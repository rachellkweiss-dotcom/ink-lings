'use client'

import { useState } from 'react'
import { useAuth } from './auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'

interface SignInProps {
  onSignInSuccess?: () => void;
  onSwitchToSignUp?: () => void;
}

export function SignIn({ onSignInSuccess, onSwitchToSignUp }: SignInProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showResetForm, setShowResetForm] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetMessage, setResetMessage] = useState('')
  const { signIn, resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await signIn(email, password)
      if (onSignInSuccess) {
        onSignInSuccess()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetLoading(true)
    setResetMessage('')

    try {
      // Use Supabase password reset
      await resetPassword(resetEmail)
      setResetMessage('Password reset email sent! Check your inbox and spam folder.')
      setResetEmail('')
      setTimeout(() => {
        setShowResetForm(false)
        setResetMessage('')
      }, 5000)
    } catch (err) {
      console.error('Password reset error:', err)
      setResetMessage(err instanceof Error ? err.message : 'Failed to send reset email. Please try again.')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-blue-900/10 dark:to-cyan-900/10" style={{ fontFamily: 'var(--font-shadows-into-light)' }}>
      <div className="max-w-6xl mx-auto p-8">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center">
            <Image
              src="/ink_links_logo_final_final.png"
              alt="Ink-lings Logo"
              width={260}
              height={104}
              priority
              className="h-20 w-auto"
            />
          </div>
        </div>

        <div className="max-w-md mx-auto space-y-6">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-center text-gray-800">Sign In</CardTitle>
              <CardDescription className="text-center text-gray-600">
                Welcome back! Sign in to access your journaling preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
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
                  <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 font-sans text-base"
                    style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                  />
                  <div className="text-right">
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => setShowResetForm(true)}
                      className="text-sm text-blue-600 hover:text-blue-800 p-0 h-auto font-normal"
                    >
                      Forgot Password?
                    </Button>
                  </div>
                </div>

                {error && (
                  <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md border border-red-200">
                    {error}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5" 
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Password Reset Form */}
          {showResetForm && (
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-center text-gray-800">Reset Password</CardTitle>
                <CardDescription className="text-center text-gray-600">
                  Enter your email to receive a password reset link
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="resetEmail" className="text-gray-700 font-medium">Email</Label>
                    <Input
                      id="resetEmail"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 font-sans text-base"
                      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                    />
                  </div>

                  {resetMessage && (
                    <div className={`text-sm p-3 rounded-md border ${
                      resetMessage.includes('sent') 
                        ? 'text-green-700 bg-green-50 border-green-200' 
                        : 'text-red-700 bg-red-50 border-red-200'
                    }`}>
                      {resetMessage}
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <Button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5"
                      disabled={resetLoading}
                    >
                      {resetLoading ? 'Sending...' : 'Send Reset Link'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowResetForm(false)}
                      className="px-6"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Sign Up Option */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">
                  Don't have an account?
                </p>
                <Button
                  variant="link"
                  onClick={onSwitchToSignUp}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Create account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
