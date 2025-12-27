import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateRequest } from '@/lib/auth-middleware';
import { rateLimit } from '@/lib/rate-limit';
import { logSuccess, logFailure } from '@/lib/audit-log';

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Rate limiting - 10 requests per minute
    const rateLimitResult = rateLimit(request, 10, 60 * 1000);
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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseServiceRole = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Clear only notification schedule to pause notifications (keeping all other data)
    // Only clear notification_days - this effectively pauses notifications
    const { error: updateError } = await supabaseServiceRole
      .from('user_preferences')
      .update({
        notification_days: [] // text[] - empty array (pauses notifications)
      })
      .eq('user_id', userId);

    if (updateError) {
      logFailure(request, 'notifications_pause_failed', userId, authenticatedUser.email, updateError.message);
      return NextResponse.json(
        { error: 'Failed to pause notifications' },
        { status: 500 }
      );
    }

    // DON'T clear prompt progress - keep it so users can resume where they left off
    // This makes pausing fully reversible

    // Log the action for audit trail
    logSuccess(request, 'notifications_paused', userId, authenticatedUser.email);

    return NextResponse.json({ 
      success: true, 
      message: 'Notifications paused successfully. You can re-enable them anytime by updating your preferences.' 
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logFailure(request, 'notifications_pause_failed', undefined, undefined, errorMessage);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
