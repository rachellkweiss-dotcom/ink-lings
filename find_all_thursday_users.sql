-- Find all users who have Thursday in their notification_days
-- Shows their notification times and timezones
-- Run this in Supabase Dashboard → SQL Editor

SELECT 
    up.user_id,
    up.notification_email,
    up.notification_days,
    up.notification_time,
    up.timezone,
    up.notification_time_utc,
    up.total_prompts_sent_count,
    -- Calculate when their prompt would be sent on Thursday, Dec 18, 2025 in UTC
    (('2025-12-18'::date + up.notification_time_utc::time)::timestamp)::timestamptz as scheduled_utc_dec18,
    -- Get their last prompt sent
    (SELECT MAX(sent_at) FROM prompt_history ph WHERE ph.user_id = up.user_id) as last_prompt_sent,
    -- Check if they received a prompt today (Dec 18, 2025)
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM prompt_history ph 
            WHERE ph.user_id = up.user_id 
            AND ph.sent_at >= '2025-12-18 00:00:00+00'::timestamptz
            AND ph.sent_at <= '2025-12-18 23:59:59+00'::timestamptz
        ) THEN '✅ Received today'
        ELSE '❌ Not received today'
    END as received_today_status
FROM user_preferences up
WHERE 
    -- User has notification days set
    up.notification_days IS NOT NULL 
    AND up.notification_days != '{}'::text[]
    -- Thursday is in their notification_days (case-insensitive)
    AND EXISTS (
        SELECT 1 
        FROM unnest(up.notification_days) AS day_name 
        WHERE LOWER(TRIM(day_name)) = 'thursday'
    )
    -- User has notification time set
    AND up.notification_time IS NOT NULL
    AND up.notification_time_utc IS NOT NULL
ORDER BY 
    up.notification_time_utc ASC,
    up.notification_email ASC;




