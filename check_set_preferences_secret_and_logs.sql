-- Check if check-set-preferences cron has secret and verify function execution
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Check if cron job has the secret token
SELECT 
    jobid,
    jobname,
    schedule,
    active,
    CASE 
        WHEN command::text LIKE '%x-cron-secret%' THEN '✅ Has secret token'
        ELSE '❌ Missing secret token (function will return 401)'
    END as secret_status,
    -- Show a snippet of the command to see the headers
    substring(command::text, 1, 1000) as command_snippet
FROM cron.job
WHERE jobname = 'check-set-preferences-emails';

-- 2. The cron job runs successfully, but we need to check if the function actually executed
-- The "1 row" return message just means the HTTP call completed, not that the function worked
-- Check edge function logs in Dashboard → Edge Functions → check-set-preferences → Logs

