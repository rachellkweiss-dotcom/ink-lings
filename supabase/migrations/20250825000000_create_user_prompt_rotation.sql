-- Create user_prompt_rotation table for simplified prompt management
-- Handle existing table that may have 'uid' column instead of 'user_id'
DO $$
BEGIN
    -- Create table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_prompt_rotation') THEN
        CREATE TABLE "public"."user_prompt_rotation" (
          "id" uuid NOT NULL DEFAULT gen_random_uuid(),
          "user_id" uuid NOT NULL,
          "next_category_to_send" text NOT NULL,
          "current_prompt_count" integer DEFAULT 1,
          "last_updated" timestamp with time zone DEFAULT now(),
          "created_at" timestamp with time zone DEFAULT now(),
          PRIMARY KEY ("id")
        );
    END IF;
    
    -- If table exists with 'uid' column, rename it to 'user_id'
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_prompt_rotation' 
        AND column_name = 'uid'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_prompt_rotation' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE "public"."user_prompt_rotation" RENAME COLUMN "uid" TO "user_id";
    END IF;
    
    -- Add user_id column if it doesn't exist (and uid doesn't exist either)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_prompt_rotation' 
        AND column_name IN ('user_id', 'uid')
    ) THEN
        ALTER TABLE "public"."user_prompt_rotation" ADD COLUMN "user_id" uuid;
    END IF;
END $$;

-- Create unique constraint on user_id (one rotation record per user)
-- Drop old index if it exists on 'uid'
DROP INDEX IF EXISTS "user_prompt_rotation_uid_key";
CREATE UNIQUE INDEX IF NOT EXISTS "user_prompt_rotation_user_id_key" ON "public"."user_prompt_rotation" USING btree ("user_id");

-- Add foreign key constraint (drop old one first if exists)
ALTER TABLE "public"."user_prompt_rotation" 
DROP CONSTRAINT IF EXISTS "user_prompt_rotation_uid_fkey";

ALTER TABLE "public"."user_prompt_rotation" 
ADD CONSTRAINT "user_prompt_rotation_user_id_fkey" 
FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE "public"."user_prompt_rotation" ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON "public"."user_prompt_rotation" TO "authenticated";
GRANT ALL ON "public"."user_prompt_rotation" TO "service_role";
GRANT ALL ON "public"."user_prompt_rotation" TO "anon";
