-- StockGuard Complete Fresh Installation for Custom Auth
-- Run this SQL in your Supabase SQL Editor for a brand new project
-- This creates all tables from scratch with custom authentication
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- ============================================================================
-- STEP 1: Create user_role enum type
-- ============================================================================
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'user_role'
) THEN CREATE TYPE user_role AS ENUM ('owner', 'manager', 'worker');
END IF;
END $$;
-- ============================================================================
-- STEP 2: Create user_profiles table (custom auth version)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'owner',
    business_name TEXT,
    phone_number TEXT,
    profile_picture_url TEXT,
    theme_preference TEXT DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- ============================================================================
-- STEP 3: Create owner_settings table
-- ============================================================================
CREATE TABLE IF NOT EXISTS owner_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    max_managers INTEGER DEFAULT 5,
    profile_pictures_mandatory BOOLEAN DEFAULT false,
    sms_notifications_enabled BOOLEAN DEFAULT false,
    email_notifications_enabled BOOLEAN DEFAULT false,
    owner_phone_number TEXT,
    owner_email TEXT,
    notification_preferences JSONB DEFAULT '{"new_sale": true, "low_stock": true, "daily_summary": true}'::jsonb,
    discount_enabled BOOLEAN DEFAULT false,
    discount_threshold DECIMAL(10, 2) DEFAULT 0,
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- ============================================================================
-- STEP 4: Create products table (with pairs/boxes support)
-- ============================================================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT,
    product_type TEXT DEFAULT 'single' CHECK (product_type IN ('single', 'pair', 'box')),
    items_per_unit INTEGER DEFAULT 1,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    price_per_unit DECIMAL(10, 2),
    price_per_item DECIMAL(10, 2),
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    image_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Set default prices if not set
UPDATE products
SET price_per_unit = COALESCE(price_per_unit, price),
    price_per_item = COALESCE(price_per_item, price)
WHERE price_per_unit IS NULL
    OR price_per_item IS NULL;
-- ============================================================================
-- STEP 5: Create sales table (multi-item support)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES user_profiles(id) ON DELETE
    SET NULL,
        subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
        discount_amount DECIMAL(10, 2) DEFAULT 0,
        discount_percentage DECIMAL(5, 2) DEFAULT 0,
        final_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
        sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- ============================================================================
-- STEP 6: Create sales_items table (for multi-item sales)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sales_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity_sold INTEGER NOT NULL CHECK (quantity_sold > 0),
    unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
    line_total DECIMAL(10, 2) NOT NULL CHECK (line_total >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- ============================================================================
-- STEP 7: Create business_workers table
-- ============================================================================
CREATE TABLE IF NOT EXISTS business_workers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(owner_id, worker_id)
);
-- ============================================================================
-- STEP 8: Create invite_codes table
-- ============================================================================
CREATE TABLE IF NOT EXISTS invite_codes (
    code TEXT PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- ============================================================================
-- STEP 9: Create subscriptions table (optional, for future use)
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    plan TEXT NOT NULL CHECK (plan IN ('free', 'basic', 'premium')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- ============================================================================
-- STEP 10: Create indexes for performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_owner_settings_owner_id ON owner_settings(owner_id);
CREATE INDEX IF NOT EXISTS idx_products_owner_id ON products(owner_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_product_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_sales_owner_id ON sales(owner_id);
CREATE INDEX IF NOT EXISTS idx_sales_worker_id ON sales(worker_id);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_items_sale_id ON sales_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_items_product_id ON sales_items(product_id);
CREATE INDEX IF NOT EXISTS idx_business_workers_owner_id ON business_workers(owner_id);
CREATE INDEX IF NOT EXISTS idx_business_workers_worker_id ON business_workers(worker_id);
CREATE INDEX IF NOT EXISTS idx_invite_codes_owner_id ON invite_codes(owner_id);
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
-- ============================================================================
-- STEP 11: Create update timestamp function
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- ============================================================================
-- STEP 12: Create triggers for updated_at
-- ============================================================================
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE
UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE
UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_owner_settings_updated_at ON owner_settings;
CREATE TRIGGER update_owner_settings_updated_at BEFORE
UPDATE ON owner_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE
UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ============================================================================
-- STEP 13: Create PostgreSQL Functions for Custom Auth
-- ============================================================================
-- Password verification function
CREATE OR REPLACE FUNCTION verify_password(p_username TEXT, p_password TEXT) RETURNS TABLE(valid BOOLEAN, user_id UUID) LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY
SELECT (password_hash = crypt(p_password, password_hash)) as valid,
    id as user_id
FROM user_profiles
WHERE username = p_username;
-- Return false if user not found
IF NOT FOUND THEN RETURN QUERY
SELECT false::BOOLEAN,
    NULL::UUID;
END IF;
END;
$$;
-- Create user function
CREATE OR REPLACE FUNCTION create_user(
        p_username TEXT,
        p_password TEXT,
        p_role user_role,
        p_business_name TEXT DEFAULT NULL,
        p_phone_number TEXT DEFAULT NULL,
        p_profile_picture_url TEXT DEFAULT NULL
    ) RETURNS user_profiles LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE new_user user_profiles;
BEGIN
INSERT INTO user_profiles (
        id,
        username,
        password_hash,
        role,
        business_name,
        phone_number,
        profile_picture_url
    )
VALUES (
        uuid_generate_v4(),
        p_username,
        crypt(p_password, gen_salt('bf')),
        p_role,
        p_business_name,
        p_phone_number,
        p_profile_picture_url
    )
RETURNING * INTO new_user;
-- Create owner_settings if owner
IF p_role = 'owner' THEN
INSERT INTO owner_settings (owner_id)
VALUES (new_user.id) ON CONFLICT (owner_id) DO NOTHING;
END IF;
RETURN new_user;
END;
$$;
-- Multi-item sale logging function
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
DECLARE v_sale_id UUID;
v_subtotal DECIMAL := 0;
v_discount_amount DECIMAL := 0;
v_discount_percentage DECIMAL := 0;
v_final_total DECIMAL := 0;
v_item JSONB;
v_product RECORD;
v_line_total DECIMAL;
v_settings RECORD;
BEGIN -- Create sale record
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
SELECT *
FROM jsonb_array_elements(p_items) LOOP -- Lock and get product
SELECT * INTO v_product
FROM products
WHERE id = (v_item->>'product_id')::UUID FOR
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
-- Legacy single-item sale function (for backward compatibility)
CREATE OR REPLACE FUNCTION log_sale_transaction(
        p_owner_id UUID,
        p_worker_id UUID,
        p_product_id UUID,
        p_quantity_sold INTEGER,
        p_unit_price DECIMAL(10, 2),
        p_notes TEXT DEFAULT NULL
    ) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_sale_id UUID;
v_current_quantity INTEGER;
BEGIN -- Check if product exists and belongs to owner
SELECT quantity INTO v_current_quantity
FROM products
WHERE id = p_product_id
    AND owner_id = p_owner_id;
IF v_current_quantity IS NULL THEN RAISE EXCEPTION 'Product not found or access denied';
END IF;
-- Check if sufficient quantity available
IF v_current_quantity < p_quantity_sold THEN RAISE EXCEPTION 'Insufficient quantity available';
END IF;
-- Create sale record (using multi-item structure)
INSERT INTO sales (owner_id, worker_id, subtotal, final_total)
VALUES (
        p_owner_id,
        p_worker_id,
        p_quantity_sold * p_unit_price,
        p_quantity_sold * p_unit_price
    )
RETURNING id INTO v_sale_id;
-- Create sale item
INSERT INTO sales_items (
        sale_id,
        product_id,
        quantity_sold,
        unit_price,
        line_total
    )
VALUES (
        v_sale_id,
        p_product_id,
        p_quantity_sold,
        p_unit_price,
        p_quantity_sold * p_unit_price
    );
-- Update product quantity
UPDATE products
SET quantity = quantity - p_quantity_sold,
    updated_at = NOW()
WHERE id = p_product_id;
RETURN v_sale_id;
END;
$$;
-- ============================================================================
-- STEP 14: Set up RLS Policies (simplified for custom auth)
-- ============================================================================
-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
-- Simplified policies: Allow all operations (security handled in app/functions)
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable all for user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Enable all for owner_settings" ON owner_settings;
DROP POLICY IF EXISTS "Enable all for products" ON products;
DROP POLICY IF EXISTS "Enable all for sales" ON sales;
DROP POLICY IF EXISTS "Enable all for sales_items" ON sales_items;
DROP POLICY IF EXISTS "Enable all for business_workers" ON business_workers;
DROP POLICY IF EXISTS "Enable all for invite_codes" ON invite_codes;
DROP POLICY IF EXISTS "Enable all for subscriptions" ON subscriptions;
-- Create permissive policies (security is handled in application code and SECURITY DEFINER functions)
CREATE POLICY "Enable all for user_profiles" ON user_profiles FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for owner_settings" ON owner_settings FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for products" ON products FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for sales" ON sales FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for sales_items" ON sales_items FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for business_workers" ON business_workers FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for invite_codes" ON invite_codes FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for subscriptions" ON subscriptions FOR ALL TO public USING (true) WITH CHECK (true);
-- ============================================================================
-- STEP 15: Seed default owner account
-- ============================================================================
DO $$
DECLARE owner_exists BOOLEAN;
BEGIN
SELECT EXISTS(
        SELECT 1
        FROM user_profiles
        WHERE role = 'owner'
    ) INTO owner_exists;
IF NOT owner_exists THEN -- Create owner using the create_user function
PERFORM create_user(
    'admin',
    'admin123',
    -- CHANGE THIS PASSWORD IN PRODUCTION!
    'owner'::user_role,
    'My Company',
    '+256700000000'
);
END IF;
END $$;
-- ============================================================================
-- Migration Complete!
-- ============================================================================