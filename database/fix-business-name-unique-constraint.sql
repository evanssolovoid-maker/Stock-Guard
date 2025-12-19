-- Fix business_name unique constraint to only apply to owners
-- Workers and managers should be able to share the same business_name as their owner
-- Run this after multi-tenant-system.sql if you're getting duplicate business_name errors when creating workers
-- ============================================================================
-- Drop the existing unique constraint that applies to all users
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS unique_business_name;
-- Create a unique partial index that only applies to owners
-- This allows multiple workers/managers to have the same business_name as their owner
CREATE UNIQUE INDEX IF NOT EXISTS unique_business_name_owners ON user_profiles(business_name)
WHERE role = 'owner'
    AND business_name IS NOT NULL;
-- Note: This ensures that:
-- 1. Only one owner can have a specific business_name
-- 2. Multiple workers/managers can have the same business_name (they share it with their owner)
-- 3. The constraint only applies when business_name is not null