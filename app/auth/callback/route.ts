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
    console.log('🔄 Exchanging code for session...');
    // Exchange the code for a session
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('❌ Error exchanging code for session:', exchangeError);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://inklingsjournal.live'}/auth?error=exchange_failed`);
    }

    console.log('✅ Session exchange successful');
    console.log('User data:', { id: data.user?.id, email: data.user?.email });

    if (data.user) {
      console.log('OAuth successful for user:', data.user.email);
      
      // Check if user has preferences using service role key for server-side access
      console.log('🔍 Checking user preferences...');
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      const { data: preferences, error: prefError } = await supabaseAdmin
        .from('user_preferences')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      console.log('User preferences:', preferences);
      console.log('Preferences error:', prefError);

      if (preferences && preferences.notification_email) {
        // User has complete preferences, redirect to account page
        console.log('✅ User has preferences, redirecting to account');
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://inklingsjournal.live'}/account`);
      } else {
        // New user or incomplete preferences, redirect to onboarding
        console.log('🆕 New user or incomplete preferences, redirecting to onboarding');
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://inklingsjournal.live'}/onboarding`);
      }
    }

    // Fallback redirect - always go to sign-in page
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://inklingsjournal.live'}/auth`);

  } catch (error) {
    console.error('Unexpected error in OAuth callback:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://inklingsjournal.live'}/auth?error=unexpected`);
  }
}
