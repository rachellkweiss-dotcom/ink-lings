import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // TODO: This will be replaced with actual Stripe webhook data
    // For now, returning mock data
    const mockDonationTotal = 125; // $125 in donations
    
    return NextResponse.json({
      success: true,
      total: mockDonationTotal,
      message: 'Donation total retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting donation total:', error);
    return NextResponse.json(
      { error: 'Failed to get donation total' },
      { status: 500 }
    );
  }
}

