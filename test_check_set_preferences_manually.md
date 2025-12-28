# Test check-set-preferences Function Manually

The function should log at the very start (lines 45-48), so if there are NO logs, something is wrong.

## Step 1: Get the Secret Token
1. Go to **Supabase Dashboard** → **Edge Functions** → **Secrets**
2. Find `CHECK_SET_PREFERENCES_CRON_SECRET`
3. Copy the value

## Step 2: Test the Function Manually

Run this command (replace `YOUR_SECRET` with the actual secret):

```bash
curl -X POST https://plbesopwfipvxqqzendc.supabase.co/functions/v1/check-set-preferences \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: YOUR_SECRET" \
  -d '{}'
```

## Step 3: Check Logs Immediately

After running the curl command:
1. Go to **Supabase Dashboard** → **Edge Functions** → **check-set-preferences** → **Logs**
2. You should see:
   - `✅ Function accessed - secret token validated`
   - `🚀 Set Preferences Email Edge Function starting...`
   - And more logs after that

## What to Look For

- **If you see logs**: The function is working, but cron logs might not be showing up in the dashboard
- **If you see NO logs**: The function might not be executing, or there's a deeper issue
- **If you see 401**: The secret token is wrong or missing
- **If you see 500**: There's an error in the function (check the error message)

## Possible Issues

1. **No logs in dashboard**: Supabase dashboard logs can be delayed or filtered. Try checking right after the cron runs (9:00 AM UTC).

2. **Function not executing**: Even though cron shows "succeeded", the HTTP call might be completing but the function might be failing silently.

3. **Missing table**: If `email_milestones` doesn't exist, the function will fail at line 103. Check if migration `20250825000003_create_email_milestones_table.sql` has been run.

