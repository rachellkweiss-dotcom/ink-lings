-- Delete User Completely - Simple Version
-- 
-- INSTRUCTIONS:
-- 1. Replace 'YOUR_USER_ID_HERE' below with the actual UUID (just once at the top!)
-- 2. Example: '123e4567-e89b-12d3-a456-426614174000'
-- 3. Run this in Supabase Dashboard → SQL Editor
--
-- ⚠️ WARNING: This permanently deletes all user data. Use with caution!

DO $$
DECLARE
    user_id_to_delete UUID := 'YOUR_USER_ID_HERE';  -- ⚠️ CHANGE THIS ONE LINE!
BEGIN
    -- Delete from all tables (only if they exist)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'prompt_history') THEN
        DELETE FROM "public"."prompt_history" WHERE user_id = user_id_to_delete;
        RAISE NOTICE 'Deleted from prompt_history';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_prompt_progress') THEN
        DELETE FROM "public"."user_prompt_progress" WHERE user_id = user_id_to_delete;
        RAISE NOTICE 'Deleted from user_prompt_progress';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_prompt_rotation') THEN
        DELETE FROM "public"."user_prompt_rotation" WHERE user_id = user_id_to_delete;
        RAISE NOTICE 'Deleted from user_prompt_rotation';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_milestones') THEN
        DELETE FROM "public"."email_milestones" WHERE user_id = user_id_to_delete;
        RAISE NOTICE 'Deleted from email_milestones';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gratitude_2026_participants') THEN
        DELETE FROM "public"."gratitude_2026_participants" WHERE user_id = user_id_to_delete;
        RAISE NOTICE 'Deleted from gratitude_2026_participants';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_preferences') THEN
        DELETE FROM "public"."user_preferences" WHERE user_id = user_id_to_delete;
        RAISE NOTICE 'Deleted from user_preferences';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        DELETE FROM "public"."users" WHERE id = user_id_to_delete;
        RAISE NOTICE 'Deleted from users';
    END IF;
    
    RAISE NOTICE '✅ Deleted user % from all existing public tables', user_id_to_delete;
    RAISE NOTICE '⚠️ Remember to also delete from auth.users in Dashboard → Authentication → Users';
END $$;

