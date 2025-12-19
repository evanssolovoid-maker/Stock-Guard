-- Simple Fix for Duplicate Business Names
-- Run this directly in Supabase SQL Editor BEFORE multi-tenant-system.sql
-- This is a simpler, more direct approach
-- Step 1: See what duplicates exist
SELECT business_name,
  COUNT(*) as count,
  array_agg(
    id::text
    ORDER BY id
  ) as user_ids
FROM user_profiles
WHERE business_name IS NOT NULL
  AND role = 'owner'
GROUP BY business_name
HAVING COUNT(*) > 1;
-- Step 2: Fix duplicates - single UPDATE statement
-- This updates all duplicates except the first one (by id)
UPDATE user_profiles up1
SET business_name = up1.business_name || '_' || SUBSTRING(REPLACE(up1.id::TEXT, '-', ''), 1, 8)
FROM (
    SELECT id,
      business_name,
      ROW_NUMBER() OVER (
        PARTITION BY business_name
        ORDER BY id
      ) as rn
    FROM user_profiles
    WHERE business_name IS NOT NULL
      AND role = 'owner'
  ) ranked
WHERE up1.id = ranked.id
  AND ranked.rn > 1
  AND up1.role = 'owner';
-- Step 3: Verify no duplicates remain (should return 0 rows)
SELECT business_name,
  COUNT(*) as count
FROM user_profiles
WHERE business_name IS NOT NULL
  AND role = 'owner'
GROUP BY business_name
HAVING COUNT(*) > 1;
-- Step 4: Drop any existing constraint
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS unique_business_name;
-- If Step 3 returns 0 rows, you can now run multi-tenant-system.sql