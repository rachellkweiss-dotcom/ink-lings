-- Check recent cron job runs for cleanup-old-prompts to see error messages
-- This will help identify what's causing the 500 error

SELECT 
    jrd.jobid,
    j.jobname,
    jrd.runid,
    jrd.status,
    jrd.return_message,
    jrd.start_time,
    jrd.end_time,
    -- Calculate duration
    jrd.end_time - jrd.start_time as duration
FROM cron.job_run_details jrd
JOIN cron.job j ON jrd.jobid = j.jobid
WHERE j.jobname = 'cleanup-old-prompts'
ORDER BY jrd.start_time DESC
LIMIT 10;

-- Also check if the function is being called with the right secret
-- by looking at the cron job configuration
SELECT 
    jobname,
    schedule,
    active,
    -- Extract secret from command
    (regexp_match(
        command::text, 
        '''x-cron-secret''\s*,\s*''([^'']+)'''
    ))[1] as secret_in_cron,
    -- Check if command has the secret
    CASE 
        WHEN command::text LIKE '%x-cron-secret%' THEN 'Has secret in headers'
        ELSE 'Missing secret in headers'
    END as secret_status
FROM cron.job
WHERE jobname = 'cleanup-old-prompts';





