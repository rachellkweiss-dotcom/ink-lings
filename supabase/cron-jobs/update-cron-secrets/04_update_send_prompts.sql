-- Update send-prompts-hourly cron job to include secret token
-- 
-- ⚠️ SECURITY WARNING: This file contains a PLACEHOLDER for the secret.
-- DO NOT commit this file with a real secret value!
-- 
-- INSTRUCTIONS:
-- 1. Set SEND_PROMPTS_CRON_SECRET in Supabase Dashboard → Edge Functions → Secrets
-- 2. Copy this file and replace 'YOUR_SEND_PROMPTS_CRON_SECRET_HERE' with your actual secret
-- 3. Run the SQL in Supabase Dashboard → SQL Editor
-- 4. Delete the file with the real secret (or don't save it)

-- Step 1: Remove existing cron job
SELECT cron.unschedule('send-prompts-hourly');

-- Step 2: Create new cron job with secret token
SELECT cron.schedule(
    'send-prompts-hourly',
    '55 * * * *',  -- Every hour at :55 minutes
    $$
    SELECT
        net.http_post(
            url := 'https://plbesopwfipvxqqzendc.supabase.co/functions/v1/send-prompts',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'x-cron-secret', 'YOUR_SEND_PROMPTS_CRON_SECRET_HERE'  -- ⚠️ REPLACE WITH SECRET FROM DASHBOARD!
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
WHERE jobname = 'send-prompts-hourly';

