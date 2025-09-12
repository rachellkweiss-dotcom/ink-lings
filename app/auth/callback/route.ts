import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  console.log('🔍 Auth callback triggered');
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  console.log('Callback params:', { code: code ? 'present' : 'missing', error });

  // Check for hash parameters (Supabase often uses hash instead of query params)
  const hash = request.url.split('#')[1];
  console.log('Hash parameters:', hash);

  if (error) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://inklingsjournal.live'}/auth?error=${error}`);
  }

  if (!code && !hash) {
    console.error('No code or hash received from OAuth provider');
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://inklingsjournal.live'}/auth?error=no_code`);
  }

  try {
    console.log('🔄 Processing OAuth callback...');
    
    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Use Supabase's built-in OAuth handling
    const { data, error: authError } = await supabase.auth.getSession();

    if (authError) {
      console.error('❌ Error getting session:', authError);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://inklingsjournal.live'}/auth?error=session_failed`);
    }

    console.log('✅ Session retrieved successfully');
    console.log('User data:', { id: data.session?.user?.id, email: data.session?.user?.email });

    if (data.session?.user) {
      console.log('OAuth successful for user:', data.session.user.email);
      
      // Check if user has preferences using service role key for server-side access
      console.log('🔍 Checking user preferences...');
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      const { data: preferences, error: prefError } = await supabaseAdmin
        .from('user_preferences')
        .select('*')
        .eq('user_id', data.session.user.id)
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
