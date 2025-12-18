-- Migration: Set up send-support-inklings cron job
-- This schedules the function to run daily at 9:00 AM UTC

-- Step 1: Remove existing cron job if it exists (to avoid duplicates)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-support-inklings') THEN
        PERFORM cron.unschedule('send-support-inklings');
    END IF;
END $$;

-- Step 2: Schedule the send-support-inklings function to run daily at 9:00 AM UTC
-- Note: The function uses a secret token for authentication (stored in Edge Function secrets)
-- If SEND_SUPPORT_CRON_SECRET is not set, the function will allow all requests
SELECT cron.schedule(
    'send-support-inklings',
    '0 9 * * *',  -- Daily at 9:00 AM UTC
    $$
    SELECT
        net.http_post(
            url := 'https://plbesopwfipvxqqzendc.supabase.co/functions/v1/send-support-inklings',
            headers := jsonb_build_object(
                'Content-Type', 'application/json'
                -- Note: If you set SEND_SUPPORT_CRON_SECRET, add it here:
                -- 'x-cron-secret', 'your-secret-token-here'
            ),
            body := '{}'::jsonb
        ) AS request_id;
    $$
);

-- Step 3: Verify the cron job was created
-- Run this query to see all cron jobs: SELECT * FROM cron.job WHERE jobname = 'send-support-inklings';

