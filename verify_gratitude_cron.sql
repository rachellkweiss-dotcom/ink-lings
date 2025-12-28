-- Verify gratitude prompts cron job is set up correctly
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Check if cron job exists and its schedule
SELECT 
    jobid,
    jobname,
    schedule,
    active,
    CASE 
        WHEN schedule = '0 16 * * *' THEN '✅ Correct schedule (16:00 UTC)'
        ELSE '❌ Wrong schedule: ' || schedule
    END as schedule_status
FROM cron.job
WHERE jobname = 'send-gratitude-prompts';

-- 2. Check if the command includes the secret token
SELECT 
    jobname,
    CASE 
        WHEN command::text LIKE '%x-cron-secret%' THEN '✅ Has secret token'
        WHEN command::text LIKE '%06b047ed62548ae2aae814d7a3c1bdf358191ec2b3e8f3feb311ab3b0e236afe%' THEN '✅ Has correct secret'
        ELSE '❌ Missing secret token'
    END as secret_status,
    active,
    schedule
FROM cron.job
WHERE jobname = 'send-gratitude-prompts';

-- 3. Show the full command (to verify everything looks correct)
SELECT 
    jobname,
    schedule,
    active,
    command
FROM cron.job
WHERE jobname = 'send-gratitude-prompts';

