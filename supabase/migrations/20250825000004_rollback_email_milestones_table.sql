-- Rollback migration: Remove email_milestones table
-- This migration removes the email milestone tracking functionality

-- Drop the trigger first
DROP TRIGGER IF EXISTS trigger_update_email_milestones_updated_at ON "public"."email_milestones";

-- Drop the function
DROP FUNCTION IF EXISTS update_email_milestones_updated_at();

-- Drop the table
DROP TABLE IF EXISTS "public"."email_milestones";




