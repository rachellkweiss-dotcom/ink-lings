# 2026 Gratitude Challenge Email Enrollment System

## Overview

This system allows you to send one-time announcement emails to current users with a one-click enrollment button for the 2026 Gratitude Challenge program. Users can enroll directly from the email without needing to log in first.

## Architecture

### Database Changes

**Migration**: `20250825000019_add_gratitude_enrollment_token_columns.sql`

Added two columns to `user_preferences` table:
- `gratitude_2026_token` (TEXT, nullable) - Unique UUID token for each user
- `gratitude_2026_expires` (TIMESTAMP WITH TIME ZONE, nullable) - Token expiration (30 days)

**Index**: Created on `gratitude_2026_token` for fast lookups

### API Endpoint

**Route**: `/api/gratitude-challenge/enroll-email`

**Method**: GET

**Parameters**: 
- `token` (query parameter) - Enrollment token from email

**Flow**:
1. Validates token exists in `user_preferences`
2. Checks token hasn't expired
3. Looks up user by token
4. Enrolls user in `gratitude_2026_participants` (or reactivates if inactive)
5. Clears token from `user_preferences`
6. Redirects to `/gratitude-challenge?enrolled=true`

**Security**:
- Rate limiting: 10 requests/minute
- Token expiration: 30 days
- One-time use: Token cleared after enrollment
- Audit logging for all actions

### Edge Function

**Function**: `send-gratitude-2026-announcement`

**Purpose**: Send announcement emails to all current users

**Features**:
- Only sends to users without existing tokens (prevents duplicates)
- Generates unique UUID token per user
- Stores token and expiration in `user_preferences`
- Rate limiting: 500ms delay between emails
- Test mode: `?test=true` sends to first user only

**Setup**:
1. Set `GRATITUDE_ANNOUNCEMENT_SECRET` in Supabase Dashboard
2. Deploy function: `supabase functions deploy send-gratitude-2026-announcement`

**Usage**:
```bash
# Send to all users
curl -X POST https://<project-ref>.supabase.co/functions/v1/send-gratitude-2026-announcement \
  -H "Authorization: Bearer <GRATITUDE_ANNOUNCEMENT_SECRET>"

# Test mode (first user only)
curl -X POST "https://<project-ref>.supabase.co/functions/v1/send-gratitude-2026-announcement?test=true" \
  -H "Authorization: Bearer <GRATITUDE_ANNOUNCEMENT_SECRET>"
```

### Email Template

**File**: `email-templates/gratitude-2026-announcement-email.html`

**Features**:
- Responsive design
- One-click enrollment button
- Information about the program
- What to expect section

**Button Link**: 
```
https://www.inklingsjournal.live/api/gratitude-challenge/enroll-email?token=<unique-token>
```

### Frontend Updates

**Page**: `/app/gratitude-challenge/page.tsx`

- Added success message when `enrolled=true` query parameter is present
- Shows confirmation after email enrollment
- Dismissible success banner

**Types**: Updated `UserPreferences` interface to include:
- `gratitude_2026_token?: string | null`
- `gratitude_2026_expires?: string | null`

## How It Works

1. **Email Sending**:
   - Edge function finds all users with `user_preferences`
   - Generates unique token (UUID) for each user
   - Stores token + 30-day expiration in `user_preferences`
   - Sends email with enrollment button containing token

2. **User Clicks Button**:
   - User clicks button in email
   - Browser navigates to `/api/gratitude-challenge/enroll-email?token=...`
   - API endpoint validates token

3. **Enrollment**:
   - Token verified (exists, not expired)
   - User looked up from `user_preferences`
   - User enrolled in `gratitude_2026_participants`
   - Token cleared from `user_preferences`
   - Redirect to success page

## Security Features

1. **Token Security**:
   - Random UUID tokens (cryptographically secure)
   - 30-day expiration
   - One-time use (cleared after enrollment)
   - Indexed for fast validation

2. **API Security**:
   - Rate limiting (10 req/min)
   - Token validation
   - Expiration checking
   - Audit logging

3. **Edge Function Security**:
   - Secret-based authentication
   - Prevents duplicate emails (checks for existing tokens)
   - Rollback on email failure

## Testing

### Test Email Sending

1. Set up secret in Supabase Dashboard
2. Deploy edge function
3. Run test mode:
   ```bash
   curl -X POST "https://<project>.supabase.co/functions/v1/send-gratitude-2026-announcement?test=true" \
     -H "Authorization: Bearer <SECRET>"
   ```
4. Check email received
5. Click enrollment button
6. Verify enrollment in database

### Verify Enrollment

```sql
-- Check user enrollment
SELECT * FROM gratitude_2026_participants WHERE user_id = '<user-id>';

-- Check token was cleared
SELECT gratitude_2026_token, gratitude_2026_expires 
FROM user_preferences 
WHERE user_id = '<user-id>';
```

## Deployment Checklist

- [ ] Run migration: `supabase migration up`
- [ ] Set `GRATITUDE_ANNOUNCEMENT_SECRET` in Supabase Dashboard
- [ ] Deploy edge function: `supabase functions deploy send-gratitude-2026-announcement`
- [ ] Test with `?test=true` parameter
- [ ] Verify email received and button works
- [ ] Check enrollment in database
- [ ] Send to all users (remove `?test=true`)

## Notes

- Tokens expire after 30 days
- Users who already have tokens won't receive duplicate emails
- If email sending fails, token is rolled back
- Users can still enroll manually via the app
- Email enrollment works without requiring login first

