# Instagram Tracking & 3-Day Stats Pipeline Setup Guide

A reusable guide for connecting an Instagram Business account to automated analytics tracking, Discord reporting, and historical performance tracking via Supabase.

**Implemented for:** Ink-lings
**Reusable for:** Any app with an Instagram presence and a `social_media` table in Supabase

---

## Overview

This system does three things every 3 days:

1. **Pulls Instagram analytics** (follower count, post performance, reach, views, saves, shares) via the Instagram Graph API
2. **Posts a plain-text stats report to Discord** so bots and humans can read it
3. **Writes performance snapshots to a `social_media` table** in Supabase so your content bot has historical data to learn from

---

## Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Instagram API   │────▶│  Supabase Edge    │────▶│  Discord Webhook │
│  (Graph API)     │     │  Function (cron)  │     │  (plain text)    │
└──────────────────┘     └────────┬─────────┘     └──────────────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │  Supabase DB     │
                         │  social_media    │
                         │  table (JSONB)   │
                         └──────────────────┘
```

---

## Prerequisites

- Instagram Business or Creator account
- A Facebook Page linked to the Instagram account
- A Supabase project for your app (where the edge function runs)
- A Supabase project with a `social_media` table (can be the same or different project)
- A Discord webhook URL

---

## Step 1: Create a Meta App

1. Go to [developers.facebook.com/apps](https://developers.facebook.com/apps)
2. Click **Create App**
3. Select your use case (Instagram API is usually auto-suggested)
4. Select **Business** as the app type
5. Name it (e.g. `YourApp Stats`) and create

### Add the Instagram Product

1. In the app dashboard, scroll to the **Instagram** product card
2. Click **Set up**
3. This adds **API setup with Instagram login** to your left sidebar

### Add Permissions

In the left sidebar, go to **Permissions and features** and ensure these are enabled:

| Permission | Purpose |
|---|---|
| `instagram_business_basic` | Follower count, media list, likes, comments |
| `instagram_business_manage_insights` | Reach, views, saves, shares, total interactions |

Both are free and don't require App Review for your own account.

---

## Step 2: Generate an Access Token

1. In the left sidebar, click **Instagram > API setup with Instagram business login**
2. Add your Instagram account (click to log in)
3. Click **Generate token** next to the account
4. Copy the token -- **this is already long-lived (60 days)**

The stats function auto-refreshes this token every time it runs, so it stays alive indefinitely.

---

## Step 3: Get Your Instagram User ID

Run this in a browser or terminal (replace `YOUR_TOKEN`):

```
https://graph.instagram.com/v24.0/me?fields=user_id,username&access_token=YOUR_TOKEN
```

Copy the `user_id` from the response.

---

## Step 4: Get Your App Secret

In the Meta App Dashboard:
1. Go to **App settings > Basic**
2. Click **Show** next to the App Secret
3. Copy it

---

## Step 5: Set Supabase Secrets

Set these secrets on the Supabase project that runs your edge function:

```bash
supabase secrets set INSTAGRAM_ACCESS_TOKEN=your_token_here
supabase secrets set INSTAGRAM_USER_ID=your_user_id_here
supabase secrets set INSTAGRAM_APP_SECRET=your_app_secret_here
```

---

## Step 6: Social Media Table Setup

Your `social_media` table needs two columns for performance tracking:

```sql
ALTER TABLE public.social_media
  ADD COLUMN instagram_permalink text NULL,
  ADD COLUMN performance_history jsonb NULL DEFAULT '[]'::jsonb;

CREATE INDEX idx_social_media_instagram_permalink
  ON public.social_media (instagram_permalink)
  WHERE instagram_permalink IS NOT NULL;
```

If the `social_media` table is in a different Supabase project, also set these secrets on the app's Supabase project:

```bash
supabase secrets set CLAWDBOT_SUPABASE_URL=https://yourproject.supabase.co
supabase secrets set CLAWDBOT_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## Step 7: The Content-to-Stats Flow

### How it works end-to-end:

1. **Bot drafts a post** → creates a row in `social_media` with `posted = false`
2. **You see your posts for today** → review and post to Instagram
3. **You paste the Instagram permalink** into `instagram_permalink` on the row
   - Any URL format works: `/p/CODE/`, `/reel/CODE/`, `/reel/CODE/?igsh=...`
   - The system extracts the shortcode (`CODE`) for matching
4. **Every 3 days the stats dump runs** → matches posts by shortcode, appends a performance snapshot

### Performance snapshot format (JSONB):

```json
{
  "recorded_at": "2026-02-08T04:06:37.475Z",
  "reach": 43,
  "views": 51,
  "likes": 0,
  "comments": 0,
  "saved": 0,
  "shares": 0,
  "total_interactions": 0
}
```

Over time, each row's `performance_history` becomes an array of snapshots, giving the bot a historical view of how each post performed.

---

## Instagram API Reference

### Account Stats

```
GET https://graph.instagram.com/v24.0/{USER_ID}?fields=followers_count,follows_count,media_count&access_token={TOKEN}
```

### Recent Media

```
GET https://graph.instagram.com/v24.0/{USER_ID}/media?fields=id,caption,like_count,comments_count,timestamp,media_type,permalink&limit=20&access_token={TOKEN}
```

### Media Insights (per post)

```
GET https://graph.instagram.com/v24.0/{MEDIA_ID}/insights?metric=reach,saved,shares,views,total_interactions&access_token={TOKEN}
```

### Available metrics by media type:

| Metric | Feed (static) | Reels | Carousel | Stories |
|---|---|---|---|---|
| `reach` | Yes | Yes | Yes | Yes (24hr only) |
| `views` | Yes | Yes | Yes | Yes (24hr only) |
| `saved` | Yes | Yes | Yes | No |
| `shares` | Yes | Yes | Yes | Yes (24hr only) |
| `total_interactions` | Yes | Yes | Yes | Yes (24hr only) |
| `likes` | Yes | Yes | Yes | No |
| `comments` | Yes | Yes | Yes | No |

**Story limitation:** Story metrics expire after 24 hours. Since the stats dump runs every 3 days, stories won't be captured. Screenshot story insights manually if needed.

### Token Refresh

The token auto-refreshes on every stats run:

```
GET https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token={TOKEN}
```

Returns a new token valid for 60 more days.

---

## Discord Output Format

The stats report is sent as **plain text** (not an embed card) so bots can read it:

```
**📊 YourApp Stats Report**

**👥 Users**
New Users (Last 3 Days): 5
Total Authenticated Users: 40

**📸 Instagram (@your_handle)**
Followers: 41
Following: 113
Total Posts: 60

**📱 Posts Since Last Report (3)**
1. 🎬 Feb 7 — https://www.instagram.com/reel/ABC123/
   ❤️ 5 💬 2 👁️ 200 📣 150 💾 3 🔄 1
   Your caption here...
```

---

## Shortcode Matching Logic

Instagram posts have a unique shortcode that appears in all URL formats:

| URL Format | Shortcode |
|---|---|
| `https://www.instagram.com/p/ABC123/` | `ABC123` |
| `https://www.instagram.com/reel/ABC123/` | `ABC123` |
| `https://www.instagram.com/reel/ABC123/?igsh=xyz` | `ABC123` |

The regex used to extract it:

```javascript
url.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/)
```

This means users can paste any URL format from desktop or mobile and it will match correctly.

---

## Adapting for Another App

To set this up for a different app:

1. **Create a new Meta App** (or reuse the same one if using the same Instagram account)
2. **Generate a new access token** for that app's Instagram account
3. **Set the Supabase secrets** on that app's Supabase project
4. **Update the product filter** in `syncPerformanceToSocialMedia()`:
   ```javascript
   .ilike('product', 'your-app-name')
   ```
5. **Update the Discord message** with your app name and handle
6. **Update the app-specific stats** (the `fetchAppStats()` function is app-specific -- adapt the queries to your tables)
7. **Deploy the edge function** to the new app's Supabase project

The Instagram tracking and social media sync code is fully reusable -- only the app stats queries and Discord formatting need customization per app.

---

## Secrets Checklist

| Secret | Where to get it | Purpose |
|---|---|---|
| `INSTAGRAM_ACCESS_TOKEN` | Meta App Dashboard > Instagram > Generate token | API authentication |
| `INSTAGRAM_USER_ID` | `/me` endpoint response | Identify your account |
| `INSTAGRAM_APP_SECRET` | Meta App Dashboard > Settings > Basic | Token refresh |
| `DISCORD_STATS_WEBHOOK_URL` | Discord server > Channel settings > Integrations | Send reports |
| `DISCORD_STATS_CRON_SECRET` | Generate yourself (e.g. `openssl rand -hex 32`) | Secure the endpoint |
| `CLAWDBOT_SUPABASE_URL` | Supabase dashboard > Settings > API | Connect to social_media table |
| `CLAWDBOT_SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard > Settings > API | Write to social_media table |

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `Invalid OAuth access token` | Token expired or truncated. Generate a new one from the Meta App Dashboard |
| `performanceUpdates: 0` | Check that `product` value matches (case-insensitive) and `instagram_permalink` is filled in |
| Instagram section shows "not configured" | Redeploy the edge function after setting secrets (`supabase functions deploy`) |
| Insights return empty data | Insights can be delayed up to 48 hours for new posts |
| Stories not tracked | Expected -- story metrics expire after 24 hours, stats run every 3 days |
