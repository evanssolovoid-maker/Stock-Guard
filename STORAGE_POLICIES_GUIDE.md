# 📸 Complete Step-by-Step Guide: Storage Policies Setup

This guide will walk you through setting up Supabase Storage for product images in StockGuard.

---

## 🎯 Overview

We need to:

1. Create a storage bucket named `product-images`
2. Make it public (so images can be displayed)
3. Create 4 policies (SELECT, INSERT, UPDATE, DELETE)

**Time needed:** 5-10 minutes

---

## Method 1: Quick Setup Using SQL (Recommended) ⚡

### Step 1: Open SQL Editor

1. Go to your **Supabase Dashboard**
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New Query"** button

### Step 2: Create the Bucket and Policies

1. Open the file: `database/storage-setup-complete.sql` from your project
2. **Select ALL** contents (Ctrl+A)
3. **Copy** (Ctrl+C)
4. **Paste** into the SQL Editor (Ctrl+V)
5. Click **"Run"** button (or press Ctrl+Enter)

### Step 3: Verify Setup

1. Go to **Storage** → **Buckets** in Supabase Dashboard
2. You should see **`product-images`** bucket listed
3. Click on it to verify it's **Public**

✅ **Done!** If you see the bucket, you're all set!

---

## Method 2: Manual Setup via Dashboard (Step-by-Step) 📝

If you prefer to set up everything manually through the Supabase Dashboard, follow these steps:

---

### 🗂️ Part 1: Create the Storage Bucket

#### Step 1.1: Navigate to Storage

1. In Supabase Dashboard, look at the **left sidebar**
2. Find and click **"Storage"**
3. You'll see a page with tabs: **Buckets**, **Policies**, **Files**

#### Step 1.2: Create New Bucket

1. Click the **"New bucket"** button (usually top right, green button)
2. A form will appear. Fill it in:

   **Bucket name:**

   ```
   product-images
   ```

   ⚠️ **Important:**

   - Use exactly this name: `product-images`
   - No spaces, no capital letters
   - Must match exactly

   **Public bucket:**

   - ✅ **CHECK THIS BOX** (This is critical!)
   - This allows images to be displayed publicly

   **File size limit:** (Optional)

   - You can leave default or set to: `2097152` (2MB)
   - This limits image file sizes

   **Allowed MIME types:** (Optional)

   - You can leave empty or add: `image/jpeg, image/png, image/jpg`

3. Click **"Create bucket"** button
4. Wait a moment for it to be created

#### Step 1.3: Verify Bucket Created

1. You should now see `product-images` in your buckets list
2. Click on **`product-images`** to open it
3. Verify it shows **"Public bucket"** is enabled

---

### 🔒 Part 2: Create Storage Policies

Now we'll create 4 policies to control who can upload, view, update, and delete images.

#### Step 2.1: Navigate to Policies

1. Still in the **Storage** section
2. Click the **"Policies"** tab at the top
3. You should see a list/dropdown of buckets
4. Select **`product-images`** from the dropdown/list

---

#### Policy 1: Public Read (SELECT) - Allow Anyone to View Images

**Purpose:** This allows images to be displayed in your app

1. Click **"New Policy"** button
2. Choose: **"Create a policy from scratch"** (if option appears)
3. Fill in the form:

   **Policy name:**

   ```
   Public can view product images
   ```

   **Allowed operation:**

   - Select: **`SELECT`**

   **Target roles:**

   - Select: **`public`** (this makes it accessible to everyone)

   **Policy definition (USING expression):**

   ```sql
   bucket_id = 'product-images'
   ```

   **Policy definition (WITH CHECK expression):**

   - Leave empty or use the same:

   ```sql
   bucket_id = 'product-images'
   ```

4. Click **"Review"** button (or **"Save"** if no review button)
5. Review the policy details
6. Click **"Save policy"** or **"Confirm"**

✅ **Policy 1 created!**

---

#### Policy 2: Public Upload (INSERT) - Allow Anyone to Upload Images

**Purpose:** This allows users to upload product images

1. Click **"New Policy"** button again
2. Fill in:

   **Policy name:**

   ```
   Anyone can upload product images
   ```

   **Allowed operation:**

   - Select: **`INSERT`**

   **Target roles:**

   - Select: **`public`**

   **Policy definition (WITH CHECK expression):**

   ```sql
   bucket_id = 'product-images'
   ```

   **Policy definition (USING expression):**

   - Leave empty or use:

   ```sql
   bucket_id = 'product-images'
   ```

3. Click **"Review"** → **"Save policy"**

✅ **Policy 2 created!**

---

#### Policy 3: Public Update (UPDATE) - Allow Anyone to Update Images

**Purpose:** This allows updating/replacing product images

1. Click **"New Policy"** button again
2. Fill in:

   **Policy name:**

   ```
   Anyone can update product images
   ```

   **Allowed operation:**

   - Select: **`UPDATE`**

   **Target roles:**

   - Select: **`public`**

   **Policy definition (USING expression):**

   ```sql
   bucket_id = 'product-images'
   ```

   **Policy definition (WITH CHECK expression):**

   ```sql
   bucket_id = 'product-images'
   ```

3. Click **"Review"** → **"Save policy"**

✅ **Policy 3 created!**

---

#### Policy 4: Public Delete (DELETE) - Allow Anyone to Delete Images

**Purpose:** This allows deleting product images

1. Click **"New Policy"** button again
2. Fill in:

   **Policy name:**

   ```
   Anyone can delete product images
   ```

   **Allowed operation:**

   - Select: **`DELETE`**

   **Target roles:**

   - Select: **`public`**

   **Policy definition (USING expression):**

   ```sql
   bucket_id = 'product-images'
   ```

   **Policy definition (WITH CHECK expression):**

   - Leave empty

3. Click **"Review"** → **"Save policy"**

✅ **Policy 4 created!**

---

### ✅ Part 3: Verify Everything is Set Up

#### Step 3.1: Check Policies List

1. In **Storage** → **Policies** tab
2. Make sure **`product-images`** is selected in the bucket dropdown
3. You should see **4 policies** listed:
   - ✅ Public can view product images (SELECT)
   - ✅ Anyone can upload product images (INSERT)
   - ✅ Anyone can update product images (UPDATE)
   - ✅ Anyone can delete product images (DELETE)

#### Step 3.2: Verify Bucket Settings

1. Go to **Storage** → **Buckets** tab
2. Click on **`product-images`** bucket
3. Check that:
   - ✅ **"Public bucket"** is enabled/ON
   - ✅ Bucket name is exactly `product-images`

---

## 🧪 Part 4: Test the Setup

### Quick Test

1. **Start your development server:**

   ```bash
   npm run dev
   ```

2. **Log in to your app:**

   - Username: `admin`
   - Password: `admin123`

3. **Try uploading a product image:**
   - Go to Products page
   - Click "Add Product"
   - Try uploading an image (PNG or JPG)
   - If it uploads successfully, you're all set! ✅

---

## 📋 Quick Reference Checklist

Use this checklist to verify everything is set up:

### Bucket Setup

- [ ] Bucket named exactly: `product-images`
- [ ] Bucket is set to **Public**
- [ ] Bucket appears in Storage → Buckets list

### Policies Setup

- [ ] Policy 1: "Public can view product images" (SELECT, public)
- [ ] Policy 2: "Anyone can upload product images" (INSERT, public)
- [ ] Policy 3: "Anyone can update product images" (UPDATE, public)
- [ ] Policy 4: "Anyone can delete product images" (DELETE, public)

### Verification

- [ ] All 4 policies visible in Storage → Policies
- [ ] Can upload image in the app
- [ ] Image displays after upload

---

## 🐛 Troubleshooting

### Issue: "Bucket already exists"

**What it means:** You tried to create the bucket twice

**Solution:**

- That's fine! Just proceed to creating policies
- Or delete the existing bucket and recreate it

### Issue: "Policy already exists"

**What it means:** You tried to create the same policy twice

**Solution:**

1. Go to Storage → Policies
2. Find the duplicate policy
3. Click the **⋯** (three dots) or delete icon
4. Delete it
5. Create it again

### Issue: "Permission denied" when uploading

**Possible causes:**

1. Bucket is not public
2. Policies not created correctly
3. Wrong bucket name

**Solution:**

1. Check bucket is set to **Public**:
   - Storage → Buckets → `product-images` → Settings
   - Make sure "Public bucket" is checked
2. Verify all 4 policies exist:
   - Storage → Policies → `product-images`
   - Count them - should be 4
3. Check bucket name matches exactly: `product-images`

### Issue: Images not displaying

**Possible causes:**

1. Missing SELECT policy
2. Bucket not public
3. Wrong image URL

**Solution:**

1. Verify SELECT policy exists for `public` role
2. Check bucket is public
3. Check browser console for image loading errors

### Issue: Can't find "Policies" tab

**What it means:** You might be in the wrong section

**Solution:**

1. Make sure you're in **Storage** section (left sidebar)
2. Look for tabs at the top: **Buckets**, **Policies**, **Files**
3. Click the **Policies** tab

---

## 🔍 Verification Queries

Run these in SQL Editor to verify setup:

### Check Bucket Exists

```sql
SELECT * FROM storage.buckets WHERE id = 'product-images';
```

Should return 1 row with `public = true`

### Check Policies Exist

```sql
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
AND policyname LIKE '%product images%';
```

Should return 4 rows (one for each policy)

---

## 📸 Visual Guide Reference

### Where to Find Things in Supabase Dashboard

```
Left Sidebar:
├── 🏠 Table Editor
├── 📊 SQL Editor  ← Use this for quick SQL setup
├── 💾 Storage     ← Use this for manual setup
│   ├── Buckets    ← Create bucket here
│   ├── Policies   ← Create policies here
│   └── Files      ← View uploaded files here
└── ⚙️ Settings
```

---

## ⚡ Quick SQL Setup (Copy-Paste)

If you prefer the quick method, use this SQL script:

1. Open `database/storage-setup-custom-auth.sql`
2. Copy all contents
3. Paste in SQL Editor
4. Run it

This creates everything automatically!

---

## 🎉 Success!

Once you've completed all steps:

✅ Your storage bucket is ready  
✅ All policies are configured  
✅ Product images can be uploaded and displayed  
✅ You can now add products with images in your app!

---

## 📝 Notes

- **Bucket must be Public** - Images need to be accessible via URLs
- **Policy names don't matter** - But use descriptive names for clarity
- **Public policies** - Since we're using custom auth, we use public policies
- **File size limits** - Consider setting limits to prevent huge uploads

---

**Need more help?** Check the troubleshooting section above or see `STORAGE_SETUP_GUIDE.md` for more details.
