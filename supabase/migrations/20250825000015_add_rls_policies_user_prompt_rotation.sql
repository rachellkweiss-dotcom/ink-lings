-- Migration: Add RLS policies for user_prompt_rotation table
-- This allows authenticated users to manage their own prompt rotation records

-- Policy: Users can view their own prompt rotation
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_prompt_rotation' 
        AND policyname = 'Users can view their own prompt rotation'
    ) THEN
        CREATE POLICY "Users can view their own prompt rotation" 
            ON "public"."user_prompt_rotation"
            FOR SELECT
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- Policy: Users can insert their own prompt rotation
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_prompt_rotation' 
        AND policyname = 'Users can insert their own prompt rotation'
    ) THEN
        CREATE POLICY "Users can insert their own prompt rotation" 
            ON "public"."user_prompt_rotation"
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Policy: Users can update their own prompt rotation
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_prompt_rotation' 
        AND policyname = 'Users can update their own prompt rotation'
    ) THEN
        CREATE POLICY "Users can update their own prompt rotation" 
            ON "public"."user_prompt_rotation"
            FOR UPDATE
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

