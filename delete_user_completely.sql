-- SQL Script: Delete a user completely from all tables
-- 
-- Usage: Replace '<USER_ID_HERE>' with the actual user ID (UUID)
-- Example: Replace '<USER_ID_HERE>' with '123e4567-e89b-12d3-a456-426614174000'
--
-- WARNING: This will permanently delete all user data. Use with caution!
-- Run this in Supabase Dashboard → SQL Editor

-- Set the user ID to delete (REPLACE THIS WITH ACTUAL USER ID)
DO $$
DECLARE
    target_user_id UUID := '<USER_ID_HERE>';  -- ⚠️ REPLACE THIS!
BEGIN
    -- Check if user exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
        RAISE EXCEPTION 'User with ID % does not exist', target_user_id;
    END IF;

    RAISE NOTICE 'Starting deletion for user: %', target_user_id;

    -- 1. Delete from prompt_history (if table exists and has user_id)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'prompt_history') THEN
        DELETE FROM "public"."prompt_history" WHERE user_id = target_user_id;
        RAISE NOTICE 'Deleted from prompt_history';
    END IF;

    -- 2. Delete from user_prompt_progress (has ON DELETE CASCADE, but explicit for clarity)
    DELETE FROM "public"."user_prompt_progress" WHERE user_id = target_user_id;
    RAISE NOTICE 'Deleted from user_prompt_progress';

    -- 3. Delete from user_prompt_rotation (has ON DELETE CASCADE, but explicit for clarity)
    DELETE FROM "public"."user_prompt_rotation" WHERE user_id = target_user_id;
    RAISE NOTICE 'Deleted from user_prompt_rotation';

    -- 4. Delete from email_milestones (has ON DELETE CASCADE, but explicit for clarity)
    DELETE FROM "public"."email_milestones" WHERE user_id = target_user_id;
    RAISE NOTICE 'Deleted from email_milestones';

    -- 5. Delete from gratitude_2026_participants (has ON DELETE CASCADE, but explicit for clarity)
    DELETE FROM "public"."gratitude_2026_participants" WHERE user_id = target_user_id;
    RAISE NOTICE 'Deleted from gratitude_2026_participants';

    -- 6. Delete from user_preferences (does NOT have ON DELETE CASCADE, so must delete explicitly)
    DELETE FROM "public"."user_preferences" WHERE user_id = target_user_id;
    RAISE NOTICE 'Deleted from user_preferences';

    -- 7. Delete from public.users table (if user_id matches)
    DELETE FROM "public"."users" WHERE id = target_user_id;
    RAISE NOTICE 'Deleted from public.users';

    -- 8. Delete from feedback_tokens (if it has user_id column - check first)
    -- Note: feedback_tokens might not have user_id, so this is optional
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'feedback_tokens' 
        AND column_name = 'user_id'
    ) THEN
        DELETE FROM "public"."feedback_tokens" WHERE user_id = target_user_id;
        RAISE NOTICE 'Deleted from feedback_tokens';
    END IF;

    -- 9. Finally, delete from auth.users (this will cascade to any remaining references)
    -- This must be done via Supabase Admin API or using auth.admin.deleteUser()
    -- For SQL, we can't directly delete from auth.users, so we'll just note it
    RAISE NOTICE 'User data deleted from all public tables.';
    RAISE NOTICE '⚠️ IMPORTANT: You must also delete from auth.users using:';
    RAISE NOTICE '   - Supabase Dashboard → Authentication → Users → Delete';
    RAISE NOTICE '   - OR use: supabase.auth.admin.deleteUser(''%'')', target_user_id;
    RAISE NOTICE '';
    RAISE NOTICE '✅ Deletion complete for user: %', target_user_id;

END $$;

-- Alternative: If you want to delete by email instead of user_id, use this:
/*
DO $$
DECLARE
    target_email TEXT := 'user@example.com';  -- ⚠️ REPLACE WITH ACTUAL EMAIL
    target_user_id UUID;
BEGIN
    -- Find user_id from email
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = target_email;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % does not exist', target_email;
    END IF;
    
    -- Then run the same deletion logic as above using target_user_id
    -- (Copy the deletion code from above)
END $$;
*/

