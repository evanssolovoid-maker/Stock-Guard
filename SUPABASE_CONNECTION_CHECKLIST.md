# Supabase Connection Checklist ✅

Follow this checklist step-by-step to connect StockGuard to your new Supabase account.

## Phase 1: Create Supabase Project

- [ ] **Sign in/Sign up** at https://supabase.com/dashboard
- [ ] Click **"New Project"** button
- [ ] Enter project details:
  - [ ] Project name: `stockguard` (or your choice)
  - [ ] Database password: Create a strong password (save it!)
  - [ ] Region: Select closest to you
  - [ ] Pricing plan: Free tier (or your preference)
- [ ] Click **"Create new project"**
- [ ] Wait 2-3 minutes for provisioning to complete

## Phase 2: Get API Credentials

- [ ] Click **⚙️ Settings** icon (bottom left of dashboard)
- [ ] Click **"API"** in settings menu
- [ ] Copy **Project URL** (looks like: `https://xxxxx.supabase.co`)
- [ ] Copy **anon public** key (long JWT token under "Project API keys")
- [ ] Save both somewhere temporarily (you'll use them next)

## Phase 3: Configure Environment Variables

- [ ] Navigate to project root folder:
  ```
  C:\Users\UMER\Desktop\My Projects\Stock-Guard\
  ```
- [ ] Create new file named: `.env.local`
- [ ] Add these lines (replace with your actual values):
  ```env
  VITE_SUPABASE_URL=https://your-project-id.supabase.co
  VITE_SUPABASE_ANON_KEY=your-anon-key-here
  ```
- [ ] Save the file

**Example:**
```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0NzU2ODAwMCwiZXhwIjoxOTYzMTQ0MDAwfQ.example
```

## Phase 4: Run Database Migration

- [ ] In Supabase Dashboard, click **"SQL Editor"** (left sidebar)
- [ ] Click **"New Query"** button
- [ ] Open file: `database/migration-custom-auth.sql`
- [ ] Select **ALL** contents (Ctrl+A)
- [ ] Copy (Ctrl+C)
- [ ] Paste into SQL Editor (Ctrl+V)
- [ ] Click **"Run"** button (or press Ctrl+Enter)
- [ ] Wait for "Success" message
- [ ] Check for any errors (should be none)

## Phase 5: Verify Tables Were Created

- [ ] Click **"Table Editor"** (left sidebar)
- [ ] Verify these tables exist:
  - [ ] `user_profiles`
  - [ ] `owner_settings`
  - [ ] `products`
  - [ ] `sales`
  - [ ] `sales_items`
  - [ ] `business_workers`
  - [ ] `invite_codes`

## Phase 6: Set Up Storage for Product Images

- [ ] Click **"Storage"** (left sidebar)
- [ ] Click **"Create a new bucket"**
- [ ] Enter bucket name: `product-images`
- [ ] **Check** ✅ "Public bucket"
- [ ] Click **"Create bucket"**
- [ ] Click on the `product-images` bucket
- [ ] Go to **"Policies"** tab
- [ ] Click **"New Policy"** (you'll create 4 policies)

### Policy 1: Public Read
- [ ] Policy name: `Public read access`
- [ ] Allowed operation: `SELECT`
- [ ] Policy definition: `true`
- [ ] Click **"Review"** → **"Save policy"**

### Policy 2: Authenticated Upload
- [ ] Click **"New Policy"** again
- [ ] Policy name: `Authenticated upload`
- [ ] Allowed operation: `INSERT`
- [ ] Policy definition: 
  ```sql
  bucket_id = 'product-images' AND auth.role() = 'authenticated'
  ```
- [ ] Click **"Review"** → **"Save policy"**

### Policy 3: Authenticated Update
- [ ] Click **"New Policy"** again
- [ ] Policy name: `Authenticated update`
- [ ] Allowed operation: `UPDATE`
- [ ] Policy definition:
  ```sql
  bucket_id = 'product-images' AND auth.role() = 'authenticated'
  ```
- [ ] Click **"Review"** → **"Save policy"**

### Policy 4: Authenticated Delete
- [ ] Click **"New Policy"** again
- [ ] Policy name: `Authenticated delete`
- [ ] Allowed operation: `DELETE`
- [ ] Policy definition:
  ```sql
  bucket_id = 'product-images' AND auth.role() = 'authenticated'
  ```
- [ ] Click **"Review"** → **"Save policy"**

## Phase 7: Verify Default Account

- [ ] Go to **"Table Editor"** → **"user_profiles"**
- [ ] Look for a row with:
  - `username` = `admin`
  - `role` = `owner`
- [ ] If not found, run this in SQL Editor:
  ```sql
  SELECT create_user(
    'admin',
    'admin123',
    'owner'::user_role,
    'My Company',
    '+256700000000'
  );
  ```

## Phase 8: Test Connection

- [ ] Open terminal/command prompt
- [ ] Navigate to project folder:
  ```bash
  cd "C:\Users\UMER\Desktop\My Projects\Stock-Guard"
  ```
- [ ] Install dependencies (if not done):
  ```bash
  npm install
  ```
- [ ] Start dev server:
  ```bash
  npm run dev
  ```
- [ ] Open browser to the URL shown (usually http://localhost:5173)
- [ ] Open browser DevTools (F12) → Console tab
- [ ] Look for: `Supabase configured: { url: '...', keyPresent: true }`
- [ ] Try logging in:
  - Username: `admin`
  - Password: `admin123`

## ✅ Success Indicators

You'll know everything is working if:
- ✅ No errors in browser console
- ✅ Can log in with admin/admin123
- ✅ Dashboard loads after login
- ✅ Can see tables in Supabase dashboard

## 🐛 Troubleshooting

### "Missing Supabase environment variables"
→ Check that `.env.local` file exists in root folder
→ Verify variable names are exact: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
→ Restart dev server after creating `.env.local`

### Migration errors
→ Check SQL Editor for specific error messages
→ Make sure you copied the entire migration file
→ Try running sections one at a time if needed

### Can't log in
→ Verify user exists in `user_profiles` table
→ Check that `password_hash` column has a value
→ Try creating user manually with `create_user` function

### Storage not working
→ Verify bucket is marked as "Public"
→ Check all 4 policies are created
→ Try uploading a file from Supabase dashboard first

## 🎉 All Done!

Once all checkboxes are checked, you're ready to use StockGuard!

**Next Steps:**
1. Change the default admin password
2. Add your first product
3. Create manager/worker accounts
4. Start logging sales!

---

📖 **Need more details?** See `SUPABASE_SETUP.md` for comprehensive guide.




