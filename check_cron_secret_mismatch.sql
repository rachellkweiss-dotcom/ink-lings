-- Check what secret the cron job is actually using
-- This will help identify if there's a mismatch

SELECT 
    jobname,
    -- Extract the secret from the command (if present)
    CASE 
        WHEN command::text LIKE '%x-cron-secret%' THEN 
            substring(
                command::text 
                from '''x-cron-secret''\s*,\s*''([^'']+)'''
            )
        ELSE 'No secret found in command'
    END as secret_in_cron_command,
    -- Show if command has the secret header
    CASE 
        WHEN command::text LIKE '%x-cron-secret%' THEN '✅ Has x-cron-secret header'
        ELSE '❌ Missing x-cron-secret header'
    END as secret_header_status,
    active,
    schedule
FROM cron.job
WHERE jobname = 'send-15-prompt-milestone';

-- Also show the full command (truncated) to see the structure
SELECT 
    jobname,
    left(command::text, 200) as command_preview
FROM cron.job
WHERE jobname = 'send-15-prompt-milestone';




