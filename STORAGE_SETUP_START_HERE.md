# 📸 Storage Setup - START HERE

Welcome! This guide will help you set up storage for product images.

---

## 🎯 Choose Your Method

### ⚡ Fast Method (2 minutes) - Recommended
**Use SQL script** - One click setup!
- 📄 Guide: `STORAGE_SETUP_SIMPLE.md`
- ⏱️ Time: 2-3 minutes

### 📝 Detailed Method (10 minutes)
**Step-by-step manual setup** - Learn everything!
- 📄 Guide: `STORAGE_POLICIES_GUIDE.md`
- ⏱️ Time: 10-15 minutes

### ✅ Checklist Method (5 minutes)
**Follow a checklist** - Check things off!
- 📄 Guide: `STORAGE_SETUP_CHECKLIST.md`
- ⏱️ Time: 5-10 minutes

---

## 🚀 Quick Start (Fastest)

### Step 1: Run SQL Script

1. Open: `database/storage-setup-complete.sql`
2. Copy ALL contents
3. Go to Supabase Dashboard → **SQL Editor** → **New Query**
4. Paste and click **"Run"**

### Step 2: Verify

1. Go to **Storage** → **Buckets**
2. You should see `product-images` bucket ✅

**Done!** That's it! 🎉

---

## 📋 What You Need to Set Up

1. ✅ Storage bucket named: `product-images`
2. ✅ Bucket must be **Public**
3. ✅ 4 policies created:
   - SELECT (view images)
   - INSERT (upload images)
   - UPDATE (update images)
   - DELETE (delete images)

---

## 📚 Detailed Guides

- **`STORAGE_POLICIES_GUIDE.md`** - Complete step-by-step walkthrough
- **`STORAGE_SETUP_CHECKLIST.md`** - Checklist format
- **`STORAGE_SETUP_SIMPLE.md`** - Quick reference

---

## 🆘 Quick Troubleshooting

**Can't find Storage?**
→ Look in left sidebar of Supabase Dashboard

**Bucket not created?**
→ Check SQL Editor for errors

**Policies missing?**
→ Make sure you created all 4 policies

**Images not uploading?**
→ Verify bucket is set to **Public**

---

**Ready?** Open `STORAGE_POLICIES_GUIDE.md` for detailed step-by-step instructions! 🚀




