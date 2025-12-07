# ✅ Storage Setup Checklist

Use this checklist to set up storage step-by-step.

---

## Option 1: Quick SQL Setup ⚡

- [ ] Open Supabase Dashboard → **SQL Editor** → **New Query**
- [ ] Open file: `database/storage-setup-complete.sql`
- [ ] Copy ALL contents (Ctrl+A, Ctrl+C)
- [ ] Paste into SQL Editor (Ctrl+V)
- [ ] Click **"Run"** button
- [ ] See "Success" message
- [ ] Verify bucket exists: **Storage** → **Buckets** → See `product-images`
- [ ] Verify policies: **Storage** → **Policies** → See 4 policies

✅ **Done!** Skip to "Final Verification" below.

---

## Option 2: Manual Dashboard Setup 📝

### Part A: Create Bucket

- [ ] Go to Supabase Dashboard
- [ ] Click **"Storage"** in left sidebar
- [ ] Click **"Buckets"** tab
- [ ] Click **"New bucket"** button
- [ ] Enter bucket name: `product-images`
- [ ] ✅ Check **"Public bucket"** checkbox
- [ ] (Optional) Set file size limit: `5242880` (5MB)
- [ ] (Optional) Add MIME types: `image/jpeg, image/png, image/jpg`
- [ ] Click **"Create bucket"** button
- [ ] Verify bucket appears in list

### Part B: Create Policies

- [ ] Go to **Storage** → **Policies** tab
- [ ] Select **`product-images`** bucket from dropdown

#### Policy 1: Public View

- [ ] Click **"New Policy"**
- [ ] Policy name: `Public can view product images`
- [ ] Allowed operation: `SELECT`
- [ ] Target roles: `public`
- [ ] Policy definition: `bucket_id = 'product-images'`
- [ ] Click **"Save policy"**

#### Policy 2: Public Upload

- [ ] Click **"New Policy"**
- [ ] Policy name: `Anyone can upload product images`
- [ ] Allowed operation: `INSERT`
- [ ] Target roles: `public`
- [ ] Policy definition: `bucket_id = 'product-images'`
- [ ] Click **"Save policy"**

#### Policy 3: Public Update

- [ ] Click **"New Policy"**
- [ ] Policy name: `Anyone can update product images`
- [ ] Allowed operation: `UPDATE`
- [ ] Target roles: `public`
- [ ] USING expression: `bucket_id = 'product-images'`
- [ ] WITH CHECK expression: `bucket_id = 'product-images'`
- [ ] Click **"Save policy"**

#### Policy 4: Public Delete

- [ ] Click **"New Policy"**
- [ ] Policy name: `Anyone can delete product images`
- [ ] Allowed operation: `DELETE`
- [ ] Target roles: `public`
- [ ] Policy definition: `bucket_id = 'product-images'`
- [ ] Click **"Save policy"**

---

## Final Verification ✅

### Check Bucket

- [ ] Go to **Storage** → **Buckets**
- [ ] See `product-images` bucket listed
- [ ] Click on `product-images`
- [ ] Verify **"Public bucket"** is enabled/ON

### Check Policies

- [ ] Go to **Storage** → **Policies**
- [ ] Select `product-images` bucket
- [ ] Count policies - should see **4 policies**:
  - [ ] Public can view product images (SELECT)
  - [ ] Anyone can upload product images (INSERT)
  - [ ] Anyone can update product images (UPDATE)
  - [ ] Anyone can delete product images (DELETE)

### Test in App

- [ ] Start dev server: `npm run dev`
- [ ] Log in to app
- [ ] Go to Products page
- [ ] Click "Add Product"
- [ ] Try uploading an image (PNG or JPG)
- [ ] Image uploads successfully ✅
- [ ] Image displays after upload ✅

---

## 🎉 All Done!

If all checkboxes are checked, your storage is fully configured!

**Next Steps:**
- Add products with images
- Test image uploads
- Verify images display correctly

---

**Need detailed instructions?** See `STORAGE_POLICIES_GUIDE.md`




