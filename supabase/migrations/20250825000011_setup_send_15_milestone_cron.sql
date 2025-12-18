-- Migration: Set up send-15-prompt-milestone cron job
-- This schedules the function to run daily to check for users who reached 15 prompts

-- Step 1: Remove existing cron job if it exists (to avoid duplicates)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-15-prompt-milestone') THEN
        PERFORM cron.unschedule('send-15-prompt-milestone');
    END IF;
END $$;

-- Step 2: Schedule the send-15-prompt-milestone function to run daily at 10:00 AM UTC
-- Note: The function uses a secret token for authentication (stored in Edge Function secrets)
-- If SEND_15_MILESTONE_CRON_SECRET is not set, the function will allow all requests
SELECT cron.schedule(
    'send-15-prompt-milestone',
    '0 10 * * *',  -- Daily at 10:00 AM UTC
    $$
    SELECT
        net.http_post(
            url := 'https://plbesopwfipvxqqzendc.supabase.co/functions/v1/send-15-prompt-milestone',
            headers := jsonb_build_object(
                'Content-Type', 'application/json'
                -- Note: If you set SEND_15_MILESTONE_CRON_SECRET, add it here:
                -- 'x-cron-secret', 'your-secret-token-here'
            ),
            body := '{}'::jsonb
        ) AS request_id;
    $$
);

-- Step 3: Verify the cron job was created
-- Run this query to see all cron jobs: SELECT * FROM cron.job WHERE jobname = 'send-15-prompt-milestone';

