-- Complete Storage Setup for StockGuard (Custom Auth)
-- Run this entire script in Supabase SQL Editor
-- This creates the bucket and all policies in one go
-- Step 1: Create the storage bucket
INSERT INTO storage.buckets (
        id,
        name,
        public,
        file_size_limit,
        allowed_mime_types
    )
VALUES (
        'product-images',
        'product-images',
        true,
        -- Public bucket (required for images to be accessible)
        20971520,
        -- 20MB limit (20 * 1024 * 1024 bytes)
        ARRAY ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
    ) ON CONFLICT (id) DO
UPDATE
SET public = true,
    file_size_limit = 20971520,
    allowed_mime_types = ARRAY ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
-- Step 2: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete product images" ON storage.objects;
-- Step 3: Create storage policies for custom auth
-- Since we're using custom authentication, we use public policies
-- Security is handled in application code
-- Policy 1: Allow public read access (so images can be displayed)
CREATE POLICY "Public can view product images" ON storage.objects FOR
SELECT TO public USING (bucket_id = 'product-images');
-- Policy 2: Allow public upload (for simplicity with custom auth)
CREATE POLICY "Anyone can upload product images" ON storage.objects FOR
INSERT TO public WITH CHECK (bucket_id = 'product-images');
-- Policy 3: Allow public update
CREATE POLICY "Anyone can update product images" ON storage.objects FOR
UPDATE TO public USING (bucket_id = 'product-images') WITH CHECK (bucket_id = 'product-images');
-- Policy 4: Allow public delete
CREATE POLICY "Anyone can delete product images" ON storage.objects FOR DELETE TO public USING (bucket_id = 'product-images');
-- Verification: Check that everything was created
SELECT 'Bucket created' as status,
    name,
    public
FROM storage.buckets
WHERE id = 'product-images';
SELECT 'Policies created' as status,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE tablename = 'objects'
    AND schemaname = 'storage'
    AND policyname LIKE '%product images%'
ORDER BY policyname;
-- Expected output: 1 bucket row + 4 policy rows
-- If you see all 5 rows, setup is complete! ✅