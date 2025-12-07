# Quick Start Guide - Connecting to Supabase

## 🚀 5-Minute Setup

### 1. Create Supabase Project
- Go to https://supabase.com/dashboard
- Click "New Project"
- Fill in: Name, Database Password, Region
- Wait 2-3 minutes for setup

### 2. Get Your Keys
- Settings (⚙️) → API
- Copy **Project URL** and **anon public** key

### 3. Create `.env.local` File
Create file in project root:
```env
VITE_SUPABASE_URL=your-project-url-here
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run Database Migration
- Supabase Dashboard → SQL Editor
- Open `database/migration-custom-auth.sql`
- Copy & paste all SQL → Click "Run"

### 5. Set Up Storage
- Storage → Create bucket: `product-images` (public)
- Add policies (see full guide in SUPABASE_SETUP.md)

### 6. Test It!
```bash
npm install
npm run dev
```

Login with:
- Username: `admin`
- Password: `admin123`

---

📖 **Full detailed guide**: See `SUPABASE_SETUP.md`




