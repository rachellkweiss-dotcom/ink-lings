# Troubleshooting CLEANUP_CRON_SECRET 500 Error

The function is still reporting that `CLEANUP_CRON_SECRET` is not configured. Let's verify:

## Step 1: Check Secret Name (Case-Sensitive!)

The secret name must be **exactly**: `CLEANUP_CRON_SECRET`

Common mistakes:
- ❌ `cleanup_cron_secret` (lowercase)
- ❌ `CLEANUP-CRON-SECRET` (hyphens instead of underscores)
- ❌ `CLEANUP_CRON_SECRET ` (trailing space)
- ✅ `CLEANUP_CRON_SECRET` (correct)

## Step 2: Verify Location

The secret must be in:
**Supabase Dashboard → Edge Functions → Secrets**

NOT in:
- Project Settings → Environment Variables
- Database → Settings
- Any other location

## Step 3: Check All Required Secrets

The function also needs these secrets (they should be auto-set, but verify):
- `SUPABASE_URL` - Should be auto-set
- `SUPABASE_SERVICE_ROLE_KEY` - Should be auto-set
- `CLEANUP_CRON_SECRET` - You need to set this

## Step 4: Wait for Propagation

After setting/updating a secret, wait 1-2 minutes for it to propagate to all function instances.

## Step 5: Try a Different Approach

If it still doesn't work, try:
1. Delete the secret completely
2. Wait 30 seconds
3. Recreate it with the exact name `CLEANUP_CRON_SECRET`
4. Wait 1-2 minutes
5. Try the function again

## Step 6: Check Function Version

Make sure you're testing the latest deployed version. The deployment ID in your error was `plbesopwfipvxqqzendc_355664cb-333f-4ce7-b72c-14cef975127e_11`.





