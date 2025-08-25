import { NextRequest, NextResponse } from 'next/server';
import { createDonationCheckoutSession } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const { amount, donationType, customerEmail } = await request.json();

    if (!customerEmail) {
      return NextResponse.json(
        { error: 'Customer email is required' },
        { status: 400 }
      );
    }

    // Create one-time donation
    const session = await createDonationCheckoutSession(amount, customerEmail, donationType);

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });

  } catch (error) {
    console.error('Error creating donation session:', error);
    return NextResponse.json(
      { error: 'Failed to create donation session' },
      { status: 500 }
    );
  }
}
