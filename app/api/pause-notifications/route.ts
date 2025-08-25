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

    // Clear notification preferences to pause notifications
    const { error: updateError } = await supabaseServiceRole
      .from('user_preferences')
      .update({
        notification_days: [],
        notification_time: null,
        current_category_index: 0,
        last_prompt_sent: null
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error pausing notifications:', updateError);
      return NextResponse.json(
        { error: 'Failed to pause notifications' },
        { status: 500 }
      );
    }

    // Also clear prompt progress to reset their position
    const { error: progressError } = await supabaseServiceRole
      .from('user_prompt_progress')
      .delete()
      .eq('user_id', userId);

    if (progressError) {
      console.error('Error clearing prompt progress:', progressError);
      // Don't fail the whole operation for this
    }

    console.log(`Notifications paused for user: ${userId}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Notifications paused successfully' 
    });

  } catch (error) {
    console.error('Error in pause notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
