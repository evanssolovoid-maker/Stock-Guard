# Notification Preferences Setup

## Overview
The notification preferences functionality has been enabled. Users can now control browser notifications and SMS notifications through the Settings page.

## What Was Implemented

### 1. Database Schema
- **File**: `database/add-notification-columns.sql`
- Added notification columns to `user_profiles` table:
  - `sms_notifications` (BOOLEAN) - Enable/disable SMS notifications
  - `browser_notifications` (BOOLEAN) - Enable/disable browser notifications
  - `email_notifications` (BOOLEAN) - Enable/disable email notifications (future)
  - `sms_threshold` (DECIMAL) - Minimum sale amount to trigger SMS

### 2. Notification Service
- **File**: `src/services/notifications.service.js`
- Handles all notification logic:
  - `showBrowserNotification()` - Shows browser notifications after checking user preferences
  - `requestBrowserNotificationPermission()` - Requests browser notification permission
  - `isBrowserNotificationsEnabled()` - Checks if browser notifications are enabled
  - `shouldSendSMSNotification()` - Checks if SMS should be sent based on preferences and threshold

### 3. Browser Notifications Integration
- **File**: `src/store/salesStore.js`
- Updated to use the notification service
- Browser notifications now check user preferences before showing
- Notifications are automatically shown when new sales are detected

### 4. Settings Page
- **File**: `src/pages/Settings.jsx`
- Notification preferences UI is already present
- Updated to use the notification service for permission requests
- Auto-saves preferences when browser notification permission is granted

## Setup Instructions

### Step 1: Add Database Columns
Run the SQL script in your Supabase SQL Editor:

```sql
-- Run database/add-notification-columns.sql
```

Or manually add the columns using the Supabase dashboard.

### Step 2: Test Browser Notifications

1. **Enable Browser Notifications:**
   - Go to Settings page
   - Toggle "Enable Browser Notifications" to ON
   - Click "Request" button if permission is needed
   - Allow notifications when browser prompts
   - Click "Save Changes"

2. **Test Notifications:**
   - Have a worker log a sale
   - You should see a browser notification with sale details
   - Notification will auto-close after 5 seconds

### Step 3: Test SMS Notifications

1. **Enable SMS Notifications:**
   - Go to Settings page
   - Toggle "Enable SMS Notifications" to ON
   - Set SMS threshold (0 for all sales, or specific amount)
   - Enter your phone number in Profile Information
   - Click "Save Changes"

2. **Test SMS:**
   - Click "Send Test SMS" button (if backend is configured)
   - Or wait for a sale to be made (if threshold is met)

## Features

### Browser Notifications
- ✅ Checks user preferences before showing
- ✅ Respects browser permission settings
- ✅ Shows sale details (items, amount, worker)
- ✅ Auto-closes after 5 seconds
- ✅ Works with real-time sales updates

### SMS Notifications
- ✅ Configurable threshold (only send for sales above X amount)
- ✅ Requires phone number in profile
- ✅ Can be enabled/disabled per user
- ⚠️ Requires backend SMS service configuration (Africa's Talking, etc.)

### Email Notifications
- ⏳ Coming soon (UI is present but disabled)

## Important Notes

1. **Database Columns**: Make sure to run the SQL script to add the notification columns to your database.

2. **Browser Permissions**: Users must grant browser notification permission before notifications will work.

3. **SMS Backend**: SMS notifications require backend configuration (not included in frontend).

4. **User Preferences**: Each user (owner/manager) can set their own notification preferences.

5. **Real-time Updates**: Notifications work automatically with the real-time sales subscription system.

## Troubleshooting

### Browser Notifications Not Showing
- Check that browser notifications are enabled in Settings
- Verify browser notification permission is granted
- Check browser console for errors
- Ensure user has `browser_notifications = true` in database

### Settings Not Saving
- Check browser console for errors
- Verify database columns exist
- Ensure user is logged in
- Check network tab for failed requests

### Permission Denied
- Clear browser site data and try again
- Check browser settings for notification permissions
- Some browsers require HTTPS for notifications

## Next Steps

1. ✅ Run the database migration script
2. ✅ Test browser notifications
3. ⏳ Configure SMS backend (if needed)
4. ⏳ Test SMS notifications (if backend is ready)
5. ⏳ Consider adding email notification backend


