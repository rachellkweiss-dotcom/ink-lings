-- Migration: Disable the send-15-prompt-milestone cron job
--
-- Reason: Discord notifications are now configured directly in the app
-- (see notification-setup.tsx and the notification_channel column added in
-- 20260618000001_add_notification_channel.sql), so the milestone email that
-- pointed users to an external Scribehow guide for Discord setup is no
-- longer needed.
--
-- The edge function `send-15-prompt-milestone` itself is kept deployed but
-- short-circuits to a "disabled" response. This migration removes the
-- scheduled invocation so it stops firing in production.

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-15-prompt-milestone') THEN
        PERFORM cron.unschedule('send-15-prompt-milestone');
        RAISE NOTICE 'Unscheduled cron job: send-15-prompt-milestone';
    ELSE
        RAISE NOTICE 'Cron job send-15-prompt-milestone not found, nothing to unschedule';
    END IF;
END $$;

-- Verification query (run manually if desired):
-- SELECT jobid, jobname, schedule, active FROM cron.job WHERE jobname = 'send-15-prompt-milestone';
-- Expected result: 0 rows
