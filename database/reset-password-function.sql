-- Function to reset user password (for forgot password flow)
-- Allows resetting password with just username (no email verification)
-- This function must be run in Supabase SQL Editor
CREATE OR REPLACE FUNCTION reset_user_password(
        p_username TEXT,
        p_new_password TEXT
    ) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE user_exists BOOLEAN;
BEGIN -- Check if user exists
SELECT EXISTS(
        SELECT 1
        FROM user_profiles
        WHERE username = p_username
    ) INTO user_exists;
IF NOT user_exists THEN RETURN false;
END IF;
-- Update password
UPDATE user_profiles
SET password_hash = crypt(p_new_password, gen_salt('bf')),
    updated_at = NOW()
WHERE username = p_username;
RETURN true;
END;
$$;
-- Grant execute permission
GRANT EXECUTE ON FUNCTION reset_user_password(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_user_password(TEXT, TEXT) TO anon;