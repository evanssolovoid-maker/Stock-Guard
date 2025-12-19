-- Cleanup Specific Owner and All Related Data
-- Use this if you only want to delete a specific owner (e.g., test accounts)
-- Replace 'test' with the actual business_name you want to delete
-- ============================================================================
-- Step 1: Find the owner(s) you want to delete
SELECT id,
  username,
  business_name,
  role,
  created_at
FROM user_profiles
WHERE role = 'owner'
  AND business_name = 'test';
-- Change 'test' to the business name you want to delete
-- Step 2: Delete all data for specific owner(s)
-- Replace 'test' with the business_name you want to delete
DO $$
DECLARE owner_ids UUID [];
BEGIN -- Get all owner IDs with the specified business name
SELECT array_agg(id) INTO owner_ids
FROM user_profiles
WHERE role = 'owner'
  AND business_name = 'test';
-- Change 'test' to the business name you want to delete
IF owner_ids IS NOT NULL
AND array_length(owner_ids, 1) > 0 THEN -- Delete sales items for sales belonging to these owners
DELETE FROM sales_items
WHERE sale_id IN (
    SELECT id
    FROM sales
    WHERE owner_id = ANY(owner_ids)
  );
-- Delete sales for these owners
DELETE FROM sales
WHERE owner_id = ANY(owner_ids);
-- Delete products for these owners
DELETE FROM products
WHERE owner_id = ANY(owner_ids);
-- Delete business workers relationships
DELETE FROM business_workers
WHERE owner_id = ANY(owner_ids);
-- Delete workers and managers belonging to these businesses
DELETE FROM user_profiles
WHERE business_name = 'test' -- Change 'test' to match
  AND role IN ('worker', 'manager');
-- Delete owner settings
DELETE FROM owner_settings
WHERE owner_id = ANY(owner_ids);
-- Finally, delete the owners themselves
DELETE FROM user_profiles
WHERE id = ANY(owner_ids);
RAISE NOTICE 'Deleted % owner(s) and all related data',
array_length(owner_ids, 1);
ELSE RAISE NOTICE 'No owners found with business_name = ''test''';
END IF;
END $$;
-- Step 3: Verify deletion
SELECT business_name,
  COUNT(*) as count
FROM user_profiles
WHERE role = 'owner'
GROUP BY business_name;
-- If the business name is gone, you're ready to run multi-tenant-system.sql