-- Migration: Add trigger for new users and backfill email_milestones table
-- This ensures all users are tracked in the email_milestones table

-- Step 1: Create function to add new users to email_milestones
CREATE OR REPLACE FUNCTION add_user_to_email_milestones()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert new user into email_milestones table
    INSERT INTO "public"."email_milestones" (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING; -- In case user already exists
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Grant necessary permissions for the function
GRANT EXECUTE ON FUNCTION add_user_to_email_milestones() TO "service_role";

-- Step 3: Create trigger on auth.users table
CREATE TRIGGER trigger_add_user_to_email_milestones
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION add_user_to_email_milestones();

-- Step 4: Backfill existing users who aren't in email_milestones table
INSERT INTO "public"."email_milestones" (user_id)
SELECT au.id
FROM auth.users au
LEFT JOIN "public"."email_milestones" em ON au.id = em.user_id
WHERE em.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Step 5: Add comment to document the function
COMMENT ON FUNCTION add_user_to_email_milestones() IS 'Automatically adds new users to email_milestones table for tracking milestone emails';
