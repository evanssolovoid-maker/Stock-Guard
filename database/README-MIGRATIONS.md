# Database Migration Guide

## Which Migration File Should I Use?

### 🆕 For Brand New Supabase Projects
**Use:** `migration-fresh-install.sql`

This is a complete installation script that creates everything from scratch. Use this if:
- ✅ You're setting up StockGuard for the first time
- ✅ You have a fresh, empty Supabase project
- ✅ No tables exist yet

### 🔄 For Existing Projects (Upgrading)
**Use:** `migration-custom-auth.sql`

This is an upgrade script that modifies existing tables. Use this if:
- ✅ You already have the old schema.sql tables
- ✅ You want to migrate from email-based auth to username/password
- ✅ You have existing data to preserve

---

## Quick Start for New Projects

1. **Open Supabase SQL Editor**
   - Go to your Supabase Dashboard
   - Click "SQL Editor" → "New Query"

2. **Copy the Fresh Install Script**
   - Open `database/migration-fresh-install.sql`
   - Copy ALL contents (Ctrl+A, Ctrl+C)

3. **Paste and Run**
   - Paste into SQL Editor (Ctrl+V)
   - Click "Run" or press Ctrl+Enter
   - Wait for "Success" message

4. **Verify**
   - Go to "Table Editor" in Supabase
   - You should see 8 tables created
   - Check `user_profiles` table for the admin user

5. **Default Login**
   - Username: `admin`
   - Password: `admin123`
   - ⚠️ Change this immediately!

---

## Migration Files Explained

### `migration-fresh-install.sql`
- ✅ Creates all tables from scratch
- ✅ Sets up custom authentication
- ✅ Creates all PostgreSQL functions
- ✅ Sets up indexes and triggers
- ✅ Seeds default admin account
- ✅ Perfect for new projects

### `migration-custom-auth.sql`
- ✅ Upgrades existing schema
- ✅ Adds username/password columns
- ✅ Creates new tables (owner_settings, sales_items)
- ✅ Updates existing tables
- ✅ Preserves existing data
- ✅ Use only if you have old tables

---

## Troubleshooting

### Error: "relation does not exist"
**Problem:** You're using the upgrade migration on a fresh database.

**Solution:** Use `migration-fresh-install.sql` instead.

### Error: "syntax error at or near IF NOT EXISTS"
**Problem:** PostgreSQL doesn't support IF NOT EXISTS for CREATE POLICY.

**Solution:** The fresh install script is already fixed. Use that one.

### Error: "column already exists"
**Problem:** You're trying to run migrations twice.

**Solution:** This is usually safe to ignore. The migrations use IF NOT EXISTS checks.

---

## What Gets Created

### Tables
1. `user_profiles` - User accounts with custom auth
2. `owner_settings` - Owner configuration
3. `products` - Product inventory (supports single/pair/box)
4. `sales` - Sales transactions
5. `sales_items` - Individual items in sales
6. `business_workers` - Worker-owner relationships
7. `invite_codes` - Invitation system
8. `subscriptions` - Subscription management

### Functions
- `verify_password()` - Authenticate users
- `create_user()` - Create new users
- `log_multi_item_sale()` - Process multi-item sales
- `log_sale_transaction()` - Legacy single-item sales
- `update_updated_at_column()` - Auto-update timestamps

### Security
- Row Level Security (RLS) enabled on all tables
- Simplified policies for custom auth
- Security handled in application code and SECURITY DEFINER functions

---

## Next Steps After Migration

1. ✅ Verify tables were created
2. ✅ Test login with admin/admin123
3. ✅ Change the default password
4. ✅ Set up storage bucket (see `STORAGE_SETUP_GUIDE.md`)
5. ✅ Start using the application!

---

**Questions?** Check the main `SUPABASE_SETUP.md` guide for detailed instructions.




