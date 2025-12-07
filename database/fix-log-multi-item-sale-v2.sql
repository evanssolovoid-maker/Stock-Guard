-- Fix for log_multi_item_sale function - Remove overloading and handle TEXT/JSONB in one function
-- This fixes the "Could not choose the best candidate function" error
DROP FUNCTION IF EXISTS log_multi_item_sale(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS log_multi_item_sale(UUID, UUID, JSONB);

-- Create single function that accepts JSONB (Supabase converts arrays/objects to JSONB automatically)
CREATE OR REPLACE FUNCTION log_multi_item_sale(
    p_worker_id UUID,
    p_owner_id UUID,
    p_items JSONB
) RETURNS TABLE(
    sale_id UUID,
    subtotal DECIMAL,
    discount_amount DECIMAL,
    final_total DECIMAL
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE 
    v_sale_id UUID;
    v_subtotal DECIMAL := 0;
    v_discount_amount DECIMAL := 0;
    v_discount_percentage DECIMAL := 0;
    v_final_total DECIMAL := 0;
    v_item JSONB;
    v_product RECORD;
    v_line_total DECIMAL;
    v_settings RECORD;
BEGIN 
    -- Validate that it's an array
    IF jsonb_typeof(p_items) != 'array' THEN
        RAISE EXCEPTION 'p_items must be a JSON array';
    END IF;

    -- Create sale record
    INSERT INTO sales (
        owner_id,
        worker_id,
        subtotal,
        discount_amount,
        discount_percentage,
        final_total
    )
    VALUES (p_owner_id, p_worker_id, 0, 0, 0, 0)
    RETURNING id INTO v_sale_id;

    -- Process each item
    FOR v_item IN
        SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        -- Lock and get product
        SELECT * INTO v_product
        FROM products
        WHERE id = (v_item->>'product_id')::UUID
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product not found: %', v_item->>'product_id';
        END IF;

        -- Check stock (quantity is number of boxes/pairs/singles)
        IF v_product.quantity < (v_item->>'quantity')::INTEGER THEN
            RAISE EXCEPTION 'Insufficient stock for product %. Available: %, Requested: %',
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
    IF v_settings.discount_enabled AND v_subtotal >= v_settings.discount_threshold THEN
        v_discount_percentage := v_settings.discount_percentage;
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
    SELECT v_sale_id, v_subtotal, v_discount_amount, v_final_total;
END;
$$;


