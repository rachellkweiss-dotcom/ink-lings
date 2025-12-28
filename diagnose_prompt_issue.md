# Diagnosing Why Prompts Weren't Sent Today

**Date:** December 18, 2025  
**Issue:** No prompts sent after security updates this morning

---

## 🔍 Root Cause Analysis

### What Changed This Morning:
1. ✅ Updated `send-prompts` Edge Function to **REQUIRE** secret token
2. ✅ Function now returns **500** if secret not configured
3. ✅ Function now returns **401** if secret doesn't match

### Likely Issue:
The cron job `send-prompts-hourly` is probably **not sending the secret token** in the HTTP headers, causing authentication failures.

---

## 📋 Diagnostic Steps

### Step 1: Check Cron Job Configuration
Run this SQL in Supabase Dashboard → SQL Editor:

```sql
-- Check if cron job has secret token configured
SELECT 
    jobname,
    CASE 
        WHEN command::text LIKE '%x-cron-secret%' THEN '✅ Has secret token'
        WHEN command::text LIKE '%YOUR_SEND_PROMPTS_CRON_SECRET%' THEN '⚠️ Has placeholder (not configured)'
        ELSE '❌ Missing secret token'
    END as secret_status,
    active,
    schedule
FROM cron.job
WHERE jobname = 'send-prompts-hourly';
```

**Expected Result:**
- If shows "❌ Missing secret token" → This is the problem!
- If shows "⚠️ Has placeholder" → Secret not configured
- If shows "✅ Has secret token" → Check Edge Function logs

### Step 2: Check Recent Cron Job Runs
```sql
-- Check recent runs and their status
SELECT 
    j.jobname,
    jrd.runid,
    jrd.status,
    jrd.return_message,
    jrd.start_time,
    jrd.end_time
FROM cron.job_run_details jrd
JOIN cron.job j ON jrd.jobid = j.jobid
WHERE j.jobname = 'send-prompts-hourly'
ORDER BY jrd.start_time DESC
LIMIT 10;
```

**Look for:**
- `status = 'failed'` → Authentication issue
- `return_message` containing "401" or "Unauthorized" → Missing/invalid secret

### Step 3: Check Edge Function Logs
1. Go to **Supabase Dashboard → Edge Functions → send-prompts → Logs**
2. Look for recent invocations (should be every hour at :55 minutes)
3. Check for:
   - `❌ Unauthorized access attempt` → Cron job not sending secret
   - `❌ SEND_PROMPTS_CRON_SECRET is not configured` → Secret not set in Dashboard

---

## 🔧 Fix Options

### Option A: If Cron Job Missing Secret Token
Update the cron job to include the secret token:

1. Get your `SEND_PROMPTS_CRON_SECRET` from Supabase Dashboard → Edge Functions → Secrets
2. Run this SQL (replace `YOUR_SECRET_HERE` with actual secret):

```sql
-- Update send-prompts-hourly cron job with secret token
SELECT cron.unschedule('send-prompts-hourly');

SELECT cron.schedule(
    'send-prompts-hourly',
    '55 * * * *',  -- Every hour at :55 minutes
    $$
    SELECT
        net.http_post(
            url := 'https://plbesopwfipvxqqzendc.supabase.co/functions/v1/send-prompts',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'x-cron-secret', 'YOUR_SECRET_HERE'  -- ⚠️ REPLACE WITH ACTUAL SECRET!
            ),
            body := '{}'::jsonb
        ) AS request_id;
    $$
);
```

### Option B: If Secret Not Set in Dashboard
1. Go to **Supabase Dashboard → Edge Functions → Secrets**
2. Add secret: `SEND_PROMPTS_CRON_SECRET` with a secure random value
3. Then update the cron job (Option A)

### Option C: Temporarily Make Secret Optional (NOT RECOMMENDED)
If you need prompts to work immediately, you could temporarily make the secret optional, but this reduces security. Better to fix the cron job properly.

---

## ✅ Verification

After fixing, verify:
1. Cron job shows "✅ Has secret token"
2. Next cron run succeeds (check logs)
3. Prompts are sent to users

---

## 📝 Files to Check

- `supabase/cron-jobs/update-cron-secrets/04_update_send_prompts.sql` - Template for updating cron job
- `supabase/functions/send-prompts/index.ts` - Function code (requires secret)




