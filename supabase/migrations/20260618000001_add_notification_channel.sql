-- Adds Discord as an alternative delivery channel for recurring journal prompts.
-- notification_channel determines where send-prompts / send-gratitude-prompts /
-- send-catchup-prompts deliver. All other emails (welcome, milestone, support,
-- account, preferences-reminder) continue to use notification_email regardless.
--
-- discord_webhook_url is a secret. RLS on user_preferences already restricts
-- select/insert/update to auth.uid() = user_id, so other authenticated users
-- cannot read it via PostgREST. Edge functions use the service role and bypass
-- RLS intentionally so they can deliver prompts.

alter table public.user_preferences
  add column if not exists notification_channel text not null default 'email',
  add column if not exists discord_webhook_url text;

alter table public.user_preferences
  drop constraint if exists user_preferences_notification_channel_check;

alter table public.user_preferences
  add constraint user_preferences_notification_channel_check
  check (notification_channel in ('email', 'discord'));

-- Force PostgREST to reload its schema cache so the new columns are queryable
-- immediately without waiting for the next scheduled refresh.
notify pgrst, 'reload schema';
