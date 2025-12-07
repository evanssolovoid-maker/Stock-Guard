# 🚀 Storage Setup - Super Simple Guide

**5-Minute Setup** for product image storage.

---

## ✅ Quick Method (Recommended)

### Step 1: Copy SQL Script
Open: `database/storage-setup-complete.sql`

### Step 2: Run in Supabase
1. Go to Supabase Dashboard → **SQL Editor** → **New Query**
2. Paste the SQL script
3. Click **Run**

### Step 3: Verify
- Go to **Storage** → **Buckets**
- You should see `product-images` bucket ✅

**Done!** That's it! 🎉

---

## 📝 Manual Method (Step-by-Step)

### Create Bucket

1. **Storage** → **Buckets** → **New bucket**
2. Name: `product-images`
3. ✅ Check **"Public bucket"**
4. Click **Create**

### Create 4 Policies

Go to **Storage** → **Policies** → Select `product-images`

**Policy 1:**
- Name: `Public can view product images`
- Operation: `SELECT`
- Role: `public`
- Expression: `bucket_id = 'product-images'`

**Policy 2:**
- Name: `Anyone can upload product images`
- Operation: `INSERT`
- Role: `public`
- Expression: `bucket_id = 'product-images'`

**Policy 3:**
- Name: `Anyone can update product images`
- Operation: `UPDATE`
- Role: `public`
- Expression: `bucket_id = 'product-images'`

**Policy 4:**
- Name: `Anyone can delete product images`
- Operation: `DELETE`
- Role: `public`
- Expression: `bucket_id = 'product-images'`

---

## ✅ Verification

- [ ] Bucket `product-images` exists
- [ ] Bucket is **Public**
- [ ] 4 policies created
- [ ] Can upload image in app

---

**That's it!** Your storage is ready. See `STORAGE_POLICIES_GUIDE.md` for detailed instructions.


