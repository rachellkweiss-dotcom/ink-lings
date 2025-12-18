-- Migration: Set up cleanup-old-prompts cron job
-- This schedules the cleanup function to run daily at 2:00 AM UTC
-- 
-- IMPORTANT: Before running this migration, you need to:
-- 1. Get your Supabase project reference ID from Settings → General
-- 2. Replace 'YOUR-PROJECT-REF' below with your actual project reference
-- 3. Make sure the cleanup-old-prompts edge function is deployed

-- Step 1: Enable pg_net extension (required for HTTP calls to Edge Functions)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Step 2: Remove existing cron job if it exists (to avoid duplicates)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-old-prompts') THEN
        PERFORM cron.unschedule('cleanup-old-prompts');
    END IF;
END $$;

-- Step 3: Schedule the cleanup-old-prompts function to run daily at 2:00 AM UTC
-- The function URL format is: https://<project-ref>.supabase.co/functions/v1/cleanup-old-prompts
-- 
-- To get your project ref:
-- 1. Go to Supabase Dashboard → Settings → General
-- 2. Look for "Reference ID" or extract it from your project URL
--    (e.g., if URL is https://abcdefghijklmnop.supabase.co, then ref is "abcdefghijklmnop")

SELECT cron.schedule(
    'cleanup-old-prompts',                    -- Job name
    '0 2 * * *',                              -- Schedule: Daily at 2:00 AM UTC
    $$                                        -- SQL to execute
    SELECT
        net.http_post(
            url := 'https://plbesopwfipvxqqzendc.supabase.co/functions/v1/cleanup-old-prompts',
            headers := jsonb_build_object(
                'Content-Type', 'application/json'
            ),
            body := '{}'::jsonb
        ) AS request_id;
    $$
);

-- Note: The function doesn't require authentication since we set verify_jwt = false
-- If you need to add auth later, you can use:
-- 'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)

-- Step 4: Verify the cron job was created
-- Run this query to see all cron jobs: SELECT * FROM cron.job;

