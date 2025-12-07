-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;
-- Function to notify owner on new sale
CREATE OR REPLACE FUNCTION notify_owner_on_sale() RETURNS TRIGGER AS $$ BEGIN -- Call the backend API endpoint
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
AFTER
INSERT ON sales FOR EACH ROW EXECUTE FUNCTION notify_owner_on_sale();
-- Note: Update the URL above with your actual Railway deployment URL
-- Example: 'https://stoguard-production.up.railway.app/api/notify-owner'