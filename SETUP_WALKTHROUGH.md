# Complete Setup Walkthrough - StockGuard to New Supabase

Follow these steps in order. Each step builds on the previous one.

---

## 📍 Step 1: Create Your Supabase Account & Project

### 1.1 Sign Up / Sign In

- Visit: https://supabase.com/dashboard
- Sign in with your GitHub account (or create one)

### 1.2 Create New Project

1. Click the **"New Project"** button (green button, top right)
2. Fill in the form:
   ```
   Organization: [Your organization or create new]
   Name: stockguard
   Database Password: [Create a strong password - save it!]
   Region: [Choose closest to you]
   Pricing Plan: Free
   ```
3. Click **"Create new project"**
4. ⏳ Wait 2-3 minutes for setup

### 1.3 Verify Project is Ready

- You should see a dashboard with "Welcome to your new project"
- Status should show "Active" (green)

---

## 📍 Step 2: Get Your API Keys

### 2.1 Navigate to Settings

1. Look at the **left sidebar** in Supabase dashboard
2. Click the **⚙️ Settings** icon (at the bottom)
3. Click **"API"** in the settings menu

### 2.2 Copy Your Credentials

You'll see two things you need:

**Project URL:**

```
Format: https://xxxxxxxxxxxxx.supabase.co
Example: https://abcdefghijklmnop.supabase.co
```

**API Keys:**

- Look for **"Project API keys"** section
- Find the **"anon public"** key (it's very long, starts with `eyJ...`)
- Click the **👁️ eye icon** to reveal it
- Click **📋 copy icon** to copy it

**💡 Save both somewhere temporarily** - you'll paste them next!

---

## 📍 Step 3: Create Environment File

### 3.1 Navigate to Your Project Folder

Open File Explorer and go to:

```
C:\Users\UMER\Desktop\My Projects\Stock-Guard\
```

### 3.2 Create `.env.local` File

1. In the root folder, right-click → **New** → **Text Document**
2. Name it exactly: `.env.local` (including the dot at the start)
   - ⚠️ Windows might warn about the dot - that's OK
   - You may need to rename it in a code editor if Windows won't let you

### 3.3 Add Your Credentials

Open `.env.local` in Notepad or your code editor and paste:

```env
VITE_SUPABASE_URL=paste-your-project-url-here
VITE_SUPABASE_ANON_KEY=paste-your-anon-key-here
```

**Replace with your actual values:**

Example:

```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0NzU2ODAwMCwiZXhwIjoxOTYzMTQ0MDAwfQ.example
```

### 3.4 Save the File

- Save and close the file
- ✅ Verify it's in the same folder as `package.json`

---

## 📍 Step 4: Run Database Migration

### 4.1 Open SQL Editor

1. In Supabase Dashboard, click **"SQL Editor"** in left sidebar
2. Click **"New Query"** button

### 4.2 Get the Migration File

1. Open your project folder
2. Navigate to: `database\migration-fresh-install.sql`
   - ⚠️ **Important**: Use `migration-fresh-install.sql` for new Supabase projects!
3. Open it in a text editor (VS Code, Notepad++, etc.)

### 4.3 Copy Migration SQL

1. Select **ALL** text in the file (Ctrl+A)
2. Copy it (Ctrl+C)

### 4.4 Paste and Run

1. Go back to Supabase SQL Editor
2. Delete any existing text in the editor
3. Paste the migration SQL (Ctrl+V)
4. Click the **"Run"** button (or press Ctrl+Enter)
5. ⏳ Wait for execution (may take 10-30 seconds)

### 4.5 Check for Success

- You should see: **"Success. No rows returned"** or similar
- If you see errors, scroll down to see what failed
- Most errors are safe to ignore if tables already exist

---

## 📍 Step 5: Verify Tables Created

### 5.1 Check Table Editor

1. Click **"Table Editor"** in left sidebar
2. You should see these tables:
   - ✅ `user_profiles`
   - ✅ `owner_settings`
   - ✅ `products`
   - ✅ `sales`
   - ✅ `sales_items`
   - ✅ `business_workers`
   - ✅ `invite_codes`

If all tables are there, you're good! ✅

### 5.2 Check Default Admin Account

1. Click on **`user_profiles`** table
2. Look for a row with:
   - `username` = `admin`
   - `role` = `owner`

If it's there, perfect! If not, we'll create it in troubleshooting.

---

## 📍 Step 6: Set Up Storage for Images

### 6.1 Create Storage Bucket

1. Click **"Storage"** in left sidebar
2. Click **"Create a new bucket"** button
3. Fill in:
   - **Name**: `product-images` (exactly, no spaces)
   - ✅ **Public bucket**: Check this box (IMPORTANT!)
   - Leave other fields as default
4. Click **"Create bucket"**

### 6.2 Set Up Storage Policies

1. Click on the **`product-images`** bucket
2. Click the **"Policies"** tab
3. You'll create 4 policies:

#### Policy 1: Public Read

- Click **"New Policy"**
- Choose: **"Create a policy from scratch"**
- Policy name: `Public read access`
- Allowed operation: `SELECT`
- Target roles: `public`
- Policy definition:
  ```sql
  true
  ```
- Click **"Review"** → **"Save policy"**

#### Policy 2: Public Upload

- Click **"New Policy"** again
- Choose: **"Create a policy from scratch"**
- Policy name: `Public upload`
- Allowed operation: `INSERT`
- Target roles: `public`
- Policy definition:
  ```sql
  bucket_id = 'product-images'
  ```
- Click **"Review"** → **"Save policy"**

#### Policy 3: Public Update

- Click **"New Policy"** again
- Policy name: `Public update`
- Allowed operation: `UPDATE`
- Target roles: `public`
- Using expression:
  ```sql
  bucket_id = 'product-images'
  ```
- With check expression:
  ```sql
  bucket_id = 'product-images'
  ```
- Click **"Review"** → **"Save policy"**

#### Policy 4: Public Delete

- Click **"New Policy"** again
- Policy name: `Public delete`
- Allowed operation: `DELETE`
- Target roles: `public`
- Policy definition:
  ```sql
  bucket_id = 'product-images'
  ```
- Click **"Review"** → **"Save policy"**

✅ You should now have 4 policies listed!

---

## 📍 Step 7: Test the Connection

### 7.1 Install Dependencies

1. Open **PowerShell** or **Command Prompt**
2. Navigate to your project:
   ```powershell
   cd "C:\Users\UMER\Desktop\My Projects\Stock-Guard"
   ```
3. Install packages:
   ```powershell
   npm install
   ```
4. Wait for installation to complete

### 7.2 Start Development Server

```powershell
npm run dev
```

You should see:

```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

### 7.3 Open Browser

1. Open your browser
2. Go to: `http://localhost:5173`
3. Open **Developer Tools** (Press F12)
4. Go to **Console** tab

### 7.4 Check for Connection

In the console, you should see:

```
Supabase configured: { url: 'https://...', keyPresent: true, ... }
```

✅ If you see this, the connection is working!

### 7.5 Test Login

1. On the login page, enter:
   - **Username**: `admin`
   - **Password**: `admin123`
2. Click **"Sign in"**
3. You should be redirected to the dashboard!

---

## 🎉 Success Checklist

After completing all steps, verify:

- [ ] Supabase project is created and active
- [ ] `.env.local` file exists with correct credentials
- [ ] Database migration ran successfully
- [ ] All 7 tables are visible in Table Editor
- [ ] `product-images` storage bucket exists and is public
- [ ] 4 storage policies are created
- [ ] Development server starts without errors
- [ ] Browser console shows "Supabase configured"
- [ ] Can log in with admin/admin123
- [ ] Dashboard loads after login

---

## 🐛 Common Issues & Fixes

### Issue: "Missing Supabase environment variables"

**Fix:**

- Check `.env.local` file exists in root folder
- Verify it's named exactly `.env.local` (with the dot)
- Check variable names: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Restart the dev server after creating/editing `.env.local`

### Issue: Migration fails

**Fix:**

- Check the error message in SQL Editor
- Most "already exists" errors are safe to ignore
- Try running just the parts that failed

### Issue: Can't create `.env.local` with dot

**Fix:**

- Create it as `env.local` first
- Then rename it to `.env.local` in VS Code or another editor
- Or use command line: `ren env.local .env.local`

### Issue: Can't log in

**Fix:**

- Check `user_profiles` table for admin user
- If missing, run in SQL Editor:
  ```sql
  SELECT create_user(
    'admin',
    'admin123',
    'owner'::user_role,
    'My Company',
    '+256700000000'
  );
  ```

### Issue: Storage not working

**Fix:**

- Verify bucket name is exactly `product-images`
- Check bucket is marked as "Public"
- Verify all 4 policies exist
- Try the simplified SQL approach from `database/storage-setup-complete.sql`

---

## 📞 Need Help?

- 📖 See `SUPABASE_SETUP.md` for detailed documentation
- ✅ Use `SUPABASE_CONNECTION_CHECKLIST.md` for a quick checklist
- 🚀 Check `QUICK_START.md` for a 5-minute summary

---

**You're all set!** 🎉 Start building with StockGuard!
