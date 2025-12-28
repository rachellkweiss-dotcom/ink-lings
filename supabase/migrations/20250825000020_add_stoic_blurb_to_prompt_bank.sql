-- Migration: Add stoic_blurb column to prompt_bank table
-- This column explains why the prompt relates to gratitude

ALTER TABLE "public"."prompt_bank"
ADD COLUMN IF NOT EXISTS "stoic_blurb" TEXT;

COMMENT ON COLUMN "public"."prompt_bank"."stoic_blurb" IS 'Explanation of why this prompt relates to gratitude and stoic philosophy';

