# Security Best Practices for Edge Functions

## 🔒 Never Commit Secrets to Git

**IMPORTANT:** Secrets should NEVER be committed to the codebase. They should only exist in:
- Supabase Dashboard → Edge Functions → Secrets (for Edge Functions)
- Supabase Dashboard → Database → Cron Jobs (for cron job SQL)

## Where Secrets Are Stored

### 1. Edge Function Secrets
Secrets are stored in **Supabase Dashboard → Edge Functions → Secrets**:
- `CLEANUP_CRON_SECRET`
- `CHECK_SET_PREFERENCES_CRON_SECRET`
- `SEND_15_MILESTONE_CRON_SECRET`
- `SEND_PROMPTS_CRON_SECRET`
- `SEND_SUPPORT_CRON_SECRET`

These are automatically available to Edge Functions via `Deno.env.get()`.

### 2. Cron Job Secrets
Secrets are embedded in the cron job SQL commands in the database. They are NOT stored in code files.

## Secure Workflow

### Setting Up Cron Jobs with Secrets

1. **Set the secret in Supabase Dashboard:**
   - Go to Edge Functions → Secrets
   - Add the secret (e.g., `CLEANUP_CRON_SECRET`)

2. **Update the cron job SQL:**
   - Use the template files in `update-cron-secrets/` as reference
   - Replace `YOUR_*_CRON_SECRET_HERE` with the actual secret
   - Run the SQL directly in Supabase Dashboard → SQL Editor
   - **DO NOT save the SQL file with the real secret**

3. **Template Files:**
   - The files in `update-cron-secrets/` are templates with placeholders
   - They are safe to commit to Git
   - When you need to update a cron job, copy the template, add your secret, run it, then discard

## What's in Git

✅ **Safe to commit:**
- Edge function code (functions check secrets but don't contain them)
- Template SQL files with placeholders
- Documentation files

❌ **Never commit:**
- SQL files with actual secret values
- `.env` files
- Any file containing real secrets

## If You Accidentally Commit a Secret

1. **Immediately rotate the secret** in Supabase Dashboard
2. **Update the cron job** with the new secret
3. **Remove from Git history** (if needed, use `git filter-branch` or BFG Repo-Cleaner)
4. **Review access logs** to ensure no unauthorized access

## Current Security Status

✅ All Edge Functions check secrets before processing
✅ Secrets are stored only in Supabase Dashboard
✅ Template SQL files use placeholders
✅ `.gitignore` excludes secret files

## Best Practices

1. **Use different secrets for each function** - Don't reuse secrets
2. **Rotate secrets periodically** - Every 90 days or if compromised
3. **Use strong secrets** - At least 32 characters, random
4. **Never share secrets** - Use secure channels if needed
5. **Monitor access logs** - Check Supabase logs for unauthorized attempts

