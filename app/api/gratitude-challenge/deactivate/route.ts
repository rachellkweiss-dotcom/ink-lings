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

    // Deactivate enrollment (don't delete, just set active = false)
    const { error: updateError } = await supabaseServiceRole
      .from('gratitude_2026_participants')
      .update({
        active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      // If no record exists, that's fine - they're already not enrolled
      if (updateError.code === 'PGRST116') {
        return NextResponse.json({ 
          success: true,
          enrolled: false,
          active: false
        });
      }

      logFailure(request, 'gratitude_deactivation_failed', userId, authenticatedUser.email, updateError.message);
      return NextResponse.json(
        { error: 'Failed to deactivate enrollment' },
        { status: 500 }
      );
    }

    logSuccess(request, 'gratitude_enrollment_deactivated', userId, authenticatedUser.email);
    return NextResponse.json({ 
      success: true,
      enrolled: false,
      active: false
    });
  } catch (error) {
    console.error('Error in gratitude deactivation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


