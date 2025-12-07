# SMS Notifications Backend Setup Guide

This guide will help you set up the backend server for SMS notifications using Africa's Talking API.

## Overview

The backend server handles:
- **Automatic SMS notifications** when new sales are made (via database trigger)
- **Test SMS endpoint** for testing your SMS configuration
- **Multi-item sales support** - properly formats SMS messages for sales with multiple products

## Prerequisites

1. **Africa's Talking Account**
   - Sign up at [Africa's Talking](https://africastalking.com/)
   - Get your API key and username from the dashboard
   - Request a sender ID (short code) - this must be approved by Africa's Talking

2. **Supabase Account**
   - Your Supabase project URL
   - Your Supabase service role key (for backend access)

3. **Deployment Platform** (optional but recommended)
   - Railway account (recommended for easy deployment)
   - Or any Node.js hosting service

## Step 1: Local Development Setup

### Install Dependencies

```bash
cd backend
npm install
```

### Create `.env` File

Create a `.env` file in the `backend` directory:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
AT_API_KEY=your_africas_talking_api_key
AT_USERNAME=your_africas_talking_username
FRONTEND_URL=http://localhost:5173
PORT=3000
```

### Run Locally

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Step 2: Deploy to Railway (Recommended)

### Create Railway Account

1. Go to [Railway](https://railway.app/)
2. Sign up with GitHub
3. Create a new project

### Deploy Backend

1. **Connect Repository**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Select your StockGuard repository

2. **Configure Service**
   - Set **Root Directory** to `backend`
   - Railway will automatically detect Node.js

3. **Add Environment Variables**
   Go to Settings → Variables and add:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_KEY=your_supabase_service_role_key
   AT_API_KEY=your_africas_talking_api_key
   AT_USERNAME=your_africas_talking_username
   FRONTEND_URL=http://localhost:5173 (or your frontend URL)
   PORT=3000 (Railway sets this automatically, but you can specify)
   ```

4. **Deploy**
   - Railway will automatically build and deploy
   - Note your deployment URL (e.g., `https://your-app.up.railway.app`)

## Step 3: Set Up Database Trigger

The database trigger automatically calls your backend when a new sale is created.

### Option 1: Using Supabase SQL Editor

1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Open `database/notification-trigger.sql`
4. **Replace the URL** with your Railway deployment URL:
   ```sql
   url := 'https://your-app.up.railway.app/api/notify-owner',
   ```
5. Run the SQL script

### Option 2: Manual SQL

```sql
-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to notify owner on new sale
CREATE OR REPLACE FUNCTION notify_owner_on_sale() RETURNS TRIGGER AS $$
BEGIN
    -- Call the backend API endpoint
    PERFORM net.http_post(
        url := 'https://your-app.up.railway.app/api/notify-owner',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := json_build_object('saleId', NEW.id)::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS sale_notification_trigger ON sales;
CREATE TRIGGER sale_notification_trigger
AFTER INSERT ON sales
FOR EACH ROW
EXECUTE FUNCTION notify_owner_on_sale();
```

**Important:** Replace `https://your-app.up.railway.app` with your actual Railway deployment URL!

## Step 4: Configure Frontend

Update your frontend `.env` file to point to your backend:

```env
VITE_BACKEND_URL=https://your-app.up.railway.app
```

Or if running locally:
```env
VITE_BACKEND_URL=http://localhost:3000
```

## Step 5: Test the Setup

### Test 1: Health Check

Visit in browser or use curl:
```bash
curl https://your-app.up.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "supabase": "connected",
  "africastalking": "configured"
}
```

### Test 2: Test SMS from Frontend

1. Go to Settings page in your app
2. Enable SMS notifications
3. Add your phone number
4. Click "Send Test SMS"
5. You should receive an SMS within a few seconds

### Test 3: Test Automatic Notifications

1. Make a sale through the app
2. Check your phone - you should receive an SMS notification automatically
3. Check Railway logs to see the notification being processed

## API Endpoints

### `GET /health`
Health check endpoint to verify server is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "supabase": "connected",
  "africastalking": "configured"
}
```

### `POST /api/notify-owner`
Called automatically by database trigger when a new sale is created.

**Request Body:**
```json
{
  "saleId": "uuid-of-sale"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "message-id-from-africas-talking"
}
```

Or if skipped:
```json
{
  "success": true,
  "skipped": true,
  "reason": "SMS notifications disabled"
}
```

### `POST /api/test-sms`
Test SMS endpoint called from the frontend Settings page.

**Request Body:**
```json
{
  "ownerId": "uuid-of-owner"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "message-id-from-africas-talking",
  "message": "Test SMS sent successfully!"
}
```

## SMS Message Format

The backend automatically formats SMS messages based on the sale:

### Single Item Sale
```
Sale: Product Name x2 = UGX 50,000 by Worker Name. - StockGuard
```

### Multiple Items (3 or fewer)
```
Sale: Product1(2), Product2(1), Product3(3) = UGX 100,000 by Worker Name. - StockGuard
```

### Multiple Items (more than 3)
```
Sale: 10 items = UGX 250,000 by Worker Name. - StockGuard
```

## Troubleshooting

### SMS Not Sending

1. **Check Railway Logs**
   - Go to Railway dashboard
   - Click on your backend service
   - View logs for errors

2. **Verify Environment Variables**
   - Ensure all required variables are set in Railway
   - Check that Africa's Talking credentials are correct

3. **Check Phone Number Format**
   - Phone numbers should be in international format: `+256701234567`
   - No spaces or special characters

4. **Verify Sender ID**
   - Sender ID must be approved by Africa's Talking
   - Check your Africa's Talking dashboard

### Database Trigger Not Working

1. **Check Trigger Exists**
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'sale_notification_trigger';
   ```

2. **Verify pg_net Extension**
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_net';
   ```

3. **Test Trigger Manually**
   - Check Supabase logs for errors
   - Verify the URL in the trigger function is correct

### Common Errors

**"SMS service not configured"**
- Africa's Talking credentials not set
- Check `AT_API_KEY` and `AT_USERNAME` environment variables

**"Supabase not configured"**
- Supabase credentials not set
- Check `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` environment variables

**"Phone number not set"**
- Owner's phone number not in database
- User needs to add phone number in Settings

**"SMS notifications disabled"**
- User has disabled SMS notifications in Settings
- User needs to enable in Settings page

## Cost Considerations

- **Africa's Talking Pricing:** Typically ~UGX 50-100 per SMS in Uganda
- **Railway Hosting:** Free tier available, then pay-as-you-go
- The backend automatically skips SMS if:
  - Notifications are disabled
  - Sale amount is below threshold (if set)
  - Phone number is not set

## Security Notes

- Never commit `.env` file to git
- Use Railway's environment variables for production
- Service role key should only be used in backend (never in frontend)
- Consider rate limiting for production use

## Support

If you encounter issues:
1. Check Railway logs
2. Check Supabase logs
3. Verify all environment variables are set correctly
4. Test endpoints manually using curl or Postman

