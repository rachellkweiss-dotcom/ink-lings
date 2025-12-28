-- Migration: Set up send-gratitude-prompts cron job
-- This schedules the function to run daily at 16:00 UTC (11:00 AM EST / 12:00 PM EDT) to send gratitude challenge prompts

-- Step 1: Remove existing cron job if it exists (to avoid duplicates)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-gratitude-prompts') THEN
        PERFORM cron.unschedule('send-gratitude-prompts');
    END IF;
END $$;

-- Step 2: Schedule the send-gratitude-prompts function to run daily at 16:00 UTC (11:00 AM EST)
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
                'Content-Type', 'application/json'
                -- Note: The secret is stored in Edge Function secrets (SEND_PROMPTS_CRON_SECRET)
                -- You need to manually add it to the cron job after creation.
                -- Run this SQL to update it (replace YOUR_SECRET with the actual secret):
                -- UPDATE cron.job SET command = regexp_replace(command::text, '''Content-Type'', ''application/json''', '''Content-Type'', ''application/json'', ''x-cron-secret'', ''YOUR_SECRET''')::jsonb WHERE jobname = 'send-gratitude-prompts';
            ),
            body := '{}'::jsonb
        ) AS request_id;
    $$
);

-- Step 3: Verify the cron job was created
-- Run this query to see all cron jobs: SELECT * FROM cron.job WHERE jobname = 'send-gratitude-prompts';

