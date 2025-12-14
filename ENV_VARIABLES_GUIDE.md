# Environment Variables Setup Guide

This guide explains where to add each environment variable for different parts of your application.

## 📋 Quick Summary

| Variable | GitHub Secrets | Vercel Env Vars | Local .env.local | Supabase Dashboard |
|----------|---------------|-----------------|------------------|-------------------|
| **SUPABASE_ACCESS_TOKEN** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **SUPABASE_PROJECT_ID** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **NEXT_PUBLIC_SUPABASE_URL** | ❌ No | ✅ Yes | ✅ Yes | ❌ No |
| **NEXT_PUBLIC_SUPABASE_ANON_KEY** | ❌ No | ✅ Yes | ✅ Yes | ❌ No |
| **SUPABASE_SERVICE_ROLE_KEY** | ❌ No | ✅ Yes | ✅ Yes | ❌ No |
| **RESEND_API_KEY** | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes (for edge functions) |
| **EMAIL_FROM** | ❌ No | ✅ Yes | ✅ Yes | ❌ No |
| **STRIPE_SECRET_KEY** | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes (for edge functions) |
| **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY** | ❌ No | ✅ Yes | ✅ Yes | ❌ No |
| **NEXT_PUBLIC_BASE_URL** | ❌ No | ✅ Yes | ✅ Yes | ❌ No |
| **NEXT_PUBLIC_ENABLE_SCHEDULER** | ❌ No | ✅ Yes | ✅ Yes | ❌ No |

---

## 1. 🔐 GitHub Secrets (For Auto-Deploying Edge Functions)

**Purpose:** Only used by GitHub Actions to deploy edge functions automatically.

**Location:** GitHub Repository → Settings → Secrets and variables → Actions

**Add these 2 secrets:**

```
SUPABASE_ACCESS_TOKEN = your_supabase_access_token_here
SUPABASE_PROJECT_ID = plbesopwfipvxqqzendc
```

**How to get SUPABASE_ACCESS_TOKEN:**
1. Go to https://supabase.com/dashboard/account/tokens
2. Click **Generate new token**
3. Give it a name (e.g., "GitHub Actions")
4. Copy the token and add it to GitHub Secrets

**Note:** These are ONLY for the GitHub Actions workflow. They don't affect your app runtime.

---

## 2. 🚀 Vercel Environment Variables (For Production Next.js App)

**Purpose:** Used by your Next.js app when running in production on Vercel.

**Location:** Vercel Dashboard → Your Project → Settings → Environment Variables

**Add ALL of these:**

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Email Configuration
RESEND_API_KEY=your_resend_api_key_here
EMAIL_FROM="Ink-lings <notifications@yourdomain.com>"

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
NEXT_PUBLIC_BASE_URL=https://your-production-domain.com

# Feature Flags
NEXT_PUBLIC_ENABLE_SCHEDULER=true
```

**Important:**
- Set these for **Production**, **Preview**, and **Development** environments
- Use your **production** values (not test keys)
- `NEXT_PUBLIC_BASE_URL` should be your actual production domain

---

## 3. 💻 Local .env.local (For Local Development)

**Purpose:** Used when running `npm run dev` on your local machine.

**Location:** `/Users/rachellweiss/Desktop/journal-app/ink-lings/.env.local`

**Add ALL of these (same as Vercel, but with local values):**

```bash
# Copy from env.example and fill in your actual values
RESEND_API_KEY=your_resend_api_key_here
EMAIL_FROM="Ink-lings <notifications@yourdomain.com>"

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Feature Flags
NEXT_PUBLIC_ENABLE_SCHEDULER=true
```

**Note:** 
- You can use **test** keys for Stripe in local development
- `NEXT_PUBLIC_BASE_URL` should be `http://localhost:3000` for local dev
- This file is in `.gitignore` and won't be committed to git

---

## 4. 🗄️ Supabase Dashboard (For Edge Functions)

**Purpose:** Used by Supabase Edge Functions when they run.

**Location:** Supabase Dashboard → Your Project → Settings → Edge Functions → Secrets

**Add these (if your edge functions need them):**

```bash
RESEND_API_KEY=your_resend_api_key_here
STRIPE_SECRET_KEY=your_stripe_secret_key_here
```

**Note:** 
- Supabase automatically provides `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to edge functions
- You only need to add secrets that your edge functions explicitly use (like `RESEND_API_KEY` and `STRIPE_SECRET_KEY`)
- Check your edge function code to see which `Deno.env.get()` calls it makes

**How to add:**
1. Go to Supabase Dashboard → Your Project
2. Click **Settings** → **Edge Functions**
3. Scroll to **Secrets** section
4. Add each secret as a key-value pair

---

## 📝 Summary Checklist

### ✅ For GitHub Actions (Auto-Deploy):
- [ ] Add `SUPABASE_ACCESS_TOKEN` to GitHub Secrets
- [ ] Add `SUPABASE_PROJECT_ID` to GitHub Secrets

### ✅ For Vercel (Production):
- [ ] Add all Next.js environment variables to Vercel
- [ ] Set `NEXT_PUBLIC_BASE_URL` to production domain
- [ ] Use production API keys (not test keys)

### ✅ For Local Development:
- [ ] Create `.env.local` file
- [ ] Copy values from `env.example`
- [ ] Set `NEXT_PUBLIC_BASE_URL` to `http://localhost:3000`
- [ ] Can use test keys for Stripe

### ✅ For Supabase Edge Functions:
- [ ] Add `RESEND_API_KEY` to Supabase Dashboard secrets
- [ ] Add `STRIPE_SECRET_KEY` to Supabase Dashboard secrets (if needed)
- [ ] Verify edge functions can access these secrets

---

## 🔍 How to Verify Everything is Set Up

1. **GitHub Actions:**
   - Push a change to `supabase/functions/`
   - Check GitHub Actions tab - should deploy successfully

2. **Vercel:**
   - Deploy your app
   - Check Vercel logs for any missing env var errors
   - Test your app in production

3. **Local:**
   - Run `npm run dev`
   - Check console for any missing env var warnings
   - Test your app locally

4. **Supabase Edge Functions:**
   - Trigger an edge function manually
   - Check Supabase logs for any missing secret errors

---

## ⚠️ Important Notes

- **Never commit `.env.local` to git** (it's in `.gitignore`)
- **GitHub Secrets are only for CI/CD**, not for app runtime
- **Vercel env vars** are for your Next.js app in production
- **Supabase secrets** are for edge functions only
- **Local `.env.local`** is for development only

---

## 🆘 Troubleshooting

**"Missing environment variable" error:**
- Check which environment you're in (local, Vercel, or Supabase)
- Verify the variable is set in the correct place (see table above)
- Check for typos in variable names
- Restart your dev server after changing `.env.local`

**Edge function can't access secrets:**
- Verify secrets are added in Supabase Dashboard → Settings → Edge Functions → Secrets
- Check that your edge function code uses `Deno.env.get('SECRET_NAME')`
- Redeploy the edge function after adding secrets

**GitHub Actions deployment fails:**
- Verify `SUPABASE_ACCESS_TOKEN` is valid (regenerate if needed)
- Check that `SUPABASE_PROJECT_ID` matches your project
- Look at GitHub Actions logs for specific error messages

