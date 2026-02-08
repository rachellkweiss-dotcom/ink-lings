-- Migration: Add rating column to support_tickets
-- Stores the 1-5 star rating submitted by users after ticket resolution

ALTER TABLE "public"."support_tickets"
ADD COLUMN IF NOT EXISTS "rating" INTEGER CHECK (rating >= 1 AND rating <= 5);

COMMENT ON COLUMN "public"."support_tickets"."rating" IS 'User satisfaction rating (1-5 stars) submitted after ticket resolution';
