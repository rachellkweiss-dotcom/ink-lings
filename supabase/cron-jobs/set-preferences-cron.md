-- Cron job configuration for set preferences email
-- This should be set up in Supabase Dashboard > Database > Cron Jobs

-- Job Name: check-set-preferences-emails
-- Schedule: 0 9 * * * (daily at 9am UTC)
-- Function URL: https://your-project-ref.supabase.co/functions/v1/check-set-preferences
-- HTTP Method: POST

-- Description:
-- This cron job runs daily at 9am UTC to check for users who:
-- 1. Have an auth account but no user_preferences (never completed onboarding)
-- 2. Signed up more than 2 days ago
-- 3. Haven't received the set_preferences email yet
-- 
-- It sends them a reminder email to set their preferences and start receiving journal prompts.

-- To set this up in Supabase:
-- 1. Go to Dashboard > Database > Cron Jobs
-- 2. Click "Create a new cron job"
-- 3. Fill in the details above
-- 4. Make sure your edge function is deployed first




