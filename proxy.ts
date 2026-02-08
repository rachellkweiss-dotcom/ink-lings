import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        // SECURITY: Explicitly set secure cookie attributes
        const secureOptions: CookieOptions = {
          ...options,
          httpOnly: true,  // Prevent JavaScript access (XSS protection)
          secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
          sameSite: 'lax',  // CSRF protection
          path: '/',
        }
        request.cookies.set({
          name,
          value,
          ...secureOptions,
        })
        response.cookies.set({
          name,
          value,
          ...secureOptions,
        })
      },
      remove(name: string, options: CookieOptions) {
        // SECURITY: Use secure options when removing cookies too
        const secureOptions: CookieOptions = {
          ...options,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
        }
        request.cookies.set({
          name,
          value: '',
          ...secureOptions,
        })
        response.cookies.set({
          name,
          value: '',
          ...secureOptions,
        })
      },
    },
  })

  // Refresh session - this will update cookies with secure flags
  // Call getSession() which triggers cookie refresh if needed
  const { data: { session } } = await supabase.auth.getSession()
  
  // If we have a session, ensure cookies are refreshed with secure flags
  if (session) {
    // Call getUser() to trigger any necessary cookie updates
    await supabase.auth.getUser()
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
