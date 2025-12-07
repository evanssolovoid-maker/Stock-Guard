# Supabase Setup Guide - StockGuard Custom Version

This guide will walk you through connecting StockGuard to a new Supabase account and setting up the database.

## 📋 Prerequisites

- A Supabase account (sign up at https://supabase.com if you don't have one)
- Node.js installed on your machine
- Basic knowledge of SQL

---

## Step 1: Create a New Supabase Project

1. **Go to Supabase Dashboard**

   - Visit https://supabase.com/dashboard
   - Sign in or create an account

2. **Create New Project**
   - Click **"New Project"** button
   - Fill in the project details:
     - **Name**: `stockguard` (or your preferred name)
     - **Database Password**: Create a strong password (save this somewhere safe!)
     - **Region**: Choose closest to your location
     - **Pricing Plan**: Select Free tier or your preferred plan
   - Click **"Create new project"**
   - Wait 2-3 minutes for the project to be provisioned

---

## Step 2: Get Your API Keys

1. **Navigate to Project Settings**

   - In your project dashboard, click the **⚙️ Settings** icon (bottom left)
   - Click **"API"** in the settings menu

2. **Copy Your Credentials**
   You'll need:

   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys" → "anon public")

   Example format:

   ```
   Project URL: https://xxxxxxxxxxxxx.supabase.co
   anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   ⚠️ **Keep these secure!** The anon key is safe to use in frontend code.

---

## Step 3: Set Up Environment Variables

1. **Create `.env.local` file**

   - In your project root directory (`C:\Users\UMER\Desktop\My Projects\Stock-Guard\`)
   - Create a new file named `.env.local`

2. **Add Your Credentials**
   Open `.env.local` and add:

   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

   Replace:

   - `https://your-project-id.supabase.co` with your actual Project URL
   - `your-anon-key-here` with your actual anon key

   **Example:**

   ```env
   VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0NzU2ODAwMCwiZXhwIjoxOTYzMTQ0MDAwfQ.example
   ```

3. **Verify File Location**
   Make sure `.env.local` is in the root directory (same level as `package.json`)

---

## Step 4: Run Database Migration

1. **Open SQL Editor**

   - In Supabase Dashboard, click **"SQL Editor"** in the left sidebar
   - Click **"New Query"**

2. **Run the Migration Script**

   - Open `database/migration-custom-auth.sql` from your project
   - Copy the **entire contents** of the file
   - Paste into the SQL Editor
   - Click **"Run"** (or press `Ctrl+Enter`)

3. **Verify Migration**

   - You should see "Success. No rows returned" or similar success message
   - Check the **"Table Editor"** in the left sidebar
   - You should see these tables:
     - `user_profiles`
     - `owner_settings`
     - `products`
     - `sales`
     - `sales_items`
     - `business_workers`
     - `invite_codes`

4. **Check Functions**
   - In SQL Editor, run:
     ```sql
     SELECT routine_name
     FROM information_schema.routines
     WHERE routine_schema = 'public'
     AND routine_type = 'FUNCTION';
     ```
   - You should see:
     - `verify_password`
     - `create_user`
     - `log_multi_item_sale`
     - `update_updated_at_column`

---

## Step 5: Set Up Storage Buckets (for Product Images)

1. **Navigate to Storage**

   - Click **"Storage"** in the left sidebar
   - Click **"Create a new bucket"**

2. **Create Product Images Bucket**

   - **Name**: `product-images`
   - **Public bucket**: ✅ **Enable** (checked)
   - Click **"Create bucket"**

3. **Set Bucket Policies**

   - Click on the `product-images` bucket
   - Go to **"Policies"** tab
   - Click **"New Policy"**

   **Policy 1: Allow Public Read Access**

   - **Policy name**: `Public read access`
   - **Allowed operation**: `SELECT`
   - **Policy definition**:
     ```sql
     true
     ```
   - Click **"Review"** then **"Save policy"**

   **Policy 2: Allow Authenticated Upload**

   - Click **"New Policy"** again
   - **Policy name**: `Authenticated upload`
   - **Allowed operation**: `INSERT`
   - **Policy definition**:
     ```sql
     bucket_id = 'product-images' AND auth.role() = 'authenticated'
     ```
   - Click **"Review"** then **"Save policy"**

   **Policy 3: Allow Authenticated Update**

   - Click **"New Policy"** again
   - **Policy name**: `Authenticated update`
   - **Allowed operation**: `UPDATE`
   - **Policy definition**:
     ```sql
     bucket_id = 'product-images' AND auth.role() = 'authenticated'
     ```
   - Click **"Review"** then **"Save policy"**

   **Policy 4: Allow Authenticated Delete**

   - Click **"New Policy"** again
   - **Policy name**: `Authenticated delete`
   - **Allowed operation**: `DELETE`
   - **Policy definition**:
     ```sql
     bucket_id = 'product-images' AND auth.role() = 'authenticated'
     ```
   - Click **"Review"** then **"Save policy"**

---

## Step 6: Enable Required PostgreSQL Extensions

1. **Open SQL Editor**

   - Click **"SQL Editor"** → **"New Query"**

2. **Run Extension Commands**

   ```sql
   -- Enable UUID extension (should already be enabled)
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

   -- Enable pgcrypto for password hashing
   CREATE EXTENSION IF NOT EXISTS "pgcrypto";
   ```

   - Click **"Run"**

---

## Step 7: Verify Default Owner Account

After running the migration, a default owner account should be created:

- **Username**: `admin`
- **Password**: `admin123`

⚠️ **IMPORTANT**: Change this password immediately in production!

To verify it was created:

1. Go to **"Table Editor"** → **"user_profiles"**
2. Look for a user with `username = 'admin'` and `role = 'owner'`

---

## Step 8: Test Your Connection

1. **Install Dependencies** (if not already done)

   ```bash
   npm install
   ```

2. **Start Development Server**

   ```bash
   npm run dev
   ```

3. **Test Login**

   - Open http://localhost:5173 (or the port shown in terminal)
   - Try logging in with:
     - Username: `admin`
     - Password: `admin123`

4. **Check Console**
   - Open browser DevTools (F12)
   - Check the Console tab
   - You should see: `Supabase configured: { url: '...', keyPresent: true, ... }`
   - If you see errors about missing environment variables, check your `.env.local` file

---

## Step 9: (Optional) Create Additional Test Accounts

If you want to test with managers or workers:

1. **Open SQL Editor**
2. **Run this query** (update values as needed):

   ```sql
   -- Create a test manager
   SELECT create_user(
     'manager1',
     'manager123',
     'manager'::user_role,
     'Test Manager',
     '+256700000001'
   );

   -- Create a test worker
   SELECT create_user(
     'worker1',
     'worker123',
     'worker'::user_role,
     'Test Worker',
     '+256700000002'
   );
   ```

---

## 🔧 Troubleshooting

### Issue: "Missing Supabase environment variables"

**Solution**:

- Check that `.env.local` exists in the root directory
- Verify the variable names are exactly: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Restart your dev server after creating/updating `.env.local`

### Issue: Migration fails with "relation already exists"

**Solution**:

- The migration script is idempotent and checks for existing tables
- This is usually safe to ignore, but if you get errors, you may need to drop existing tables first

### Issue: Cannot log in with admin/admin123

**Solution**:

- Check if the user was created in `user_profiles` table
- Verify the password hash exists (password_hash column should not be null)
- Try creating the user manually using the `create_user` function

### Issue: Storage bucket policies not working

**Solution**:

- Verify the bucket is set to public
- Check that policies are saved correctly
- Try using the bucket from SQL Editor first

### Issue: Functions not found

**Solution**:

- Re-run the migration script
- Check SQL Editor for errors
- Verify you have permission to create functions

---

## 📝 Next Steps

1. ✅ **Change Default Password**: Update the admin password immediately
2. ✅ **Test Features**: Try adding products, logging sales, etc.
3. ✅ **Review RLS Policies**: Ensure row-level security is configured correctly
4. ✅ **Backup Database**: Set up regular backups in Supabase dashboard

---

## 🔐 Security Checklist

- [ ] Changed default admin password
- [ ] Verified RLS policies are enabled on all tables
- [ ] Set up database backups
- [ ] Reviewed storage bucket policies
- [ ] Kept API keys secure (not in git)
- [ ] Added `.env.local` to `.gitignore` (if using git)

---

## 📞 Need Help?

- Check `README_IMPLEMENTATION.md` for feature documentation
- Review `TROUBLESHOOTING.md` for common issues
- Check Supabase Dashboard logs for database errors
- Review browser console for frontend errors

---

**Setup Complete!** 🎉 You're ready to use StockGuard with your new Supabase account.
