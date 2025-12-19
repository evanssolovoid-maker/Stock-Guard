-- Fix RLS Policies for Custom Authentication
-- This script updates the RLS policies to work with custom auth (not Supabase Auth)
-- Run this after multi-tenant-system.sql if you're getting 500 errors on login
-- ============================================================================
-- Drop the restrictive policies that use auth.uid() (which doesn't work with custom auth)
DROP POLICY IF EXISTS "Business users can view profiles in their business" ON user_profiles;
DROP POLICY IF EXISTS "Business users can view their products" ON products;
DROP POLICY IF EXISTS "Business users can view their sales" ON sales;
DROP POLICY IF EXISTS "Business users can view their workers" ON business_workers;
-- Drop existing permissive policies if they exist (from initial migration)
DROP POLICY IF EXISTS "Enable all for user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Enable all for products" ON products;
DROP POLICY IF EXISTS "Enable all for sales" ON sales;
DROP POLICY IF EXISTS "Enable all for business_workers" ON business_workers;
-- Create permissive policies for custom auth
-- Security is handled in application code and SECURITY DEFINER functions
CREATE POLICY "Enable all for user_profiles" ON user_profiles FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for products" ON products FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for sales" ON sales FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for business_workers" ON business_workers FOR ALL TO public USING (true) WITH CHECK (true);
-- Note: Data isolation is enforced in application code by filtering by business_owner_id
-- The SECURITY DEFINER functions also enforce proper access control