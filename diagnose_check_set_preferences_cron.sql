-- Comprehensive diagnostic for check-set-preferences cron job
-- Run these queries in Supabase Dashboard → SQL Editor

-- 1. Check if cron job exists
SELECT 
    jobid,
    jobname,
    schedule,
    active,
    CASE 
        WHEN schedule = '0 9 * * *' THEN '✅ Correct schedule (9:00 AM UTC)'
        ELSE '❌ Wrong schedule: ' || schedule
    END as schedule_status,
    CASE 
        WHEN active THEN '✅ Active'
        ELSE '❌ Inactive'
    END as active_status
FROM cron.job
WHERE jobname = 'check-set-preferences-emails';

-- 2. Check if secret token is included
SELECT 
    jobname,
    CASE 
        WHEN command::text LIKE '%x-cron-secret%' THEN '✅ Has secret token header'
        ELSE '❌ Missing secret token header'
    END as secret_header_status,
    CASE 
        WHEN command::text LIKE '%CHECK_SET_PREFERENCES_CRON_SECRET%' THEN '⚠️ Has placeholder (needs real secret)'
        WHEN command::text LIKE '%x-cron-secret%' AND command::text NOT LIKE '%CHECK_SET_PREFERENCES_CRON_SECRET%' THEN '✅ Has secret token'
        ELSE '❌ No secret token'
    END as secret_status
FROM cron.job
WHERE jobname = 'check-set-preferences-emails';

-- 3. Check recent cron job runs (last 7 days)
SELECT 
    j.jobname,
    jrd.jobid,
    jrd.runid,
    jrd.status,
    jrd.return_message,
    jrd.start_time,
    jrd.end_time
FROM cron.job_run_details jrd
JOIN cron.job j ON jrd.jobid = j.jobid
WHERE j.jobname = 'check-set-preferences-emails'
ORDER BY jrd.start_time DESC
LIMIT 10;

-- 4. Check all cron jobs to see what's active
SELECT 
    jobid,
    jobname,
    schedule,
    active,
    CASE 
        WHEN active THEN '✅'
        ELSE '❌'
    END as status
FROM cron.job
ORDER BY jobname;

-- 5. Check if the edge function exists and is accessible
-- (This will show if there are any HTTP errors from cron)
SELECT 
    j.jobname,
    jrd.jobid,
    jrd.runid,
    jrd.status,
    jrd.return_message,
    jrd.start_time,
    jrd.end_time,
    CASE 
        WHEN jrd.return_message LIKE '%error%' OR jrd.return_message LIKE '%Error%' OR jrd.return_message LIKE '%failed%' THEN '❌ Error detected'
        WHEN jrd.status = 'failed' THEN '❌ Failed'
        WHEN jrd.status = 'succeeded' THEN '✅ Succeeded'
        ELSE '⚠️ Unknown status'
    END as run_status
FROM cron.job_run_details jrd
JOIN cron.job j ON jrd.jobid = j.jobid
WHERE j.jobname = 'check-set-preferences-emails'
ORDER BY jrd.start_time DESC
LIMIT 5;

