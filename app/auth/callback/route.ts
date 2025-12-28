import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/account'

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const response = NextResponse.redirect(new URL(next, request.url))

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

    // Exchange the code for a session - this will set cookies with secure flags
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error || !session?.user) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(new URL('/auth?error=session_error', request.url))
    }

    // Check if user has completed onboarding (has row in user_preferences)
    const { data: preferences, error: preferencesError } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (preferencesError && preferencesError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected for new users
      console.error('Error checking user preferences:', preferencesError)
      return NextResponse.redirect(new URL('/auth?error=preferences_error', request.url))
    }

    // If user has preferences, they've completed onboarding - redirect to account
    // Otherwise, redirect to onboarding
    const redirectPath = preferences ? '/account' : '/onboarding'
    return NextResponse.redirect(new URL(redirectPath, request.url))
  }

  // If no code, redirect to auth page
  return NextResponse.redirect(new URL('/auth', request.url))
}

