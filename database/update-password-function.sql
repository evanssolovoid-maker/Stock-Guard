-- Function to update user password
-- Verifies old password before updating to new password
-- This function must be run in Supabase SQL Editor
CREATE OR REPLACE FUNCTION update_user_password(
        p_user_id UUID,
        p_old_password TEXT,
        p_new_password TEXT
    ) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE current_hash TEXT;
BEGIN -- Get current password hash
SELECT password_hash INTO current_hash
FROM user_profiles
WHERE id = p_user_id;
-- Verify old password
IF current_hash IS NULL THEN RETURN false;
END IF;
-- Check if old password matches
IF current_hash != crypt(p_old_password, current_hash) THEN RETURN false;
END IF;
-- Update to new password
UPDATE user_profiles
SET password_hash = crypt(p_new_password, gen_salt('bf')),
    updated_at = NOW()
WHERE id = p_user_id;
RETURN true;
END;
$$;
-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_password(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_password(UUID, TEXT, TEXT) TO anon;