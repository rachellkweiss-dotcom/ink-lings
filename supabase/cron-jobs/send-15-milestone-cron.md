# Send 15-Prompt Milestone Email Cron Job

This cron job automatically sends milestone emails to users who have received exactly 15 prompts.

## Function Details

- **Function Name**: `send-15-prompt-milestone`
- **Schedule**: Daily at 10:00 AM UTC (`0 10 * * *`)
- **Function URL**: `https://plbesopwfipvxqqzendc.supabase.co/functions/v1/send-15-prompt-milestone`
- **HTTP Method**: `POST`

## What It Does

Sends milestone emails to users who:
1. Have received exactly 15 prompts (`total_prompts_sent_count = 15`)
2. Haven't received the `alt_notifications` email yet (checks `email_milestones.alt_notifications`)

The email explains options for notifications (email, Discord setup, or paid help).

## Setup Instructions

### Step 1: Add Secret Token (Optional but Recommended)

1. Generate a secret: `openssl rand -hex 32`
2. Add to **Supabase Dashboard** → **Settings** → **Edge Functions** → **Secrets**:
   - Key: `SEND_15_MILESTONE_CRON_SECRET`
   - Value: (your generated secret)

### Step 2: Set Up Cron Job via SQL

Run this SQL in **Supabase Dashboard** → **SQL Editor**:

```sql
-- Remove existing cron job if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-15-prompt-milestone') THEN
        PERFORM cron.unschedule('send-15-prompt-milestone');
    END IF;
END $$;

-- Schedule the function to run daily at 10:00 AM UTC
SELECT cron.schedule(
    'send-15-prompt-milestone',
    '0 10 * * *',
    $$
    SELECT
        net.http_post(
            url := 'https://plbesopwfipvxqqzendc.supabase.co/functions/v1/send-15-prompt-milestone',
            headers := jsonb_build_object(
                'Content-Type', 'application/json'
                -- If you set SEND_15_MILESTONE_CRON_SECRET, add it here:
                -- 'x-cron-secret', 'your-secret-token-here'
            ),
            body := '{}'::jsonb
        ) AS request_id;
    $$
);
```

### Step 3: Verify Function is Deployed

```bash
supabase functions deploy send-15-prompt-milestone
```

## Testing

Test the function manually:

```bash
curl -X POST https://plbesopwfipvxqqzendc.supabase.co/functions/v1/send-15-prompt-milestone \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Monitoring

Check function logs:
```bash
supabase functions logs send-15-prompt-milestone
```

Or view in **Supabase Dashboard** → **Edge Functions** → **send-15-prompt-milestone** → **Logs**

