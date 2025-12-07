# Complete Storage Setup Guide for Product Images

## Quick Setup (Recommended)

### Method 1: Using SQL Editor (Easiest)

1. **Open Supabase SQL Editor**
   - Go to: https://supabase.com/dashboard/project/ovhoklpdmcsfwbczzzyk/sql/new
   - Or navigate: Dashboard → SQL Editor → New Query

2. **Copy and Paste the SQL Script**
   - Open `database/storage-setup-complete.sql` from your project
   - Copy the entire contents
   - Paste into the SQL Editor

3. **Run the Script**
   - Click **"Run"** button (or press Ctrl+Enter / Cmd+Enter)
   - Wait for success message

4. **Verify Setup**
   - Go to **Storage** → **Buckets**
   - You should see `product-images` bucket
   - Go to **Storage** → **Policies** → **product-images**
   - You should see 4 policies listed

---

## Method 2: Manual Setup via Dashboard

### Step 1: Create the Bucket

1. Go to **Storage** → **Buckets** in Supabase Dashboard
2. Click **"New bucket"** button
3. Fill in the form:
   - **Name**: `product-images` (exactly this name, no spaces)
   - **Public bucket**: ✅ **Check this box** (IMPORTANT!)
   - **File size limit**: `2097152` (2MB in bytes)
   - **Allowed MIME types**: `image/jpeg, image/png, image/jpg`
4. Click **"Create bucket"**

### Step 2: Create Storage Policies

1. Go to **Storage** → **Policies**
2. Click on **"product-images"** bucket
3. Click **"New Policy"**

#### Policy 1: Upload (INSERT)
- **Policy name**: `Authenticated users can upload product images`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
(bucket_id = 'product-images')
```
- Click **"Review"** then **"Save policy"**

#### Policy 2: Update
- **Policy name**: `Authenticated users can update product images`
- **Allowed operation**: `UPDATE`
- **Target roles**: `authenticated`
- **Using expression**:
```sql
(bucket_id = 'product-images')
```
- **With check expression**:
```sql
(bucket_id = 'product-images')
```
- Click **"Review"** then **"Save policy"**

#### Policy 3: Public Read (SELECT)
- **Policy name**: `Public can view product images`
- **Allowed operation**: `SELECT`
- **Target roles**: `public`
- **Policy definition**:
```sql
(bucket_id = 'product-images')
```
- Click **"Review"** then **"Save policy"**

#### Policy 4: Delete
- **Policy name**: `Authenticated users can delete product images`
- **Allowed operation**: `DELETE`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
(bucket_id = 'product-images')
```
- Click **"Review"** then **"Save policy"**

---

## Troubleshooting

### Issue: "Bucket already exists"
**Solution**: This is fine! The SQL script handles this. If using manual setup, just proceed to policies.

### Issue: "Policy already exists"
**Solution**: 
1. Go to **Storage** → **Policies** → **product-images**
2. Delete the existing policy
3. Recreate it using the SQL script or manual method

### Issue: "Permission denied" when uploading
**Possible causes**:
1. **Bucket is not public**: Make sure "Public bucket" is checked
2. **Policies not created**: Verify all 4 policies exist
3. **User not authenticated**: Make sure you're logged in

**Solution**:
1. Check bucket settings: **Storage** → **Buckets** → **product-images** → Settings
2. Verify policies: **Storage** → **Policies** → **product-images**
3. Check browser console for specific error messages

### Issue: Images not displaying
**Possible causes**:
1. **Missing SELECT policy**: Public read policy is required
2. **Bucket not public**: Images need public bucket to generate URLs
3. **Wrong bucket name**: Must be exactly `product-images`

**Solution**:
1. Verify bucket is public: **Storage** → **Buckets** → **product-images** → Settings
2. Check SELECT policy exists for `public` role
3. Verify bucket name matches exactly: `product-images`

### Issue: "Storage.objects does not exist"
**Solution**: This means storage extension isn't enabled. Run this first:
```sql
CREATE EXTENSION IF NOT EXISTS "storage";
```

---

## Verification Steps

After setup, verify everything works:

1. **Check Bucket Exists**
   ```sql
   SELECT * FROM storage.buckets WHERE id = 'product-images';
   ```
   Should return 1 row with `public = true`

2. **Check Policies Exist**
   ```sql
   SELECT policyname, cmd, roles 
   FROM pg_policies 
   WHERE tablename = 'objects' 
   AND schemaname = 'storage'
   AND policyname LIKE '%product images%';
   ```
   Should return 4 rows

3. **Test Upload** (in your app)
   - Go to Products page
   - Click "Add Product"
   - Upload an image
   - Check if it appears

---

## Quick Reference

**Bucket Name**: `product-images`  
**Bucket Type**: Public  
**File Size Limit**: 2MB  
**Allowed Types**: JPEG, PNG, JPG  
**Required Policies**: 4 (INSERT, UPDATE, SELECT, DELETE)

---

## Need Help?

If you're still having issues:

1. **Check Supabase Logs**
   - Go to **Logs** → **Storage** in dashboard
   - Look for error messages

2. **Test in SQL Editor**
   - Try uploading a test file manually
   - Check if policies are working

3. **Verify Authentication**
   - Make sure you're logged in as a business owner
   - Check that your user has the correct role

4. **Common Mistakes**
   - ❌ Bucket name has spaces or wrong case
   - ❌ Bucket is not set to public
   - ❌ Missing SELECT policy for public role
   - ❌ Policies have wrong bucket_id check

