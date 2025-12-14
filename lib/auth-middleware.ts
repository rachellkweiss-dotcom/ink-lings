import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

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
): Promise<{ user: any; error: null } | { user: null; error: NextResponse }> {
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
    }

    // Method 2: Cookie-based authentication (for browser requests)
    // Create a server-side Supabase client that reads cookies from the request
    const response = NextResponse.next();
    
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          // Read cookie from the incoming request
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Set cookie in the response (for session refresh)
          request.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          // Remove cookie from response
          request.cookies.set({ name, value: '', ...options });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    });

    // Get the user from the session (reads from cookies automatically)
    const { data: { user }, error } = await supabase.auth.getUser();

    if (!error && user) {
      return { user, error: null };
    }

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
): Promise<{ user: any; error: null } | { user: null; error: NextResponse }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get the session from cookies
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      // Extract the access token from cookies if present
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

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

