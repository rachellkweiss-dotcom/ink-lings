# Secrets Setup Checklist

## Step 1: Set Secrets in Supabase Dashboard

Go to: **Supabase Dashboard → Edge Functions → Secrets**

Add these secrets (you already have `CHECK_SET_PREFERENCES_CRON_SECRET`):

- [ ] `CLEANUP_CRON_SECRET` - for `cleanup-old-prompts`
- [x] `CHECK_SET_PREFERENCES_CRON_SECRET` - for `check-set-preferences` ✅ Already set
- [ ] `SEND_15_MILESTONE_CRON_SECRET` - for `send-15-prompt-milestone`
- [ ] `SEND_PROMPTS_CRON_SECRET` - for `send-prompts`
- [ ] `SEND_SUPPORT_CRON_SECRET` - for `send-support-inklings`

**Tip:** Generate secrets using: `openssl rand -hex 32` or https://randomkeygen.com/

## Step 2: Update Cron Jobs

After setting secrets, update each cron job by running the SQL files in `update-cron-secrets/` directory.

For each file:
1. Open the SQL file
2. Replace `'YOUR_*_CRON_SECRET_HERE'` with the actual secret value
3. Run in Supabase Dashboard → SQL Editor

### Update Order:

- [x] `01_update_cleanup_old_prompts.sql` ✅
- [x] `02_update_check_set_preferences.sql` ✅
- [x] `03_update_send_15_milestone.sql` ✅
- [x] `04_update_send_prompts.sql` ✅
- [x] `05_update_send_support_inklings.sql` ✅

## Step 3: Verify

After updating all cron jobs, verify they're working:

Run `verify_all_cron_jobs.sql` to check:
- All cron jobs are active
- All have secret tokens configured

All should show `active: true` and `✅ Has secret token`.

## Quick Test

Test one function manually to verify secrets work:

```bash
# Replace with your actual secret
curl -X POST https://plbesopwfipvxqqzendc.supabase.co/functions/v1/cleanup-old-prompts \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: YOUR_CLEANUP_CRON_SECRET_HERE" \
  -d '{}'
```

Should return success (not 401 Unauthorized).

