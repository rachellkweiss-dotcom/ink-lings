-- Verify all cron jobs are configured correctly with secrets
-- Run this in Supabase Dashboard → SQL Editor

SELECT 
    jobid,
    jobname,
    schedule,
    active,
    CASE 
        WHEN command LIKE '%x-cron-secret%' THEN '✅ Has secret token'
        ELSE '❌ Missing secret token'
    END AS secret_status
FROM cron.job
WHERE jobname IN (
    'cleanup-old-prompts',
    'check-set-preferences-emails',
    'send-15-prompt-milestone',
    'send-prompts-hourly',
    'send-support-inklings'
)
ORDER BY jobname;

-- Expected result: All 5 jobs should show "✅ Has secret token" and active = true

