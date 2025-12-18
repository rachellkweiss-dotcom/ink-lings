-- Check if there's a cron job set up for send-catchup-prompts
SELECT 
    jobid,
    jobname,
    schedule,
    active,
    command
FROM cron.job
WHERE jobname LIKE '%catchup%' OR command LIKE '%send-catchup-prompts%';

-- Also check all cron jobs to see what's running
SELECT 
    jobid,
    jobname,
    schedule,
    active
FROM cron.job
ORDER BY jobname;

