-- Find users who should have received prompts during the downtime period
-- Downtime: 8pm CST on 12/17 to 8am CST on 12/18
-- In UTC: 02:00 UTC on 12/18 to 14:00 UTC on 12/18
-- Run this in Supabase Dashboard → SQL Editor

WITH downtime_period AS (
    SELECT 
        '2025-12-18 02:00:00+00'::timestamptz as start_time,  -- 8pm CST on 12/17
        '2025-12-18 14:00:00+00'::timestamptz as end_time     -- 8am CST on 12/18
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
        -- Get day names for 12/17 (Wednesday) and 12/18 (Thursday)
        'wednesday' as day_17,
        'thursday' as day_18
    FROM user_preferences up
    LEFT JOIN prompt_history ph ON up.user_id = ph.user_id
    CROSS JOIN downtime_period dp
    WHERE up.notification_email IS NOT NULL
      AND up.notification_days IS NOT NULL
      AND array_length(up.notification_days, 1) > 0
    GROUP BY up.user_id, up.notification_email, up.notification_days, up.notification_time, up.timezone, up.total_prompts_sent_count
),
scheduled_times AS (
    SELECT 
        us.*,
        dp.start_time as downtime_start,
        dp.end_time as downtime_end,
        -- Convert notification time to UTC for 12/17
        -- Combine date and parsed time, then convert from user's timezone to UTC
        (('2025-12-17'::date + us.notification_time_parsed)::timestamp AT TIME ZONE us.timezone AT TIME ZONE 'UTC')::timestamptz as scheduled_utc_17,
        -- Convert notification time to UTC for 12/18
        (('2025-12-18'::date + us.notification_time_parsed)::timestamp AT TIME ZONE us.timezone AT TIME ZONE 'UTC')::timestamptz as scheduled_utc_18,
        -- Check if notification_days includes the day (case-insensitive)
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM unnest(us.notification_days) AS day_name 
                WHERE LOWER(TRIM(day_name)) = 'wednesday'
            ) THEN true
            ELSE false
        END as should_run_17,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM unnest(us.notification_days) AS day_name 
                WHERE LOWER(TRIM(day_name)) = 'thursday'
            ) THEN true
            ELSE false
        END as should_run_18
    FROM user_schedules us
    CROSS JOIN downtime_period dp
)
SELECT 
    st.user_id,
    st.notification_email,
    st.notification_days,
    st.notification_time,
    st.timezone,
    st.last_prompt_sent,
    st.total_prompts_sent_count,
    st.scheduled_utc_17,
    st.scheduled_utc_18,
    st.should_run_17,
    st.should_run_18,
    CASE 
        WHEN st.should_run_17 AND st.scheduled_utc_17 >= st.downtime_start AND st.scheduled_utc_17 <= st.downtime_end THEN 'Should have run on 12/17'
        WHEN st.should_run_18 AND st.scheduled_utc_18 >= st.downtime_start AND st.scheduled_utc_18 <= st.downtime_end THEN 'Should have run on 12/18'
        ELSE 'Not scheduled during downtime'
    END as scheduled_during_downtime,
    CASE 
        WHEN (st.should_run_17 AND st.scheduled_utc_17 >= st.downtime_start AND st.scheduled_utc_17 <= st.downtime_end)
          OR (st.should_run_18 AND st.scheduled_utc_18 >= st.downtime_start AND st.scheduled_utc_18 <= st.downtime_end) THEN
            CASE 
                WHEN st.last_prompt_sent IS NULL THEN '❌ Never received prompts - definitely missed'
                WHEN st.last_prompt_sent < st.downtime_start THEN '❌ Last prompt before downtime - likely missed'
                ELSE 
                    -- Check if they received a prompt close to their scheduled time (within 2 hours)
                    -- This accounts for prompts sent slightly early/late when cron job resumed
                    CASE 
                        WHEN st.last_prompt_sent >= COALESCE(
                            CASE WHEN st.should_run_17 AND st.scheduled_utc_17 >= st.downtime_start AND st.scheduled_utc_17 <= st.downtime_end THEN st.scheduled_utc_17 - INTERVAL '2 hours' END,
                            CASE WHEN st.should_run_18 AND st.scheduled_utc_18 >= st.downtime_start AND st.scheduled_utc_18 <= st.downtime_end THEN st.scheduled_utc_18 - INTERVAL '2 hours' END
                        ) AND st.last_prompt_sent <= COALESCE(
                            CASE WHEN st.should_run_17 AND st.scheduled_utc_17 >= st.downtime_start AND st.scheduled_utc_17 <= st.downtime_end THEN st.scheduled_utc_17 + INTERVAL '2 hours' END,
                            CASE WHEN st.should_run_18 AND st.scheduled_utc_18 >= st.downtime_start AND st.scheduled_utc_18 <= st.downtime_end THEN st.scheduled_utc_18 + INTERVAL '2 hours' END
                        ) THEN '✅ Received prompt (within 2 hours of scheduled time)'
                        ELSE '❌ Missed scheduled prompt during downtime'
                    END
            END
        ELSE 'Not affected'
    END as status
FROM scheduled_times st
WHERE (
    (st.should_run_17 AND st.scheduled_utc_17 >= st.downtime_start AND st.scheduled_utc_17 <= st.downtime_end)
    OR (st.should_run_18 AND st.scheduled_utc_18 >= st.downtime_start AND st.scheduled_utc_18 <= st.downtime_end)
)
-- Exclude users who actually received prompts within 2 hours of their scheduled time
AND NOT (
    st.last_prompt_sent IS NOT NULL
    AND st.last_prompt_sent >= COALESCE(
        CASE WHEN st.should_run_17 AND st.scheduled_utc_17 >= st.downtime_start AND st.scheduled_utc_17 <= st.downtime_end THEN st.scheduled_utc_17 - INTERVAL '2 hours' END,
        CASE WHEN st.should_run_18 AND st.scheduled_utc_18 >= st.downtime_start AND st.scheduled_utc_18 <= st.downtime_end THEN st.scheduled_utc_18 - INTERVAL '2 hours' END
    )
    AND st.last_prompt_sent <= COALESCE(
        CASE WHEN st.should_run_17 AND st.scheduled_utc_17 >= st.downtime_start AND st.scheduled_utc_17 <= st.downtime_end THEN st.scheduled_utc_17 + INTERVAL '2 hours' END,
        CASE WHEN st.should_run_18 AND st.scheduled_utc_18 >= st.downtime_start AND st.scheduled_utc_18 <= st.downtime_end THEN st.scheduled_utc_18 + INTERVAL '2 hours' END
    )
)
ORDER BY 
    CASE 
        WHEN st.should_run_17 AND st.scheduled_utc_17 >= st.downtime_start AND st.scheduled_utc_17 <= st.downtime_end THEN st.scheduled_utc_17
        ELSE st.scheduled_utc_18
    END ASC;

