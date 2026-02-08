-- Migration: Create support ticket system tables
-- Provides a Discord-backed support system where users submit tickets via web UI,
-- tickets create Discord threads, and replies are synced back via polling.

-- ============================================================
-- Table: support_tickets
-- ============================================================

CREATE TABLE IF NOT EXISTS "public"."support_tickets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "token" TEXT NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', ''),
    "user_id" UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "ticket_type" TEXT NOT NULL CHECK (ticket_type IN ('help', 'bug', 'account_deletion')),
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    "discord_thread_id" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "resolved_at" TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY ("id")
);

-- Unique index on token (used for URL-based access)
CREATE UNIQUE INDEX IF NOT EXISTS "support_tickets_token_key"
    ON "public"."support_tickets" USING btree ("token");

-- Index for looking up tickets by Discord thread ID (used by poller)
CREATE INDEX IF NOT EXISTS "idx_support_tickets_discord_thread_id"
    ON "public"."support_tickets"("discord_thread_id")
    WHERE "discord_thread_id" IS NOT NULL;

-- Index for querying open/in_progress tickets (used by poller)
CREATE INDEX IF NOT EXISTS "idx_support_tickets_status"
    ON "public"."support_tickets"("status")
    WHERE "status" IN ('open', 'in_progress');

-- Index for user_id lookups
CREATE INDEX IF NOT EXISTS "idx_support_tickets_user_id"
    ON "public"."support_tickets"("user_id")
    WHERE "user_id" IS NOT NULL;

-- ============================================================
-- Table: support_messages
-- ============================================================

CREATE TABLE IF NOT EXISTS "public"."support_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ticket_id" UUID NOT NULL REFERENCES "public"."support_tickets"(id) ON DELETE CASCADE,
    "sender_type" TEXT NOT NULL CHECK (sender_type IN ('user', 'admin', 'bot')),
    "sender_name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "discord_message_id" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY ("id")
);

-- Index for fetching messages by ticket
CREATE INDEX IF NOT EXISTS "idx_support_messages_ticket_id"
    ON "public"."support_messages"("ticket_id");

-- Index for deduplication during Discord polling
CREATE UNIQUE INDEX IF NOT EXISTS "idx_support_messages_discord_message_id"
    ON "public"."support_messages"("discord_message_id")
    WHERE "discord_message_id" IS NOT NULL;

-- ============================================================
-- Triggers: auto-update updated_at on support_tickets
-- ============================================================

CREATE OR REPLACE FUNCTION update_support_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_support_tickets_updated_at ON "public"."support_tickets";
CREATE TRIGGER trigger_update_support_tickets_updated_at
    BEFORE UPDATE ON "public"."support_tickets"
    FOR EACH ROW
    EXECUTE FUNCTION update_support_tickets_updated_at();

-- ============================================================
-- Permissions: Service role access (no RLS - API routes use service role)
-- ============================================================

GRANT ALL ON "public"."support_tickets" TO "service_role";
GRANT ALL ON "public"."support_messages" TO "service_role";

-- ============================================================
-- Comments
-- ============================================================

COMMENT ON TABLE "public"."support_tickets" IS 'Support tickets submitted by users. Each ticket creates a Discord thread for management.';
COMMENT ON COLUMN "public"."support_tickets"."token" IS 'Unique token for URL-based access to the ticket chat page (no auth required)';
COMMENT ON COLUMN "public"."support_tickets"."user_id" IS 'Optional FK to auth.users - null for unauthenticated submissions';
COMMENT ON COLUMN "public"."support_tickets"."ticket_type" IS 'Type of support request: help, bug, or account_deletion';
COMMENT ON COLUMN "public"."support_tickets"."discord_thread_id" IS 'Discord thread ID where this ticket is managed';
COMMENT ON COLUMN "public"."support_tickets"."resolved_at" IS 'Timestamp when the ticket was marked as resolved';

COMMENT ON TABLE "public"."support_messages" IS 'Messages within a support ticket conversation, synced between web UI and Discord.';
COMMENT ON COLUMN "public"."support_messages"."sender_type" IS 'Who sent the message: user (ticket creator), admin (Rachell), or bot (ClawdBot)';
COMMENT ON COLUMN "public"."support_messages"."discord_message_id" IS 'Discord message ID for deduplication during polling';
