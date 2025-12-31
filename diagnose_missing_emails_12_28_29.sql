-- Diagnose missing emails on 12/28 and 12/29
-- Run this in Supabase Dashboard → SQL Editor

-- Query 1: Find all users who should have received emails on 12/28 and 12/29
-- This checks if their notification day matches and what their notification hour is
WITH date_range AS (
  SELECT 
    '2025-12-28'::date as check_date,
    'saturday'::text as day_name
  UNION ALL
  SELECT 
    '2025-12-29'::date as check_date,
    'sunday'::text as day_name
),
users_who_should_receive AS (
  SELECT 
    up.user_id,
    up.notification_email,
    up.notification_days,
    up.notification_time_utc,
    up.timezone,
    dr.check_date,
    dr.day_name,
    EXTRACT(HOUR FROM up.notification_time_utc)::int as notification_hour_utc
  FROM user_preferences up
  CROSS JOIN date_range dr
  WHERE 
    -- User has notification days set
    up.notification_days IS NOT NULL 
    AND up.notification_days != '{}'::text[]
    -- The day matches one of their notification days (case-insensitive)
    AND EXISTS (
      SELECT 1 
      FROM unnest(up.notification_days) AS day_name 
      WHERE LOWER(TRIM(day_name)) = LOWER(TRIM(dr.day_name))
    )
    -- User has notification time set
    AND up.notification_time_utc IS NOT NULL
)
SELECT 
  uwsr.user_id,
  uwsr.notification_email,
  uwsr.check_date,
  uwsr.day_name,
  uwsr.notification_hour_utc,
  -- Check if they actually received an email that day
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM prompt_history ph 
      WHERE ph.user_id = uwsr.user_id 
      AND ph.sent_at::date = uwsr.check_date
    ) THEN '✅ Received'
    ELSE '❌ MISSING'
  END as email_status,
  -- Get the actual sent_at time if they received one
  (
    SELECT ph.sent_at 
    FROM prompt_history ph 
    WHERE ph.user_id = uwsr.user_id 
    AND ph.sent_at::date = uwsr.check_date
    ORDER BY ph.sent_at DESC
    LIMIT 1
  ) as actual_sent_time,
  -- Get their last prompt sent (any day)
  (
    SELECT MAX(ph.sent_at)
    FROM prompt_history ph 
    WHERE ph.user_id = uwsr.user_id
  ) as last_prompt_ever
FROM users_who_should_receive uwsr
ORDER BY 
  uwsr.check_date,
  uwsr.notification_hour_utc,
  uwsr.notification_email;

-- Query 2: Summary - count of missing emails per day
WITH date_range AS (
  SELECT '2025-12-28'::date as check_date, 'saturday'::text as day_name
  UNION ALL
  SELECT '2025-12-29'::date as check_date, 'sunday'::text as day_name
),
users_who_should_receive AS (
  SELECT 
    up.user_id,
    dr.check_date,
    dr.day_name
  FROM user_preferences up
  CROSS JOIN date_range dr
  WHERE 
    up.notification_days IS NOT NULL 
    AND up.notification_days != '{}'::text[]
    AND EXISTS (
      SELECT 1 
      FROM unnest(up.notification_days) AS day_name 
      WHERE LOWER(TRIM(day_name)) = LOWER(TRIM(dr.day_name))
    )
    AND up.notification_time_utc IS NOT NULL
)
SELECT 
  uwsr.check_date,
  uwsr.day_name,
  COUNT(*) as users_who_should_receive,
  COUNT(CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM prompt_history ph 
      WHERE ph.user_id = uwsr.user_id 
      AND ph.sent_at::date = uwsr.check_date
    ) THEN 1 
  END) as users_who_received,
  COUNT(*) - COUNT(CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM prompt_history ph 
      WHERE ph.user_id = uwsr.user_id 
      AND ph.sent_at::date = uwsr.check_date
    ) THEN 1 
  END) as missing_emails
FROM users_who_should_receive uwsr
GROUP BY uwsr.check_date, uwsr.day_name
ORDER BY uwsr.check_date;

-- Query 3: Check what emails were actually sent on 12/28 and 12/29
SELECT 
  ph.user_id,
  up.notification_email,
  ph.sent_at,
  EXTRACT(HOUR FROM ph.sent_at)::int as sent_hour_utc,
  ph.category_id,
  ph.prompt_text
FROM prompt_history ph
JOIN user_preferences up ON ph.user_id = up.user_id
WHERE ph.sent_at::date IN ('2025-12-28', '2025-12-29')
ORDER BY ph.sent_at;

-- Query 4: Find users with specific notification hours to see if they received emails
-- (This helps identify if the cron ran at the right hours)
SELECT 
  up.user_id,
  up.notification_email,
  EXTRACT(HOUR FROM up.notification_time_utc)::int as notification_hour_utc,
  up.notification_days,
  -- Check 12/28
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM prompt_history ph 
      WHERE ph.user_id = up.user_id 
      AND ph.sent_at::date = '2025-12-28'
    ) THEN '✅'
    ELSE '❌'
  END as received_12_28,
  -- Check 12/29
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM prompt_history ph 
      WHERE ph.user_id = up.user_id 
      AND ph.sent_at::date = '2025-12-29'
    ) THEN '✅'
    ELSE '❌'
  END as received_12_29,
  -- Last prompt ever
  (SELECT MAX(ph.sent_at) FROM prompt_history ph WHERE ph.user_id = up.user_id) as last_prompt
FROM user_preferences up
WHERE 
  up.notification_days IS NOT NULL 
  AND up.notification_days != '{}'::text[]
  AND up.notification_time_utc IS NOT NULL
ORDER BY 
  EXTRACT(HOUR FROM up.notification_time_utc)::int,
  up.notification_email;

