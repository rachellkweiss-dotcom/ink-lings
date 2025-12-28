-- Fix send-15-prompt-milestone cron job to include secret token
-- 
-- INSTRUCTIONS:
-- 1. Get your SEND_15_MILESTONE_CRON_SECRET from Supabase Dashboard → Edge Functions → Secrets
-- 2. Replace 'YOUR_SECRET_HERE' below with the actual secret value
-- 3. Run this SQL in Supabase Dashboard → SQL Editor

-- Step 1: Remove existing cron job
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-15-prompt-milestone') THEN
        PERFORM cron.unschedule('send-15-prompt-milestone');
    END IF;
END $$;

-- Step 2: Create new cron job with secret token
SELECT cron.schedule(
    'send-15-prompt-milestone',
    '0 10 * * *',  -- Daily at 10:00 AM UTC
    $$
    SELECT
        net.http_post(
            url := 'https://plbesopwfipvxqqzendc.supabase.co/functions/v1/send-15-prompt-milestone',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'x-cron-secret', 'YOUR_SECRET_HERE'  -- ⚠️ REPLACE WITH ACTUAL SECRET FROM DASHBOARD!
            ),
            body := '{}'::jsonb
        ) AS request_id;
    $$
);

-- Step 3: Verify it was created correctly
SELECT 
    jobid,
    jobname,
    schedule,
    active,
    CASE 
        WHEN command::text LIKE '%x-cron-secret%' THEN '✅ Has secret token'
        ELSE '❌ Missing secret token'
    END as secret_status
FROM cron.job
WHERE jobname = 'send-15-prompt-milestone';



