-- Check recent cron job runs to see what's happening
-- This will show if the cron job is running and if it's failing

SELECT 
    j.jobname,
    jrd.runid,
    jrd.status,
    jrd.return_message,
    jrd.start_time,
    jrd.end_time,
    CASE 
        WHEN jrd.end_time IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (jrd.end_time - jrd.start_time))
        ELSE NULL
    END as duration_seconds
FROM cron.job_run_details jrd
JOIN cron.job j ON jrd.jobid = j.jobid
WHERE j.jobname = 'send-prompts-hourly'
ORDER BY jrd.start_time DESC
LIMIT 20;

-- Also check if there are any runs today (December 18, 2025)
SELECT 
    COUNT(*) as runs_today,
    COUNT(CASE WHEN status = 'succeeded' THEN 1 END) as succeeded,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
    MIN(start_time) as first_run,
    MAX(start_time) as last_run
FROM cron.job_run_details jrd
JOIN cron.job j ON jrd.jobid = j.jobid
WHERE j.jobname = 'send-prompts-hourly'
  AND jrd.start_time >= CURRENT_DATE;





