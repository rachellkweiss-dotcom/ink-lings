# Supabase Edge Functions Deployment Guide

## Current Setup

You have **4 edge functions** in your codebase:
1. `check-set-preferences` - Reminds users to set preferences
2. `send-15-prompt-milestone` - Sends milestone email at 15 prompts
3. `send-support-inklings` - Sends support/donation emails (production)
4. `send-support-inklings-test` - Test version of support emails

## Quick Deploy Commands

### Deploy All Functions
```bash
npm run supabase:deploy:all
```

### Deploy Individual Functions
```bash
# Deploy check-set-preferences
npm run supabase:deploy:check-set-preferences

# Deploy 15-prompt milestone
npm run supabase:deploy:send-15-milestone

# Deploy support emails (production)
npm run supabase:deploy:send-support

# Deploy support emails (test)
npm run supabase:deploy:send-support-test
```

## First-Time Setup

### 1. Link to Your Supabase Project
```bash
# Link to your project (you'll need your database password)
supabase link --project-ref plbesopwfipvxqqzendc
```

**Alternative:** If you don't want to link, you can deploy directly:
```bash
supabase functions deploy <function-name> --project-ref plbesopwfipvxqqzendc
```

### 2. Verify Functions Are Deployed
```bash
# List all deployed functions
npm run supabase:functions:list

# View logs for a function
supabase functions logs send-support-inklings
```

## Workflow: Edit and Deploy from Cursor

### Step 1: Edit Function in Cursor
- Open the function file: `supabase/functions/<function-name>/index.ts`
- Make your changes
- Save the file

### Step 2: Deploy from Terminal
```bash
# From the ink-lings directory
npm run supabase:deploy:<function-name>
```

### Step 3: Verify Deployment
```bash
# Check logs to see if it's working
supabase functions logs <function-name>
```

## Environment Variables

Edge functions use environment variables set in Supabase Dashboard:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `STRIPE_SECRET_KEY` (for support emails)

**To update secrets:**
```bash
supabase secrets set RESEND_API_KEY=your_key_here
```

## Current Functions Overview

### 1. `check-set-preferences`
- **Purpose:** Reminds users who signed up >2 days ago to set preferences
- **Trigger:** Manual or cron
- **CORS:** Uses wildcard `*` (needs fixing)

### 2. `send-15-prompt-milestone`
- **Purpose:** Sends milestone email when users reach 15 prompts
- **Trigger:** Manual or cron
- **CORS:** Uses wildcard `*` (needs fixing)

### 3. `send-support-inklings`
- **Purpose:** Sends support/donation emails at milestones (30, 80, 130, 200 prompts)
- **Trigger:** Cron job (daily at 9 AM UTC)
- **CORS:** Uses wildcard `*` (needs fixing)
- **Note:** Only sends if donations < $675

### 4. `send-support-inklings-test`
- **Purpose:** Test version (doesn't send emails, just logs)
- **Trigger:** Manual testing
- **CORS:** Uses wildcard `*` (needs fixing)

## Security Note: CORS Configuration

All functions currently use:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',  // ⚠️ Too permissive
}
```

**Recommended fix:**
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://inklingsjournal.live',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

## Troubleshooting

### Function Not Deploying
1. Check you're linked: `supabase projects list`
2. Verify function name matches directory name
3. Check for syntax errors: `deno check supabase/functions/<name>/index.ts`

### Function Not Running
1. Check cron job is set up (for scheduled functions)
2. View logs: `supabase functions logs <name>`
3. Verify environment variables are set

### Can't Link Project
- You need your database password from Supabase Dashboard
- Or use `--project-ref` flag with each deploy command

## Next Steps

1. **Link your project** (one-time setup)
2. **Fix CORS** in all edge functions
3. **Test deployment** with one function first
4. **Set up CI/CD** (optional) for automatic deployment on git push

