-- Rollback migration: Remove prompt count tracking from user_preferences
-- This migration removes the automatic counting functionality

-- Step 1: Drop the trigger
DROP TRIGGER IF EXISTS trigger_update_prompt_count ON "public"."prompt_history";

-- Step 2: Drop the function
DROP FUNCTION IF EXISTS update_user_prompt_count();

-- Step 3: Remove the column from user_preferences table
ALTER TABLE "public"."user_preferences" 
DROP COLUMN IF EXISTS "total_prompts_sent_count";




