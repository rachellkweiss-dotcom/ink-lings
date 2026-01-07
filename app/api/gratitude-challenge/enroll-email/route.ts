import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '@/lib/rate-limit';
import { logSuccess, logFailure } from '@/lib/audit-log';

/**
 * API endpoint for email-based gratitude enrollment
 * 
 * Flow:
 * 1. User clicks button in email with token
 * 2. We look up user_preferences by token
 * 3. Verify token hasn't expired
 * 4. Enroll user in gratitude_2026_participants
 * 5. Clear token from user_preferences
 * 6. Redirect to success page
 */
export async function GET(request: NextRequest) {
  try {
    // SECURITY: Rate limiting - 10 requests per minute
    const rateLimitResult = rateLimit(request, 10, 60 * 1000);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseServiceRole = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    // Validate token parameter
    if (!token) {
      console.error('Missing token parameter');
      return NextResponse.redirect('https://www.inklingsjournal.live/?error=invalid-token');
    }

    console.log(`Processing gratitude enrollment token: ${token.substring(0, 8)}...`);

    // Look up user_preferences by token
    const { data: userPrefs, error: lookupError } = await supabaseServiceRole
      .from('user_preferences')
      .select('user_id, gratitude_2026_token, gratitude_2026_expires, notification_email, timezone')
      .eq('gratitude_2026_token', token)
      .single();

    if (lookupError || !userPrefs) {
      console.error('Token not found or invalid:', lookupError?.message);
      logFailure(request, 'gratitude_enrollment_token_invalid', undefined, undefined, 'Token not found');
      return NextResponse.redirect('https://www.inklingsjournal.live/?error=invalid-token');
    }

    // Verify token hasn't expired
    if (userPrefs.gratitude_2026_expires) {
      const expirationDate = new Date(userPrefs.gratitude_2026_expires);
      const now = new Date();
      
      if (now > expirationDate) {
        console.error('Token has expired');
        logFailure(request, 'gratitude_enrollment_token_expired', userPrefs.user_id, userPrefs.notification_email, 'Token expired');
        
        // Clear expired token
        await supabaseServiceRole
          .from('user_preferences')
          .update({
            gratitude_2026_token: null,
            gratitude_2026_expires: null
          })
          .eq('user_id', userPrefs.user_id);
        
        return NextResponse.redirect('https://www.inklingsjournal.live/?error=token-expired');
      }
    }

    const userId = userPrefs.user_id;
    if (!userId) {
      console.error('User ID not found in user_preferences');
      return NextResponse.redirect('https://www.inklingsjournal.live/?error=invalid-user');
    }

    // Check if user is already enrolled
    const { data: existingEnrollment, error: checkError } = await supabaseServiceRole
      .from('gratitude_2026_participants')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine
      logFailure(request, 'gratitude_enrollment_check_failed', userId, userPrefs.notification_email, checkError.message);
      return NextResponse.redirect('https://www.inklingsjournal.live/?error=enrollment-error');
    }

    if (existingEnrollment) {
      // User already enrolled - reactivate if inactive
      if (!existingEnrollment.active) {
        const { error: updateError } = await supabaseServiceRole
          .from('gratitude_2026_participants')
          .update({
            active: true,
            updated_at: new Date().toISOString(),
            ...(userPrefs.timezone && { timezone: userPrefs.timezone })
          })
          .eq('user_id', userId);

        if (updateError) {
          logFailure(request, 'gratitude_enrollment_reactivation_failed', userId, userPrefs.notification_email, updateError.message);
          return NextResponse.redirect('https://www.inklingsjournal.live/?error=enrollment-error');
        }

        // Clear token after successful reactivation
        await supabaseServiceRole
          .from('user_preferences')
          .update({
            gratitude_2026_token: null,
            gratitude_2026_expires: null
          })
          .eq('user_id', userId);

        logSuccess(request, 'gratitude_enrollment_reactivated_email', userId, userPrefs.notification_email);
        return NextResponse.redirect('https://www.inklingsjournal.live/gratitude-challenge/enrolled');
      }

      // Already active - clear token and redirect
      await supabaseServiceRole
        .from('user_preferences')
        .update({
          gratitude_2026_token: null,
          gratitude_2026_expires: null
        })
        .eq('user_id', userId);

      return NextResponse.redirect('https://www.inklingsjournal.live/gratitude-challenge/enrolled');
    }

    // New enrollment - insert record
    const { data: newEnrollment, error: insertError } = await supabaseServiceRole
      .from('gratitude_2026_participants')
      .insert({
        user_id: userId,
        active: true,
        ...(userPrefs.timezone && { timezone: userPrefs.timezone })
      })
      .select()
      .single();

    if (insertError) {
      logFailure(request, 'gratitude_enrollment_failed', userId, userPrefs.notification_email, insertError.message);
      return NextResponse.redirect('https://www.inklingsjournal.live/?error=enrollment-error');
    }

    // Clear token after successful enrollment
    await supabaseServiceRole
      .from('user_preferences')
      .update({
        gratitude_2026_token: null,
        gratitude_2026_expires: null
      })
      .eq('user_id', userId);

    logSuccess(request, 'gratitude_enrollment_created_email', userId, userPrefs.notification_email);
    return NextResponse.redirect('https://www.inklingsjournal.live/gratitude-challenge/enrolled');

  } catch (error) {
    console.error('Error in gratitude email enrollment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logFailure(request, 'gratitude_enrollment_email_error', undefined, undefined, errorMessage);
    return NextResponse.redirect('https://www.inklingsjournal.live/?error=enrollment-error');
  }
}

