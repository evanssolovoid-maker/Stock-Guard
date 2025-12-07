# Railway Deployment Guide

## Current Setup

You have two parts to deploy:
1. **Backend** (already deployed) - SMS notification server
2. **Frontend** (needs deployment) - React/Vite application

## Finding Your Railway URLs

### Backend URL
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click on your backend service
3. Go to the **Settings** tab
4. Find **Public Domain** or **Generate Domain** button
5. Your backend URL will look like: `https://your-backend-name.up.railway.app`

### Frontend URL (after deployment)
Once you deploy the frontend, it will have its own URL like: `https://your-frontend-name.up.railway.app`

## Deploying the Frontend on Railway

### Option 1: Deploy Frontend as Separate Service (Recommended)

1. **Create a new service in Railway:**
   - Go to your Railway project
   - Click **+ New** → **GitHub Repo**
   - Select your `StoGuard` repository
   - Railway will detect it as a Node.js project

2. **Configure the service:**
   - **Root Directory:** Leave empty (or set to `/` - root of repo)
   - **Build Command:** `npm run build`
   - **Start Command:** `npm run preview` (or use a static file server - see below)

3. **Add environment variables:**
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key
   - `VITE_BACKEND_URL` - Your backend Railway URL (optional, defaults to localhost:3000)

4. **Generate a public domain:**
   - Go to **Settings** → **Generate Domain**
   - Railway will give you a URL like `https://stoguard-production.up.railway.app`

### Option 2: Use Static File Server (Better for Production)

Since Vite's preview server isn't ideal for production, create a simple static server:

1. **Create `server.js` in the root directory:**

```javascript
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from dist directory
app.use(express.static(join(__dirname, 'dist')));

// Handle client-side routing - return index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

2. **Update `package.json` scripts:**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "start": "node server.js",
    "preview": "vite preview"
  }
}
```

3. **Add `express` as a dependency:**

```bash
npm install express
```

4. **In Railway:**
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`

### Option 3: Deploy Frontend to Vercel/Netlify (Easier)

These platforms are optimized for frontend deployments:

**Vercel:**
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Set **Framework Preset:** Vite
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_BACKEND_URL` (your Railway backend URL)
5. Deploy - you'll get a URL like `https://stoguard.vercel.app`

**Netlify:**
1. Go to [netlify.com](https://netlify.com)
2. Import your GitHub repository
3. Set **Build command:** `npm run build`
4. Set **Publish directory:** `dist`
5. Add environment variables (same as Vercel)
6. Deploy

## Updating Backend CORS

After deploying the frontend, update your backend to allow requests from your frontend URL:

1. In Railway backend service, add/update environment variable:
   - `FRONTEND_URL` = Your frontend deployment URL (e.g., `https://stoguard.vercel.app`)

2. The backend already has CORS configured to use this variable.

## Updating Database Trigger

After getting your backend URL, update the database trigger:

1. Open `database/notification-trigger.sql`
2. Replace `'https://your-app.up.railway.app/api/notify-owner'` with your actual backend URL
3. Run the updated SQL in Supabase SQL Editor

## Testing Your Deployment

1. **Backend Health Check:**
   - Visit: `https://your-backend-url.up.railway.app/health`
   - Should return: `{"status":"ok",...}`

2. **Frontend:**
   - Visit your frontend URL
   - Should load the StockGuard login page

3. **Test SMS (if configured):**
   - Login to your app
   - Go to Settings
   - Click "Send Test SMS"

## Troubleshooting

### Frontend can't connect to backend
- Check `VITE_BACKEND_URL` is set correctly
- Verify backend CORS allows your frontend URL
- Check backend is running (visit `/health` endpoint)

### Build fails
- Check all environment variables are set
- Verify `npm run build` works locally first
- Check Railway build logs for specific errors

### 404 errors on routes
- Make sure you're using a static file server (Option 2) or Vercel/Netlify
- Vite preview server doesn't handle client-side routing well in production



