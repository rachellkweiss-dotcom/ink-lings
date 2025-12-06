-- Migration: Create function to sync users to email_milestones
-- This function can be called manually or via cron to ensure all users are in email_milestones

CREATE OR REPLACE FUNCTION sync_users_to_email_milestones()
RETURNS void AS $$
BEGIN
    INSERT INTO "public"."email_milestones" (user_id)
    SELECT au.id
    FROM auth.users au
    LEFT JOIN "public"."email_milestones" em ON au.id = em.user_id
    WHERE em.user_id IS NULL
    AND au.email_confirmed_at IS NOT NULL; -- Only confirmed users
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION sync_users_to_email_milestones() TO "authenticated";
GRANT EXECUTE ON FUNCTION sync_users_to_email_milestones() TO "service_role";
GRANT EXECUTE ON FUNCTION sync_users_to_email_milestones() TO "anon";

-- Add comment to document the function
COMMENT ON FUNCTION sync_users_to_email_milestones() IS 'Syncs confirmed users from auth.users to email_milestones table. Can be called manually or via cron job.';




