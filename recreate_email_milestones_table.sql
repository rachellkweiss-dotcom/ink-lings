-- Recreate email_milestones table
-- This table was deleted by a rollback migration but is still needed by:
-- - check-set-preferences function
-- - send-15-prompt-milestone function
-- - send-support-inklings function
-- Run this in Supabase Dashboard → SQL Editor

-- Step 1: Create the email_milestones table
CREATE TABLE IF NOT EXISTS "public"."email_milestones" (
    "user_id" UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    "set_preferences" TIMESTAMP WITH TIME ZONE,
    "alt_notifications" TIMESTAMP WITH TIME ZONE,
    "support_inklings" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create index for efficient queries
CREATE INDEX IF NOT EXISTS "idx_email_milestones_user_id" ON "public"."email_milestones"("user_id");

-- Step 3: Enable Row Level Security
ALTER TABLE "public"."email_milestones" ENABLE ROW LEVEL SECURITY;

-- Step 4: Create policy to allow service role to manage email milestones
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'email_milestones' 
        AND policyname = 'Service role can manage email milestones'
    ) THEN
        CREATE POLICY "Service role can manage email milestones" ON "public"."email_milestones"
            FOR ALL USING (true);
    END IF;
END $$;

-- Step 5: Grant necessary permissions
GRANT ALL ON "public"."email_milestones" TO "service_role";
GRANT SELECT ON "public"."email_milestones" TO "authenticated";

-- Step 6: Add comments to document the columns
COMMENT ON TABLE "public"."email_milestones" IS 'Tracks when milestone emails were sent to users';
COMMENT ON COLUMN "public"."email_milestones"."set_preferences" IS 'Timestamp when set_preferences reminder email was sent (count=0, signup>2days)';
COMMENT ON COLUMN "public"."email_milestones"."alt_notifications" IS 'Timestamp when alt_notifications email was sent (count=10)';
COMMENT ON COLUMN "public"."email_milestones"."support_inklings" IS 'Timestamp when support_inklings email was sent (count=20, stripe<675)';

-- Step 7: Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_milestones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create trigger to automatically update updated_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_update_email_milestones_updated_at'
    ) THEN
        CREATE TRIGGER trigger_update_email_milestones_updated_at
            BEFORE UPDATE ON "public"."email_milestones"
            FOR EACH ROW
            EXECUTE FUNCTION update_email_milestones_updated_at();
    END IF;
END $$;

-- Step 9: Grant permissions for the function
GRANT EXECUTE ON FUNCTION update_email_milestones_updated_at() TO "service_role";

-- Step 10: Backfill existing users into email_milestones
-- This ensures all existing users are tracked
INSERT INTO "public"."email_milestones" (user_id)
SELECT au.id
FROM auth.users au
LEFT JOIN "public"."email_milestones" em ON au.id = em.user_id
WHERE em.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Step 11: Verify the table was created
SELECT 
    'email_milestones table' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_milestones') 
        THEN '✅ Created successfully'
        ELSE '❌ Failed to create'
    END as status,
    (SELECT COUNT(*) FROM "public"."email_milestones") as total_records;

