-- Disable notification trigger (for Supabase-only setup without Railway backend)
-- This removes the trigger that calls the backend API for SMS/Email notifications
-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS sale_notification_trigger ON sales;
-- Optionally drop the function (comment out if you want to keep it for later)
-- DROP FUNCTION IF EXISTS notify_owner_on_sale();
-- Note: Browser notifications will still work as they are handled client-side
-- SMS and Email notifications require the Railway backend server