# Troubleshooting Guide

## Sign-In Issues

### Can Sign In on Mobile but Not on Localhost

If you can sign in on mobile (network IP) but not on localhost, try these solutions:

#### 1. Clear Browser Cache and LocalStorage

**Chrome/Edge:**
1. Press `F12` to open DevTools
2. Go to **Application** tab
3. Click **Clear storage** in the left sidebar
4. Check all boxes
5. Click **Clear site data**
6. Refresh the page

**Firefox:**
1. Press `F12` to open DevTools
2. Go to **Storage** tab
3. Right-click on `localStorage` → **Delete All**
4. Refresh the page

#### 2. Check Browser Console for Errors

1. Press `F12` to open DevTools
2. Go to **Console** tab
3. Look for red error messages
4. Common errors:
   - `Missing Supabase environment variables` - Check your `.env` file
   - `Network error` - Check internet connection
   - `CORS error` - Supabase should handle this, but check Supabase dashboard

#### 3. Verify Environment Variables

1. Check that `.env` file exists in the root directory
2. Verify it contains:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```
3. **Important**: Restart the dev server after changing `.env`:
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

#### 4. Check Supabase Configuration

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Verify:
   - Project URL matches `VITE_SUPABASE_URL` in `.env`
   - Anon/public key matches `VITE_SUPABASE_ANON_KEY` in `.env`

#### 5. Try Incognito/Private Mode

1. Open browser in incognito/private mode
2. Navigate to `http://localhost:5173`
3. Try signing in
4. If it works, the issue is likely browser cache/cookies

#### 6. Check Network Tab

1. Press `F12` to open DevTools
2. Go to **Network** tab
3. Try signing in
4. Look for failed requests (red)
5. Check:
   - Are requests to Supabase failing?
   - What's the status code? (401, 403, 500, etc.)
   - What's the error message?

#### 7. Disable Browser Extensions

Some browser extensions can block requests:
1. Try disabling ad blockers
2. Try disabling privacy extensions
3. Try disabling security extensions
4. Test in a different browser

#### 8. Check Supabase Auth Settings

1. Go to Supabase dashboard
2. Navigate to **Authentication** → **Settings**
3. Check:
   - **Site URL**: Should include `http://localhost:5173`
   - **Redirect URLs**: Should include `http://localhost:5173/**`
4. Add if missing:
   ```
   http://localhost:5173/**
   http://127.0.0.1:5173/**
   ```

#### 9. Verify Database Connection

1. Open browser console (F12)
2. Look for console logs:
   - `Supabase configured:` - Should show URL and key present
   - `Loading user profile for:` - Should show user ID
   - `Profile query completed in Xms` - Should show query time
3. If you see timeout errors, check:
   - Internet connection
   - Supabase project status
   - Database RLS policies

#### 10. Hard Refresh

Try a hard refresh to clear cache:
- **Windows/Linux**: `Ctrl + Shift + R` or `Ctrl + F5`
- **Mac**: `Cmd + Shift + R`

## Common Error Messages

### "Missing Supabase environment variables"
- **Solution**: Check `.env` file exists and has correct values
- **Solution**: Restart dev server after changing `.env`

### "Invalid login credentials"
- **Solution**: Verify email and password are correct
- **Solution**: Check if email is confirmed in Supabase dashboard

### "Network error" or "Failed to fetch"
- **Solution**: Check internet connection
- **Solution**: Check Supabase project is active
- **Solution**: Check browser console for CORS errors

### "Profile fetch timeout"
- **Solution**: Check internet connection
- **Solution**: Check Supabase database is accessible
- **Solution**: Check RLS policies allow profile reads

### "Email not confirmed"
- **Solution**: Check email inbox for confirmation link
- **Solution**: Manually confirm email in Supabase dashboard

## Still Having Issues?

1. **Check the browser console** for detailed error messages
2. **Check the Network tab** for failed requests
3. **Compare working mobile vs non-working localhost**:
   - Are environment variables the same?
   - Are browser extensions different?
   - Is cache different?

4. **Try these commands**:
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   
   # Restart dev server
   npm run dev
   ```

5. **Check Supabase logs**:
   - Go to Supabase dashboard
   - Navigate to **Logs** → **Auth Logs**
   - Look for failed sign-in attempts
   - Check error messages

