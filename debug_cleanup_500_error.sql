-- Debug: Check if the secret in the cron job matches what's expected
-- This will help identify if there's a mismatch

-- Check the cron job configuration
SELECT 
    jobname,
    schedule,
    active,
    -- Extract the secret from the command
    (regexp_match(
        command::text, 
        '''x-cron-secret''\s*,\s*''([^'']+)'''
    ))[1] as secret_in_cron_job,
    -- Show a snippet of the command to verify
    substring(command::text, 1, 500) as command_snippet
FROM cron.job
WHERE jobname = 'cleanup-old-prompts';

-- Also check recent cron job runs to see error messages
SELECT 
    jrd.jobid,
    j.jobname,
    jrd.runid,
    jrd.status,
    jrd.return_message,
    jrd.start_time,
    jrd.end_time
FROM cron.job_run_details jrd
JOIN cron.job j ON jrd.jobid = j.jobid
WHERE j.jobname = 'cleanup-old-prompts'
ORDER BY jrd.start_time DESC
LIMIT 5;

