import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { rateLimit } from '@/lib/rate-limit';
import { logSuccess, logFailure } from '@/lib/audit-log';

export async function GET(request: NextRequest) {
  // Rate limiting: 30 requests per minute per IP (more lenient since it's just reading data)
  const rateLimitResponse = rateLimit(request, 30, 60000);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

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
      created: {
        gte: startTimestamp,
        lt: endTimestamp
      }
    });

    // Filter for successful payments
    const successfulPayments = payments.data.filter(payment => payment.status === 'succeeded');

    // Calculate total amount from successful payments within the period
    let totalDonations = 0;
    
    successfulPayments.forEach(payment => {
      // Convert from cents to dollars and add to total
      totalDonations += payment.amount / 100;
    });

    // Log successful data access (public endpoint, no user ID)
    logSuccess(request, 'donation_total_accessed', undefined, undefined, {
      total: totalDonations,
      period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
    });

    return NextResponse.json({
      success: true,
      total: totalDonations,
      message: `Rolling annual donation total (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}) retrieved from Stripe`
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logFailure(request, 'donation_total_access_failed', undefined, undefined, errorMessage);
    console.error('Error getting donation total from Stripe:', error);
    
    // Fallback to 0 if Stripe fails
    return NextResponse.json({
      success: true,
      total: 0,
      message: 'Using fallback value due to Stripe error'
    });
  }
}

