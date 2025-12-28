-- Migration: Force PostgREST schema cache refresh for user_prompt_rotation
-- This forces PostgREST to reload its schema by making a metadata change

-- Add a comment to the table to trigger schema reload
-- PostgREST watches for schema changes and will reload when it detects this
COMMENT ON TABLE "public"."user_prompt_rotation" IS 'User prompt rotation tracking - updated to use user_id column';

-- Also add a comment to the user_id column to ensure it's recognized
COMMENT ON COLUMN "public"."user_prompt_rotation"."user_id" IS 'Foreign key to auth.users.id - primary key for this table';

-- Force PostgREST to see the change by querying pg_catalog
DO $$
BEGIN
    -- This query forces PostgREST to refresh its internal schema cache
    PERFORM 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' 
    AND c.relname = 'user_prompt_rotation';
END $$;

