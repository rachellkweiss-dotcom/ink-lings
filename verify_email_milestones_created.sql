-- Verify email_milestones table was created successfully
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Check if table exists
SELECT 
    'email_milestones table exists' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_milestones') 
        THEN '✅ Yes'
        ELSE '❌ No'
    END as status;

-- 2. Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'email_milestones'
ORDER BY ordinal_position;

-- 3. Count records (should match number of users)
SELECT 
    'Total records in email_milestones' as metric,
    COUNT(*) as count
FROM email_milestones;

-- 4. Check if policy exists
SELECT 
    'RLS Policy exists' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'email_milestones' 
            AND policyname = 'Service role can manage email milestones'
        )
        THEN '✅ Yes'
        ELSE '❌ No'
    END as status;

-- 5. Check if trigger exists
SELECT 
    'Trigger exists' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_trigger 
            WHERE tgname = 'trigger_update_email_milestones_updated_at'
        )
        THEN '✅ Yes'
        ELSE '❌ No'
    END as status;

