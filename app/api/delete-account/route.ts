import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateRequest } from '@/lib/auth-middleware';
import { rateLimit } from '@/lib/rate-limit';
import { logSuccess, logFailure } from '@/lib/audit-log';

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Rate limiting - 5 requests per 15 minutes
    const rateLimitResult = rateLimit(request, 5, 15 * 60 * 1000);
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

    // Log the action for audit trail
    logSuccess(request, 'account_deletion_started', userId, authenticatedUser.email);

    // 1. Delete prompt history
    const { error: historyError } = await supabaseServiceRole
      .from('prompt_history')
      .delete()
      .eq('user_id', userId);

    if (historyError) {
      console.error('Error deleting prompt history:', historyError);
    }

    // 2. Delete user prompt progress
    const { error: progressError } = await supabaseServiceRole
      .from('user_prompt_progress')
      .delete()
      .eq('user_id', userId);

    if (progressError) {
      console.error('Error deleting prompt progress:', progressError);
    }

    // 3. Delete user preferences
    const { error: prefsError } = await supabaseServiceRole
      .from('user_preferences')
      .delete()
      .eq('user_id', userId);

    if (prefsError) {
      console.error('Error deleting user preferences:', prefsError);
    }

    // 4. Delete the auth user (this will also clean up any other auth-related data)
    const { error: authError } = await supabaseServiceRole.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Error deleting auth user:', authError);
      return NextResponse.json(
        { error: 'Failed to delete auth user' },
        { status: 500 }
      );
    }

    // Log successful deletion
    logSuccess(request, 'account_deletion_completed', userId, authenticatedUser.email);

    return NextResponse.json({ 
      success: true, 
      message: 'Account deleted successfully' 
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logFailure(request, 'account_deletion_failed', undefined, undefined, errorMessage);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



