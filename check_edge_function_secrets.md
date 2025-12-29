# Checking Edge Function Secrets

The 500 error from `cleanup-old-prompts` is likely because `CLEANUP_CRON_SECRET` is not configured.

## To Fix:

1. **Go to Supabase Dashboard** → **Edge Functions** → **Secrets**

2. **Check if these secrets exist:**
   - `CLEANUP_CRON_SECRET`
   - `CHECK_SET_PREFERENCES_CRON_SECRET`
   - `SEND_15_MILESTONE_CRON_SECRET`
   - `SEND_PROMPTS_CRON_SECRET`
   - `SEND_SUPPORT_CRON_SECRET`

3. **If any are missing, add them:**
   - Click "Add new secret"
   - Enter the secret name (e.g., `CLEANUP_CRON_SECRET`)
   - Enter the secret value (get it from the cron job SQL or generate a new one)
   - Click "Save"

4. **To get the secret values from cron jobs:**
   - Run the `extract_all_cron_secrets.sql` query in SQL Editor
   - Or check the cron job SQL files in `supabase/cron-jobs/update-cron-secrets/`

## After Setting Secrets:

The Edge Functions will automatically pick up the new secrets. You don't need to redeploy the functions.

## To Test:

Try running the cleanup function again. It should work if the secret is set correctly.





