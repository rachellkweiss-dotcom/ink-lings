import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseServiceRole = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    console.log(`Starting account deletion for user: ${userId}`);

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

    console.log(`Account successfully deleted for user: ${userId}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Account deleted successfully' 
    });

  } catch (error) {
    console.error('Error in delete account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


