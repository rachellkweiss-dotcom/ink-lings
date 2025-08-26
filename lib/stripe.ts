import Stripe from 'stripe';

// Initialize Stripe with your secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

// Donation product IDs (Live mode)
export const DONATION_PRODUCTS = {
  TIP_JAR: 'prod_Sw59teK5QnVEnG', // Tip jar product
  COFFEE_JOURNALING: 'prod_Sw5896ssG1Cu0F', // Coffee + Journal product
};

// Donation amounts (in cents)
export const DONATION_AMOUNTS = {
  TIP_JAR: 500, // $5.00 tip jar amount
  COFFEE_JOURNALING: 500, // $5.00 coffee + journal amount
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
              name: donationType === 'TIP_JAR' ? 'Ink-lings Tip Jar' : 'Ink-lings Coffee + Journal',
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
