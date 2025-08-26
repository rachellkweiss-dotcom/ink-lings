import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET() {
  try {
    // Calculate rolling annual period (August 22 - August 22)
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Start date: August 22 of current year (or previous year if we're before August 22)
    let startYear = currentYear;
    if (now.getMonth() < 7 || (now.getMonth() === 7 && now.getDate() < 22)) {
      startYear = currentYear - 1;
    }
    
    const startDate = new Date(startYear, 7, 22); // Month 7 = August (0-indexed)
    const endDate = new Date(startYear + 1, 7, 22);
    
    // Convert to Unix timestamp for Stripe (seconds since epoch)
    const startTimestamp = Math.floor(startDate.getTime() / 1000);
    const endTimestamp = Math.floor(endDate.getTime() / 1000);
    
    // Get payments only within the rolling annual period
    const payments = await stripe.paymentIntents.list({
      limit: 100, // Get up to 100 payments
      status: 'succeeded',
      created: {
        gte: startTimestamp,
        lt: endTimestamp
      }
    });

    // Calculate total amount from payments within the period
    let totalDonations = 0;
    
    payments.data.forEach(payment => {
      // Convert from cents to dollars and add to total
      totalDonations += payment.amount / 100;
    });

    return NextResponse.json({
      success: true,
      total: totalDonations,
      message: `Rolling annual donation total (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}) retrieved from Stripe`
    });
  } catch (error) {
    console.error('Error getting donation total from Stripe:', error);
    
    // Fallback to 0 if Stripe fails
    return NextResponse.json({
      success: true,
      total: 0,
      message: 'Using fallback value due to Stripe error'
    });
  }
}

