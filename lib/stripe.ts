import Stripe from 'stripe';

// Lazy-initialized Stripe client to avoid build-time errors
let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    stripeInstance = new Stripe(apiKey, {
      apiVersion: '2025-12-15.clover',
    });
  }
  return stripeInstance;
}

// Export a getter function instead of the instance directly
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripe()[prop as keyof Stripe];
  }
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

// Get rolling annual donation total (Aug to Aug) - Ink-lings only
export async function getRollingAnnualDonations() {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11, so August is 7
    
    // If we're before August, use previous year as start
    const startYear = currentMonth < 7 ? currentYear - 1 : currentYear;
    const startDate = new Date(startYear, 7, 1); // August 1st
    
    // If we're after August, use current year as end
    const endYear = currentMonth >= 7 ? currentYear + 1 : currentYear;
    const endDate = new Date(endYear, 7, 1); // August 1st of next year
    
    // Use checkout sessions to filter by product
    const sessions = await stripe.checkout.sessions.list({
      created: {
        gte: Math.floor(startDate.getTime() / 1000),
        lt: Math.floor(endDate.getTime() / 1000),
      },
      limit: 100,
      expand: ['data.line_items']
    });
    
    let totalAmount = 0;
    
    for (const session of sessions.data) {
      if (session.payment_status !== 'paid') continue;
      
      // Check if this is an Ink-lings donation
      const lineItems = session.line_items?.data || [];
      const isInklings = lineItems.some(item => {
        const productName = item.description || '';
        return productName.toLowerCase().includes('ink-lings') || 
               productName.toLowerCase().includes('inklings');
      });
      
      const hasInklingsMetadata = session.metadata?.donationType !== undefined;
      
      if (isInklings || hasInklingsMetadata) {
        totalAmount += (session.amount_total || 0) / 100;
      }
    }
    
    return totalAmount;
  } catch (error) {
    console.error('Error getting rolling annual donations:', error);
    return 0;
  }
}

// Get total lifetime donations - Ink-lings only
export async function getLifetimeDonations() {
  try {
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
      expand: ['data.line_items']
    });
    
    let totalAmount = 0;
    
    for (const session of sessions.data) {
      if (session.payment_status !== 'paid') continue;
      
      // Check if this is an Ink-lings donation
      const lineItems = session.line_items?.data || [];
      const isInklings = lineItems.some(item => {
        const productName = item.description || '';
        return productName.toLowerCase().includes('ink-lings') || 
               productName.toLowerCase().includes('inklings');
      });
      
      const hasInklingsMetadata = session.metadata?.donationType !== undefined;
      
      if (isInklings || hasInklingsMetadata) {
        totalAmount += (session.amount_total || 0) / 100;
      }
    }
    
    return totalAmount;
  } catch (error) {
    console.error('Error getting lifetime donations:', error);
    return 0;
  }
}

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
              name: donationType === 'custom_donation' || donationType === 'one-time' 
                ? 'Ink-lings Tip Jar' 
                : donationType === 'coffee_journaling' 
                ? 'Ink-lings Coffee + Journal'
                : 'Ink-lings Donation',
              description: 'Thank you for supporting Ink-lings!',
              images: [`${process.env.NEXT_PUBLIC_BASE_URL || 'https://inklingsjournal.live'}/ink_links_logo_final_final.png`], // Your logo
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
              success_url: 'https://inklingsjournal.live/donation-success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'https://inklingsjournal.live/account',
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
