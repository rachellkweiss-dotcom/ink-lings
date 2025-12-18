# Cleanup Old Prompts Cron Job

This cron job automatically deletes old prompt history and orphaned progress entries to keep the database clean.

## Function Details

- **Function Name**: `cleanup-old-prompts`
- **Schedule**: Daily at 2:00 AM UTC (`0 2 * * *`)
- **Function URL**: `https://your-project-ref.supabase.co/functions/v1/cleanup-old-prompts`
- **HTTP Method**: `POST`

## What It Does

1. **Deletes old prompts**: Removes prompts from `prompt_history` older than 90 days
2. **Cleans orphaned entries**: Removes `user_prompt_progress` entries for deleted users

## Setup Instructions

### Option 1: Supabase Cron via SQL (Recommended)

Since `pg_cron` is enabled, you can set up the cron job directly via SQL:

1. **Get your project reference ID**:
   - Go to **Supabase Dashboard** → **Settings** → **General**
   - Copy your "Reference ID" (or extract it from your project URL)

2. **Update the migration file**:
   - Open `supabase/migrations/20250127000000_enable_pg_cron_and_setup_cleanup.sql`
   - Replace `YOUR-PROJECT-REF` with your actual project reference ID

3. **Run the migration**:
   ```bash
   supabase db push
   ```
   
   Or run the SQL directly in **Supabase Dashboard** → **SQL Editor**

4. **Verify it's scheduled**:
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'cleanup-old-prompts';
   ```

**Alternative: Set up via SQL Editor**

If you prefer to set it up manually:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run this SQL (replace `YOUR-PROJECT-REF` with your project reference):
   ```sql
   SELECT cron.schedule(
       'cleanup-old-prompts',
       '0 2 * * *',
       $$
       SELECT net.http_post(
           url := 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/cleanup-old-prompts',
           headers := jsonb_build_object('Content-Type', 'application/json'),
           body := '{}'::jsonb
       ) AS request_id;
       $$
   );
   ```

**Note**: Make sure the function is deployed first:
```bash
supabase functions deploy cleanup-old-prompts
```

### Option 2: External Cron Service (cron-job.org)

If using an external cron service:

1. **Add secret to Supabase**:
   - Go to **Supabase Dashboard** → **Settings** → **Edge Functions** → **Secrets**
   - Add: `CLEANUP_CRON_SECRET` = (generate a strong random string)

2. **Configure cron-job.org**:
   - URL: `https://your-project-ref.supabase.co/functions/v1/cleanup-old-prompts`
   - Method: `POST`
   - Headers: Add `x-cron-secret` with the same secret value

## Testing

You can test the function manually:

```bash
# Test via Supabase CLI
supabase functions invoke cleanup-old-prompts

# Or test via curl (if using secret token)
curl -X POST https://your-project-ref.supabase.co/functions/v1/cleanup-old-prompts \
  -H "x-cron-secret: your-secret-here"
```

## Monitoring

Check function logs:
```bash
supabase functions logs cleanup-old-prompts
```

Or view in Supabase Dashboard → Edge Functions → cleanup-old-prompts → Logs

## Schedule Recommendations

- **Daily at 2am UTC**: Good for most use cases (low traffic time)
- **Weekly**: If you have low volume, consider `0 2 * * 0` (Sundays at 2am)
- **Custom**: Adjust based on your data volume and retention needs

