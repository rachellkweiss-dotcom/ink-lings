# Support Ink-lings Email System

This system automatically sends support emails to users who have reached specific prompt milestones (30, 80, 130, 200 prompts) to help cover the annual operating costs of Ink-lings.

## How It Works

### Daily Cron Job
- **Schedule**: Runs daily at 9:00 AM UTC (`0 9 * * *`)
- **Function**: `send-support-inklings`
- **Location**: `supabase/functions/send-support-inklings/`

### Logic Flow

1. **Check Annual Goal**: 
   - Fetches current donation total from Stripe for the rolling annual period (August 22 to August 22)
   - If total ≥ $675, skips all emails (goal reached)
   - If total < $675, proceeds with email logic

2. **Find Eligible Users**:
   - Queries `user_preferences` table for users with `total_prompts_sent_count` = 30, 80, 130, or 200
   - These are the support milestone thresholds

3. **Check Email History**:
   - For each eligible user, checks `email_milestones.support_inklings` timestamp
   - **No timestamp**: Send email and record timestamp
   - **Timestamp exists**: 
     - If >10 days since last email: Send email and update timestamp
     - If ≤10 days: Skip email (prevents spam)

4. **Send Support Email**:
   - Uses Resend API to send HTML email
   - Includes cost breakdown, progress bar, and donation link
   - Matches the visual design from the account page

## Email Content

The email includes:
- **Cost Breakdown**: Hosting ($300), Email Service ($200), Database ($100), Domain ($75) = $675 total
- **Progress Bar**: Visual representation of current donations vs goal
- **Remaining Amount**: How much is still needed (if goal not reached)
- **Call-to-Action**: Link to account page for donations
- **Polite Tone**: Emphasizes it's optional and thanks users for being part of the community

## Database Tables Used

### `user_preferences`
- `user_id`: User identifier
- `notification_email`: Email address to send to
- `total_prompts_sent_count`: Number of prompts sent (triggers at 30, 80, 130, 200)

### `email_milestones`
- `user_id`: User identifier
- `support_inklings`: Timestamp of last support email sent
- Used to prevent spam (10-day minimum between emails)

## Environment Variables Required

```bash
STRIPE_SECRET_KEY=sk_live_...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
RESEND_API_KEY=re_...
```

## Deployment Instructions

### 1. Deploy the Edge Function
```bash
# From the ink-lings directory
supabase functions deploy send-support-inklings
```

### 2. Set Environment Variables
```bash
supabase secrets set STRIPE_SECRET_KEY=your_stripe_secret_key
supabase secrets set SUPABASE_URL=your_supabase_url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
supabase secrets set RESEND_API_KEY=your_resend_api_key
```

### 3. Verify Cron Job
The cron job should automatically be registered when you deploy the function with the `cron.json` file.

### 4. Test the Function
```bash
# Test manually
supabase functions invoke send-support-inklings

# Check logs
supabase functions logs send-support-inklings
```

## Testing

### Manual Testing
1. **Test Stripe Integration**: Verify donation totals are fetched correctly
2. **Test User Selection**: Check that users at milestones (30, 80, 130, 200) are found
3. **Test Email Logic**: Verify 10-day spacing works correctly
4. **Test Email Content**: Check that HTML renders properly and includes progress bar

### Test Scenarios
1. **Goal Reached**: When donations ≥ $675, no emails should be sent
2. **Goal Not Reached**: When donations < $675, eligible users should receive emails
3. **Recent Email**: Users who received email <10 days ago should be skipped
4. **No Previous Email**: Users with no `support_inklings` timestamp should receive email

## Monitoring

### Logs to Watch
- `Support Ink-lings Email Cron Job Started`
- `Current donation total: $X`
- `Found X users at milestones`
- `Support email sent to user X`
- `Skipped email for user X (recently sent)`

### Success Metrics
- Emails sent count
- Emails skipped count
- Donation total
- Any errors in the process

## Annual Reset

The system automatically resets every August 22nd:
- Stripe donation period resets (August 22 to August 22)
- Goal checking resets to $0
- Email history remains (users won't get duplicate emails immediately)

## Security Notes

- Uses Supabase service role key for database access
- Stripe secret key for payment data
- Resend API key for email sending
- All sensitive data handled server-side only
