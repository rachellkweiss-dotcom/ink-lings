# Setting Up Secret Tokens for Edge Functions

This guide will help you set up secret tokens for all your Edge Functions to add an extra layer of security.

## Step 1: Set Secrets in Supabase Dashboard

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/plbesopwfipvxqqzendc
2. Navigate to **Edge Functions** → **Secrets**
3. Add the following secrets (click "Add new secret" for each):

### Required Secrets:

| Secret Name | Function | Description |
|------------|----------|-------------|
| `CLEANUP_CRON_SECRET` | `cleanup-old-prompts` | Secret for cleanup cron job |
| `CHECK_SET_PREFERENCES_CRON_SECRET` | `check-set-preferences` | ✅ Already set |
| `SEND_15_MILESTONE_CRON_SECRET` | `send-15-prompt-milestone` | Secret for milestone emails |
| `SEND_PROMPTS_CRON_SECRET` | `send-prompts` | Secret for hourly prompt sending |
| `SEND_SUPPORT_CRON_SECRET` | `send-support-inklings` | Secret for support emails |

### Generating Secure Secrets

You can generate secure random secrets using:
- Online: https://randomkeygen.com/ (use "CodeIgniter Encryption Keys")
- Terminal: `openssl rand -hex 32`
- Or any password generator (use at least 32 characters)

**Example secret format:** `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`

## Step 2: Update Cron Jobs with Secrets

After setting the secrets in the Dashboard, you need to update each cron job to include the secret token in the HTTP request headers.

**Important:** The secrets you set in Edge Functions secrets are used by the functions to validate requests. The cron jobs need to send these same secrets in the `x-cron-secret` header.

### Option A: Update via SQL (Recommended)

Run the SQL files in `supabase/cron-jobs/update-cron-secrets/` directory. Each file contains SQL to update a specific cron job. You'll need to replace `'YOUR_SECRET_HERE'` with the actual secret value you set in Step 1.

### Option B: Manual Update

For each cron job, you can manually update it in Supabase Dashboard → Database → Cron Jobs, or run SQL like:

```sql
-- Example: Update cleanup-old-prompts cron job
SELECT cron.unschedule('cleanup-old-prompts');

SELECT cron.schedule(
    'cleanup-old-prompts',
    '0 2 * * *',
    $$
    SELECT
        net.http_post(
            url := 'https://plbesopwfipvxqqzendc.supabase.co/functions/v1/cleanup-old-prompts',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'x-cron-secret', 'YOUR_CLEANUP_CRON_SECRET_HERE'
            ),
            body := '{}'::jsonb
        ) AS request_id;
    $$
);
```

## Step 3: Verify Secrets Are Working

After updating the cron jobs, test one manually:

```bash
curl -X POST https://plbesopwfipvxqqzendc.supabase.co/functions/v1/cleanup-old-prompts \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: YOUR_SECRET_HERE" \
  -d '{}'
```

If the secret is correct, you should get a successful response. If wrong, you'll get a 401 Unauthorized.

## Security Notes

- **Never commit secrets to Git** - They should only exist in:
  - Supabase Dashboard → Edge Functions → Secrets
  - Your cron job SQL (which should be in a private repo or use environment variables)
  
- **Rotate secrets periodically** - Change them every 90 days or if compromised

- **Use different secrets for each function** - Don't reuse the same secret across functions

