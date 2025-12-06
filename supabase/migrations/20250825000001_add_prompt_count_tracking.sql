-- Migration: Add prompt count tracking to user_preferences
-- This migration adds automatic counting of prompts sent to each user

-- Step 1: Add the total_prompts_sent_count column to user_preferences table
ALTER TABLE "public"."user_preferences" 
ADD COLUMN "total_prompts_sent_count" integer DEFAULT 0;

-- Step 2: Create a function to update the prompt count
CREATE OR REPLACE FUNCTION update_user_prompt_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the total_prompts_sent_count in user_preferences
    -- Increment by 1 for each new prompt_history row
    UPDATE "public"."user_preferences"
    SET 
        "total_prompts_sent_count" = "total_prompts_sent_count" + 1,
        "updated_at" = NOW()
    WHERE "user_id" = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create a trigger that calls the function when a new row is inserted into prompt_history
CREATE TRIGGER trigger_update_prompt_count
    AFTER INSERT ON "public"."prompt_history"
    FOR EACH ROW
    EXECUTE FUNCTION update_user_prompt_count();

-- Step 4: Initialize the count for existing users based on their current prompt_history
-- This will set the total_prompts_sent_count to the actual count of prompts in prompt_history
UPDATE "public"."user_preferences" up
SET "total_prompts_sent_count" = (
    SELECT COALESCE(COUNT(*), 0)
    FROM "public"."prompt_history" ph
    WHERE ph.user_id = up.user_id
);

-- Step 5: Grant necessary permissions for the function and trigger
GRANT EXECUTE ON FUNCTION update_user_prompt_count() TO "authenticated";
GRANT EXECUTE ON FUNCTION update_user_prompt_count() TO "service_role";
GRANT EXECUTE ON FUNCTION update_user_prompt_count() TO "anon";

-- Add comment to document the new column
COMMENT ON COLUMN "public"."user_preferences"."total_prompts_sent_count" IS 'Total number of prompts sent to this user, automatically updated via trigger';




