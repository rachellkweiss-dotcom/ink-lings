'use client'

import { useState } from 'react'
import { useAuth } from './auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'

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

  // Show verification message after account creation
  if (isVerificationSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-blue-900/10 dark:to-cyan-900/10" style={{ fontFamily: 'var(--font-shadows-into-light)' }}>
        <div className="max-w-6xl mx-auto p-8">
          {/* Logo Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center">
              <Image
                src="/ink_links_logo_final_final.png"
                alt="Ink-lings Logo"
                width={520}
                height={208}
                priority
              />
            </div>
          </div>

          <div className="max-w-md mx-auto">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="text-green-600 text-sm bg-green-50 p-4 rounded-md border border-green-200">
                  <CardTitle className="text-xl text-center text-green-800 mb-2">✓ Account Created Successfully!</CardTitle>
                  <CardDescription className="text-center text-green-700">
                    Please click the verification link we sent to {email} to continue to onboarding.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-4">
                  
                  <div className="text-gray-600 text-sm">
                    <p>Didn&apos;t receive the email?</p>
                    <p>Check your spam folder or contact support if you need help.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
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
              <CardTitle className="text-xl text-center text-gray-800">Create Your Account</CardTitle>
              <CardDescription className="text-center text-gray-600">
                Sign up to save your journaling preferences and get personalized prompts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-gray-700 font-medium">First Name</Label>
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
                    <Label htmlFor="lastName" className="text-gray-700 font-medium">Last Name</Label>
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
                    placeholder="Create a password"
                    required
                    minLength={6}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 font-sans text-base"
                    style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">Confirm Password</Label>
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
                  <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md border border-red-200">
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
              </form>
            </CardContent>
          </Card>

          {/* Sign In Option */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">
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
      </div>
    </div>
  )
}
