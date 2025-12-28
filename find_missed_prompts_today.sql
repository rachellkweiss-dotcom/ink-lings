-- Find users who should have received prompts today (December 18, 2025 - Thursday) but didn't
-- Based on the same logic we used this morning for downtime
-- Run this in Supabase Dashboard → SQL Editor

-- For today (December 18, 2025), check the full day
-- Start: 2025-12-18 00:00:00 UTC
-- End: 2025-12-18 23:59:59 UTC
WITH today_period AS (
    SELECT 
        '2025-12-18 00:00:00+00'::timestamptz as start_time,
        '2025-12-18 23:59:59+00'::timestamptz as end_time
),
user_schedules AS (
    SELECT 
        up.user_id,
        up.notification_email,
        up.notification_days,
        up.notification_time,
        up.timezone,
        MAX(ph.sent_at) as last_prompt_sent,
        up.total_prompts_sent_count,
        -- Parse notification_time (format: "6:00 AM" or "6:00 PM" or "12:00 PM")
        -- Handle 12:00 PM/AM correctly (12 PM = noon, 12 AM = midnight)
        CASE 
            WHEN up.notification_time LIKE '%AM%' THEN 
                CASE 
                    WHEN SPLIT_PART(up.notification_time, ':', 1) = '12' THEN 
                        -- 12:XX AM = midnight (00:XX)
                        TO_TIMESTAMP('00:' || SPLIT_PART(SPLIT_PART(up.notification_time, ':', 2), ' ', 1), 'HH24:MI')::time
                    ELSE 
                        TO_TIMESTAMP(SPLIT_PART(up.notification_time, ':', 1) || ':' || SPLIT_PART(SPLIT_PART(up.notification_time, ':', 2), ' ', 1), 'HH24:MI')::time
                END
            WHEN up.notification_time LIKE '%PM%' THEN 
                CASE 
                    WHEN SPLIT_PART(up.notification_time, ':', 1) = '12' THEN 
                        -- 12:XX PM = noon (12:XX, no conversion needed)
                        TO_TIMESTAMP('12:' || SPLIT_PART(SPLIT_PART(up.notification_time, ':', 2), ' ', 1), 'HH24:MI')::time
                    ELSE 
                        -- Other PM times: add 12 hours
                        (TO_TIMESTAMP(SPLIT_PART(up.notification_time, ':', 1) || ':' || SPLIT_PART(SPLIT_PART(up.notification_time, ':', 2), ' ', 1), 'HH24:MI')::time + INTERVAL '12 hours')::time
                END
            ELSE 
                TO_TIMESTAMP(up.notification_time, 'HH24:MI')::time
        END as notification_time_parsed,
        -- December 18, 2025 is a Thursday
        'thursday' as today_day
    FROM user_preferences up
    LEFT JOIN prompt_history ph ON up.user_id = ph.user_id
    CROSS JOIN today_period tp
    WHERE up.notification_email IS NOT NULL
      AND up.notification_days IS NOT NULL
      AND array_length(up.notification_days, 1) > 0
    GROUP BY up.user_id, up.notification_email, up.notification_days, up.notification_time, up.timezone, up.total_prompts_sent_count
),
scheduled_times AS (
    SELECT 
        us.*,
        tp.start_time as period_start,
        tp.end_time as period_end,
        -- Convert notification time to UTC for 12/18
        (('2025-12-18'::date + us.notification_time_parsed)::timestamp AT TIME ZONE us.timezone AT TIME ZONE 'UTC')::timestamptz as scheduled_utc,
        -- Check if notification_days includes Thursday (case-insensitive)
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM unnest(us.notification_days) AS day_name 
                WHERE LOWER(TRIM(day_name)) = 'thursday'
            ) THEN true
            ELSE false
        END as should_run_today
    FROM user_schedules us
    CROSS JOIN today_period tp
)
SELECT 
    st.user_id,
    st.notification_email,
    st.notification_days,
    st.notification_time,
    st.timezone,
    st.last_prompt_sent,
    st.total_prompts_sent_count,
    st.scheduled_utc,
    st.should_run_today,
    CASE 
        WHEN st.should_run_today AND st.scheduled_utc >= st.period_start AND st.scheduled_utc <= st.period_end THEN 'Should have run today'
        ELSE 'Not scheduled for today'
    END as scheduled_today,
    CASE 
        WHEN st.should_run_today AND st.scheduled_utc >= st.period_start AND st.scheduled_utc <= st.period_end THEN
            CASE 
                WHEN st.last_prompt_sent IS NULL THEN '❌ Never received prompts - definitely missed'
                WHEN st.last_prompt_sent < st.period_start THEN '❌ Last prompt before today - missed'
                WHEN st.last_prompt_sent >= st.period_start AND st.last_prompt_sent <= st.period_end THEN '✅ Received prompt today (manual run)'
                ELSE '❌ Missed scheduled prompt today'
            END
        ELSE 'Not affected'
    END as status
FROM scheduled_times st
WHERE (
    st.should_run_today 
    AND st.scheduled_utc >= st.period_start 
    AND st.scheduled_utc <= st.period_end
)
-- Exclude users who received ANY prompt today (even if outside the 2-hour window)
-- This accounts for manual runs that happened at different times
AND NOT (
    st.last_prompt_sent IS NOT NULL
    AND st.last_prompt_sent >= st.period_start
    AND st.last_prompt_sent <= st.period_end
)
ORDER BY st.scheduled_utc ASC;
