-- Migration: Create email_milestones table for tracking milestone emails
-- This table tracks when milestone emails were sent to users

-- Create the email_milestones table
CREATE TABLE IF NOT EXISTS "public"."email_milestones" (
    "user_id" UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    "set_preferences" TIMESTAMP WITH TIME ZONE,
    "alt_notifications" TIMESTAMP WITH TIME ZONE,
    "support_inklings" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS "idx_email_milestones_user_id" ON "public"."email_milestones"("user_id");

-- Enable Row Level Security
ALTER TABLE "public"."email_milestones" ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role to manage email milestones
CREATE POLICY "Service role can manage email milestones" ON "public"."email_milestones"
    FOR ALL USING (true);

-- Grant necessary permissions
GRANT ALL ON "public"."email_milestones" TO "service_role";
GRANT SELECT ON "public"."email_milestones" TO "authenticated";

-- Add comments to document the columns
COMMENT ON TABLE "public"."email_milestones" IS 'Tracks when milestone emails were sent to users';
COMMENT ON COLUMN "public"."email_milestones"."set_preferences" IS 'Timestamp when set_preferences reminder email was sent (count=0, signup>2days)';
COMMENT ON COLUMN "public"."email_milestones"."alt_notifications" IS 'Timestamp when alt_notifications email was sent (count=10)';
COMMENT ON COLUMN "public"."email_milestones"."support_inklings" IS 'Timestamp when support_inklings email was sent (count=20, stripe<675)';

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_milestones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_email_milestones_updated_at
    BEFORE UPDATE ON "public"."email_milestones"
    FOR EACH ROW
    EXECUTE FUNCTION update_email_milestones_updated_at();

-- Grant permissions for the function
GRANT EXECUTE ON FUNCTION update_email_milestones_updated_at() TO "service_role";




