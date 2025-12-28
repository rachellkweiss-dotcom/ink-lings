-- Verify the gratitude cron job has the secret token
-- Run this in Supabase Dashboard → SQL Editor

SELECT 
    jobname,
    schedule,
    active,
    CASE 
        WHEN command::text LIKE '%x-cron-secret%' THEN '✅ Has secret token header'
        ELSE '❌ Missing secret token header'
    END as secret_header_status,
    CASE 
        WHEN command::text LIKE '%06b047ed62548ae2aae814d7a3c1bdf358191ec2b3e8f3feb311ab3b0e236afe%' THEN '✅ Has correct secret value'
        ELSE '❌ Missing or incorrect secret value'
    END as secret_value_status
FROM cron.job
WHERE jobname = 'send-gratitude-prompts';

