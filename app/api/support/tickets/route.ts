import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateRequest } from '@/lib/auth-middleware';
import { logSuccess, logFailure } from '@/lib/audit-log';
import { rateLimit } from '@/lib/rate-limit';
import { createSupportThread, buildTicketMessage } from '@/lib/discord';

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Rate limiting - 3 requests per 15 minutes
    const rateLimitResult = rateLimit(request, 3, 15 * 60 * 1000);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Read body first (before auth consumes the request)
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Validate the body
    const { createSupportTicketSchema: schema } = await import('@/lib/api-validation');
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      );
    }

    // Auth is optional - try to authenticate but don't require it
    const authResult = await authenticateRequest(request);
    const authenticatedUser = authResult.error ? null : authResult.user;

    const { ticketType, subject, description, email, name, registrationMethod, userFirstName } = parsed.data;

    // If authenticated, verify email matches (if they provided one different from their account)
    const ticketEmail = authenticatedUser?.email || email;
    const ticketName = name || userFirstName || '';
    const ticketUserId = authenticatedUser?.id || null;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseServiceRole = createClient(supabaseUrl, supabaseServiceRoleKey);

    // For account deletion: pause notifications first
    if (ticketType === 'account_deletion' && ticketUserId) {
      const { error: pauseError } = await supabaseServiceRole
        .from('user_preferences')
        .update({ notification_days: [] })
        .eq('user_id', ticketUserId);

      if (pauseError) {
        console.error('Error pausing notifications during deletion request:', pauseError);
        // Continue - don't block ticket creation
      } else {
        console.log(`Notifications paused for user ${ticketUserId} (account deletion ticket)`);
      }
    }

    // Create the support ticket in the database
    const { data: ticket, error: ticketError } = await supabaseServiceRole
      .from('support_tickets')
      .insert({
        user_id: ticketUserId,
        email: ticketEmail,
        name: ticketName,
        ticket_type: ticketType,
        subject,
        status: 'open',
      })
      .select('id, token')
      .single();

    if (ticketError || !ticket) {
      console.error('Failed to create support ticket:', ticketError);
      return NextResponse.json(
        { error: 'Failed to create support ticket' },
        { status: 500 }
      );
    }

    // Create Discord thread first (so we can save the discord_message_id for deduplication)
    let discordThreadId: string | null = null;
    let discordInitialMessageId: string | null = null;
    try {
      const discordMessage = buildTicketMessage({
        ticketType,
        subject,
        description,
        email: ticketEmail,
        name: ticketName,
        userId: ticketUserId || undefined,
        token: ticket.token,
      });

      const { threadId, messageId } = await createSupportThread(
        `[${ticketType.toUpperCase()}] ${subject}`,
        discordMessage
      );
      discordThreadId = threadId;
      discordInitialMessageId = messageId;

      // Update ticket with Discord thread ID
      await supabaseServiceRole
        .from('support_tickets')
        .update({ discord_thread_id: threadId })
        .eq('id', ticket.id);
    } catch (discordError) {
      console.error('Failed to create Discord thread:', discordError);
      // Continue - ticket exists in DB, Discord integration is non-critical
    }

    // Save the initial user message
    // Include the Discord message ID so the poller skips the bot's forum post via deduplication
    const { error: messageError } = await supabaseServiceRole
      .from('support_messages')
      .insert({
        ticket_id: ticket.id,
        sender_type: 'user',
        sender_name: ticketName || ticketEmail,
        content: description,
        discord_message_id: discordInitialMessageId,
      });

    if (messageError) {
      console.error('Failed to save initial message:', messageError);
    }

    // Send confirmation email to user via Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://inklingsjournal.live';
    const chatUrl = `${siteUrl}/support/chat/${ticket.token}`;

    if (resendApiKey) {
      try {
        const typeLabel: Record<string, string> = {
          general_inquiry: 'General Inquiry',
          help: 'Help',
          bug: 'Bug Report',
          feature_request: 'Feature Request',
          request_data: 'Data Export Request',
          account_deletion: 'Account Deletion Request',
        };
        const resolvedTypeLabel = typeLabel[ticketType] || ticketType;

        const confirmationHtml = buildConfirmationEmail({
          subject,
          typeLabel: resolvedTypeLabel,
          chatUrl,
          ticketType,
          name: ticketName,
        });

        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Ink-lings <support@inklingsjournal.live>',
            to: ticketEmail,
            subject: `We received your request - Ink-lings Support`,
            html: confirmationHtml,
          }),
        });

        if (!emailResponse.ok) {
          console.error('Failed to send confirmation email:', await emailResponse.text());
        }
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
        // Continue - email failure is non-critical
      }
    } else if (process.env.NODE_ENV === 'production') {
      console.error('RESEND_API_KEY not configured in production');
    }

    // Audit log
    logSuccess(request, 'support_ticket_created', ticketUserId || undefined, ticketEmail, {
      ticketId: ticket.id,
      ticketType,
      subject,
      discordThreadId,
      registrationMethod,
    });

    return NextResponse.json({
      success: true,
      token: ticket.token,
      chatUrl,
      message: 'Support ticket created. Check your email for a link to track your request.',
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logFailure(request, 'support_ticket_creation_failed', undefined, undefined, errorMessage);
    console.error('Unexpected error creating support ticket:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Build the HTML for the confirmation email sent to the user.
 */
function buildConfirmationEmail(opts: {
  subject: string;
  typeLabel: string;
  chatUrl: string;
  ticketType: string;
  name: string;
}): string {
  const greeting = opts.name ? `Hi ${opts.name},` : 'Hi there,';
  const deletionNote = opts.ticketType === 'account_deletion'
    ? `<div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <p style="margin: 0; color: #856404;"><strong>Note:</strong> Your notifications have been paused and your account deletion is being processed. Your account and all associated data will be permanently removed.</p>
      </div>`
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>We received your request - Ink-lings</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f0f4ff;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2563eb, #06b6d4); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">We received your request</h1>
          <p style="margin: 8px 0 0; opacity: 0.9;">Ink-lings Support</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <p>${greeting}</p>
          
          <p>We received your support request and are working on it. We'll email you when we have a reply.</p>

          ${deletionNote}
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
            Ink-lings Support &bull; <a href="https://inklingsjournal.live" style="color: #2563eb; text-decoration: none;">inklingsjournal.live</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
