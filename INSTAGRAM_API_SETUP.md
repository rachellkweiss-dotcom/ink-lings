# Instagram Graph API Setup Guide

This guide walks through setting up the Instagram Graph API integration so that Ink-lings' Discord stats bot reports Instagram follower count and post performance alongside app and GA stats.

## What You'll Get

Once configured, the Discord stats report will include:
- **Follower count** (and following count)
- **Total posts** on the account
- **Recent posts performance** (likes, comments, date, caption preview)
- **Automatic token refresh** (token auto-refreshes every 3 days to stay alive)

---

## Prerequisites

- Access to the @ink_lings_journal Instagram account
- A Facebook account (personal is fine -- it won't be public-facing)

---

## Step 1: Switch to an Instagram Business Account (Free)

1. Open the Instagram app on your phone
2. Go to your profile (@ink_lings_journal)
3. Tap the **hamburger menu** (three lines, top right)
4. Tap **Settings and Privacy**
5. Scroll to **Account type and tools**
6. Tap **Switch to professional account**
7. Choose **Business** (not Creator)
8. Follow the prompts to connect or create a Facebook Page
   - You can create a minimal page (e.g., "Ink-lings Journal") -- it doesn't need to be active
9. Complete the setup

**Cost: Free**

---

## Step 2: Create a Meta Developer App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Log in with the Facebook account linked to the Instagram Business account
3. Click **My Apps** (top right) → **Create App**
4. Choose app type: **Business**
5. Name it something like "Ink-lings Stats" 
6. Click **Create App**
7. On the app dashboard, find **Instagram** in the product list and click **Set Up**

---

## Step 3: Configure Instagram Business Login Permissions

1. In your Meta App, go to **App Review** → **Permissions and Features**
2. Request the following permissions:
   - `instagram_business_basic` -- required for account info and media
   - `instagram_business_manage_insights` -- required for follower count (accounts with 100+ followers)
3. For development/testing, these permissions work immediately for your own account without review
4. Note: If your account has fewer than 100 followers, `followers_count` may not be available via the API (you can still see it in the app)

---

## Step 4: Generate an Access Token

### Option A: Using the Graph API Explorer (Easiest)

1. Go to the [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app ("Ink-lings Stats") from the dropdown
3. Click **Generate Access Token**
4. Grant the `instagram_business_basic` and `instagram_business_manage_insights` permissions
5. This gives you a **short-lived token** (valid ~1 hour)

### Option B: Using Instagram Business Login

1. In your Meta App dashboard, go to **Instagram** → **Basic Display** or **Instagram Business Login**
2. Follow the authorization flow to get a short-lived token

### Exchange for a Long-Lived Token

The short-lived token needs to be exchanged for a **long-lived token** (60 days):

```bash
curl -X GET "https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=YOUR_APP_SECRET&access_token=YOUR_SHORT_LIVED_TOKEN"
```

The response will contain:
```json
{
  "access_token": "IGQVJ...(long token)...",
  "token_type": "bearer",
  "expires_in": 5184000
}
```

Save the `access_token` value -- this is your **INSTAGRAM_ACCESS_TOKEN**.

**Important:** The Discord stats function automatically refreshes this token every 3 days (each time the cron runs). As long as the function runs at least once every 60 days, the token never expires. However, since the refreshed token is logged but can't auto-update Supabase secrets, you should plan to update the secret periodically (see Step 6).

---

## Step 5: Get Your Instagram User ID

Using your long-lived token, run:

```bash
curl -X GET "https://graph.instagram.com/v22.0/me?fields=id,username&access_token=YOUR_LONG_LIVED_TOKEN"
```

Response:
```json
{
  "id": "17841400123456789",
  "username": "ink_lings_journal"
}
```

Save the `id` value -- this is your **INSTAGRAM_USER_ID**.

---

## Step 6: Add Secrets to Supabase

Add these three secrets to your Supabase Edge Functions:

```bash
# Set the secrets via Supabase CLI
supabase secrets set INSTAGRAM_ACCESS_TOKEN="your_long_lived_token_here"
supabase secrets set INSTAGRAM_USER_ID="your_instagram_user_id_here"
supabase secrets set INSTAGRAM_APP_SECRET="your_meta_app_secret_here"
```

To find your **App Secret**:
1. Go to your Meta App dashboard
2. Click **Settings** → **Basic**
3. Click **Show** next to the App Secret field

---

## Step 7: Deploy the Updated Edge Function

Deploy the updated `send-discord-stats` function:

```bash
supabase functions deploy send-discord-stats
```

---

## Step 8: Test It

Trigger the stats function manually to verify Instagram data appears:

```bash
curl -X POST "https://plbesopwfipvxqqzendc.supabase.co/functions/v1/send-discord-stats" \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: YOUR_DISCORD_STATS_CRON_SECRET"
```

Check Discord for the stats report -- you should see a new "Instagram (@ink_lings_journal)" section with follower count and recent post performance.

---

## Token Maintenance

### How Token Refresh Works
- The edge function automatically tries to refresh the token every time it runs (every 3 days)
- Refreshed tokens are valid for another 60 days from the refresh date
- The function logs the refreshed token and how many days until expiration
- **Limitation:** The refreshed token is used for that run, but the Supabase secret still holds the old token

### Recommended Maintenance
- **Every 30-45 days**: Check the Discord stats report for the token expiry note
- If you see "Token: Refreshed (expires in X days)" and X is getting low, generate a fresh long-lived token and update the Supabase secret:
  ```bash
  supabase secrets set INSTAGRAM_ACCESS_TOKEN="new_refreshed_token"
  ```
- Alternatively, you could set up a separate cron job or edge function that stores the refreshed token back to a Supabase table and reads from there instead of env vars

### If the Token Expires
- The Instagram section will show "not configured" in the Discord report
- Other stats (app + GA) will still work normally
- Generate a new token by repeating Steps 4-6

---

## Environment Variables Reference

| Variable | Where | Description |
|----------|-------|-------------|
| `INSTAGRAM_ACCESS_TOKEN` | Supabase Secrets | Long-lived Instagram access token (60-day expiry, auto-refreshed) |
| `INSTAGRAM_USER_ID` | Supabase Secrets | Instagram Business account numeric ID |
| `INSTAGRAM_APP_SECRET` | Supabase Secrets | Meta App secret (from App Dashboard → Settings → Basic) |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Instagram credentials not configured" in Discord | Verify secrets are set: `supabase secrets list` |
| Token refresh failing | Token may have expired. Generate a new one (Steps 4-6) |
| `followers_count` shows 0 | Account may have <100 followers (API limitation) |
| 403 error on media endpoint | Check that `instagram_business_basic` permission is granted |
| "OAuthException" errors | Token is expired or invalid. Generate a new one |
