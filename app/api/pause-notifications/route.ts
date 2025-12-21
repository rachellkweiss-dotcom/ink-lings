import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateRequest } from '@/lib/auth-middleware';

export async function POST(request: NextRequest) {
  try {
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
      console.error('Error pausing notifications:', updateError);
      return NextResponse.json(
        { error: 'Failed to pause notifications' },
        { status: 500 }
      );
    }

    // DON'T clear prompt progress - keep it so users can resume where they left off
    // This makes pausing fully reversible

    // Log the action for audit trail
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      action: 'notifications_paused',
      userId: userId,
      userEmail: authenticatedUser.email,
      ip: ip,
      userAgent: request.headers.get('user-agent') || 'unknown'
    }));

    return NextResponse.json({ 
      success: true, 
      message: 'Notifications paused successfully. You can re-enable them anytime by updating your preferences.' 
    });

  } catch (error) {
    console.error('Error in pause notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
