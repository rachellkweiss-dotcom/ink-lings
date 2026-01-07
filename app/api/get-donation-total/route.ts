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
    
    // Get checkout sessions within the rolling annual period
    // We use checkout sessions because they have the product/line item info
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
      created: {
        gte: startTimestamp,
        lt: endTimestamp
      },
      expand: ['data.line_items']
    });

    // Filter for:
    // 1. Completed payments
    // 2. Ink-lings products only (exclude Remember-lings)
    let totalDonations = 0;
    
    for (const session of sessions.data) {
      if (session.payment_status !== 'paid') continue;
      
      // Check if this is an Ink-lings donation by looking at line items
      const lineItems = session.line_items?.data || [];
      const isInklings = lineItems.some(item => {
        const productName = item.description || '';
        return productName.toLowerCase().includes('ink-lings') || 
               productName.toLowerCase().includes('inklings');
      });
      
      // Also check metadata for donationType (Ink-lings donations have this)
      const hasInklingsMetadata = session.metadata?.donationType !== undefined;
      
      if (isInklings || hasInklingsMetadata) {
        totalDonations += (session.amount_total || 0) / 100;
      }
    }

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

