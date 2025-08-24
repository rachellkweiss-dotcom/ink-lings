import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a service role client that bypasses RLS for testing
const supabaseServiceRole = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('=== create-test-user API started ===');
    
    const body = await request.json();
    console.log('Request body:', body);
    
    const { email, timezone, notificationDays, notificationTime, categories } = body;

    // Create a real auth user for testing
    console.log('Creating real auth user...');
    const { data: authUser, error: authError } = await supabaseServiceRole.auth.admin.createUser({
      email: email,
      password: 'testpassword123',
      email_confirm: true,
      user_metadata: {
        first_name: 'Test',
        last_name: 'User'
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return NextResponse.json(
        { error: 'Failed to create auth user', details: authError },
        { status: 500 }
      );
    }

    const userId = authUser.user.id;
    console.log('Created real auth user ID:', userId);

    // Test database connection first
    console.log('Testing database connection...');
    const { data: testData, error: testError } = await supabaseServiceRole
      .from('user_preferences')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('Database connection test failed:', testError);
      return NextResponse.json(
        { error: 'Database connection failed', details: testError },
        { status: 500 }
      );
    }
    
    console.log('Database connection successful');

    // Create user preferences directly (no UTC calculation needed)
    console.log('Creating user preferences...');
    console.log(`User preferred time: ${notificationTime} ${timezone}`);
    
    const { data: preferences, error: prefsError } = await supabaseServiceRole
      .from('user_preferences')
      .insert({
        user_id: userId,
        notification_email: email,
        notification_days: notificationDays,
        notification_time: notificationTime,
        timezone: timezone,
        categories: categories,
        current_category_index: 0
      })
      .select()
      .single();

    if (prefsError) {
      console.error('Error creating user preferences:', prefsError);
      return NextResponse.json(
        { error: 'Failed to create user preferences', details: prefsError },
        { status: 500 }
      );
    }

    console.log('User preferences created successfully:', preferences);

    // Create initial prompt progress entries for each category
    console.log('Creating progress entries for categories:', categories);
    for (const categoryId of categories) {
      const { error: progressError } = await supabaseServiceRole
        .from('user_prompt_progress')
        .insert({
          user_id: userId,
          category_id: categoryId,
          current_prompt_number: 1
        });

      if (progressError) {
        console.error('Error creating progress for category', categoryId, ':', progressError);
      } else {
        console.log('Progress created for category:', categoryId);
      }
    }

    console.log('=== create-test-user API completed successfully ===');

    return NextResponse.json({
      message: 'Test user created successfully',
      user: {
        id: userId,
        email: email,
        preferences: preferences
      }
    });

  } catch (error) {
    console.error('=== create-test-user API ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { error: 'Failed to create test user', details: error },
      { status: 500 }
    );
  }
}
