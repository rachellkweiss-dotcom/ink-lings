-- Count how many prompts each user should have received between
-- Start: 2025-12-27 18:55:03.576+00 UTC
-- End: 2025-12-29 21:14:03.576+00 CST (which is 2025-12-30 03:14:03.576+00 UTC)
-- Run this in Supabase Dashboard → SQL Editor

WITH time_range AS (
  SELECT 
    '2025-12-27 18:55:03.576+00'::timestamptz as start_time,
    '2025-12-29 21:14:03.576-06:00'::timestamptz as end_time  -- CST is UTC-6
),
-- Generate all dates in the range
date_series AS (
  SELECT generate_series(
    (SELECT DATE(start_time) FROM time_range),
    (SELECT DATE(end_time) FROM time_range),
    '1 day'::interval
  )::date as check_date
),
-- Get day names for each date
dates_with_days AS (
  SELECT 
    ds.check_date,
    CASE EXTRACT(DOW FROM ds.check_date)
      WHEN 0 THEN 'sunday'
      WHEN 1 THEN 'monday'
      WHEN 2 THEN 'tuesday'
      WHEN 3 THEN 'wednesday'
      WHEN 4 THEN 'thursday'
      WHEN 5 THEN 'friday'
      WHEN 6 THEN 'saturday'
    END as day_name
  FROM date_series ds
),
-- For each user, generate their scheduled prompt times
user_scheduled_times AS (
  SELECT 
    up.user_id,
    up.notification_email,
    up.notification_days,
    up.notification_time_utc,
    dwd.check_date,
    dwd.day_name,
    -- Create the scheduled timestamp by combining date + notification time
    -- Use make_timestamptz to properly construct the timestamp
    make_timestamptz(
      EXTRACT(YEAR FROM dwd.check_date)::int,
      EXTRACT(MONTH FROM dwd.check_date)::int,
      EXTRACT(DAY FROM dwd.check_date)::int,
      EXTRACT(HOUR FROM up.notification_time_utc)::int,
      EXTRACT(MINUTE FROM up.notification_time_utc)::int,
      EXTRACT(SECOND FROM up.notification_time_utc)::numeric,
      'UTC'
    ) as scheduled_time
  FROM user_preferences up
  CROSS JOIN dates_with_days dwd
  CROSS JOIN time_range tr
  WHERE 
    -- User has notification days set
    up.notification_days IS NOT NULL 
    AND up.notification_days != '{}'::text[]
    -- The day matches one of their notification days (case-insensitive)
    AND EXISTS (
      SELECT 1 
      FROM unnest(up.notification_days) AS day_name 
      WHERE LOWER(TRIM(day_name)) = LOWER(TRIM(dwd.day_name))
    )
    -- User has notification time set
    AND up.notification_time_utc IS NOT NULL
    -- Scheduled time is within our time range
    AND make_timestamptz(
      EXTRACT(YEAR FROM dwd.check_date)::int,
      EXTRACT(MONTH FROM dwd.check_date)::int,
      EXTRACT(DAY FROM dwd.check_date)::int,
      EXTRACT(HOUR FROM up.notification_time_utc)::int,
      EXTRACT(MINUTE FROM up.notification_time_utc)::int,
      EXTRACT(SECOND FROM up.notification_time_utc)::numeric,
      'UTC'
    ) >= tr.start_time
    AND make_timestamptz(
      EXTRACT(YEAR FROM dwd.check_date)::int,
      EXTRACT(MONTH FROM dwd.check_date)::int,
      EXTRACT(DAY FROM dwd.check_date)::int,
      EXTRACT(HOUR FROM up.notification_time_utc)::int,
      EXTRACT(MINUTE FROM up.notification_time_utc)::int,
      EXTRACT(SECOND FROM up.notification_time_utc)::numeric,
      'UTC'
    ) <= tr.end_time
),
-- Check which scheduled times actually resulted in emails
scheduled_with_status AS (
  SELECT 
    ust.*,
    -- Check if they received an email at this scheduled time (within 1 hour window)
    CASE 
      WHEN EXISTS (
        SELECT 1 
        FROM prompt_history ph 
        WHERE ph.user_id = ust.user_id 
        AND ph.sent_at >= ust.scheduled_time - INTERVAL '1 hour'
        AND ph.sent_at <= ust.scheduled_time + INTERVAL '1 hour'
      ) THEN true
      ELSE false
    END as received
  FROM user_scheduled_times ust
)
-- Final summary: count expected vs received
SELECT 
  user_id,
  notification_email,
  notification_days,
  notification_time_utc,
  COUNT(*) as prompts_expected,
  COUNT(*) FILTER (WHERE received = true) as prompts_received,
  COUNT(*) FILTER (WHERE received = false) as prompts_missed,
  -- List the scheduled times for reference
  array_agg(scheduled_time ORDER BY scheduled_time) as scheduled_times,
  -- List which ones were received
  array_agg(scheduled_time ORDER BY scheduled_time) FILTER (WHERE received = true) as received_times,
  -- List which ones were missed
  array_agg(scheduled_time ORDER BY scheduled_time) FILTER (WHERE received = false) as missed_times,
  -- Last prompt ever (for context)
  (SELECT MAX(ph.sent_at) FROM prompt_history ph WHERE ph.user_id = sws.user_id) as last_prompt_ever
FROM scheduled_with_status sws
GROUP BY user_id, notification_email, notification_days, notification_time_utc
ORDER BY prompts_missed DESC, notification_email;

