# Send Catch-Up Prompts Function

## Overview

This function sends catch-up prompts to users who missed their scheduled prompts (e.g., during downtime or system issues).

## Setup: Configure User IDs

**Before using this function, you must edit the function code to specify which users need catch-up prompts:**

1. Open `supabase/functions/send-catchup-prompts/index.ts`
2. Find the `CATCHUP_USER_IDS` array at the top of the file
3. Replace the placeholder with actual user IDs:

```typescript
const CATCHUP_USER_IDS: string[] = [
  'user-id-1',  // email@example.com
  'user-id-2',  // email2@example.com
];
```

4. Deploy the updated function: `supabase functions deploy send-catchup-prompts`

### Finding Users Who Missed Prompts

Use the `find_missed_prompts_downtime.sql` query to identify users who missed prompts during a specific time period.

## How to Send Catch-Up Prompts

### Option 1: Using curl (Recommended)

```bash
# Replace YOUR_SECRET with your actual SEND_PROMPTS_CRON_SECRET
curl -X POST https://plbesopwfipvxqqzendc.supabase.co/functions/v1/send-catchup-prompts \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: YOUR_SECRET" \
  -d '{}'
```

### Option 2: Using Supabase Dashboard

1. Go to **Supabase Dashboard → Edge Functions → send-catchup-prompts**
2. Click **"Invoke Function"**
3. Add header: `x-cron-secret` with your `SEND_PROMPTS_CRON_SECRET` value
4. Click **"Invoke"**

### Option 3: Using Supabase CLI

```bash
supabase functions invoke send-catchup-prompts \
  --header "x-cron-secret=YOUR_SECRET"
```

## What the Function Does

1. ✅ Sends prompts to users specified in `CATCHUP_USER_IDS` array
2. ✅ Uses the same email template as regular prompts
3. ✅ Records prompts in `prompt_history` table
4. ✅ Updates `user_prompt_rotation` for next prompt
5. ✅ **Rate limiting**: 1 second delay between emails to avoid Resend API limits (2 req/sec)
6. ✅ Returns a summary of results

## Rate Limiting

The function includes built-in rate limiting:
- **1 second delay** between each email
- Keeps requests well under Resend's 2 requests/second limit
- Prevents API rate limit errors

## Expected Response

### Success Response
```json
{
  "success": true,
  "emailsSent": 2,
  "errors": 0,
  "results": [
    { "user_id": "...", "email": "...", "status": "success" },
    ...
  ]
}
```

### Error: No Users Configured
If you haven't set up user IDs, you'll get:
```json
{
  "success": false,
  "message": "No user IDs configured. Please edit CATCHUP_USER_IDS array in the function code.",
  "instructions": "Add user IDs to the CATCHUP_USER_IDS array at the top of the function file."
}
```

## After Running

Once you've sent the catch-up prompts, you can verify they were sent by:
1. Checking Resend dashboard for sent emails
2. Checking `prompt_history` table for new entries
3. The function will return a summary of what was sent

