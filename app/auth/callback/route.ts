import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // Debug: Log all parameters received
  console.log('🔍 Callback received with URL:', request.url);
  console.log('🔍 All search params:', Object.fromEntries(searchParams.entries()));

  if (error) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://inklingsjournal.live'}/auth?error=${error}`);
  }

  // For PKCE OAuth, Supabase doesn't pass the code - it establishes the session automatically
  // Just redirect to account page and let the client-side auth context handle the session
  console.log('✅ OAuth callback completed, redirecting to account');
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://inklingsjournal.live'}/account`);
