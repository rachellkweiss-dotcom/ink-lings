# Send Gratitude 2026 Announcement Email

Edge function to send one-time announcement emails to current users about the 2026 Gratitude Challenge program.

## Overview

This function:
1. Finds all users with `user_preferences` who haven't received the email yet (no token set)
2. Generates a unique enrollment token for each user
3. Stores the token and expiration (30 days) in `user_preferences`
4. Sends a personalized email with a one-click enrollment button

## Setup

### 1. Set Environment Variable

In Supabase Dashboard → Edge Functions → `send-gratitude-2026-announcement` → Settings:

Add secret:
- **Name**: `GRATITUDE_ANNOUNCEMENT_SECRET`
- **Value**: Generate a secure random string (e.g., using `openssl rand -hex 32`)

### 2. Deploy the Function

```bash
# From project root
supabase functions deploy send-gratitude-2026-announcement
```

## Usage

### Send to All Users

```bash
curl -X POST https://<your-project-ref>.supabase.co/functions/v1/send-gratitude-2026-announcement \
  -H "Authorization: Bearer <GRATITUDE_ANNOUNCEMENT_SECRET>" \
  -H "Content-Type: application/json"
```

### Test Mode (Send to First User Only)

```bash
curl -X POST "https://<your-project-ref>.supabase.co/functions/v1/send-gratitude-2026-announcement?test=true" \
  -H "Authorization: Bearer <GRATITUDE_ANNOUNCEMENT_SECRET>" \
  -H "Content-Type: application/json"
```

### Send to Specific User (for testing)

```bash
curl -X POST "https://<your-project-ref>.supabase.co/functions/v1/send-gratitude-2026-announcement?user_id=<USER_ID>" \
  -H "Authorization: Bearer <GRATITUDE_ANNOUNCEMENT_SECRET>" \
  -H "Content-Type: application/json"
```

**Note**: When using `user_id`, the function will send to that specific user even if they already have a token (useful for testing). To find a user's ID, check your `user_preferences` or `auth.users` table.

## How It Works

1. **Token Generation**: Each user gets a unique UUID token stored in `user_preferences.gratitude_2026_token`
2. **Email Link**: The email contains a button linking to `/api/gratitude-challenge/enroll-email?token=<token>`
3. **Enrollment**: When clicked, the API endpoint:
   - Verifies the token exists and hasn't expired
   - Looks up the user from `user_preferences`
   - Enrolls them in `gratitude_2026_participants`
   - Clears the token from `user_preferences`
   - Redirects to success page

## Security

- **Secret Authentication**: Function requires `GRATITUDE_ANNOUNCEMENT_SECRET` in Authorization header
- **Token Expiration**: Tokens expire after 30 days
- **One-Time Use**: Tokens are cleared after successful enrollment
- **Rate Limiting**: API endpoint has rate limiting (10 requests/minute)

## Response

```json
{
  "success": true,
  "sent": 150,
  "errors": 0,
  "total": 150
}
```

## Notes

- The function only sends to users who don't already have a token (prevents duplicate emails)
- **Exception**: When using `user_id` parameter, it will send even if the user already has a token (for testing purposes)
- Tokens expire after 30 days
- If email sending fails, the token is rolled back (removed from user_preferences)
- Rate limiting: 500ms delay between emails (respects Resend's 2/second limit)

## Finding a User ID

To get a user's ID for testing:

```sql
-- Find user by email
SELECT user_id, notification_email 
FROM user_preferences 
WHERE notification_email = 'your-test@email.com';

-- Or list all users
SELECT user_id, notification_email 
FROM user_preferences 
WHERE notification_email IS NOT NULL;
```

