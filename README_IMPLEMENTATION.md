# StockGuard Custom Implementation Guide

## 🎯 Overview

This document provides a complete guide to the custom implementation of StockGuard as a single-company inventory management system with username/password authentication and enhanced features.

## 📋 What Has Been Implemented

### 1. **Custom Authentication System** ✅

- **Removed**: Email-based Supabase Auth
- **Added**: Username + Password authentication
- **Storage**: Sessions stored in localStorage
- **Security**: Password hashing via PostgreSQL `crypt()` function

**Files Modified:**
- `src/services/auth.service.js` - Complete rewrite for custom auth
- `src/context/AuthContext.jsx` - Updated to use localStorage sessions
- `src/pages/Login.jsx` - Changed from email to username input

**Database Changes:**
- Added `username` column (UNIQUE) to `user_profiles`
- Added `password_hash` column to `user_profiles`
- Added `profile_picture_url` column
- Created `user_role` enum type: `owner`, `manager`, `worker`
- Removed dependency on `auth.users` table

### 2. **Products System - Pairs & Boxes** ✅

- **Single Items**: Standard individual products
- **Pairs**: Products sold in pairs (shoes, socks) with price per pair
- **Boxes**: Products sold in boxes with configurable items per box

**Database Changes:**
- Added `product_type` column: `'single'`, `'pair'`, `'box'`
- Added `items_per_unit` column (default: 1)
- Added `price_per_unit` column (price for box/pair/single)
- Added `price_per_item` column (calculated per-item price)

**Files Modified:**
- `src/services/products.service.js` - Updated for product types
- `src/components/AddProductModal.jsx` - Product type selector UI

### 3. **Multi-Item Sales with Cart** ✅

- **Cart System**: Add multiple products before checkout
- **Automatic Discounts**: Configurable discounts based on total amount
- **Item Types**: Support for selling boxes, pairs, or singles
- **Transaction Safety**: Atomic database transactions

**Database Changes:**
- Created `sales_items` table for individual items in a sale
- Updated `sales` table:
  - `subtotal` - Total before discount
  - `discount_amount` - Discount amount applied
  - `discount_percentage` - Discount percentage
  - `final_total` - Final amount after discount
  - Removed single-item columns (product_id, quantity_sold, unit_price)

**Files Modified:**
- `src/services/sales.service.js` - Added `logMultiItemSale()` method
- `src/pages/LogSale.jsx` - Complete rewrite with cart functionality

### 4. **Owner Settings System** ✅

- **Notification Preferences**: SMS, Email, Browser notifications
- **Discount Settings**: Enable/disable, threshold, percentage
- **Team Settings**: Max managers, profile picture requirements
- **Contact Information**: Phone number, email for notifications

**Database Changes:**
- Created `owner_settings` table with all configuration options

**Files Created:**
- Database migration includes owner_settings schema

### 5. **PostgreSQL Functions** ✅

Created three main functions:

1. **`verify_password(p_username, p_password)`**
   - Verifies username and password
   - Returns boolean + user_id

2. **`create_user(...)`**
   - Creates new user with hashed password
   - Handles role-based creation
   - Creates owner_settings automatically for owners

3. **`log_multi_item_sale(p_worker_id, p_owner_id, p_items)`**
   - Atomic transaction for multi-item sales
   - Applies discounts automatically
   - Updates inventory
   - Returns sale details with totals

## 📁 Key Files

### Database
- `database/migration-custom-auth.sql` - Complete migration script

### Services
- `src/services/auth.service.js` - Custom authentication
- `src/services/products.service.js` - Product type support
- `src/services/sales.service.js` - Multi-item sales

### Components
- `src/components/AddProductModal.jsx` - Product type selector

### Pages
- `src/pages/Login.jsx` - Username-based login
- `src/pages/LogSale.jsx` - Multi-item cart system

### Context
- `src/context/AuthContext.jsx` - localStorage-based sessions

## 🚀 Setup Instructions

### 1. Database Migration

Run the migration SQL in your Supabase SQL Editor:

```bash
# Open database/migration-custom-auth.sql
# Copy and paste into Supabase SQL Editor
# Execute the script
```

**Important**: The migration includes:
- Table modifications
- New tables (owner_settings, sales_items)
- PostgreSQL functions
- RLS policies
- Seed owner account (username: `admin`, password: `admin123`)

⚠️ **CHANGE THE SEED PASSWORD IN PRODUCTION!**

### 2. Install Dependencies

```bash
npm install
```

New dependency added: `bcryptjs` (for client-side password handling, though server-side uses PostgreSQL crypt)

### 3. Environment Variables

Create `.env.local`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run Development Server

```bash
npm run dev
```

## 🔐 Default Login Credentials

After running the migration:

- **Username**: `admin`
- **Password**: `admin123`

⚠️ **Change this immediately in production!**

## 📝 Still TODO

1. **Settings Page Update** ⏳
   - Update to work with `owner_settings` table
   - Add discount configuration UI
   - Add team settings (max managers, profile pictures)
   - Notification preferences

2. **Signup Page** ⏳
   - Update to use username instead of email
   - Handle manager/worker creation by owner

3. **Protected Routes** ⏳
   - Update to handle `manager` role
   - Route managers appropriately

4. **Sales Display** ⏳
   - Update Sales page to show multi-item sales
   - Display items from `sales_items` table

5. **Local Development** ⏳
   - Create local Supabase setup scripts
   - Seed database script for testing
   - Development environment configuration

## 🎨 Features

### Authentication
- ✅ Username + Password login
- ✅ Role-based access (owner, manager, worker)
- ✅ Session management via localStorage
- ✅ Password hashing with PostgreSQL crypt()

### Products
- ✅ Single items
- ✅ Pairs (price per pair, auto-calculates per-item)
- ✅ Boxes (configurable items per box)
- ✅ Price per unit and per item tracking

### Sales
- ✅ Multi-item cart
- ✅ Automatic discounts (configurable threshold & percentage)
- ✅ Support for boxes, pairs, and singles
- ✅ Real-time subtotal and discount calculation
- ✅ Atomic transaction safety

### Settings (Database Ready)
- ✅ Owner settings table structure
- ⏳ Settings UI needs update

## 🔧 Technical Details

### Password Security
- Passwords hashed using PostgreSQL `crypt()` function
- Uses bcrypt algorithm (configured in function)
- Passwords never stored in plain text
- Verification done server-side

### Session Management
- Sessions stored in browser localStorage
- Session contains: user object + simple token
- No server-side session storage (stateless)
- Token is base64-encoded JSON

### Database Functions
All functions use `SECURITY DEFINER` to bypass RLS when needed while maintaining security checks.

## 📊 Database Schema Summary

### user_profiles
- `id` (UUID, primary key)
- `username` (TEXT, UNIQUE, NOT NULL)
- `password_hash` (TEXT, NOT NULL)
- `role` (user_role enum: owner, manager, worker)
- `business_name`, `phone_number`
- `profile_picture_url`

### owner_settings
- `owner_id` (UUID, references user_profiles)
- `max_managers` (INTEGER, default: 5)
- `profile_pictures_mandatory` (BOOLEAN)
- `discount_enabled` (BOOLEAN)
- `discount_threshold` (DECIMAL)
- `discount_percentage` (DECIMAL)
- Notification preferences (JSONB)

### products
- Standard fields +
- `product_type` (single/pair/box)
- `items_per_unit` (INTEGER)
- `price_per_unit` (DECIMAL)
- `price_per_item` (DECIMAL)

### sales
- `subtotal` (DECIMAL)
- `discount_amount` (DECIMAL)
- `discount_percentage` (DECIMAL)
- `final_total` (DECIMAL)

### sales_items
- `sale_id` (references sales)
- `product_id` (references products)
- `quantity_sold` (INTEGER)
- `unit_price` (DECIMAL)
- `line_total` (DECIMAL)

## ⚠️ Important Notes

1. **Migration Order**: Run the migration SQL file completely before using the app
2. **Password Change**: Default admin password must be changed in production
3. **RLS Policies**: Some functions bypass RLS with SECURITY DEFINER (by design)
4. **Backward Compatibility**: Old single-item sales still work via legacy function
5. **Local Development**: Set up Supabase locally for testing (see TODO section)

## 🐛 Known Issues / Considerations

1. Settings page still uses old structure - needs update
2. Signup page still uses email - needs update
3. Sales display page needs update for multi-item sales
4. Protected routes need manager role handling
5. No password reset functionality yet
6. No email verification (not needed with username auth)

## 📞 Support

For issues or questions:
1. Check the migration SQL file for database errors
2. Verify environment variables are set correctly
3. Check browser console for authentication errors
4. Review PostgreSQL function logs in Supabase dashboard

## 🎉 Success Criteria

The implementation is complete when:
- ✅ Users can log in with username/password
- ✅ Products support single/pair/box types
- ✅ Sales can include multiple items with discounts
- ✅ Owner can configure settings (when UI is updated)
- ✅ All database functions work correctly
- ✅ Multi-item sales update inventory correctly

---

**Last Updated**: Implementation in progress
**Status**: Core features complete, Settings UI pending




