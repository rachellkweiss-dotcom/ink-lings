-- Migration: Set up send-discord-stats cron job
-- This schedules the function to run every 3 days at 10:00 AM UTC

-- Step 1: Remove existing cron job if it exists (to avoid duplicates)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-discord-stats') THEN
        PERFORM cron.unschedule('send-discord-stats');
    END IF;
END $$;

-- Step 2: Schedule the send-discord-stats function to run every 3 days at 10:00 AM UTC
-- Note: The function uses a secret token for authentication (stored in Edge Function secrets)
SELECT cron.schedule(
    'send-discord-stats',
    '0 10 */3 * *',  -- Every 3 days at 10:00 AM UTC
    $$
    SELECT
        net.http_post(
            url := 'https://plbesopwfipvxqqzendc.supabase.co/functions/v1/send-discord-stats',
            headers := jsonb_build_object(
                'Content-Type', 'application/json'
                -- Note: If you set DISCORD_STATS_CRON_SECRET, add it here:
                -- 'x-cron-secret', 'your-secret-token-here'
            ),
            body := '{}'::jsonb
        ) AS request_id;
    $$
);

-- Step 3: Verify the cron job was created
-- Run this query to see all cron jobs: SELECT * FROM cron.job WHERE jobname = 'send-discord-stats';
