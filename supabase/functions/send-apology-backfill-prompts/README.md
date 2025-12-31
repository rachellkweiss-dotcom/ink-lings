# Send Apology & Backfill Prompts

This Edge Function sends an apology email to users who missed prompts during the system outage (Dec 27-29, 2025) and includes their missed prompts in the email.

## Features

- Sends apology email with missed prompts
- Includes gratitude challenge enrollment (if not already enrolled)
- Updates prompt rotation and history after sending
- Handles multiple missed prompts (up to 3)
- Rate limiting: 1 second delay between emails

## Setup

1. Set `SEND_PROMPTS_CRON_SECRET` in Supabase Dashboard (same secret as send-prompts function)
2. Set `RESEND_API_KEY` in Supabase Dashboard
3. Deploy the function:
   ```bash
   supabase functions deploy send-apology-backfill-prompts
   ```

## Usage

### Step 1: Test with Your User ID Only

The function is already configured to test with just your user ID (`1b4cf4f0-be8a-4931-b4b2-7a4801585a8e`). All other users are commented out.

**Deploy the function:**
```bash
supabase functions deploy send-apology-backfill-prompts
```

**Call the function to test:**
```bash
curl -X POST https://<your-project-ref>.supabase.co/functions/v1/send-apology-backfill-prompts \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>"
```

Replace:
- `<your-project-ref>` with your Supabase project reference
- `<SUPABASE_ANON_KEY>` with your Supabase anon key (or service role key)

**Check the response:**
You should see a JSON response with:
- `success: true`
- `emailsSent: 1`
- `results` array with your email and status

**Check your email:**
You should receive an email at `rkweiss89@gmail.com` with:
- Apology message
- 2 missed prompts (since you missed 2)
- Gratitude challenge enrollment section
- Instagram link

### Step 2: Uncomment All Users for Production

Once you've tested and confirmed it works:

1. Edit `index.ts` and uncomment all the users in `BACKFILL_USERS`
2. Comment out or remove the test user line
3. Deploy again: `supabase functions deploy send-apology-backfill-prompts`
4. Run the function again to send to all 12 users

## Email Content

The email includes:
- Apology message
- All missed prompts (formatted like normal prompt emails)
- Gratitude challenge enrollment section:
  - If `gratitude_2026_token` is NULL → "Already signed up" (grayed out)
  - If `gratitude_2026_token` exists → Enrollment button with token
- Instagram link (@ink_lings_journal)
- Normal signature

## How It Works

1. Fetches users from `BACKFILL_USER_IDS` array
2. Gets their current rotation state from `user_prompt_rotation`
3. Gets the next prompts they should have received (up to 3)
4. Builds email with all missed prompts
5. Sends email via Resend
6. Updates `prompt_history` for each prompt
7. Updates `user_prompt_rotation` (increments counts, moves to next category)

## Response

Returns JSON with:
- `success`: boolean
- `emailsSent`: number of emails sent
- `errors`: number of errors
- `results`: array of results per user

## Notes

- The function gets prompts based on current rotation state
- Assumes rotation wasn't updated during outage (since emails weren't sent)
- Most users missed 1-3 prompts during the outage period
- Rate limited to 1 email per second (Resend API limit)

