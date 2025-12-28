-- Migration: Create gratitude_2026_participants table
-- This table tracks users enrolled in the 2026 Gratitude Challenge
-- Gratitude prompts are sent daily at 16:00 UTC (11:00 AM EST) based on day of year (1-365)

-- Create the gratitude_2026_participants table
CREATE TABLE IF NOT EXISTS "public"."gratitude_2026_participants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "enrolled_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "last_prompt_sent" INTEGER, -- Day of year (1-365) of last prompt sent
    "notification_time_utc" TIME WITHOUT TIME ZONE DEFAULT '16:00:00', -- 11:00 AM EST / 12:00 PM EDT
    "timezone" TEXT, -- User's timezone for reference (not used for sending, but stored for context)
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY ("id")
);

-- Create unique constraint on user_id (one enrollment per user)
CREATE UNIQUE INDEX IF NOT EXISTS "gratitude_2026_participants_user_id_key" 
    ON "public"."gratitude_2026_participants" USING btree ("user_id");

-- Create index for active participants (for efficient queries when sending emails)
CREATE INDEX IF NOT EXISTS "idx_gratitude_2026_participants_active" 
    ON "public"."gratitude_2026_participants"("active") 
    WHERE "active" = true;

-- Create index for user_id lookups
CREATE INDEX IF NOT EXISTS "idx_gratitude_2026_participants_user_id" 
    ON "public"."gratitude_2026_participants"("user_id");

-- Enable Row Level Security
ALTER TABLE "public"."gratitude_2026_participants" ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read/update their own enrollment
DROP POLICY IF EXISTS "Users can view their own gratitude enrollment" ON "public"."gratitude_2026_participants";
CREATE POLICY "Users can view their own gratitude enrollment" 
    ON "public"."gratitude_2026_participants"
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own gratitude enrollment" ON "public"."gratitude_2026_participants";
CREATE POLICY "Users can update their own gratitude enrollment" 
    ON "public"."gratitude_2026_participants"
    FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own gratitude enrollment" ON "public"."gratitude_2026_participants";
CREATE POLICY "Users can insert their own gratitude enrollment" 
    ON "public"."gratitude_2026_participants"
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Service role can manage all enrollments (for sending emails)
DROP POLICY IF EXISTS "Service role can manage all gratitude enrollments" ON "public"."gratitude_2026_participants";
CREATE POLICY "Service role can manage all gratitude enrollments" 
    ON "public"."gratitude_2026_participants"
    FOR ALL
    USING (true);

-- Grant necessary permissions
GRANT ALL ON "public"."gratitude_2026_participants" TO "service_role";
GRANT SELECT, INSERT, UPDATE ON "public"."gratitude_2026_participants" TO "authenticated";

-- Add comments to document the table and columns
COMMENT ON TABLE "public"."gratitude_2026_participants" IS 'Tracks users enrolled in the 2026 Gratitude Challenge. Prompts are sent daily at 16:00 UTC based on day of year (1-365).';
COMMENT ON COLUMN "public"."gratitude_2026_participants"."user_id" IS 'Reference to auth.users - unique, one enrollment per user';
COMMENT ON COLUMN "public"."gratitude_2026_participants"."active" IS 'Whether the user is currently enrolled (true) or has deactivated (false)';
COMMENT ON COLUMN "public"."gratitude_2026_participants"."last_prompt_sent" IS 'Day of year (1-365) of the last prompt sent to this user';
COMMENT ON COLUMN "public"."gratitude_2026_participants"."notification_time_utc" IS 'Fixed time for all users: 16:00 UTC (11:00 AM EST / 12:00 PM EDT)';
COMMENT ON COLUMN "public"."gratitude_2026_participants"."timezone" IS 'User timezone stored for reference (not used for sending)';

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_gratitude_2026_participants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_gratitude_2026_participants_updated_at ON "public"."gratitude_2026_participants";
CREATE TRIGGER trigger_update_gratitude_2026_participants_updated_at
    BEFORE UPDATE ON "public"."gratitude_2026_participants"
    FOR EACH ROW
    EXECUTE FUNCTION update_gratitude_2026_participants_updated_at();

