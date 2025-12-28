import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateRequest } from '@/lib/auth-middleware';
import { rateLimit } from '@/lib/rate-limit';
import { logSuccess, logFailure } from '@/lib/audit-log';

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Rate limiting - 5 requests per minute
    const rateLimitResult = rateLimit(request, 5, 60 * 1000);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // SECURITY: Authenticate the request
    const authResult = await authenticateRequest(request);
    if (authResult.error) {
      return authResult.error;
    }

    const authenticatedUser = authResult.user;
    const userId = authenticatedUser.id;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseServiceRole = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get user's timezone from request body (optional, for reference)
    const { timezone } = await request.json().catch(() => ({}));

    // Check if user is already enrolled
    const { data: existingEnrollment, error: checkError } = await supabaseServiceRole
      .from('gratitude_2026_participants')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine
      logFailure(request, 'gratitude_enrollment_check_failed', userId, authenticatedUser.email, checkError.message);
      return NextResponse.json(
        { error: 'Failed to check enrollment status' },
        { status: 500 }
      );
    }

    if (existingEnrollment) {
      // User already enrolled - reactivate if inactive
      if (!existingEnrollment.active) {
        const { error: updateError } = await supabaseServiceRole
          .from('gratitude_2026_participants')
          .update({
            active: true,
            updated_at: new Date().toISOString(),
            ...(timezone && { timezone })
          })
          .eq('user_id', userId);

        if (updateError) {
          logFailure(request, 'gratitude_enrollment_reactivation_failed', userId, authenticatedUser.email, updateError.message);
          return NextResponse.json(
            { error: 'Failed to reactivate enrollment' },
            { status: 500 }
          );
        }

        logSuccess(request, 'gratitude_enrollment_reactivated', userId, authenticatedUser.email);
        return NextResponse.json({ 
          success: true,
          enrolled: true,
          active: true
        });
      }

      // Already active
      return NextResponse.json({ 
        success: true,
        enrolled: true,
        active: true
      });
    }

    // New enrollment - insert record
    const { data: newEnrollment, error: insertError } = await supabaseServiceRole
      .from('gratitude_2026_participants')
      .insert({
        user_id: userId,
        active: true,
        notification_time_utc: '16:00:00', // 11:00 AM EST
        ...(timezone && { timezone })
      })
      .select()
      .single();

    if (insertError) {
      logFailure(request, 'gratitude_enrollment_failed', userId, authenticatedUser.email, insertError.message);
      return NextResponse.json(
        { error: 'Failed to enroll in gratitude challenge' },
        { status: 500 }
      );
    }

    logSuccess(request, 'gratitude_enrollment_created', userId, authenticatedUser.email);
    return NextResponse.json({ 
      success: true,
      enrolled: true,
      active: true
    });
  } catch (error) {
    console.error('Error in gratitude enrollment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

