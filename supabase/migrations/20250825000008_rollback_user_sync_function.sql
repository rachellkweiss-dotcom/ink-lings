-- Rollback migration: Remove user sync function
-- This migration removes the sync_users_to_email_milestones function

DROP FUNCTION IF EXISTS sync_users_to_email_milestones();




