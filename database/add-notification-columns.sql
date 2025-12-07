-- Add notification columns to user_profiles table
-- This enables notification preferences functionality
-- Add SMS notifications column
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'user_profiles'
        AND column_name = 'sms_notifications'
) THEN
ALTER TABLE user_profiles
ADD COLUMN sms_notifications BOOLEAN DEFAULT false;
END IF;
END $$;
-- Add browser notifications column
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'user_profiles'
        AND column_name = 'browser_notifications'
) THEN
ALTER TABLE user_profiles
ADD COLUMN browser_notifications BOOLEAN DEFAULT false;
END IF;
END $$;
-- Add email notifications column
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'user_profiles'
        AND column_name = 'email_notifications'
) THEN
ALTER TABLE user_profiles
ADD COLUMN email_notifications BOOLEAN DEFAULT false;
END IF;
END $$;
-- Add SMS threshold column
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'user_profiles'
        AND column_name = 'sms_threshold'
) THEN
ALTER TABLE user_profiles
ADD COLUMN sms_threshold DECIMAL(10, 2) DEFAULT 0;
END IF;
END $$;
-- Add index for notification preferences
CREATE INDEX IF NOT EXISTS idx_user_profiles_notifications ON user_profiles(
    sms_notifications,
    browser_notifications,
    email_notifications
);