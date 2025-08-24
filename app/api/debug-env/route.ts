import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT_FOUND',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'FOUND (hidden for security)' : 'NOT_FOUND',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'FOUND (hidden for security)' : 'NOT_FOUND',
    resendKey: process.env.RESEND_API_KEY ? 'FOUND (hidden for security)' : 'NOT_FOUND',
    emailFrom: process.env.EMAIL_FROM || 'NOT_FOUND'
  });
}

