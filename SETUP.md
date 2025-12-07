# StockGuard Setup Guide

## Quick Start

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Configure Environment Variables**

   - Create a `.env` file in the root directory
   - Add your Supabase credentials:

   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Set Up Database**

   - Open your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and paste the entire contents of `database/migration-fresh-install.sql` (for new projects) or `database/migration-custom-auth.sql` (for existing projects)
   - Click "Run" to execute the SQL script
   - This creates all tables, functions, triggers, and RLS policies

4. **Start Development Server**

   ```bash
   npm run dev
   ```

5. **Access the Application**
   - Open `http://localhost:5173` in your browser

## First Steps After Setup

1. **Create a Business Owner Account**

   - Navigate to `/signup`
   - Select "Business Owner" tab
   - Fill in business details and create account

2. **Test Worker Signup**
   - As a business owner, you'll need to create invite codes (feature to be implemented)
   - Workers can sign up using invite codes

## Troubleshooting

### Database Connection Issues

- Verify your Supabase URL and anon key are correct
- Check that the database schema has been applied
- Ensure RLS policies are enabled

### Authentication Issues

- Verify the `user_profiles` table exists
- Check that the trigger `on_auth_user_created` is set up
- Ensure Supabase Auth is enabled in your project

### Theme Not Persisting

- Check browser localStorage is enabled
- Clear localStorage and try again

## Next Steps

- Implement product management features
- Add sales logging functionality
- Create analytics dashboard
- Implement worker invite code generation
- Add subscription management
