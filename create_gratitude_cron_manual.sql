-- Manually create the gratitude prompts cron job
-- Run this in Supabase Dashboard → SQL Editor if the migration didn't create it

-- Step 1: Remove existing cron job if it exists (to avoid duplicates)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-gratitude-prompts') THEN
        PERFORM cron.unschedule('send-gratitude-prompts');
        RAISE NOTICE 'Removed existing gratitude prompts cron job';
    END IF;
END $$;

-- Step 2: Schedule the send-gratitude-prompts function to run daily at 16:00 UTC
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
SELECT 
    jobid,
    jobname,
    schedule,
    active,
    CASE 
        WHEN schedule = '0 16 * * *' THEN '✅ Correct schedule'
        ELSE '❌ Wrong schedule'
    END as status
FROM cron.job
WHERE jobname = 'send-gratitude-prompts';

