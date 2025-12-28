-- Extract all cron job secrets from the database
-- The secrets are stored in the cron job command's headers JSON
-- Run this in Supabase Dashboard → SQL Editor

-- Extract secrets from the cron job command SQL
-- The command is stored as SQL text, and we need to parse the JSON from it
SELECT 
    jobname,
    schedule,
    active,
    -- Extract the secret from the SQL command text
    -- The secret is in: jsonb_build_object(..., 'x-cron-secret', 'SECRET_HERE')
    CASE 
        WHEN command::text LIKE '%x-cron-secret%' THEN
            -- Use regex to extract the secret value after 'x-cron-secret'
            -- Pattern: 'x-cron-secret', 'SECRET_VALUE'
            (regexp_match(
                command::text, 
                '''x-cron-secret''\s*,\s*''([^'']+)'''
            ))[1]
        ELSE 'NOT_FOUND'
    END as secret_token,
    -- Map to the environment variable name
    CASE 
        WHEN jobname = 'cleanup-old-prompts' THEN 'CLEANUP_CRON_SECRET'
        WHEN jobname = 'check-set-preferences-emails' THEN 'CHECK_SET_PREFERENCES_CRON_SECRET'
        WHEN jobname = 'send-15-prompt-milestone' THEN 'SEND_15_MILESTONE_CRON_SECRET'
        WHEN jobname = 'send-prompts-hourly' THEN 'SEND_PROMPTS_CRON_SECRET'
        WHEN jobname = 'send-support-inklings' THEN 'SEND_SUPPORT_CRON_SECRET'
    END as env_var_name
FROM cron.job
WHERE jobname IN (
    'cleanup-old-prompts',
    'check-set-preferences-emails',
    'send-15-prompt-milestone',
    'send-prompts-hourly',
    'send-support-inklings'
)
ORDER BY jobname;

-- If the above doesn't extract properly, use this to see the raw command
-- and manually extract the secrets
SELECT 
    jobname,
    schedule,
    active,
    command::text as raw_command
FROM cron.job
WHERE jobname IN (
    'cleanup-old-prompts',
    'check-set-preferences-emails',
    'send-15-prompt-milestone',
    'send-prompts-hourly',
    'send-support-inklings'
)
ORDER BY jobname;
