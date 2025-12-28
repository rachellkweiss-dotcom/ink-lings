-- Comprehensive diagnostic for why prompts aren't being sent
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Check cron job status and recent runs
SELECT 
    j.jobname,
    j.schedule,
    j.active,
    COUNT(jrd.runid) as total_runs,
    COUNT(CASE WHEN jrd.status = 'succeeded' THEN 1 END) as succeeded,
    COUNT(CASE WHEN jrd.status = 'failed' THEN 1 END) as failed,
    MAX(jrd.start_time) as last_run_time,
    MAX(jrd.status) as last_status
FROM cron.job j
LEFT JOIN cron.job_run_details jrd ON j.jobid = jrd.jobid
WHERE j.jobname = 'send-prompts-hourly'
GROUP BY j.jobid, j.jobname, j.schedule, j.active;

-- 2. Check recent runs today (December 18, 2025)
SELECT 
    jrd.runid,
    jrd.status,
    jrd.return_message,
    jrd.start_time,
    jrd.end_time,
    CASE 
        WHEN jrd.return_message LIKE '%401%' OR jrd.return_message LIKE '%Unauthorized%' 
        THEN '❌ Authentication failed - secret mismatch?'
        WHEN jrd.return_message LIKE '%500%' 
        THEN '❌ Server error - check Edge Function logs'
        WHEN jrd.status = 'succeeded' 
        THEN '✅ Success'
        ELSE '⚠️ Check return_message'
    END as diagnosis
FROM cron.job_run_details jrd
JOIN cron.job j ON jrd.jobid = j.jobid
WHERE j.jobname = 'send-prompts-hourly'
  AND jrd.start_time >= CURRENT_DATE
ORDER BY jrd.start_time DESC
LIMIT 10;

-- 3. Check if cron job command includes secret (verify it's actually there)
SELECT 
    jobname,
    active,
    schedule,
    -- Extract the secret value from the command (for verification)
    CASE 
        WHEN command::text LIKE '%x-cron-secret%' THEN 
            SUBSTRING(
                command::text 
                FROM 'x-cron-secret[''"]\s*,\s*[''"]([^''"]+)[''"]'
            )
        ELSE 'Not found'
    END as secret_value_preview,
    LENGTH(
        CASE 
            WHEN command::text LIKE '%x-cron-secret%' THEN 
                SUBSTRING(
                    command::text 
                    FROM 'x-cron-secret[''"]\s*,\s*[''"]([^''"]+)[''"]'
                )
            ELSE ''
        END
    ) as secret_length
FROM cron.job
WHERE jobname = 'send-prompts-hourly';




