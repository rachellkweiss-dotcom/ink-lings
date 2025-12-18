-- Update check-set-preferences-emails cron job to include secret token
-- 
-- ⚠️ SECURITY WARNING: This file contains a PLACEHOLDER for the secret.
-- DO NOT commit this file with a real secret value!
-- 
-- INSTRUCTIONS:
-- 1. Get CHECK_SET_PREFERENCES_CRON_SECRET from Supabase Dashboard → Edge Functions → Secrets
-- 2. Copy this file and replace 'YOUR_CHECK_SET_PREFERENCES_CRON_SECRET_HERE' with your actual secret
-- 3. Run the SQL in Supabase Dashboard → SQL Editor
-- 4. Delete the file with the real secret (or don't save it)

-- Step 1: Remove existing cron job
SELECT cron.unschedule('check-set-preferences-emails');

-- Step 2: Create new cron job with secret token
SELECT cron.schedule(
    'check-set-preferences-emails',
    '0 9 * * *',  -- Daily at 9:00 AM UTC
    $$
    SELECT
        net.http_post(
            url := 'https://plbesopwfipvxqqzendc.supabase.co/functions/v1/check-set-preferences',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'x-cron-secret', 'YOUR_CHECK_SET_PREFERENCES_CRON_SECRET_HERE'  -- ⚠️ REPLACE WITH SECRET FROM DASHBOARD!
            ),
            body := '{}'::jsonb
        ) AS request_id;
    $$
);

-- Step 3: Verify it was updated
SELECT 
    jobid,
    jobname,
    schedule,
    active
FROM cron.job
WHERE jobname = 'check-set-preferences-emails';

