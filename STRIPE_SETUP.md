# 🚀 Stripe Donation System Setup Guide

## **Overview**
This guide will help you set up Stripe donations for your Ink-lings journaling app. Users can make one-time donations or subscribe to monthly support.

## **Step 1: Create Stripe Account**
1. Go to [stripe.com](https://stripe.com) and create an account
2. Complete your business verification
3. Get your API keys from the Stripe Dashboard

## **Step 2: Get Your API Keys**
1. In Stripe Dashboard, go to **Developers** → **API keys**
2. Copy your **Publishable key** (starts with `pk_`)
3. Copy your **Secret key** (starts with `sk_`)
4. Add them to your `.env.local` file:

```bash
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## **Step 3: Create Donation Products**
1. In Stripe Dashboard, go to **Products**
2. Create these products:

### **Coffee & Journaling ($5 one-time)**
- **Name**: Coffee & Journaling
- **Price**: $5.00 USD
- **Billing**: One-time
- **Product ID**: `prod_coffee_journaling`

### **Monthly Supporter ($5/month)**
- **Name**: Monthly Supporter
- **Price**: $5.00 USD
- **Billing**: Recurring (monthly)
- **Product ID**: `prod_monthly_supporter`

## **Step 4: Test the System**
1. Start your development server: `npm run dev`
2. Go to your account page
3. Try making a test donation
4. Check Stripe Dashboard for successful payments

## **Step 5: Go Live**
1. Switch to **Live mode** in Stripe Dashboard
2. Update your API keys to live keys
3. Update `NEXT_PUBLIC_BASE_URL` to your production domain
4. Test with real payments

## **Donation Tiers**
- **$5** - "Coffee & Journaling" ☕ (One-time)
- **$5** - "Monthly Supporter" 📚 (Recurring monthly)
- **Custom** - "Digital Tip Jar" 💌 (Pay what you want)

## **Security Notes**
- Never expose your `STRIPE_SECRET_KEY` in client-side code
- Always use HTTPS in production
- Implement webhook verification for production use

## **Troubleshooting**
- **"Invalid API key"**: Check your API keys are correct
- **"Product not found"**: Verify product IDs match exactly
- **"Invalid amount"**: Ensure amounts are in cents (500 = $5.00)

## **Next Steps**
- Set up webhooks for payment confirmations
- Add donation history tracking
- Implement donor recognition features
- Set up recurring payment management

## **Support**
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)
- Check your browser console for error messages

---

**💡 Pro Tip**: Start with test mode to avoid real charges while testing!
