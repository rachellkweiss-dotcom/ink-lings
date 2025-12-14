import { NextRequest, NextResponse } from 'next/server';
import { createDonationCheckoutSession } from '@/lib/stripe';
import { authenticateRequest } from '@/lib/auth-middleware';
import { validateRequestBody, donationSessionSchema } from '@/lib/api-validation';

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request);
    if (authResult.error) {
      return authResult.error;
    }

    // Validate request body
    const validationResult = await validateRequestBody(request, donationSessionSchema);
    if (validationResult.error) {
      return validationResult.error;
    }

    const { amount, donationType, customerEmail } = validationResult.data;

    // Verify that the authenticated user's email matches the donation email
    // (optional: you might want to allow donations for others)
    if (authResult.user.email !== customerEmail) {
      return NextResponse.json(
        { error: 'Email mismatch - donation email must match your account email' },
        { status: 403 }
      );
    }

    // Create donation session
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
