# Fix: send-prompts Secret Issue

## Problem
- Cron job has secret: `06b047ed62548ae2aae814d7a3c1bdf358191ec2b3e8f3feb311ab3b0e236afe` (64 chars)
- Function says: `SEND_PROMPTS_CRON_SECRET is not configured`
- This means the secret in Edge Function secrets doesn't match or wasn't set properly

## Solution

### Step 1: Verify Secret in Edge Function Secrets

1. Go to **Supabase Dashboard → Edge Functions → Secrets**
2. Look for `SEND_PROMPTS_CRON_SECRET`
3. Check if:
   - It exists
   - The value matches: `06b047ed62548ae2aae814d7a3c1bdf358191ec2b3e8f3feb311ab3b0e236afe`
   - There are no duplicate entries

### Step 2: Update Secret (if needed)

If the secret doesn't match or you want to ensure it's correct:

1. In **Supabase Dashboard → Edge Functions → Secrets**
2. Find `SEND_PROMPTS_CRON_SECRET`
3. **Delete it** (if it exists with wrong value)
4. **Add new secret**:
   - Key: `SEND_PROMPTS_CRON_SECRET`
   - Value: `06b047ed62548ae2aae814d7a3c1bdf358191ec2b3e8f3feb311ab3b0e236afe`
5. **Save**

### Step 3: Redeploy Function

After updating the secret, redeploy the function so it picks up the new secret:

```bash
supabase functions deploy send-prompts
```

**OR** wait a few minutes - Supabase sometimes takes a moment to propagate secrets to running functions.

### Step 4: Test

After redeploying, check the logs again. The next cron run should work.

---

## Alternative: Check for Duplicate Secrets

If you think the secret was "added to" instead of "replaced", check:

1. In **Supabase Dashboard → Edge Functions → Secrets**
2. Look for multiple entries with similar names
3. Delete any duplicates
4. Keep only one `SEND_PROMPTS_CRON_SECRET` with the correct value

---

## Quick Verification

After fixing, manually test the function:

1. Go to **Supabase Dashboard → Edge Functions → send-prompts → Invoke**
2. Add header: `x-cron-secret` = `06b047ed62548ae2aae814d7a3c1bdf358191ec2b3e8f3feb311ab3b0e236afe`
3. Click **Invoke**
4. Should return success (not 401 or 500)




