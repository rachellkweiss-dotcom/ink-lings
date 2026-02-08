import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    // Rate limiting: 30 requests per minute
    const rateLimitResult = rateLimit(request, 30, 60 * 1000);
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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseServiceRole = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Fetch the ticket by token
    const { data: ticket, error: ticketError } = await supabaseServiceRole
      .from('support_tickets')
      .select('id, token, email, name, ticket_type, subject, status, created_at, updated_at, resolved_at')
      .eq('token', token)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Fetch all messages for this ticket
    const { data: messages, error: messagesError } = await supabaseServiceRole
      .from('support_messages')
      .select('id, sender_type, sender_name, content, created_at')
      .eq('ticket_id', ticket.id)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Failed to fetch messages:', messagesError);
      return NextResponse.json(
        { error: 'Failed to load messages' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ticket: {
        token: ticket.token,
        email: ticket.email,
        name: ticket.name,
        ticketType: ticket.ticket_type,
        subject: ticket.subject,
        status: ticket.status,
        createdAt: ticket.created_at,
        updatedAt: ticket.updated_at,
        resolvedAt: ticket.resolved_at,
      },
      messages: (messages || []).map((msg) => ({
        id: msg.id,
        senderType: msg.sender_type,
        senderName: msg.sender_name,
        content: msg.content,
        createdAt: msg.created_at,
      })),
    });

  } catch (error) {
    console.error('Unexpected error fetching ticket:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
