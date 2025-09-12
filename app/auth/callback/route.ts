import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  console.log('🔍 Auth callback triggered');
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  console.log('Callback params:', { code: code ? 'present' : 'missing', error });

  if (error) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://inklingsjournal.live'}/auth?error=${error}`);
  }

  if (!code) {
    console.error('No code received from OAuth provider');
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://inklingsjournal.live'}/auth?error=no_code`);
  }

  try {
    // Create Supabase client with service role key to check user preferences
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Exchange code for session to get user info
    const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (sessionError) {
      console.error('Session exchange error:', sessionError);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://inklingsjournal.live'}/auth?error=session_error`);
    }

    if (!session?.user) {
      console.error('No user in session');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://inklingsjournal.live'}/auth?error=no_user`);
    }

    console.log('✅ User authenticated:', session.user.id);

    // Check if user has completed onboarding (has row in user_preferences)
    const { data: preferences, error: preferencesError } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (preferencesError && preferencesError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected for new users
      console.error('Error checking user preferences:', preferencesError);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://inklingsjournal.live'}/auth?error=preferences_error`);
    }

    // If user has preferences, they've completed onboarding
    if (preferences) {
      console.log('✅ User has completed onboarding, redirecting to account');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://inklingsjournal.live'}/account`);
    } else {
      console.log('✅ New user needs onboarding, redirecting to onboarding');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://inklingsjournal.live'}/onboarding`);
    }

  } catch (error) {
    console.error('Unexpected error in auth callback:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://inklingsjournal.live'}/auth?error=unexpected_error`);
  }
}
