-- Multi-Tenant System Migration for StockGuard
-- Run this SQL in Supabase SQL Editor
-- This enables multiple businesses to operate independently with data isolation
-- ============================================================================
-- STEP 1: Add unique constraint to business names
-- First, we need to handle any existing duplicate business names
-- ============================================================================
-- Check for duplicate business names and handle them
-- This must run BEFORE adding the unique constraint
-- Use a single UPDATE statement to fix all duplicates at once
DO $$
DECLARE updated_count INTEGER;
remaining_duplicates INTEGER;
total_owners INTEGER;
BEGIN -- Check if there are any owners at all
SELECT COUNT(*) INTO total_owners
FROM user_profiles
WHERE role = 'owner'
  AND business_name IS NOT NULL;
-- If no owners exist, skip duplicate check
IF total_owners = 0 THEN RAISE NOTICE 'No owners found. Skipping duplicate check.';
ELSE -- Fix all duplicates in one UPDATE statement
-- Keep the first occurrence (by id), update all others
WITH duplicates AS (
  SELECT id,
    business_name,
    ROW_NUMBER() OVER (
      PARTITION BY business_name
      ORDER BY id
    ) as rn
  FROM user_profiles
  WHERE business_name IS NOT NULL
    AND role = 'owner'
),
to_update AS (
  SELECT id,
    business_name
  FROM duplicates
  WHERE rn > 1
)
UPDATE user_profiles up
SET business_name = up.business_name || '_' || SUBSTRING(REPLACE(up.id::TEXT, '-', ''), 1, 8)
FROM to_update tu
WHERE up.id = tu.id;
GET DIAGNOSTICS updated_count = ROW_COUNT;
IF updated_count > 0 THEN RAISE NOTICE 'Updated % duplicate business names to make them unique',
updated_count;
ELSE RAISE NOTICE 'No duplicates found. All business names are unique.';
END IF;
-- Verify no duplicates remain
SELECT COUNT(*) INTO remaining_duplicates
FROM (
    SELECT business_name,
      COUNT(*) as cnt
    FROM user_profiles
    WHERE business_name IS NOT NULL
      AND role = 'owner'
    GROUP BY business_name
    HAVING COUNT(*) > 1
  ) remaining;
IF remaining_duplicates > 0 THEN RAISE EXCEPTION 'Still have % duplicate business names after cleanup. Please run cleanup-test-data.sql or fix-duplicate-business-names.sql first.',
remaining_duplicates;
END IF;
END IF;
END $$;
-- Drop existing constraint if it exists (in case of previous failed attempt)
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS unique_business_name;
-- Now add the unique constraint
DO $$ BEGIN
ALTER TABLE user_profiles
ADD CONSTRAINT unique_business_name UNIQUE (business_name);
RAISE NOTICE 'Unique constraint on business_name added successfully';
EXCEPTION
WHEN duplicate_object THEN RAISE NOTICE 'Unique constraint on business_name already exists';
WHEN unique_violation THEN RAISE EXCEPTION 'Cannot add unique constraint: duplicates still exist. Please run the duplicate cleanup section again.';
WHEN OTHERS THEN RAISE EXCEPTION 'Error adding unique constraint: %',
SQLERRM;
END $$;
-- ============================================================================
-- STEP 2: Add business_owner_id column to user_profiles (for workers/managers)
-- ============================================================================
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_name = 'user_profiles'
    AND column_name = 'business_owner_id'
) THEN
ALTER TABLE user_profiles
ADD COLUMN business_owner_id UUID REFERENCES user_profiles(id);
END IF;
END $$;
-- Set business_owner_id for owners (self-reference)
UPDATE user_profiles
SET business_owner_id = id
WHERE role = 'owner'
  AND business_owner_id IS NULL;
-- Set business_owner_id for existing workers/managers based on business_name
UPDATE user_profiles up1
SET business_owner_id = up2.id
FROM user_profiles up2
WHERE up1.role IN ('manager', 'worker')
  AND up1.business_name = up2.business_name
  AND up2.role = 'owner'
  AND up1.business_owner_id IS NULL;
-- ============================================================================
-- STEP 3: Add business_owner_id to products table
-- ============================================================================
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_name = 'products'
    AND column_name = 'business_owner_id'
) THEN
ALTER TABLE products
ADD COLUMN business_owner_id UUID REFERENCES user_profiles(id);
END IF;
END $$;
-- Update existing products to set business_owner_id from owner_id
UPDATE products
SET business_owner_id = owner_id
WHERE business_owner_id IS NULL
  AND owner_id IS NOT NULL;
-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_products_business_owner ON products(business_owner_id);
-- ============================================================================
-- STEP 4: Add business_owner_id to sales table
-- ============================================================================
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_name = 'sales'
    AND column_name = 'business_owner_id'
) THEN
ALTER TABLE sales
ADD COLUMN business_owner_id UUID REFERENCES user_profiles(id);
END IF;
END $$;
-- Update existing sales to set business_owner_id from owner_id
UPDATE sales
SET business_owner_id = owner_id
WHERE business_owner_id IS NULL
  AND owner_id IS NOT NULL;
-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_sales_business_owner ON sales(business_owner_id);
-- ============================================================================
-- STEP 5: Add business_owner_id to business_workers table
-- ============================================================================
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_name = 'business_workers'
    AND column_name = 'business_owner_id'
) THEN
ALTER TABLE business_workers
ADD COLUMN business_owner_id UUID REFERENCES user_profiles(id);
END IF;
END $$;
-- Update existing business_workers to set business_owner_id from owner_id
UPDATE business_workers
SET business_owner_id = owner_id
WHERE business_owner_id IS NULL
  AND owner_id IS NOT NULL;
-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_workers_business_owner ON business_workers(business_owner_id);
-- ============================================================================
-- STEP 6: Function to get business owner from business name
-- ============================================================================
CREATE OR REPLACE FUNCTION get_business_owner_by_name(p_business_name TEXT) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_owner_id UUID;
BEGIN
SELECT id INTO v_owner_id
FROM user_profiles
WHERE business_name = p_business_name
  AND role = 'owner'
LIMIT 1;
RETURN v_owner_id;
END;
$$;
-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_business_owner_by_name(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_business_owner_by_name(TEXT) TO anon;
-- ============================================================================
-- STEP 7: Update create_user_with_business function for multi-tenancy
-- ============================================================================
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
BEGIN -- If creating owner, require business_category and set business_owner_id to self
IF p_role = 'owner' THEN IF p_business_category IS NULL THEN RAISE EXCEPTION 'Business category is required for business owners';
END IF;
-- Check if business name already exists (only for owners)
IF EXISTS (
  SELECT 1
  FROM user_profiles
  WHERE business_name = p_business_name
    AND role = 'owner'
) THEN RAISE EXCEPTION 'Business name "%" is already taken',
p_business_name;
END IF;
-- Create owner (business_owner_id will be set to their own id after insert)
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
-- Set business_owner_id to self for owners
UPDATE user_profiles
SET business_owner_id = new_user.id
WHERE id = new_user.id;
-- Create owner_settings
INSERT INTO owner_settings (owner_id)
VALUES (new_user.id) ON CONFLICT (owner_id) DO NOTHING;
RETURN new_user;
END IF;
-- For workers/managers, get business owner ID from business name
v_business_owner_id := get_business_owner_by_name(p_business_name);
IF v_business_owner_id IS NULL THEN RAISE EXCEPTION 'Business "%" not found. Please check the business name.',
p_business_name;
END IF;
-- Check if business requires profile pictures
IF EXISTS (
  SELECT 1
  FROM owner_settings
  WHERE owner_id = v_business_owner_id
    AND profile_pictures_mandatory = true
)
AND p_profile_picture_url IS NULL THEN RAISE EXCEPTION 'Profile picture is required for this business';
END IF;
-- Create user
INSERT INTO user_profiles (
    username,
    password_hash,
    role,
    business_name,
    business_owner_id,
    phone_number,
    profile_picture_url
  )
VALUES (
    p_username,
    crypt(p_password, gen_salt('bf')),
    p_role,
    p_business_name,
    v_business_owner_id,
    p_phone_number,
    p_profile_picture_url
  )
RETURNING * INTO new_user;
-- Link to business owner in business_workers table
INSERT INTO business_workers (business_owner_id, owner_id, worker_id)
VALUES (
    v_business_owner_id,
    v_business_owner_id,
    new_user.id
  ) ON CONFLICT (owner_id, worker_id) DO NOTHING;
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
-- ============================================================================
-- STEP 8: Update RLS policies for multi-tenancy (if using RLS)
-- ============================================================================
-- Note: These policies assume RLS is enabled. Adjust based on your setup.
-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Owners can view their products" ON products;
DROP POLICY IF EXISTS "Users can view their sales" ON sales;
-- Create new multi-tenant policies
-- Users can view profiles in their business
CREATE POLICY "Business users can view profiles in their business" ON user_profiles FOR
SELECT USING (
    id = auth.uid()
    OR business_owner_id = (
      SELECT business_owner_id
      FROM user_profiles
      WHERE id = auth.uid()
    )
  );
-- Business users can view their products
CREATE POLICY "Business users can view their products" ON products FOR
SELECT USING (
    business_owner_id = (
      SELECT business_owner_id
      FROM user_profiles
      WHERE id = auth.uid()
    )
  );
-- Business users can view their sales
CREATE POLICY "Business users can view their sales" ON sales FOR
SELECT USING (
    business_owner_id = (
      SELECT business_owner_id
      FROM user_profiles
      WHERE id = auth.uid()
    )
  );
-- Business users can view their workers
CREATE POLICY "Business users can view their workers" ON business_workers FOR
SELECT USING (
    business_owner_id = (
      SELECT business_owner_id
      FROM user_profiles
      WHERE id = auth.uid()
    )
  );