-- Find users who would receive the 15-prompt milestone email
-- This matches the logic in send-15-prompt-milestone Edge Function
-- Run this in Supabase Dashboard → SQL Editor

-- Show ALL users with 15 prompts and their email status
SELECT 
  up.user_id,
  up.notification_email,
  up.total_prompts_sent_count,
  em.alt_notifications as already_received_timestamp,
  CASE 
    WHEN em.alt_notifications IS NULL THEN '✅ Will receive email'
    ELSE '❌ Already received - will be skipped'
  END as status
FROM user_preferences up
LEFT JOIN email_milestones em ON up.user_id = em.user_id
WHERE up.total_prompts_sent_count = 15
ORDER BY 
  CASE WHEN em.alt_notifications IS NULL THEN 0 ELSE 1 END,  -- Show those who will receive first
  up.notification_email;

-- Also show ALL users with 15 prompts (including those who already received it)
SELECT 
  up.user_id,
  up.notification_email,
  up.total_prompts_sent_count,
  em.alt_notifications as already_received_timestamp,
  CASE 
    WHEN em.alt_notifications IS NULL THEN '✅ Will receive email'
    ELSE '❌ Already received - will be skipped'
  END as status
FROM user_preferences up
LEFT JOIN email_milestones em ON up.user_id = em.user_id
WHERE up.total_prompts_sent_count = 15
ORDER BY 
  CASE WHEN em.alt_notifications IS NULL THEN 0 ELSE 1 END,  -- Show those who will receive first
  up.notification_email;

-- Summary count
SELECT 
  COUNT(*) as total_users_with_15_prompts,
  COUNT(CASE WHEN em.alt_notifications IS NULL THEN 1 END) as will_receive_email,
  COUNT(CASE WHEN em.alt_notifications IS NOT NULL THEN 1 END) as already_received
FROM user_preferences up
LEFT JOIN email_milestones em ON up.user_id = em.user_id
WHERE up.total_prompts_sent_count = 15;

