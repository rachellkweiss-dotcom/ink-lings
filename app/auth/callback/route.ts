import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://ink-lings-uewn.vercel.app'}/auth?error=${error}`);
  }

  if (!code) {
    console.error('No code received from OAuth provider');
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://ink-lings-uewn.vercel.app'}/auth?error=no_code`);
  }

  try {
    // Exchange the code for a session
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://ink-lings-uewn.vercel.app'}/auth?error=exchange_failed`);
    }

    if (data.user) {
      console.log('OAuth successful for user:', data.user.email);
      
      // Check if user has preferences
      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      if (preferences && preferences.notification_email) {
        // User has complete preferences, redirect to account page
        console.log('User has preferences, redirecting to account');
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://ink-lings-uewn.vercel.app'}/?phase=account`);
      } else {
        // New user or incomplete preferences, redirect to onboarding
        console.log('New user or incomplete preferences, redirecting to onboarding');
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://ink-lings-uewn.vercel.app'}/?phase=onboarding`);
      }
    }

    // Fallback redirect
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://ink-lings-uewn.vercel.app'}/auth`);

  } catch (error) {
    console.error('Unexpected error in OAuth callback:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://ink-lings-uewn.vercel.app'}/auth?error=unexpected`);
  }
}
