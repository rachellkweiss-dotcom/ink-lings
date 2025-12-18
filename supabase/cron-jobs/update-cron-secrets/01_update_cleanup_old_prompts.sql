-- Update cleanup-old-prompts cron job to include secret token
-- 
-- ⚠️ SECURITY WARNING: This file contains a PLACEHOLDER for the secret.
-- DO NOT commit this file with a real secret value!
-- 
-- INSTRUCTIONS:
-- 1. Set CLEANUP_CRON_SECRET in Supabase Dashboard → Edge Functions → Secrets
-- 2. Copy this file and replace 'YOUR_CLEANUP_CRON_SECRET_HERE' with your actual secret
-- 3. Run the SQL in Supabase Dashboard → SQL Editor
-- 4. Delete the file with the real secret (or don't save it)

-- Step 1: Remove existing cron job
SELECT cron.unschedule('cleanup-old-prompts');

-- Step 2: Create new cron job with secret token
SELECT cron.schedule(
    'cleanup-old-prompts',
    '0 2 * * *',  -- Daily at 2:00 AM UTC
    $$
    SELECT
        net.http_post(
            url := 'https://plbesopwfipvxqqzendc.supabase.co/functions/v1/cleanup-old-prompts',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'x-cron-secret', 'YOUR_CLEANUP_CRON_SECRET_HERE'  -- ⚠️ REPLACE WITH SECRET FROM DASHBOARD!
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
WHERE jobname = 'cleanup-old-prompts';

