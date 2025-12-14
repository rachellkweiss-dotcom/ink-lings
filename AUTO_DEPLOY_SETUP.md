# Automatic Edge Function Deployment Setup

## Overview

This setup allows you to edit edge functions in Cursor and have them automatically deploy to Supabase when you push to GitHub.

## How It Works

1. **Edit functions in Cursor** → Save files
2. **Commit and push to GitHub** → Triggers GitHub Actions
3. **GitHub Actions automatically deploys** → Functions update in Supabase

## Setup Instructions

### Step 1: Get Your Supabase Access Token

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click on your profile → **Access Tokens**
3. Generate a new token (or use existing)
4. Copy the token

### Step 2: Get Your Project ID

Your project ID is: `plbesopwfipvxqqzendc`

(You can also find it in your Supabase dashboard URL)

### Step 3: Add GitHub Secrets

1. Go to your GitHub repository: `https://github.com/rachellkweiss-dotcom/ink-lings`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these 2 secrets:

   **Secret 1:**
   - Name: `SUPABASE_ACCESS_TOKEN`
   - Value: Your Supabase access token (from Step 1)

   **Secret 2:**
   - Name: `SUPABASE_PROJECT_ID`
   - Value: `plbesopwfipvxqqzendc`

### Step 5: Test It!

1. Make a small change to any edge function
2. Commit and push:
   ```bash
   git add supabase/functions/
   git commit -m "Test auto-deploy"
   git push
   ```
3. Check GitHub Actions tab to see deployment progress

## What Gets Deployed

The workflow automatically deploys these functions:
- ✅ `check-set-preferences`
- ✅ `send-15-prompt-milestone`
- ✅ `send-support-inklings`
- ✅ `send-support-inklings-test`

## Manual Deployment (Alternative)

If you prefer manual control, you can still use:
```bash
npm run supabase:deploy:all
```

## Troubleshooting

### Workflow Not Running
- Check that you've added both secrets (`SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_ID`)
- Verify the workflow file is in `.github/workflows/`
- Check GitHub Actions tab for error messages

### Deployment Fails
- Verify your Supabase access token is valid (regenerate if needed)
- Check that project ID is correct: `plbesopwfipvxqqzendc`
- Make sure the token has proper permissions

### Functions Not Updating
- Check GitHub Actions logs for errors
- Verify functions are in `supabase/functions/` directory
- Try manual deployment to test: `npm run supabase:deploy:all`

## Workflow Details

- **Triggers:** Pushes to `main` branch when files in `supabase/functions/` change
- **Manual Trigger:** You can also manually trigger from GitHub Actions tab
- **Deploys:** All 4 edge functions automatically

## Next Steps

1. ✅ Add the 2 GitHub secrets (`SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_ID`)
2. ✅ Commit and push the workflow file
3. ✅ Make a test change to an edge function and push
4. ✅ Verify deployment in GitHub Actions tab
5. ✅ Check Supabase dashboard to confirm functions updated

## How to Get Supabase Access Token

1. Go to https://supabase.com/dashboard/account/tokens
2. Click **Generate new token**
3. Give it a name (e.g., "GitHub Actions")
4. Copy the token immediately (you won't see it again!)
5. Add it as `SUPABASE_ACCESS_TOKEN` secret in GitHub

