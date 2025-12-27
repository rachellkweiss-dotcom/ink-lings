import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { rateLimit } from '@/lib/rate-limit';
import { logSuccess, logFailure } from '@/lib/audit-log';

/**
 * API route to refresh session cookies with secure flags
 * Called after client-side sign-in to ensure cookies have HttpOnly, Secure, and SameSite flags
 */
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Rate limiting - 10 requests per minute
    const rateLimitResult = rateLimit(request, 10, 60 * 1000);
    if (rateLimitResult) {
      return rateLimitResult;
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const response = NextResponse.json({ success: true });

    // Try to get session tokens from request body (sent by client)
    let accessToken: string | null = null;
    let refreshToken: string | null = null;
    try {
      const body = await request.json();
      accessToken = body.accessToken || null;
      refreshToken = body.refreshToken || null;
    } catch {
      // No body or invalid JSON - try to get from cookies
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // SECURITY: Explicitly set secure cookie attributes
          const secureOptions: CookieOptions = {
            ...options,
            httpOnly: true,  // Prevent JavaScript access (XSS protection)
            secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
            sameSite: 'lax',  // CSRF protection
            path: '/',
          };
          request.cookies.set({
            name,
            value,
            ...secureOptions,
          });
          response.cookies.set({
            name,
            value,
            ...secureOptions,
          });
        },
        remove(name: string, options: CookieOptions) {
          // SECURITY: Use secure options when removing cookies too
          const secureOptions: CookieOptions = {
            ...options,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
          };
          request.cookies.set({
            name,
            value: '',
            ...secureOptions,
          });
          response.cookies.set({
            name,
            value: '',
            ...secureOptions,
          });
        },
      },
    });

    // If we have session tokens from the client, use them to set the session
    if (accessToken && refreshToken) {
      // Set the session using both tokens - this will trigger cookie setting
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) {
        logFailure(request, 'session_refresh_failed', undefined, undefined, error.message);
        console.error('Failed to set session from tokens:', error);
      } else {
        logSuccess(request, 'session_refreshed', undefined, undefined);
        console.log('[REFRESH SESSION] Successfully set session cookies');
      }
    } else {
      // Try to refresh from existing cookies
      const { data: { user }, error: getUserError } = await supabase.auth.getUser();
      if (getUserError) {
        logFailure(request, 'session_refresh_failed', undefined, undefined, getUserError.message);
      } else if (user) {
        logSuccess(request, 'session_refreshed', user.id, user.email);
      }
    }

    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logFailure(request, 'session_refresh_failed', undefined, undefined, errorMessage);
    return NextResponse.json(
      { success: false, error: 'Failed to refresh session' },
      { status: 500 }
    );
  }
}


