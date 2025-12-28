-- Check migration history to see if email_milestones table was deleted
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Check if email_milestones table exists
SELECT 
    'email_milestones table exists' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_milestones') 
        THEN '✅ Yes'
        ELSE '❌ No - TABLE IS MISSING!'
    END as status;

-- 2. Check migration history (if available in Supabase)
-- Note: Supabase stores migration history in supabase_migrations.schema_migrations
SELECT 
    version,
    name,
    inserted_at
FROM supabase_migrations.schema_migrations
WHERE name LIKE '%email_milestones%'
ORDER BY inserted_at DESC;

-- 3. Check all migrations that mention email_milestones
SELECT 
    version,
    name,
    inserted_at
FROM supabase_migrations.schema_migrations
WHERE name LIKE '%milestone%' OR name LIKE '%rollback%'
ORDER BY inserted_at DESC
LIMIT 20;

-- 4. List all recent migrations
SELECT 
    version,
    name,
    inserted_at
FROM supabase_migrations.schema_migrations
ORDER BY inserted_at DESC
LIMIT 30;

