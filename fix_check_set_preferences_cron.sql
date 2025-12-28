-- Fix check-set-preferences cron job
-- This will check if it exists, if it has the secret, and create/update it if needed
-- Run this in Supabase Dashboard → SQL Editor

-- Step 1: Check current status
SELECT 
    'Current Status' as check_type,
    jobid,
    jobname,
    schedule,
    active,
    CASE 
        WHEN command::text LIKE '%x-cron-secret%' THEN '✅ Has secret'
        ELSE '❌ Missing secret'
    END as secret_status
FROM cron.job
WHERE jobname = 'check-set-preferences-emails';

-- Step 2: Check recent runs for errors
SELECT 
    'Recent Runs' as check_type,
    j.jobname,
    jrd.runid,
    jrd.status,
    jrd.return_message,
    jrd.start_time
FROM cron.job_run_details jrd
JOIN cron.job j ON jrd.jobid = j.jobid
WHERE j.jobname = 'check-set-preferences-emails'
ORDER BY jrd.start_time DESC
LIMIT 5;

-- Step 3: Remove existing cron job if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'check-set-preferences-emails') THEN
        PERFORM cron.unschedule('check-set-preferences-emails');
        RAISE NOTICE 'Removed existing cron job';
    END IF;
END $$;

-- Step 4: Create cron job with secret token
-- ⚠️ IMPORTANT: Replace 'YOUR_SECRET_HERE' with the actual CHECK_SET_PREFERENCES_CRON_SECRET
-- Get it from: Supabase Dashboard → Edge Functions → Secrets → CHECK_SET_PREFERENCES_CRON_SECRET
SELECT cron.schedule(
    'check-set-preferences-emails',
    '0 9 * * *',  -- Daily at 9:00 AM UTC
    $$
    SELECT
        net.http_post(
            url := 'https://plbesopwfipvxqqzendc.supabase.co/functions/v1/check-set-preferences',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'x-cron-secret', 'YOUR_SECRET_HERE'  -- ⚠️ REPLACE THIS WITH ACTUAL SECRET!
            ),
            body := '{}'::jsonb
        ) AS request_id;
    $$
);

-- Step 5: Verify it was created correctly
SELECT 
    'Verification' as check_type,
    jobid,
    jobname,
    schedule,
    active,
    CASE 
        WHEN schedule = '0 9 * * *' THEN '✅ Correct schedule'
        ELSE '❌ Wrong schedule'
    END as schedule_check,
    CASE 
        WHEN command::text LIKE '%x-cron-secret%' THEN '✅ Has secret token'
        ELSE '❌ Missing secret token'
    END as secret_check
FROM cron.job
WHERE jobname = 'check-set-preferences-emails';

