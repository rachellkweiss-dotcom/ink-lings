import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '@/lib/rate-limit';
import { logSuccess, logFailure } from '@/lib/audit-log';
import { validateRequestBody, supportTicketReplySchema } from '@/lib/api-validation';
import { postToThread } from '@/lib/discord';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    // Rate limiting: 10 requests per 5 minutes
    const rateLimitResult = rateLimit(request, 10, 5 * 60 * 1000);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const { token } = await params;

    if (!token || token.length < 10) {
      return NextResponse.json(
        { error: 'Invalid ticket token' },
        { status: 400 }
      );
    }

    // Validate request body
    const validationResult = await validateRequestBody(request, supportTicketReplySchema);
    if (validationResult.error) {
      return validationResult.error;
    }

    const { content } = validationResult.data;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseServiceRole = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Fetch the ticket to verify it exists and get metadata
    const { data: ticket, error: ticketError } = await supabaseServiceRole
      .from('support_tickets')
      .select('id, email, name, status, discord_thread_id')
      .eq('token', token)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Don't allow replies to closed/resolved tickets
    if (ticket.status === 'closed' || ticket.status === 'resolved') {
      return NextResponse.json(
        { error: 'This ticket has been resolved and is no longer accepting replies.' },
        { status: 400 }
      );
    }

    // Save the message to the database
    const { data: message, error: messageError } = await supabaseServiceRole
      .from('support_messages')
      .insert({
        ticket_id: ticket.id,
        sender_type: 'user',
        sender_name: ticket.name || ticket.email,
        content,
      })
      .select('id, created_at')
      .single();

    if (messageError || !message) {
      console.error('Failed to save message:', messageError);
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      );
    }

    // Update the ticket's updated_at timestamp
    await supabaseServiceRole
      .from('support_tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', ticket.id);

    // Post the message to the Discord thread
    let discordMessageId: string | null = null;
    if (ticket.discord_thread_id) {
      try {
        const discordContent = `**${ticket.name || ticket.email}** replied:\n\n${content}`;
        discordMessageId = await postToThread(ticket.discord_thread_id, discordContent);

        // Update the message with the Discord message ID
        if (discordMessageId) {
          await supabaseServiceRole
            .from('support_messages')
            .update({ discord_message_id: discordMessageId })
            .eq('id', message.id);
        }
      } catch (discordError) {
        console.error('Failed to post reply to Discord:', discordError);
        // Continue - message was saved to DB, Discord post is non-critical
      }
    }

    logSuccess(request, 'support_message_sent', undefined, ticket.email, {
      ticketId: ticket.id,
      messageId: message.id,
      discordMessageId,
    });

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        senderType: 'user',
        senderName: ticket.name || ticket.email,
        content,
        createdAt: message.created_at,
      },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logFailure(request, 'support_message_failed', undefined, undefined, errorMessage);
    console.error('Unexpected error sending support message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
