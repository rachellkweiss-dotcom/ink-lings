import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '@/lib/rate-limit';
import { logSuccess, logFailure } from '@/lib/audit-log';
import { postToThread } from '@/lib/discord';

export async function GET(request: NextRequest) {
  // Rate limiting: 10 requests per minute per IP
  const rateLimitResponse = rateLimit(request, 10, 60000);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://inklingsjournal.live';

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseServiceRole = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const ratingStr = searchParams.get('rating');

    // Validate required parameters
    if (!token || !ratingStr) {
      return NextResponse.redirect(`${siteUrl}/?error=invalid-feedback`);
    }

    const rating = parseInt(ratingStr, 10);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      return NextResponse.redirect(`${siteUrl}/?error=invalid-feedback`);
    }

    // Look up the ticket
    const { data: ticket, error: ticketError } = await supabaseServiceRole
      .from('support_tickets')
      .select('id, token, rating, status, discord_thread_id, email')
      .eq('token', token)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.redirect(`${siteUrl}/?error=invalid-feedback`);
    }

    // If already rated, just redirect to thank you (idempotent)
    if (ticket.rating !== null) {
      return NextResponse.redirect(`${siteUrl}/support/feedback-thanks?message=already-rated`);
    }

    // Save the rating
    const { error: updateError } = await supabaseServiceRole
      .from('support_tickets')
      .update({ rating })
      .eq('id', ticket.id);

    if (updateError) {
      logFailure(request, 'support_rating_failed', undefined, ticket.email, updateError.message);
      return NextResponse.redirect(`${siteUrl}/?error=feedback-error`);
    }

    // Post the rating to the Discord thread
    if (ticket.discord_thread_id) {
      try {
        const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
        await postToThread(
          ticket.discord_thread_id,
          `**User Feedback:** ${stars} (${rating}/5)`
        );
      } catch (discordError) {
        console.error('Failed to post rating to Discord:', discordError);
        // Continue - rating was saved, Discord post is non-critical
      }
    }

    logSuccess(request, 'support_rating_submitted', undefined, ticket.email, {
      ticketId: ticket.id,
      rating,
    });

    return NextResponse.redirect(`${siteUrl}/support/feedback-thanks`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logFailure(request, 'support_rating_failed', undefined, undefined, errorMessage);
    return NextResponse.redirect(`${siteUrl}/?error=feedback-error`);
  }
}
