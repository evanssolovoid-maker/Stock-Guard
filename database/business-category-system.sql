-- Business Category System for StockGuard
-- Run this SQL in Supabase SQL Editor
-- This creates the business category enum, mapping table, and updates user creation
-- ============================================================================
-- STEP 1: Create business_category enum type
-- ============================================================================
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_type
  WHERE typname = 'business_category'
) THEN CREATE TYPE business_category AS ENUM (
  'retail_general',
  'grocery',
  'pharmacy',
  'electronics',
  'clothing',
  'hardware',
  'beauty_salon',
  'restaurant',
  'mobile_money_agent',
  'stationery',
  'automotive',
  'agriculture'
);
END IF;
END $$;
-- ============================================================================
-- STEP 2: Add business_category column to user_profiles
-- ============================================================================
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_name = 'user_profiles'
    AND column_name = 'business_category'
) THEN
ALTER TABLE user_profiles
ADD COLUMN business_category business_category;
END IF;
END $$;
-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_category ON user_profiles(business_category);
-- ============================================================================
-- STEP 3: Create category-specific product categories mapping table
-- ============================================================================
CREATE TABLE IF NOT EXISTS business_product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_category business_category NOT NULL,
  product_category TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(business_category, product_category)
);
-- Create unique index to prevent duplicate categories
CREATE UNIQUE INDEX IF NOT EXISTS idx_business_product_categories ON business_product_categories(business_category, product_category);
-- ============================================================================
-- STEP 4: Seed product categories for each business type
-- ============================================================================
-- Clear existing data (optional - comment out if you want to keep existing data)
-- TRUNCATE TABLE business_product_categories;
-- Insert categories (using INSERT ... ON CONFLICT to avoid duplicates)
INSERT INTO business_product_categories (
    business_category,
    product_category,
    display_order,
    is_default
  )
VALUES -- GROCERY
  ('grocery', 'Fresh Produce', 1, true),
  ('grocery', 'Dairy Products', 2, false),
  ('grocery', 'Meat & Poultry', 3, false),
  ('grocery', 'Beverages', 4, false),
  ('grocery', 'Dry Foods', 5, false),
  ('grocery', 'Snacks', 6, false),
  ('grocery', 'Household Items', 7, false),
  ('grocery', 'Frozen Foods', 8, false),
  ('grocery', 'Bakery', 9, false),
  ('grocery', 'Personal Care', 10, false),
  -- PHARMACY
  ('pharmacy', 'Prescription Drugs', 1, true),
  ('pharmacy', 'Over-the-Counter', 2, false),
  ('pharmacy', 'Medical Supplies', 3, false),
  ('pharmacy', 'Personal Care', 4, false),
  ('pharmacy', 'Supplements & Vitamins', 5, false),
  ('pharmacy', 'First Aid', 6, false),
  ('pharmacy', 'Baby Care', 7, false),
  ('pharmacy', 'Dental Care', 8, false),
  -- ELECTRONICS
  ('electronics', 'Mobile Phones', 1, true),
  ('electronics', 'Computers & Laptops', 2, false),
  ('electronics', 'Phone Accessories', 3, false),
  ('electronics', 'Home Appliances', 4, false),
  ('electronics', 'Audio & Video', 5, false),
  ('electronics', 'Gaming', 6, false),
  ('electronics', 'Cameras', 7, false),
  ('electronics', 'Smart Devices', 8, false),
  -- CLOTHING
  ('clothing', 'Men''s Wear', 1, true),
  ('clothing', 'Women''s Wear', 2, false),
  ('clothing', 'Children''s Wear', 3, false),
  ('clothing', 'Shoes & Footwear', 4, false),
  ('clothing', 'Accessories', 5, false),
  ('clothing', 'Sportswear', 6, false),
  ('clothing', 'Bags & Luggage', 7, false),
  ('clothing', 'Jewelry', 8, false),
  -- HARDWARE
  ('hardware', 'Building Materials', 1, true),
  ('hardware', 'Tools', 2, false),
  ('hardware', 'Plumbing Supplies', 3, false),
  ('hardware', 'Electrical Supplies', 4, false),
  ('hardware', 'Paint & Finishes', 5, false),
  ('hardware', 'Nails & Fasteners', 6, false),
  ('hardware', 'Doors & Windows', 7, false),
  ('hardware', 'Safety Equipment', 8, false),
  -- BEAUTY SALON
  ('beauty_salon', 'Hair Products', 1, true),
  ('beauty_salon', 'Skin Care', 2, false),
  ('beauty_salon', 'Cosmetics', 3, false),
  ('beauty_salon', 'Salon Services', 4, false),
  ('beauty_salon', 'Nail Care', 5, false),
  ('beauty_salon', 'Tools & Equipment', 6, false),
  ('beauty_salon', 'Hair Extensions', 7, false),
  (
    'beauty_salon',
    'Professional Products',
    8,
    false
  ),
  -- RESTAURANT
  ('restaurant', 'Main Dishes', 1, true),
  ('restaurant', 'Appetizers', 2, false),
  ('restaurant', 'Beverages', 3, false),
  ('restaurant', 'Desserts', 4, false),
  ('restaurant', 'Side Dishes', 5, false),
  ('restaurant', 'Breakfast', 6, false),
  ('restaurant', 'Special Menu', 7, false),
  ('restaurant', 'Kids Menu', 8, false),
  -- MOBILE MONEY AGENT
  ('mobile_money_agent', 'Airtime', 1, true),
  (
    'mobile_money_agent',
    'Mobile Money Services',
    2,
    false
  ),
  ('mobile_money_agent', 'Data Bundles', 3, false),
  ('mobile_money_agent', 'Bill Payments', 4, false),
  ('mobile_money_agent', 'Remittances', 5, false),
  -- STATIONERY
  ('stationery', 'Writing Materials', 1, true),
  ('stationery', 'Books', 2, false),
  ('stationery', 'Office Supplies', 3, false),
  ('stationery', 'Art Supplies', 4, false),
  ('stationery', 'School Supplies', 5, false),
  ('stationery', 'Filing & Storage', 6, false),
  ('stationery', 'Technology Accessories', 7, false),
  ('stationery', 'Educational Materials', 8, false),
  -- AUTOMOTIVE
  ('automotive', 'Spare Parts', 1, true),
  ('automotive', 'Tires & Wheels', 2, false),
  ('automotive', 'Lubricants & Fluids', 3, false),
  ('automotive', 'Accessories', 4, false),
  ('automotive', 'Car Care Products', 5, false),
  ('automotive', 'Battery & Electrical', 6, false),
  ('automotive', 'Garage Services', 7, false),
  ('automotive', 'Tools & Equipment', 8, false),
  -- AGRICULTURE
  ('agriculture', 'Seeds', 1, true),
  ('agriculture', 'Fertilizers', 2, false),
  ('agriculture', 'Pesticides', 3, false),
  ('agriculture', 'Farm Tools', 4, false),
  ('agriculture', 'Animal Feed', 5, false),
  ('agriculture', 'Irrigation Equipment', 6, false),
  ('agriculture', 'Veterinary Supplies', 7, false),
  ('agriculture', 'Harvesting Equipment', 8, false),
  -- RETAIL GENERAL (Catch-all for mixed businesses)
  ('retail_general', 'General Merchandise', 1, true),
  ('retail_general', 'Electronics', 2, false),
  ('retail_general', 'Clothing', 3, false),
  ('retail_general', 'Food & Beverages', 4, false),
  ('retail_general', 'Home & Kitchen', 5, false),
  ('retail_general', 'Health & Beauty', 6, false),
  ('retail_general', 'Sports & Outdoors', 7, false),
  ('retail_general', 'Toys & Games', 8, false),
  ('retail_general', 'Books & Media', 9, false),
  ('retail_general', 'Other', 10, false) ON CONFLICT (business_category, product_category) DO NOTHING;
-- ============================================================================
-- STEP 5: Function to get product categories for a business
-- ============================================================================
CREATE OR REPLACE FUNCTION get_business_categories(p_owner_id UUID) RETURNS TABLE(
    category TEXT,
    display_order INTEGER,
    is_default BOOLEAN
  ) LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY
SELECT bpc.product_category,
  bpc.display_order,
  bpc.is_default
FROM user_profiles up
  JOIN business_product_categories bpc ON bpc.business_category = up.business_category
WHERE up.id = p_owner_id
ORDER BY bpc.display_order;
END;
$$;
-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_business_categories(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_business_categories(UUID) TO anon;
-- ============================================================================
-- STEP 6: Update create_user function to include business_category
-- ============================================================================
-- First, create the new function
CREATE OR REPLACE FUNCTION create_user_with_business(
    p_username TEXT,
    p_password TEXT,
    p_role user_role,
    p_business_name TEXT,
    p_business_category business_category DEFAULT NULL,
    p_phone_number TEXT DEFAULT NULL,
    p_profile_picture_url TEXT DEFAULT NULL
  ) RETURNS user_profiles LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE new_user user_profiles;
v_business_owner_id UUID;
BEGIN -- If creating owner, require business_category
IF p_role = 'owner'
AND p_business_category IS NULL THEN RAISE EXCEPTION 'Business category is required for business owners';
END IF;
-- If worker/manager, get business owner's info
IF p_role IN ('manager', 'worker') THEN
SELECT id,
  business_category INTO v_business_owner_id,
  p_business_category
FROM user_profiles
WHERE business_name = p_business_name
  AND role = 'owner'
LIMIT 1;
IF v_business_owner_id IS NULL THEN RAISE EXCEPTION 'Business "%" not found',
p_business_name;
END IF;
END IF;
-- Create user
INSERT INTO user_profiles (
    username,
    password_hash,
    role,
    business_name,
    business_category,
    phone_number,
    profile_picture_url
  )
VALUES (
    p_username,
    crypt(p_password, gen_salt('bf')),
    p_role,
    p_business_name,
    p_business_category,
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
-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_user_with_business(
    TEXT,
    TEXT,
    user_role,
    TEXT,
    business_category,
    TEXT,
    TEXT
  ) TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_with_business(
    TEXT,
    TEXT,
    user_role,
    TEXT,
    business_category,
    TEXT,
    TEXT
  ) TO anon;