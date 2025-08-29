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

// Get rolling annual donation total (Aug to Aug)
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
    
    const payments = await stripe.paymentIntents.list({
      created: {
        gte: Math.floor(startDate.getTime() / 1000),
        lt: Math.floor(endDate.getTime() / 1000),
      },
      limit: 100,
    });
    
    // Filter for successful payments
    const successfulPayments = payments.data.filter(payment => 
      payment.status === 'succeeded'
    );
    
    // Sum up the amounts (convert from cents to dollars)
    const totalAmount = successfulPayments.reduce((sum, payment) => 
      sum + (payment.amount || 0), 0
    ) / 100;
    
    return totalAmount;
  } catch (error) {
    console.error('Error getting rolling annual donations:', error);
    return 0;
  }
}

// Get total lifetime donations
export async function getLifetimeDonations() {
  try {
    const payments = await stripe.paymentIntents.list({
      limit: 100,
    });
    
    // Filter for successful payments
    const successfulPayments = payments.data.filter(payment => 
      payment.status === 'succeeded'
    );
    
    // Sum up the amounts (convert from cents to dollars)
    const totalAmount = successfulPayments.reduce((sum, payment) => 
      sum + (payment.amount || 0), 0
    ) / 100;
    
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
              name: donationType === 'TIP_JAR' ? 'Ink-lings Tip Jar' : 'Ink-lings Coffee + Journal',
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
