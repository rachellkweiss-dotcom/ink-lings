-- Rollback migration: Remove user trigger and clean up email_milestones
-- This migration removes the automatic user tracking functionality

-- Step 1: Drop the trigger
DROP TRIGGER IF EXISTS trigger_add_user_to_email_milestones ON auth.users;

-- Step 2: Drop the function
DROP FUNCTION IF EXISTS add_user_to_email_milestones();

-- Step 3: Remove users who don't have user_preferences (optional cleanup)
-- Uncomment the line below if you want to remove orphaned email_milestones records
-- DELETE FROM "public"."email_milestones" em
-- WHERE NOT EXISTS (SELECT 1 FROM "public"."user_preferences" up WHERE up.user_id = em.user_id);




