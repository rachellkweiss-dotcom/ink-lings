-- Test script for prompt count tracking functionality
-- Run this after applying the migration to verify everything works

-- Test 1: Check if the column was added
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_preferences' 
AND column_name = 'total_prompts_sent_count';

-- Test 2: Check if the function exists
SELECT 
    routine_name, 
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'update_user_prompt_count';

-- Test 3: Check if the trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_update_prompt_count';

-- Test 4: Show current prompt counts for all users
SELECT 
    up.user_id,
    up.notification_email,
    up.total_prompts_sent_count,
    COUNT(ph.id) as actual_prompt_count
FROM "public"."user_preferences" up
LEFT JOIN "public"."prompt_history" ph ON up.user_id = ph.user_id
GROUP BY up.user_id, up.notification_email, up.total_prompts_sent_count
ORDER BY up.total_prompts_sent_count DESC;

-- Test 5: Manual test - Insert a test prompt and verify count increases
-- (Uncomment and run this with a valid user_id to test the trigger)
/*
INSERT INTO "public"."prompt_history" (
    user_id, 
    category_id, 
    prompt_text, 
    prompt_number, 
    email_sent_to
) VALUES (
    'your-test-user-id-here',  -- Replace with actual user ID
    'test-category',
    'Test prompt for counting',
    999,
    'test@example.com'
);

-- Check if count increased
SELECT 
    user_id,
    notification_email,
    total_prompts_sent_count
FROM "public"."user_preferences" 
WHERE user_id = 'your-test-user-id-here';
*/




