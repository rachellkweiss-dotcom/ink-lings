# Cron Job Secret Update Files

## ⚠️ Security Notice

These SQL files contain **PLACEHOLDERS** for secrets, not actual secret values. They are safe to commit to Git.

## How to Use These Files

1. **Copy the template file** you need (e.g., `01_update_cleanup_old_prompts.sql`)

2. **Get your secret** from Supabase Dashboard → Edge Functions → Secrets

3. **Replace the placeholder** `YOUR_*_CRON_SECRET_HERE` with your actual secret

4. **Run the SQL** in Supabase Dashboard → SQL Editor

5. **Delete the file** with the real secret (or don't save it)

## File Naming Convention

- ✅ **Template files** (safe to commit): `01_update_cleanup_old_prompts.sql`
- ❌ **Files with secrets** (never commit): `01_update_cleanup_old_prompts.secret.sql`

If you need to save a file with a real secret temporarily, use the `.secret.sql` extension - it will be automatically ignored by Git.

## Current Status

All template files in this directory use placeholders and are safe to commit.

## See Also

- `../SECURITY.md` - Security best practices
- `../SET_SECRETS_GUIDE.md` - Guide for setting up secrets

