-- Check send-15-prompt-milestone cron job status
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Check if cron job exists and is active
SELECT 
    jobid,
    jobname,
    schedule,
    active,
    command
FROM cron.job
WHERE jobname = 'send-15-prompt-milestone';

-- 2. Check recent cron job runs
SELECT 
    j.jobname,
    jrd.runid,
    jrd.status,
    jrd.return_message,
    jrd.start_time,
    jrd.end_time,
    jrd.end_time - jrd.start_time as duration
FROM cron.job_run_details jrd
JOIN cron.job j ON jrd.jobid = j.jobid
WHERE j.jobname = 'send-15-prompt-milestone'
ORDER BY jrd.start_time DESC
LIMIT 10;

-- 3. Check if the command includes the secret token
SELECT 
    jobname,
    CASE 
        WHEN command::text LIKE '%x-cron-secret%' THEN '✅ Has secret token'
        WHEN command::text LIKE '%YOUR_SEND_15_MILESTONE_CRON_SECRET%' THEN '⚠️ Has placeholder (not configured)'
        ELSE '❌ Missing secret token'
    END as secret_status,
    active,
    schedule
FROM cron.job
WHERE jobname = 'send-15-prompt-milestone';



