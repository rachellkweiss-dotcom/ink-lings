# Manual Test: send-prompts Function

## Option 1: Using Supabase Dashboard

1. Go to **Supabase Dashboard → Edge Functions → send-prompts**
2. Click **"Invoke Function"**
3. Add header: `x-cron-secret` with your `SEND_PROMPTS_CRON_SECRET` value
4. Click **"Invoke"**
5. Check the response and logs

## Option 2: Using curl

```bash
# Replace YOUR_SECRET with your actual SEND_PROMPTS_CRON_SECRET
curl -X POST https://plbesopwfipvxqqzendc.supabase.co/functions/v1/send-prompts \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: YOUR_SECRET" \
  -d '{}'
```

## What to Look For

**Success Response:**
```json
{
  "success": true,
  "emailsSent": 5,
  "message": "Prompts sent successfully"
}
```

**Failure Responses:**
- `401 Unauthorized` → Secret doesn't match
- `500 Server configuration error` → Secret not set in Dashboard
- Other errors → Check the error message

## If Manual Test Works

If the manual test works but cron doesn't, the issue is:
- Secret in cron job doesn't match secret in Edge Function secrets
- Need to update the cron job with the correct secret

## If Manual Test Fails

If the manual test also fails, the issue is:
- Secret not set in Edge Function secrets
- Or function has another error (check logs)





