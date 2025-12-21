import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';

/**
 * Authentication middleware for API routes
 * Verifies that the request has a valid Supabase session
 * Supports both Bearer token (Authorization header) and cookie-based authentication
 * 
 * How it works:
 * 1. First tries Authorization header with Bearer token (for API clients)
 * 2. Falls back to reading Supabase session from cookies (for browser requests)
 * 
 * Frontend usage:
 * - Browser requests: Automatically includes cookies, no headers needed
 * - API clients: Include header: Authorization: Bearer <access_token>
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<{ user: User; error: null } | { user: null; error: NextResponse }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // Method 1: Try Bearer token first (for API clients)
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      
      // Create a simple client to verify the token
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (!error && user) {
        return { user, error: null };
      }
      // If Bearer token fails, silently fall through to cookie-based auth
      // (Don't return error here - let cookie auth try)
    }

    // Method 2: Cookie-based authentication (for browser requests)
    // Create a server-side Supabase client that reads cookies from the request
    const response = NextResponse.next();
    
    // Debug: Log cookie information (only in production for debugging)
    const cookieHeader = request.headers.get('cookie');
    const allCookies = request.cookies.getAll();
    console.log('[AUTH DEBUG] Cookie header present:', !!cookieHeader);
    console.log('[AUTH DEBUG] Total cookies:', allCookies.length);
    console.log('[AUTH DEBUG] Cookie names:', allCookies.map(c => c.name));
    
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          // Read cookie from the incoming request
          const value = request.cookies.get(name)?.value;
          if (value) {
            console.log(`[AUTH DEBUG] Found cookie: ${name}`);
          }
          return value;
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
          request.cookies.set({ name, value, ...secureOptions });
          response.cookies.set({ name, value, ...secureOptions });
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
          request.cookies.set({ name, value: '', ...secureOptions });
          response.cookies.set({ name, value: '', ...secureOptions });
        },
      },
    });

    // Get the user from the session (reads from cookies automatically)
    // Try getSession first (works better with cookies), then fall back to getUser
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('[AUTH DEBUG] getSession result:', { 
      hasSession: !!session, 
      hasUser: !!session?.user,
      error: sessionError?.message 
    });
    
    if (!sessionError && session?.user) {
      console.log('[AUTH DEBUG] Authentication successful via getSession');
      return { user: session.user, error: null };
    }
    
    // Fallback to getUser if getSession didn't work
    const { data: { user }, error } = await supabase.auth.getUser();
    
    console.log('[AUTH DEBUG] getUser result:', { 
      hasUser: !!user,
      error: error?.message 
    });

    if (!error && user) {
      console.log('[AUTH DEBUG] Authentication successful via getUser');
      return { user, error: null };
    }
    
    console.log('[AUTH DEBUG] Authentication failed - no valid session or user');

    // No valid authentication found
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Unauthorized - Missing or invalid authentication' },
        { status: 401 }
      ),
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Internal server error during authentication' },
        { status: 500 }
      ),
    };
  }
}

/**
 * Alternative: Get user from cookie-based session (for browser requests)
 */
export async function authenticateRequestFromCookie(
  request: NextRequest
): Promise<{ user: User; error: null } | { user: null; error: NextResponse }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
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
          request.cookies.set({ name, value, ...secureOptions });
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
          request.cookies.set({ name, value: '', ...secureOptions });
        },
      },
    });

    // Get the session from cookies
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      // Try to get session using the cookie
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session?.user) {
        return {
          user: null,
          error: NextResponse.json(
            { error: 'Unauthorized - No valid session' },
            { status: 401 }
          ),
        };
      }

      return { user: session.user, error: null };
    }

    return {
      user: null,
      error: NextResponse.json(
        { error: 'Unauthorized - No session found' },
        { status: 401 }
      ),
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Internal server error during authentication' },
        { status: 500 }
      ),
    };
  }
}

/**
 * Verify that the user ID in the request matches the authenticated user
 * Prevents users from accessing other users' data
 */
export function verifyUserId(userId: string, authenticatedUserId: string): boolean {
  return userId === authenticatedUserId;
}

