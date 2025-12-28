import { NextRequest, NextResponse } from 'next/server';
import { createDonationCheckoutSession } from '@/lib/stripe';
import { authenticateRequest } from '@/lib/auth-middleware';
import { validateRequestBody, donationSessionSchema } from '@/lib/api-validation';
import { rateLimit } from '@/lib/rate-limit';
import { logSuccess, logFailure } from '@/lib/audit-log';

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Rate limiting - 10 requests per minute
    const rateLimitResult = rateLimit(request, 10, 60 * 1000);
    if (rateLimitResult) {
      return rateLimitResult;
    }
    
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
      logFailure(request, 'donation_session_email_mismatch', authResult.user.id, authResult.user.email, 'Email mismatch');
      return NextResponse.json(
        { error: 'Email mismatch - donation email must match your account email' },
        { status: 403 }
      );
    }

    // Create donation session
    const session = await createDonationCheckoutSession(amount, customerEmail, donationType);

    // Log successful donation session creation
    logSuccess(request, 'donation_session_created', authResult.user.id, customerEmail, {
      amount,
      donationType,
      sessionId: session.id
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logFailure(request, 'donation_session_creation_failed', undefined, undefined, errorMessage);
    return NextResponse.json(
      { error: 'Failed to create donation session' },
      { status: 500 }
    );
  }
}
