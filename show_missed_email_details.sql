-- Show detailed information about users who missed emails
-- Run this in Supabase Dashboard → SQL Editor

-- ============================================================================
-- 1. DETAILED: Users who missed SUPPORT EMAILS
-- ============================================================================
SELECT 
    up.user_id,
    up.notification_email,
    up.total_prompts_sent_count as current_prompt_count,
    em.support_inklings as last_support_email_sent,
    CASE 
        WHEN up.total_prompts_sent_count = 30 THEN '30 prompts milestone'
        WHEN up.total_prompts_sent_count = 80 THEN '80 prompts milestone'
        WHEN up.total_prompts_sent_count = 130 THEN '130 prompts milestone'
        WHEN up.total_prompts_sent_count = 200 THEN '200 prompts milestone'
    END as milestone_reached,
    CASE 
        WHEN em.support_inklings IS NULL THEN '❌ Never received support email'
        WHEN em.support_inklings < NOW() - INTERVAL '10 days' THEN '⚠️ Eligible for another email (>10 days since last)'
        ELSE '✅ Recently sent'
    END as status,
    CASE 
        WHEN em.support_inklings IS NULL THEN 'Should send support email now'
        WHEN em.support_inklings < NOW() - INTERVAL '10 days' THEN 'Eligible for follow-up email'
        ELSE 'No action needed'
    END as action_needed
FROM user_preferences up
LEFT JOIN email_milestones em ON up.user_id = em.user_id
WHERE up.total_prompts_sent_count IN (30, 80, 130, 200)  -- Support milestones
  AND (
    em.support_inklings IS NULL  -- Never received email
    OR em.support_inklings < NOW() - INTERVAL '10 days'  -- >10 days since last email
  )
ORDER BY up.total_prompts_sent_count DESC, up.user_id;

-- ============================================================================
-- 2. DETAILED: Users who missed 15-PROMPT MILESTONE EMAILS
-- ============================================================================
SELECT 
    up.user_id,
    up.notification_email,
    up.total_prompts_sent_count as current_prompt_count,
    em.alt_notifications as milestone_email_sent_at,
    CASE 
        WHEN up.total_prompts_sent_count = 15 AND em.alt_notifications IS NULL THEN '❌ At exactly 15 prompts, never received email'
        WHEN up.total_prompts_sent_count > 15 AND em.alt_notifications IS NULL THEN '⚠️ Passed 15 prompts, never received email'
        ELSE '✅ Already sent'
    END as status,
    CASE 
        WHEN em.alt_notifications IS NULL THEN 'Should have sent at 15 prompts - may need manual send'
        ELSE 'No action needed'
    END as action_needed
FROM user_preferences up
LEFT JOIN email_milestones em ON up.user_id = em.user_id
WHERE up.total_prompts_sent_count >= 15  -- Reached or passed 15 prompts
  AND em.alt_notifications IS NULL  -- Never received the milestone email
ORDER BY up.total_prompts_sent_count DESC, up.user_id;

-- ============================================================================
-- 3. MISSED PROMPTS: Check prompt_history for gaps
-- ============================================================================
-- Since next_prompt_utc doesn't exist, we'll check prompt_history
-- to see if there are users who should have received prompts but didn't
-- This is an approximation based on their schedule

-- Find users with preferences set up but no recent prompts
SELECT 
    'Potential Missed Prompts' as email_type,
    up.user_id,
    up.notification_email,
    up.notification_days,
    up.notification_time,
    up.timezone,
    MAX(ph.sent_at) as last_prompt_sent,
    COUNT(ph.id) as total_prompts_in_history,
    up.total_prompts_sent_count as total_prompts_count,
    CASE 
        WHEN MAX(ph.sent_at) IS NULL THEN '❌ Never received any prompts'
        WHEN MAX(ph.sent_at) < NOW() - INTERVAL '48 hours' THEN '⚠️ No prompts in last 48 hours'
        WHEN MAX(ph.sent_at) < NOW() - INTERVAL '24 hours' THEN '⚠️ No prompts in last 24 hours'
        ELSE '✅ Recent prompts sent'
    END as status
FROM user_preferences up
LEFT JOIN prompt_history ph ON up.user_id = ph.user_id
WHERE up.notification_email IS NOT NULL
  AND up.notification_days IS NOT NULL
  AND array_length(up.notification_days, 1) > 0  -- Has notification days set
GROUP BY up.user_id, up.notification_email, up.notification_days, up.notification_time, up.timezone, up.total_prompts_sent_count
HAVING (
    MAX(ph.sent_at) IS NULL  -- Never received prompts
    OR MAX(ph.sent_at) < NOW() - INTERVAL '24 hours'  -- No prompts in last 24 hours
)
ORDER BY MAX(ph.sent_at) ASC NULLS FIRST;


