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
    -- 'send-15-prompt-milestone' unscheduled 2026-06-19 (Discord notifications now in-app);
    -- see migration 20260619000001_disable_send_15_milestone_cron.sql
    'send-prompts-hourly',
    'send-gratitude-prompts',
    'send-support-inklings',
    'send-discord-stats',
    'sync-discord-support'
)
ORDER BY jobname;

-- Expected result: All 7 jobs should show "✅ Has secret token" and active = true

