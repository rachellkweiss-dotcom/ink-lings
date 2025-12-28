-- Check send-prompts cron job status and configuration
-- This will help diagnose why prompts weren't sent today

-- 1. Check if cron job exists and is active
SELECT 
    jobid,
    jobname,
    schedule,
    active,
    command
FROM cron.job
WHERE jobname = 'send-prompts-hourly';

-- 2. Check recent cron job runs (if available)
SELECT 
    j.jobname,
    jrd.runid,
    jrd.status,
    jrd.return_message,
    jrd.start_time,
    jrd.end_time
FROM cron.job_run_details jrd
JOIN cron.job j ON jrd.jobid = j.jobid
WHERE j.jobname = 'send-prompts-hourly'
ORDER BY jrd.start_time DESC
LIMIT 10;

-- 3. Check if the command includes the secret token
-- Look for 'x-cron-secret' in the command
SELECT 
    jobname,
    CASE 
        WHEN command::text LIKE '%x-cron-secret%' THEN '✅ Has secret token'
        WHEN command::text LIKE '%YOUR_SEND_PROMPTS_CRON_SECRET%' THEN '⚠️ Has placeholder (not configured)'
        ELSE '❌ Missing secret token'
    END as secret_status,
    active
FROM cron.job
WHERE jobname = 'send-prompts-hourly';




