-- StockGuard Custom Authentication & Enhanced Features Migration
-- Run this SQL in your Supabase SQL Editor
-- This migrates from email-based auth to username/password custom auth
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- ============================================================================
-- STEP 1: Update user_profiles table for username/password auth
-- ============================================================================
-- Add username column (if not exists)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'user_profiles'
        AND column_name = 'username'
) THEN
ALTER TABLE user_profiles
ADD COLUMN username TEXT UNIQUE;
END IF;
END $$;
-- Add password_hash column (if not exists)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'user_profiles'
        AND column_name = 'password_hash'
) THEN
ALTER TABLE user_profiles
ADD COLUMN password_hash TEXT;
END IF;
END $$;
-- Add profile_picture_url column (if not exists)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'user_profiles'
        AND column_name = 'profile_picture_url'
) THEN
ALTER TABLE user_profiles
ADD COLUMN profile_picture_url TEXT;
END IF;
END $$;
-- Create user_role enum type
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'user_role'
) THEN CREATE TYPE user_role AS ENUM ('owner', 'manager', 'worker');
END IF;
END $$;
-- Update role column to use enum (if currently TEXT)
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'user_profiles'
        AND column_name = 'role'
        AND data_type = 'text'
) THEN -- Convert existing roles to enum
ALTER TABLE user_profiles
ALTER COLUMN role TYPE user_role USING role::user_role;
ELSIF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'user_profiles'
        AND column_name = 'role'
) THEN -- Add role column if it doesn't exist
ALTER TABLE user_profiles
ADD COLUMN role user_role DEFAULT 'owner';
END IF;
END $$;
-- Make username required (will need to populate existing records first)
-- ALTER TABLE user_profiles ALTER COLUMN username SET NOT NULL;
-- Remove email column if it exists (keep for migration period)
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS email;
-- ============================================================================
-- STEP 2: Create owner_settings table
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
-- STEP 3: Update products table for pairs and boxes
-- ============================================================================
-- Add product_type column
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'products'
        AND column_name = 'product_type'
) THEN
ALTER TABLE products
ADD COLUMN product_type TEXT DEFAULT 'single' CHECK (product_type IN ('single', 'pair', 'box'));
END IF;
END $$;
-- Add items_per_unit column
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'products'
        AND column_name = 'items_per_unit'
) THEN
ALTER TABLE products
ADD COLUMN items_per_unit INTEGER DEFAULT 1;
END IF;
END $$;
-- Add price_per_unit column
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'products'
        AND column_name = 'price_per_unit'
) THEN
ALTER TABLE products
ADD COLUMN price_per_unit DECIMAL(10, 2);
-- Migrate existing price to price_per_unit
UPDATE products
SET price_per_unit = price
WHERE price_per_unit IS NULL;
END IF;
END $$;
-- Add price_per_item column
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'products'
        AND column_name = 'price_per_item'
) THEN
ALTER TABLE products
ADD COLUMN price_per_item DECIMAL(10, 2);
-- Migrate existing price to price_per_item for single items
UPDATE products
SET price_per_item = price
WHERE price_per_item IS NULL;
END IF;
END $$;
-- Update existing products to new structure
UPDATE products
SET product_type = COALESCE(product_type, 'single'),
    items_per_unit = COALESCE(items_per_unit, 1),
    price_per_unit = COALESCE(price_per_unit, price),
    price_per_item = COALESCE(price_per_item, price)
WHERE product_type IS NULL
    OR price_per_unit IS NULL
    OR price_per_item IS NULL;
-- ============================================================================
-- STEP 4: Update sales table for multi-item sales
-- ============================================================================
-- Create sales_items table
CREATE TABLE IF NOT EXISTS sales_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity_sold INTEGER NOT NULL CHECK (quantity_sold > 0),
    unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
    line_total DECIMAL(10, 2) NOT NULL CHECK (line_total >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
);
-- Add new columns to sales table
DO $$ BEGIN -- Add subtotal column
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'sales'
        AND column_name = 'subtotal'
) THEN
ALTER TABLE sales
ADD COLUMN subtotal DECIMAL(10, 2) DEFAULT 0;
END IF;
-- Add discount_amount column
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'sales'
        AND column_name = 'discount_amount'
) THEN
ALTER TABLE sales
ADD COLUMN discount_amount DECIMAL(10, 2) DEFAULT 0;
END IF;
-- Add discount_percentage column
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'sales'
        AND column_name = 'discount_percentage'
) THEN
ALTER TABLE sales
ADD COLUMN discount_percentage DECIMAL(5, 2) DEFAULT 0;
END IF;
-- Rename total_amount to final_total if it exists and final_total doesn't
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'sales'
        AND column_name = 'total_amount'
)
AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'sales'
        AND column_name = 'final_total'
) THEN
ALTER TABLE sales
    RENAME COLUMN total_amount TO final_total;
END IF;
-- Add final_total if it doesn't exist
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'sales'
        AND column_name = 'final_total'
) THEN
ALTER TABLE sales
ADD COLUMN final_total DECIMAL(10, 2) DEFAULT 0;
END IF;
-- Migrate existing data
UPDATE sales
SET subtotal = COALESCE(total_amount, 0),
    final_total = COALESCE(total_amount, 0)
WHERE subtotal IS NULL
    OR final_total IS NULL;
END $$;
-- Remove old columns (commented out to avoid data loss during migration)
-- ALTER TABLE sales DROP COLUMN IF EXISTS product_id;
-- ALTER TABLE sales DROP COLUMN IF EXISTS quantity_sold;
-- ALTER TABLE sales DROP COLUMN IF EXISTS unit_price;
-- ============================================================================
-- STEP 5: Create PostgreSQL Functions
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
-- ============================================================================
-- STEP 6: Create indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_owner_settings_owner_id ON owner_settings(owner_id);
CREATE INDEX IF NOT EXISTS idx_sales_items_sale_id ON sales_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_items_product_id ON sales_items(product_id);
CREATE INDEX IF NOT EXISTS idx_products_product_type ON products(product_type);
-- ============================================================================
-- STEP 7: Seed owner account (CHANGE PASSWORD IN PRODUCTION!)
-- ============================================================================
-- Insert default owner account if no owner exists
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
-- STEP 8: Update RLS Policies
-- ============================================================================
-- Note: Since we're using custom authentication, RLS policies are simplified
-- Security is handled in application code and database functions
-- Enable RLS on new tables
ALTER TABLE owner_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_items ENABLE ROW LEVEL SECURITY;
-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Enable all for owner_settings" ON owner_settings;
DROP POLICY IF EXISTS "Enable all for sales_items" ON sales_items;
-- Simplified policies: Allow all operations (security handled in app/functions)
-- These tables are accessed via SECURITY DEFINER functions which bypass RLS
CREATE POLICY "Enable all for owner_settings" ON owner_settings FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for sales_items" ON sales_items FOR ALL TO public USING (true) WITH CHECK (true);
-- ============================================================================
-- Migration Complete!
-- ============================================================================