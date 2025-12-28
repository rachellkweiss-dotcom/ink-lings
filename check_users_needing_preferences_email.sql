-- Check if there are users who should receive the set_preferences email
-- This matches the logic in the check-set-preferences function
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Count total auth users
SELECT 
    'Total Auth Users' as metric,
    COUNT(*) as count
FROM auth.users;

-- 2. Count users with preferences (completed onboarding)
SELECT 
    'Users with Preferences' as metric,
    COUNT(*) as count
FROM user_preferences;

-- 3. Count users without preferences (need onboarding)
-- Note: This is an approximation since we can't directly join auth.users
-- The function uses admin.listUsers() which we can't replicate here
SELECT 
    'Users without Preferences (approx)' as metric,
    (SELECT COUNT(*) FROM auth.users) - (SELECT COUNT(*) FROM user_preferences) as count;

-- 4. Check if email_milestones table exists
SELECT 
    'email_milestones table exists' as metric,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_milestones') 
        THEN '✅ Yes'
        ELSE '❌ No (migration may not have run)'
    END as status;

-- 5. Check email_milestones to see who has already received the email (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_milestones') THEN
        RAISE NOTICE 'Users who received set_preferences email: %', (SELECT COUNT(*) FROM email_milestones WHERE set_preferences IS NOT NULL);
    ELSE
        RAISE NOTICE 'email_milestones table does not exist';
    END IF;
END $$;

-- 6. Check recent signups (last 7 days) - these might be eligible soon
SELECT 
    'Recent signups (last 7 days)' as metric,
    COUNT(*) as count
FROM auth.users
WHERE created_at >= NOW() - INTERVAL '7 days';

-- 7. Check signups older than 2 days (eligible for email)
SELECT 
    'Signups older than 2 days' as metric,
    COUNT(*) as count
FROM auth.users
WHERE created_at < NOW() - INTERVAL '2 days';

