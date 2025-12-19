-- Update log_multi_item_sale function for multi-tenant system
-- Run this SQL in Supabase SQL Editor after running multi-tenant-system.sql
-- Drop existing function
DROP FUNCTION IF EXISTS log_multi_item_sale(UUID, UUID, JSONB);
-- Create updated function with business_owner_id support
CREATE OR REPLACE FUNCTION public.log_multi_item_sale(
        p_worker_id UUID,
        p_owner_id UUID,
        -- This is now business_owner_id
        p_items JSONB
    ) RETURNS TABLE(
        sale_id UUID,
        subtotal DECIMAL,
        discount_amount DECIMAL,
        final_total DECIMAL
    ) LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_sale_id UUID;
v_subtotal DECIMAL := 0;
v_discount_amount DECIMAL := 0;
v_discount_percentage DECIMAL := 0;
v_final_total DECIMAL := 0;
v_item JSONB;
v_product RECORD;
v_line_total DECIMAL;
v_settings RECORD;
BEGIN -- Validate that it's an array
IF jsonb_typeof(p_items) != 'array' THEN RAISE EXCEPTION 'p_items must be a JSON array';
END IF;
-- Create sale record with business_owner_id
INSERT INTO sales (
        owner_id,
        -- Keep for backward compatibility
        business_owner_id,
        -- Multi-tenant field
        worker_id,
        subtotal,
        discount_amount,
        discount_percentage,
        final_total
    )
VALUES (p_owner_id, p_owner_id, p_worker_id, 0, 0, 0, 0)
RETURNING id INTO v_sale_id;
-- Process each item
FOR v_item IN
SELECT *
FROM jsonb_array_elements(p_items) LOOP -- Lock and get product (filter by business_owner_id for data isolation)
SELECT * INTO v_product
FROM products
WHERE id = (v_item->>'product_id')::UUID
    AND business_owner_id = p_owner_id FOR
UPDATE;
IF NOT FOUND THEN RAISE EXCEPTION 'Product not found: %',
v_item->>'product_id';
END IF;
-- Check stock (quantity is number of boxes/pairs/singles)
IF v_product.quantity < (v_item->>'quantity')::INTEGER THEN RAISE EXCEPTION 'Insufficient stock for product %. Available: %, Requested: %',
v_product.name,
v_product.quantity,
(v_item->>'quantity')::INTEGER;
END IF;
-- Calculate line total using price_per_unit
v_line_total := v_product.price_per_unit * (v_item->>'quantity')::INTEGER;
v_subtotal := v_subtotal + v_line_total;
-- Insert sale item
INSERT INTO sales_items (
        sale_id,
        product_id,
        quantity_sold,
        unit_price,
        line_total
    )
VALUES (
        v_sale_id,
        v_product.id,
        (v_item->>'quantity')::INTEGER,
        v_product.price_per_unit,
        v_line_total
    );
-- Update product quantity
UPDATE products
SET quantity = quantity - (v_item->>'quantity')::INTEGER,
    updated_at = NOW()
WHERE id = v_product.id;
END LOOP;
-- Get discount settings
SELECT * INTO v_settings
FROM owner_settings
WHERE owner_id = p_owner_id;
-- Apply discount if applicable
IF v_settings.discount_enabled
AND v_subtotal >= v_settings.discount_threshold THEN v_discount_percentage := v_settings.discount_percentage;
v_discount_amount := (v_subtotal * v_discount_percentage / 100);
END IF;
v_final_total := v_subtotal - v_discount_amount;
-- Update sale totals
UPDATE sales
SET subtotal = v_subtotal,
    discount_amount = v_discount_amount,
    discount_percentage = v_discount_percentage,
    final_total = v_final_total
WHERE id = v_sale_id;
RETURN QUERY
SELECT v_sale_id,
    v_subtotal,
    v_discount_amount,
    v_final_total;
END;
$$;
-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.log_multi_item_sale(UUID, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_multi_item_sale(UUID, UUID, JSONB) TO anon;