-- Migration: Schedule gratitude prompts cron job for 2026
-- The function itself checks if it's 2026, so the cron can run daily
-- but will only send emails during 2026 (January 1 - December 31, 2026)

-- Step 1: Remove existing cron job if it exists (to avoid duplicates)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-gratitude-prompts') THEN
        PERFORM cron.unschedule('send-gratitude-prompts');
    END IF;
END $$;

-- Step 2: Schedule the send-gratitude-prompts function to run daily at 16:00 UTC
-- The function will automatically check if it's 2026 and only send emails during that year
-- Note: The function uses a secret token for authentication (stored in Edge Function secrets)
-- Make sure SEND_PROMPTS_CRON_SECRET is set in the Edge Function environment variables
SELECT cron.schedule(
    'send-gratitude-prompts',
    '0 16 * * *',  -- Daily at 16:00 UTC (11:00 AM EST / 12:00 PM EDT)
    $$
    SELECT
        net.http_post(
            url := 'https://plbesopwfipvxqqzendc.supabase.co/functions/v1/send-gratitude-prompts',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'x-cron-secret', '06b047ed62548ae2aae814d7a3c1bdf358191ec2b3e8f3feb311ab3b0e236afe'
            ),
            body := '{}'::jsonb
        ) AS request_id;
    $$
);

-- Step 3: Verify the cron job was created
-- Run this query to see all cron jobs: SELECT * FROM cron.job WHERE jobname = 'send-gratitude-prompts';

-- Note: The function will automatically skip if it's not 2026, so the cron can run daily
-- but emails will only be sent from January 1, 2026 to December 31, 2026

