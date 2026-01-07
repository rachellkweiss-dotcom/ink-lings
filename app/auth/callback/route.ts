import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/account'

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const response = NextResponse.redirect(new URL(next, request.url))

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        const secureOptions: CookieOptions = {
          ...options,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
        }
        request.cookies.set({ name, value, ...secureOptions })
        response.cookies.set({ name, value, ...secureOptions })
      },
      remove(name: string, options: CookieOptions) {
        const secureOptions: CookieOptions = {
          ...options,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
        }
        request.cookies.set({ name, value: '', ...secureOptions })
        response.cookies.set({ name, value: '', ...secureOptions })
      },
    },
  })

  // If we have a code, exchange it for a session
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(new URL('/auth?error=session_error', request.url))
    }
  }

  // Check for existing session (either from code exchange above or from Supabase's redirect)
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    // No session - redirect to auth
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  // If this is a password reset flow, go directly to reset-password
  if (next === '/reset-password') {
    return NextResponse.redirect(new URL('/reset-password', request.url))
  }

  // Check if user has completed onboarding
  const { data: preferences, error: preferencesError } = await supabase
    .from('user_preferences')
    .select('id')
    .eq('user_id', session.user.id)
    .single()

  if (preferencesError && preferencesError.code !== 'PGRST116') {
    console.error('Error checking user preferences:', preferencesError)
    return NextResponse.redirect(new URL('/auth?error=preferences_error', request.url))
  }

  // Redirect based on onboarding status
  const redirectPath = preferences ? '/account' : '/onboarding'
  return NextResponse.redirect(new URL(redirectPath, request.url))
}

