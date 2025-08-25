import Stripe from 'stripe';

// Initialize Stripe with your secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

// Donation product IDs (REPLACE THESE with your actual Stripe product IDs)
export const DONATION_PRODUCTS = {
  COFFEE_JOURNALING: 'prod_SvNgQyxt71h8az', // $5 one-time - replace with real ID
  MONTHLY_SUPPORTER: 'prod_SvNjImtjOWVK5t', // $5/month - replace with real ID
};

// Donation amounts
export const DONATION_AMOUNTS = {
  COFFEE_JOURNALING: 500, // $5.00 in cents
  MONTHLY_SUPPORTER: 500, // $5.00 in cents
};

// Create a checkout session for one-time donations
export async function createDonationCheckoutSession(
  amount: number,
  customerEmail: string,
  donationType: string
) {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Ink-lings ${donationType}`,
              description: 'Thank you for supporting Ink-lings!',
              images: [`${process.env.NEXT_PUBLIC_BASE_URL || 'https://ink-lings-uewn.vercel.app'}/ink_links_logo_final_final.png`], // Your logo
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'https://ink-lings-uewn.vercel.app/donation-success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://ink-lings-uewn.vercel.app/account',
      customer_email: customerEmail,
      metadata: {
        donationType,
        amount: amount.toString(),
      },
    });

    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

// Create a subscription for monthly donations
export async function createMonthlySubscriptionCheckoutSession(
  customerEmail: string
) {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Ink-lings Monthly Supporter',
              description: 'Monthly supporter subscription - thank you!',
              images: [`${process.env.NEXT_PUBLIC_BASE_URL || 'https://ink-lings-uewn.vercel.app'}/ink_links_logo_final_final.png`],
            },
            unit_amount: DONATION_AMOUNTS.MONTHLY_SUPPORTER,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: 'https://ink-lings-uewn.vercel.app/donation-success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://ink-lings-uewn.vercel.app/account',
      customer_email: customerEmail,
      metadata: {
        donationType: 'monthly_supporter',
        amount: DONATION_AMOUNTS.MONTHLY_SUPPORTER.toString(),
      },
    });

    return session;
  } catch (error) {
    console.error('Error creating subscription session:', error);
    throw error;
  }
}
