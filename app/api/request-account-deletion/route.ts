import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateRequest } from '@/lib/auth-middleware';
import { logSuccess, logFailure } from '@/lib/audit-log';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Rate limiting - 5 requests per 15 minutes
    const rateLimitResult = rateLimit(request, 5, 15 * 60 * 1000);
    if (rateLimitResult) {
      return rateLimitResult;
    }
    
    // SECURITY: Authenticate the request first
    const authResult = await authenticateRequest(request);
    if (authResult.error) {
      return authResult.error;
    }

    const authenticatedUser = authResult.user;
    const userId = authenticatedUser.id; // Use authenticated user ID, not from body
    const userEmail = authenticatedUser.email || ''; // Use authenticated email

    // Get optional metadata from body (if provided, but verify it matches authenticated user)
    const body = await request.json().catch(() => ({}));
    const userFirstName = body.userFirstName || '';
    const registrationMethod = body.registrationMethod || 'email';

    // Verify the email matches (if provided in body, it must match authenticated user)
    if (body.userEmail && body.userEmail !== userEmail) {
      return NextResponse.json(
        { error: 'Email mismatch - request email must match your account email' },
        { status: 403 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const resendApiKey = process.env.RESEND_API_KEY;
    const isProduction = process.env.NODE_ENV === 'production';
    const supabaseServiceRole = createClient(supabaseUrl, supabaseServiceRoleKey);

    // First, automatically pause their notifications by clearing schedule
    // Only clear notification_days - this effectively pauses notifications
    const { error: pauseError } = await supabaseServiceRole
      .from('user_preferences')
      .update({
        notification_days: [] // text[] - empty array (pauses notifications)
      })
      .eq('user_id', userId);

    if (pauseError) {
      console.error('Error pausing notifications during deletion request:', pauseError);
      // Continue with deletion request even if pause fails
    } else {
      console.log(`Notifications automatically paused for user: ${userId} during deletion request`);
    }

    // Send email to you about the deletion request
    const deletionRequestEmail = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Deletion Request - Ink-lings</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
          .user-info { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .action-required { background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 8px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🗑️ Account Deletion Request</h1>
            <p>A user has requested to delete their Ink-lings account</p>
          </div>
          
          <div class="content">
            <div class="user-info">
              <h3>User Details:</h3>
              <p><strong>User ID:</strong> ${userId}</p>
              <p><strong>Email:</strong> ${userEmail}</p>
              <p><strong>First Name:</strong> ${userFirstName || 'Not provided'}</p>
              <p><strong>Registration Method:</strong> ${registrationMethod || 'Email/Password'}</p>
              <p><strong>Status:</strong> ✅ Notifications automatically paused</p>
            </div>

            <div class="warning">
              <h3>⚠️ Important Notes:</h3>
              <p><strong>Registration Method:</strong> ${registrationMethod === 'google' ? 'Google OAuth' : 'Email/Password'}</p>
              ${registrationMethod === 'google' ? 
                '<p><strong>Google Users:</strong> You\'ll need to guide them to disconnect Ink-lings from their Google account security settings.</p>' : 
                '<p><strong>Email Users:</strong> Standard deletion process - just remove from database.</p>'
              }
            </div>

            <div class="action-required">
              <h3>🔧 Action Required:</h3>
              <p>Please manually delete this user from:</p>
              <ul>
                <li>Supabase Auth (users table)</li>
                <li>user_preferences table</li>
                <li>user_prompt_progress table</li>
                <li>prompt_history table</li>
              </ul>
              <p><strong>Note:</strong> This is a manual process to ensure safe deletion and proper cleanup.</p>
            </div>

            <p style="text-align: center; margin-top: 30px; color: #6c757d;">
              This email was sent from the Ink-lings account deletion request system.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send the email via Resend (non-prod can skip if key missing)
    if (!resendApiKey) {
      const msg = 'RESEND_API_KEY missing; skipping deletion email in non-production environment';
      if (isProduction) {
        console.error('Email service not configured for production');
        return NextResponse.json(
          { error: 'Failed to send deletion request' },
          { status: 500 }
        );
      } else {
        console.warn(msg);
      }
    } else {
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Ink-lings <support@inklingsjournal.live>',
          to: 'support@inklingsjournal.live', // Send to you
          subject: `🗑️ Account Deletion Request - ${userEmail}`,
          html: deletionRequestEmail,
        }),
      });

      if (!emailResponse.ok) {
        console.error('Failed to send deletion request email');
        return NextResponse.json(
          { error: 'Failed to send deletion request' },
          { status: 500 }
        );
      }
    }

    // Log the action for audit trail
    logSuccess(request, 'account_deletion_requested', userId, userEmail, {
      registrationMethod,
      userFirstName
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Your account deletion has been submitted. Your notifications have been paused and your account will be permanently deleted.' 
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logFailure(request, 'account_deletion_request_failed', undefined, undefined, errorMessage);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
