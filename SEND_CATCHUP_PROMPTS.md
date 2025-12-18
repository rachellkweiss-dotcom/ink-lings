# Send Catch-Up Prompts to 5 Users

## Users Who Missed Prompts During Downtime

1. **hellerozalina@gmail.com** - 8:00 AM Europe/London (scheduled for 12/18 08:00 UTC)
2. **schottnathan@gmail.com** - 6:00 AM America/New_York (scheduled for 12/18 11:00 UTC)
3. **cristinabartolacci94@gmail.com** - 7:00 AM America/New_York (scheduled for 12/18 12:00 UTC)
4. **lighthouseskrapbooker@hotmail.com** - 6:00 AM America/Chicago (scheduled for 12/18 12:00 UTC)
5. **rkweiss89@gmail.com** - 6:00 AM America/Chicago (scheduled for 12/18 12:00 UTC)

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

1. ✅ Sends prompts to the 5 users who missed them during downtime
2. ✅ Uses the same email template as regular prompts
3. ✅ Records prompts in `prompt_history` table
4. ✅ Updates `user_prompt_rotation` for next prompt
5. ✅ Returns a summary of results

## Expected Response

```json
{
  "success": true,
  "emailsSent": 5,
  "errors": 0,
  "results": [
    { "user_id": "...", "email": "...", "status": "success" },
    ...
  ]
}
```

## After Running

Once you've sent the catch-up prompts, you can verify they were sent by:
1. Checking Resend dashboard for sent emails
2. Checking `prompt_history` table for new entries
3. The function will return a summary of what was sent

