'use client'

import { useState } from 'react'
import { useAuth } from './auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

interface SignUpProps {
  onSwitchToSignIn?: () => void;
}

export function SignUp({ onSwitchToSignIn }: SignUpProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [isVerificationSent, setIsVerificationSent] = useState(false)
  const { signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      await signUp(email, password, {
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`
        }
      })
      setIsVerificationSent(true)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/account`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('Google OAuth error:', error);
        throw error;
      }
      
      console.log('Google OAuth initiated successfully:', data);
      // The signInWithOAuth method itself handles redirection
      // No need to set isVerificationSent here as it's handled by the provider
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during Google sign-in');
    }
  };

  // Show verification message after account creation
  if (isVerificationSent) {
    return (
      <div className="space-y-6">
            <Card className="bg-white/90 backdrop-blur-sm border-2 border-blue-600 dark:border-blue-500 shadow-lg">
              <CardHeader className="pb-4">
                <div className="text-green-600 text-base bg-green-50 p-4 rounded-md border border-green-200">
                  <CardTitle className="text-2xl text-center text-green-800 mb-2">✓ Account Created Successfully!</CardTitle>
                  <CardDescription className="text-center text-green-700 text-base">
                    Please click the verification link we sent to {email} to continue to onboarding.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-4">
                  
                  <div className="text-gray-600 text-base">
                    <p>Didn&apos;t receive the email?</p>
                    <p>Check your spam folder or contact support if you need help.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
          <Card className="bg-white/90 backdrop-blur-sm border-2 border-blue-600 dark:border-blue-500 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-3xl text-center text-gray-800 font-bold">Create Your Account</CardTitle>
              <CardDescription className="text-center text-base text-gray-600">
                Sign up to save your journaling preferences and get personalized prompts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Google Sign-In Button - First and Prominent */}
              <div className="text-center mb-6">
                <p className="text-base text-gray-600 mb-4">Quick sign up with</p>
                
                <Button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-2.5 border border-gray-300 flex items-center justify-center space-x-2"
                  disabled={loading}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Sign up with Google</span>
                </Button>
              </div>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-base">
                  <span className="px-2 bg-white text-gray-500">Or create account with email</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-gray-700 font-medium text-base">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                      required
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 font-sans text-base"
                      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-gray-700 font-medium text-base">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last name"
                      required
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 font-sans text-base"
                      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium text-base">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 font-sans text-base"
                    style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-medium text-base">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    required
                    minLength={6}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 font-sans text-base"
                    style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-700 font-medium text-base">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 font-sans text-base"
                    style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                  />
                </div>

                {error && (
                  <div className="text-red-500 text-base bg-red-50 p-3 rounded-md border border-red-200">
                    {error}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5" 
                  disabled={loading}
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>

                {/* Terms Agreement */}
                <p className="text-sm text-gray-500 text-center mt-4">
                  By creating an account, you agree to our{' '}
                  <a 
                    href="/privacy-policy" 
                    className="text-blue-600 hover:text-blue-800 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Privacy Policy
                  </a>
                  {' '}and{' '}
                  <a 
                    href="/terms-of-service" 
                    className="text-blue-600 hover:text-blue-800 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Terms of Service
                  </a>
                </p>
              </form>
            </CardContent>
          </Card>

          {/* Sign In Option */}
          <Card className="bg-white/80 backdrop-blur-sm border-2 border-blue-600 dark:border-blue-500 shadow-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-base text-gray-600 mb-3">
                  Already have an account?
                </p>
                <Button
                  variant="link"
                  onClick={onSwitchToSignIn}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Sign in instead
                </Button>
              </div>
            </CardContent>
          </Card>
    </div>
  )
}
