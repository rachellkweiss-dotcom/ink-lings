-- Migration: Set up sync-discord-support cron job
-- Polls Discord threads every hour for new replies to support tickets

-- Step 1: Remove existing cron job if it exists (to avoid duplicates)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sync-discord-support') THEN
        PERFORM cron.unschedule('sync-discord-support');
    END IF;
END $$;

-- Step 2: Schedule the sync-discord-support function to run every hour between 8am-9pm CST
-- CST = UTC-6, so 8am CST = 14:00 UTC, 9pm CST = 03:00 UTC
-- Can also be triggered manually via direct HTTP POST for immediate sync
SELECT cron.schedule(
    'sync-discord-support',
    '0 0-3,14-23 * * *',  -- Every hour between 8am-9pm CST
    $$
    SELECT
        net.http_post(
            url := 'https://plbesopwfipvxqqzendc.supabase.co/functions/v1/sync-discord-support',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'x-cron-secret', current_setting('app.discord_support_cron_secret', true)
            ),
            body := '{}'::jsonb
        ) AS request_id;
    $$
);

-- Step 3: Verify the cron job was created
-- Run this query to see the cron job: SELECT * FROM cron.job WHERE jobname = 'sync-discord-support';
