# Check Set Preferences Email Cron Job

This cron job automatically sends reminder emails to users who signed up but haven't set their preferences yet.

## Function Details

- **Function Name**: `check-set-preferences`
- **Schedule**: Daily at 9:00 AM UTC (`0 9 * * *`)
- **Function URL**: `https://plbesopwfipvxqqzendc.supabase.co/functions/v1/check-set-preferences`
- **HTTP Method**: `POST`

## What It Does

Sends reminder emails to users who:
1. Have an auth account but no `user_preferences` (never completed onboarding)
2. Signed up more than 2 days ago
3. Haven't received the `set_preferences` email yet

## Setup Instructions

### Step 1: Set Up Authentication (Optional but Recommended)

The function uses a secret token for authentication (similar to `cleanup-old-prompts`):

**Option A: With Secret Token (More Secure)**
1. Generate a secret token: `openssl rand -hex 32`
2. Add to **Supabase Dashboard** → **Settings** → **Edge Functions** → **Secrets**:
   - Key: `CHECK_SET_PREFERENCES_CRON_SECRET`
   - Value: (your generated secret)
3. Update the cron job SQL to include the secret in the `x-cron-secret` header

**Option B: Without Secret Token (Less Secure, but Works)**
- If `CHECK_SET_PREFERENCES_CRON_SECRET` is not set, the function allows all requests
- This works for Supabase cron but is less secure
- Recommended for testing only

**JWT Verification**: You can keep JWT verification OFF in the Dashboard since we're using code-level authentication.

### Step 2: Set Up Cron Job via SQL

Run this SQL in **Supabase Dashboard** → **SQL Editor**:

```sql
-- Remove existing cron job if it exists (to avoid duplicates)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'check-set-preferences-emails') THEN
        PERFORM cron.unschedule('check-set-preferences-emails');
    END IF;
END $$;

-- Schedule the check-set-preferences function to run daily at 9:00 AM UTC
SELECT cron.schedule(
    'check-set-preferences-emails',
    '0 9 * * *',  -- Daily at 9:00 AM UTC
    $$
    SELECT
        net.http_post(
            url := 'https://plbesopwfipvxqqzendc.supabase.co/functions/v1/check-set-preferences',
            headers := jsonb_build_object(
                'Content-Type', 'application/json'
            ),
            body := '{}'::jsonb
        ) AS request_id;
    $$
);

-- Verify it was created
SELECT 
    jobid,
    jobname,
    schedule,
    active
FROM cron.job
WHERE jobname = 'check-set-preferences-emails';
```

### Step 3: Verify Function is Deployed

Make sure the function is deployed:
```bash
supabase functions deploy check-set-preferences
```

## Testing

You can test the function manually:

```bash
# Test via curl
curl -X POST https://plbesopwfipvxqqzendc.supabase.co/functions/v1/check-set-preferences \
  -H "Content-Type: application/json" \
  -d '{}'
```

Or test via **Supabase Dashboard** → **Edge Functions** → **check-set-preferences** → **Invoke**

## Monitoring

Check function logs:
```bash
supabase functions logs check-set-preferences
```

Or view in **Supabase Dashboard** → **Edge Functions** → **check-set-preferences** → **Logs**




