-- Migration: Add gratitude enrollment token columns to user_preferences
-- These columns store a unique token and expiration for email-based enrollment

-- Add gratitude_2026_token column (nullable, stores UUID token)
ALTER TABLE "public"."user_preferences" 
ADD COLUMN IF NOT EXISTS "gratitude_2026_token" TEXT;

-- Add gratitude_2026_expires column (nullable, stores expiration timestamp)
ALTER TABLE "public"."user_preferences" 
ADD COLUMN IF NOT EXISTS "gratitude_2026_expires" TIMESTAMP WITH TIME ZONE;

-- Create index on token for fast lookups
CREATE INDEX IF NOT EXISTS "idx_user_preferences_gratitude_2026_token" 
ON "public"."user_preferences"("gratitude_2026_token") 
WHERE "gratitude_2026_token" IS NOT NULL;

-- Add comments to document the columns
COMMENT ON COLUMN "public"."user_preferences"."gratitude_2026_token" IS 'Unique token for email-based enrollment in 2026 Gratitude Challenge. Generated when sending enrollment email.';
COMMENT ON COLUMN "public"."user_preferences"."gratitude_2026_expires" IS 'Expiration timestamp for the gratitude enrollment token. Tokens expire after 30 days.';

