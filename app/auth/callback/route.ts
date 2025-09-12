import { NextRequest, NextResponse } from 'next/server';

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

  // Redirect to auth page with the code - it will handle OAuth processing
  console.log('✅ OAuth code received, redirecting to auth page');
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://inklingsjournal.live'}/auth?code=${encodeURIComponent(code)}`);
}
