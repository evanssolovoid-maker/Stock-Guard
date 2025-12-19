-- Cleanup Test Data for Multi-Tenant Migration
-- WARNING: This will DELETE all test data including owners, workers, managers, products, and sales
-- Only run this if you want to start fresh with the multi-tenant system
-- ============================================================================
-- Step 1: See what will be deleted (run this first to review)
SELECT 'Owners' as type,
  COUNT(*) as count
FROM user_profiles
WHERE role = 'owner';
SELECT 'Managers' as type,
  COUNT(*) as count
FROM user_profiles
WHERE role = 'manager';
SELECT 'Workers' as type,
  COUNT(*) as count
FROM user_profiles
WHERE role = 'worker';
SELECT 'Products' as type,
  COUNT(*) as count
FROM products;
SELECT 'Sales' as type,
  COUNT(*) as count
FROM sales;
-- Step 2: Delete all data (in correct order to respect foreign keys)
-- This will delete everything and allow you to start fresh
-- Delete sales items first (child of sales)
DELETE FROM sales_items;
-- Delete sales (child of user_profiles and products)
DELETE FROM sales;
-- Delete products (child of user_profiles)
DELETE FROM products;
-- Delete business workers relationships
DELETE FROM business_workers;
-- Delete invite codes
DELETE FROM invite_codes;
-- Delete owner settings (child of user_profiles)
DELETE FROM owner_settings;
-- Finally, delete all user profiles (this will cascade to any remaining relationships)
DELETE FROM user_profiles;
-- Step 3: Verify everything is deleted
SELECT 'Owners' as type,
  COUNT(*) as count
FROM user_profiles
WHERE role = 'owner';
SELECT 'Managers' as type,
  COUNT(*) as count
FROM user_profiles
WHERE role = 'manager';
SELECT 'Workers' as type,
  COUNT(*) as count
FROM user_profiles
WHERE role = 'worker';
SELECT 'Products' as type,
  COUNT(*) as count
FROM products;
SELECT 'Sales' as type,
  COUNT(*) as count
FROM sales;
-- If all counts are 0, you're ready to run multi-tenant-system.sql