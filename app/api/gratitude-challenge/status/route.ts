import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateRequest } from '@/lib/auth-middleware';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  try {
    // SECURITY: Rate limiting - 20 requests per minute
    const rateLimitResult = rateLimit(request, 20, 60 * 1000);
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

    // Check enrollment status
    const { data: enrollment, error } = await supabaseServiceRole
      .from('gratitude_2026_participants')
      .select('active, enrolled_at, last_prompt_sent')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which means not enrolled
      return NextResponse.json(
        { error: 'Failed to check enrollment status' },
        { status: 500 }
      );
    }

    if (!enrollment) {
      return NextResponse.json({
        enrolled: false,
        active: false
      });
    }

    return NextResponse.json({
      enrolled: true,
      active: enrollment.active,
      enrolled_at: enrollment.enrolled_at,
      last_prompt_sent: enrollment.last_prompt_sent
    });
  } catch (error) {
    console.error('Error checking gratitude status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

