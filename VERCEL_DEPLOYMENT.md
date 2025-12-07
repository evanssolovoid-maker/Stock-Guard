# Deploying StockGuard to Vercel

This guide will walk you through deploying your StockGuard application to Vercel.

## Prerequisites

- A GitHub account with your StockGuard repository
- A Vercel account (sign up at [vercel.com](https://vercel.com))
- Your Supabase project credentials

## Step 1: Prepare Your Repository

1. **Ensure all changes are committed:**

   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push
   ```

2. **Verify your `vercel.json` is present** (it should already be in the repo)

## Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (or create an account)
2. Click **"Add New Project"** or **"Import Project"**
3. If prompted, connect your GitHub account
4. Select your **StockGuard** repository
5. Click **"Import"**

## Step 3: Configure Project Settings

Vercel should auto-detect your Vite project. Verify these settings:

- **Framework Preset:** Vite (should be auto-detected)
- **Root Directory:** `./` (root of repository)
- **Build Command:** `npm run build` (should be auto-filled)
- **Output Directory:** `dist` (should be auto-filled)
- **Install Command:** `npm install` (should be auto-filled)

## Step 4: Add Environment Variables

**This is crucial!** Add your Supabase credentials:

1. In the project configuration page, scroll to **"Environment Variables"**
2. Click **"Add"** and add the following variables:

   | Variable Name            | Value                     | Environment                      |
   | ------------------------ | ------------------------- | -------------------------------- |
   | `VITE_SUPABASE_URL`      | Your Supabase project URL | Production, Preview, Development |
   | `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key    | Production, Preview, Development |

   **Example:**

   - `VITE_SUPABASE_URL`: `https://abcdefghijklmnop.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

3. **Important:** Make sure to add these for **all environments** (Production, Preview, and Development)

4. Click **"Save"**

## Step 5: Deploy

1. Click **"Deploy"** button
2. Wait for the build to complete (usually 1-3 minutes)
3. Once deployed, you'll see a success message with your deployment URL

## Step 6: Verify Deployment

1. Click on your deployment URL to open the app
2. Test the following:
   - ✅ App loads without errors
   - ✅ Login page appears
   - ✅ Can sign up a new account
   - ✅ Can log in with credentials
   - ✅ Dashboard loads correctly

## Step 7: Configure Custom Domain (Optional)

1. In your Vercel project dashboard, go to **"Settings"** → **"Domains"**
2. Add your custom domain (e.g., `stockguard.com`)
3. Follow Vercel's instructions to configure DNS records
4. Wait for DNS propagation (can take up to 48 hours)

## Step 8: Update Supabase RLS Policies (If Needed)

If you have any RLS policies that check for specific origins, you may need to update them:

1. Go to your Supabase dashboard → **SQL Editor**
2. Check if any policies reference `localhost` or specific URLs
3. Update them to include your Vercel domain if needed

## Troubleshooting

### Build Fails

**Error:** "Build command failed"

**Solutions:**

- Check that all dependencies are in `package.json`
- Ensure `npm install` completes successfully locally
- Check build logs in Vercel dashboard for specific errors

### Environment Variables Not Working

**Error:** "Missing Supabase environment variables" in browser console

**Solutions:**

- Verify environment variables are set in Vercel dashboard
- Ensure variables start with `VITE_` prefix
- Redeploy after adding environment variables
- Check that variables are added to all environments (Production, Preview, Development)

### App Works Locally But Not on Vercel

**Possible Causes:**

- Environment variables not set correctly
- Build output directory mismatch
- Missing files in repository

**Solutions:**

- Compare local `.env.local` with Vercel environment variables
- Verify `vercel.json` configuration
- Check that all necessary files are committed to git

### CORS Errors

**Error:** CORS policy errors in browser console

**Solutions:**

- This shouldn't happen with Supabase, but if it does:
- Check Supabase dashboard → Settings → API → CORS settings
- Add your Vercel domain to allowed origins

## Automatic Deployments

Vercel automatically deploys:

- **Production:** Every push to your main/master branch
- **Preview:** Every push to other branches or pull requests

## Updating Your Deployment

1. Make changes to your code
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your update message"
   git push
   ```
3. Vercel will automatically detect the push and redeploy

## Environment Variables Reference

| Variable                 | Description                   | Where to Find                                                        |
| ------------------------ | ----------------------------- | -------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`      | Your Supabase project URL     | Supabase Dashboard → Settings → API → Project URL                    |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key | Supabase Dashboard → Settings → API → Project API keys → anon public |

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html#vercel)
- [Supabase Documentation](https://supabase.com/docs)

---

**Need Help?** Check the build logs in your Vercel dashboard for detailed error messages.
