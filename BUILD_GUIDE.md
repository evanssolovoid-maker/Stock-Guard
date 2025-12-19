# StockGuard - Complete Build Guide

This guide will walk you through setting up StockGuard from scratch to its current state.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Setup](#project-setup)
3. [Supabase Configuration](#supabase-configuration)
4. [Database Setup](#database-setup)
5. [Storage Setup](#storage-setup)
6. [Running the Application](#running-the-application)
7. [Creating Your First Account](#creating-your-first-account)
8. [Features Overview](#features-overview)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js** 18+ installed ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- A **Supabase account** ([Sign up](https://supabase.com))
- A code editor (VS Code recommended)

---

## Project Setup

### 1. Clone or Download the Project

If using git:

```bash
git clone <repository-url>
cd Stock-Guard
```

Or extract the project folder to your desired location.

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:

- React 18
- Vite
- Tailwind CSS
- Supabase Client
- Zustand (state management)
- And other dependencies

---

## Supabase Configuration

### 1. Create a Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in or create an account
3. Click **"New Project"**
4. Fill in the details:
   - **Project Name**: `stockguard` (or your choice)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Select the region closest to you
   - **Pricing Plan**: Free tier is sufficient for development
5. Click **"Create new project"**
6. Wait 2-3 minutes for the project to be provisioned

### 2. Get Your API Credentials

1. In your Supabase project dashboard, click **⚙️ Settings** (bottom left)
2. Click **"API"** in the settings menu
3. Copy the following:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long JWT token under "Project API keys")

### 3. Configure Environment Variables

1. In the project root directory, create a file named `.env.local`
2. Add the following content (replace with your actual values):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Example:**

```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0NzU2ODAwMCwiZXhwIjoxOTYzMTQ0MDAwfQ.example
```

3. Save the file

**Important:** The `.env.local` file is already in `.gitignore` and won't be committed to version control.

---

## Database Setup

### 1. Run the Database Migration

1. In your Supabase dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New Query"**
3. Open the file `database/migration-fresh-install.sql` from your project
4. Copy the **entire contents** of the file (Ctrl+A, Ctrl+C)
5. Paste into the SQL Editor (Ctrl+V)
6. Click **"Run"** button (or press Ctrl+Enter)
7. Wait for the success message

This migration creates:

- All required tables (`user_profiles`, `products`, `sales`, etc.)
- Database functions (`log_multi_item_sale`, `verify_password`, etc.)
- Row Level Security (RLS) policies
- Triggers and indexes

### 2. Verify Database Setup

1. Click **"Table Editor"** in the left sidebar
2. You should see these tables:
   - `user_profiles`
   - `owner_settings`
   - `products`
   - `sales`
   - `sales_items`
   - `business_workers`
   - `invite_codes`

### 3. Add Multi-Tenant System (Required)

**IMPORTANT: If you have existing test data with duplicate business names:**

**Option A - Clean Start (Recommended for test environments):**

1. Run `database/cleanup-test-data.sql` to delete all test data
2. This will remove all owners, workers, managers, products, and sales
3. Then proceed with the migration below

**Option B - Keep Existing Data:**

1. Run `database/fix-duplicates-simple.sql` first to fix duplicate business names
2. Verify no duplicates remain (the script will show you)
3. Then proceed with the migration below

**Note**: The `multi-tenant-system.sql` script includes duplicate handling, so Option B is usually not needed unless you have many duplicates.

**Multi-Tenant Database Migration:**

1. In SQL Editor, open `database/multi-tenant-system.sql`
2. Copy and run the entire script
3. This enables multiple businesses to operate independently with data isolation
4. The script will automatically handle duplicates if any exist

**Update Sales Function for Multi-Tenancy:**

1. In SQL Editor, open `database/update-log-multi-item-sale-multi-tenant.sql`
2. Copy and run the entire script
3. This updates the sales logging function to use `business_owner_id`

**Fix RLS Policies for Custom Auth (REQUIRED):**

1. In SQL Editor, open `database/fix-rls-policies-custom-auth.sql`
2. Copy and run the entire script
3. This fixes the RLS policies to work with custom authentication (the multi-tenant-system.sql creates policies that use `auth.uid()` which doesn't work with custom auth)

**Fix Business Name Unique Constraint (REQUIRED if creating workers):**

1. In SQL Editor, open `database/fix-business-name-unique-constraint.sql`
2. Copy and run the entire script
3. This fixes the unique constraint to only apply to owners, allowing workers/managers to share the same business_name as their owner

**Important**: After running, wait a few seconds for Supabase to refresh its schema cache.

### 4. Add Password Functions

**Password Update Function** (for changing password when logged in):

1. In SQL Editor, open `database/update-password-function.sql`
2. Copy and run the entire script

**Password Reset Function** (for forgot password flow):

1. In SQL Editor, open `database/reset-password-function.sql`
2. Copy and run the entire script

3. **Important**: After running, wait a few seconds for Supabase to refresh its schema cache
4. Verify the functions exist by running:
   ```sql
   SELECT routine_name
   FROM information_schema.routines
   WHERE routine_name IN ('update_user_password', 'reset_user_password');
   ```
   You should see both functions in the results.

These functions allow users to:

- Change their password when logged in (requires current password)
- Reset their password if forgotten (requires username only)

### 5. Add Notification Columns (Optional)

If you want to enable notification preferences in the future:

1. In SQL Editor, open `database/add-notification-columns.sql`
2. Copy and run the entire script

This adds columns for SMS, browser, and email notification preferences.

---

## Storage Setup

### 1. Create Storage Bucket for Product Images

1. In Supabase dashboard, click **"Storage"** in the left sidebar
2. Click **"Create a new bucket"**
3. Configure the bucket:
   - **Name**: `product-images`
   - **Public bucket**: ✅ **Enable** (check this box)
4. Click **"Create bucket"**

### 2. Set Up Storage Policies

1. Click on the `product-images` bucket
2. Click **"Policies"** tab
3. Click **"New Policy"**
4. Select **"For full customization"**
5. Name it: `Allow authenticated uploads`
6. Use this SQL:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Allow authenticated users to update their uploads
CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- Allow public read access
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');
```

7. Click **"Review"** then **"Save policy"**

---

## Running the Application

### Development Mode

Run the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Production Build

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

---

## Creating Your First Account

### 1. Access the Signup Page

1. Open `http://localhost:5173` in your browser
2. Click **"Sign Up"** or navigate to `/signup`

### 2. Create Business Owner Account

1. Select the **"Business Owner"** tab
2. Fill in the form:
   - **Username**: Choose a unique username
   - **Password**: Create a strong password
   - **Business Name**: Your business name
   - **Phone Number**: Your contact number (optional)
3. Click **"Create Account"**

### 3. First Login

1. After signup, you'll be redirected to login
2. Enter your username and password
3. You'll be taken to the Dashboard

---

## Features Overview

### For Business Owners

- **Dashboard**: Overview of sales, revenue, and top products
- **Products Management**: Add, edit, delete products with images
- **Sales Tracking**: View all sales with filtering and date ranges
- **Analytics**: Charts and insights on sales performance
- **Team Management**: Add/manage managers and workers
- **Settings**: Update business information and preferences

### For Managers

- Similar features to owners with appropriate access levels

### For Workers

- **Log Sales**: Quick sale entry interface
- **My Sales**: View personal sales history
- **Products View**: Browse available products

### Key Features

- ✅ **Multi-item Sales**: Log sales with multiple products
- ✅ **Real-time Updates**: Sales appear instantly across all users
- ✅ **Product Images**: Upload and manage product photos
- ✅ **Date Range Filtering**: Filter sales by date ranges
- ✅ **Change Calculation**: Calculate customer change when logging sales
- ✅ **Dark Mode**: Toggle between light and dark themes
- ✅ **Responsive Design**: Works on mobile, tablet, and desktop

---

## Project Structure

```
Stock-Guard/
├── public/              # Static assets (favicon, manifest)
├── src/
│   ├── components/     # Reusable React components
│   ├── pages/          # Page components
│   ├── services/       # API and service functions
│   ├── store/          # Zustand state management
│   ├── hooks/          # Custom React hooks
│   ├── context/        # React context providers
│   └── utils/          # Utility functions
├── database/           # SQL migration files
├── backend/            # Backend server (optional, for SMS/Email)
├── index.html          # HTML entry point
├── vite.config.js      # Vite configuration
├── tailwind.config.js  # Tailwind CSS configuration
└── package.json        # Dependencies and scripts
```

---

## Troubleshooting

### App Won't Start

**Error**: "Missing Supabase environment variables"

**Solution**:

- Ensure `.env.local` exists in the project root
- Verify the file contains `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Restart the dev server after creating/updating `.env.local`

### Database Errors

**Error**: "relation does not exist" or "function does not exist"

**Solution**:

- Ensure you ran the migration script (`database/migration-fresh-install.sql`)
- Check that all tables exist in Supabase Table Editor
- Re-run the migration if needed

### Images Not Uploading

**Error**: "Storage bucket not found" or "Permission denied"

**Solution**:

- Verify the `product-images` bucket exists in Supabase Storage
- Ensure the bucket is set to **Public**
- Check that storage policies are correctly configured
- Verify RLS policies allow authenticated users to upload

### Authentication Issues

**Error**: "Invalid credentials" or login fails

**Solution**:

- Verify username and password are correct
- Check browser console for specific error messages
- Ensure the `user_profiles` table exists and has data
- Try creating a new account if needed

### Port Already in Use

**Error**: "Port 5173 is already in use"

**Solution**:

- Stop other processes using port 5173
- Or change the port in `vite.config.js`:
  ```js
  server: {
    port: 3000, // or any other available port
  }
  ```

---

## Environment Variables Reference

| Variable                 | Description                   | Required |
| ------------------------ | ----------------------------- | -------- |
| `VITE_SUPABASE_URL`      | Your Supabase project URL     | Yes      |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key | Yes      |

---

## Database Migration Files

- **`migration-fresh-install.sql`**: Complete database setup for new projects
- **`migration-custom-auth.sql`**: Migration for existing projects
- **`business-category-system.sql`**: Adds business categories and product category mapping (required for business category feature)
- **`multi-tenant-system.sql`**: Enables multi-tenant system with data isolation (required)
- **`update-log-multi-item-sale-multi-tenant.sql`**: Updates sales function for multi-tenancy (required after multi-tenant-system.sql)
- **`fix-rls-policies-custom-auth.sql`**: Fixes RLS policies for custom authentication (required)
- **`fix-business-name-unique-constraint.sql`**: Fixes business name unique constraint for workers (required if creating workers)
- **`update-password-function.sql`**: Creates password update function (required for password change feature)
- **`reset-password-function.sql`**: Creates password reset function (required for forgot password feature)
- **`cleanup-test-data.sql`**: Deletes all test data for fresh start (optional)
- **`fix-duplicates-simple.sql`**: Fixes duplicate business names before migration (optional)
- **`add-notification-columns.sql`**: Adds notification preference columns (optional)
- **`create-log-multi-item-sale.sql`**: Creates multi-item sale function
- **`disable-notification-trigger.sql`**: Disables backend notification trigger

---

## Next Steps

After setup:

1. **Add Products**: Go to Products page and add your inventory
2. **Create Workers**: Add workers/managers in Settings (for owners)
3. **Start Logging Sales**: Use the Log Sale page to record transactions
4. **View Analytics**: Check the Analytics page for business insights

---

## Deployment

### Deploy to Vercel

StockGuard can be easily deployed to Vercel for free. See **[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)** for complete deployment instructions.

**Quick Steps:**

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

For detailed instructions, troubleshooting, and configuration, see **[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)**.

---

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify all setup steps were completed correctly
3. Ensure Supabase project is active and accessible
4. Check that database migrations ran successfully

---

## Current State

This build guide reflects the app at its current state with:

- ✅ Custom authentication (username/password)
- ✅ Role-based access (Owner, Manager, Worker)
- ✅ Product management with images
- ✅ Multi-item sales logging
- ✅ Sales tracking and analytics
- ✅ Team management
- ✅ Date range filtering
- ✅ Change calculation for sales
- ✅ Dark mode support
- ✅ Responsive design

**Note**: SMS and Email notifications are disabled in the current build. The backend code exists but is not required for basic functionality.

---

**Last Updated**: Current build state
**Version**: 1.0.0
