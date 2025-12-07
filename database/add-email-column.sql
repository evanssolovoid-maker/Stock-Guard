-- Add email column to user_profiles table for email notifications
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'user_profiles'
        AND column_name = 'email'
) THEN
ALTER TABLE user_profiles
ADD COLUMN email TEXT;
END IF;
END $$;
-- Add email threshold column (similar to SMS threshold)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'user_profiles'
        AND column_name = 'email_threshold'
) THEN
ALTER TABLE user_profiles
ADD COLUMN email_threshold DECIMAL(10, 2) DEFAULT 0;
END IF;
END $$;
-- Add index for email notifications
CREATE INDEX IF NOT EXISTS idx_user_profiles_email_notifications ON user_profiles(email_notifications, email);