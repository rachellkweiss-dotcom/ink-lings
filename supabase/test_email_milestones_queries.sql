-- Test queries for email milestone system
-- Run these to see what data will be processed by the edge functions

-- ============================================
-- TEST 1: Set Preferences Email (signup>2days, no user_preferences)
-- ============================================
SELECT 
    au.id as user_id,
    au.email,
    au.created_at as user_signup_date,
    (NOW() - au.created_at) as days_since_signup,
    em.set_preferences as email_sent_date
FROM auth.users au
LEFT JOIN "public"."user_preferences" up ON au.id = up.user_id
LEFT JOIN "public"."email_milestones" em ON au.id = em.user_id
WHERE up.user_id IS NULL  -- No user_preferences row (never completed onboarding)
AND au.created_at < NOW() - INTERVAL '2 days'
AND (em.set_preferences IS NULL OR em.user_id IS NULL)
ORDER BY au.created_at DESC;

-- ============================================
-- TEST 2: Alt Notifications Email (count=10)
-- ============================================
SELECT 
    up.user_id,
    up.notification_email,
    up.total_prompts_sent_count,
    em.alt_notifications as email_sent_date
FROM "public"."user_preferences" up
LEFT JOIN "public"."email_milestones" em ON up.user_id = em.user_id
WHERE up.total_prompts_sent_count = 10
AND (em.alt_notifications IS NULL OR em.user_id IS NULL)
ORDER BY up.total_prompts_sent_count DESC;

-- ============================================
-- TEST 3: Support Inklings Email (count=20)
-- ============================================
SELECT 
    up.user_id,
    up.notification_email,
    up.total_prompts_sent_count,
    em.support_inklings as email_sent_date
FROM "public"."user_preferences" up
LEFT JOIN "public"."email_milestones" em ON up.user_id = em.user_id
WHERE up.total_prompts_sent_count = 20
AND (em.support_inklings IS NULL OR em.user_id IS NULL)
ORDER BY up.total_prompts_sent_count DESC;

-- ============================================
-- TEST 4: Current Email Milestones Status
-- ============================================
SELECT 
    au.id as user_id,
    COALESCE(up.notification_email, au.email) as email,
    COALESCE(up.total_prompts_sent_count, 0) as total_prompts_sent_count,
    em.set_preferences,
    em.alt_notifications,
    em.support_inklings,
    CASE 
        WHEN up.user_id IS NULL AND au.created_at < NOW() - INTERVAL '2 days' THEN 'NEEDS_SET_PREFERENCES'
        WHEN up.total_prompts_sent_count = 10 THEN 'NEEDS_ALT_NOTIFICATIONS'
        WHEN up.total_prompts_sent_count = 20 THEN 'NEEDS_SUPPORT'
        ELSE 'NO_MILESTONE'
    END as current_milestone
FROM auth.users au
LEFT JOIN "public"."user_preferences" up ON au.id = up.user_id
LEFT JOIN "public"."email_milestones" em ON au.id = em.user_id
ORDER BY COALESCE(up.total_prompts_sent_count, 0) DESC, au.created_at DESC;

-- ============================================
-- TEST 5: Count Summary
-- ============================================
SELECT 
    'Total Auth Users' as metric,
    COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
    'Users with user_preferences' as metric,
    COUNT(*) as count
FROM "public"."user_preferences"
UNION ALL
SELECT 
    'Users without user_preferences' as metric,
    COUNT(*) as count
FROM auth.users au
LEFT JOIN "public"."user_preferences" up ON au.id = up.user_id
WHERE up.user_id IS NULL
UNION ALL
SELECT 
    'Users with 10 prompts' as metric,
    COUNT(*) as count
FROM "public"."user_preferences"
WHERE total_prompts_sent_count = 10
UNION ALL
SELECT 
    'Users with 20 prompts' as metric,
    COUNT(*) as count
FROM "public"."user_preferences"
WHERE total_prompts_sent_count = 20
UNION ALL
SELECT 
    'Users needing set_preferences email' as metric,
    COUNT(*) as count
FROM auth.users au
LEFT JOIN "public"."user_preferences" up ON au.id = up.user_id
LEFT JOIN "public"."email_milestones" em ON au.id = em.user_id
WHERE up.user_id IS NULL  -- No user_preferences row
AND au.created_at < NOW() - INTERVAL '2 days'
AND (em.set_preferences IS NULL OR em.user_id IS NULL);
