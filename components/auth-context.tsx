'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isEmailVerified: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, metadata?: { data: { first_name?: string; last_name?: string; full_name?: string } }) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('🔍 Initial session check:', session ? 'session found' : 'no session');
      if (session?.user) {
        console.log('👤 User found:', session.user.email);
        // SECURITY: Refresh cookies on app load if session exists
        // This ensures API routes can read the session from cookies
        if (session.access_token && session.refresh_token) {
          try {
            await fetch('/api/auth/refresh-session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ 
                accessToken: session.access_token,
                refreshToken: session.refresh_token 
              }),
            })
          } catch (refreshError) {
            console.warn('Failed to refresh session cookies on load:', refreshError)
          }
        }
      }
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state change:', event, session ? 'session found' : 'no session');
      if (session?.user) {
        console.log('👤 User in auth change:', session.user.email);
      }
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    
    // SECURITY: Send full session to server to set secure cookies
    // The client-side Supabase stores session in localStorage, but API routes need cookies
    if (data.session) {
      try {
        await fetch('/api/auth/refresh-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ 
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token 
          }),
        })
      } catch (refreshError) {
        console.warn('Failed to refresh session cookies:', refreshError)
        // Continue anyway - middleware will handle it on next request
      }
    }
  }

  const signUp = async (email: string, password: string, metadata?: { data: { first_name?: string; last_name?: string; full_name?: string } }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: metadata
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    if (error) throw error
  }

  const isEmailVerified = user?.email_confirmed_at ? true : false

  const value = {
    user,
    session,
    loading,
    isEmailVerified,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
