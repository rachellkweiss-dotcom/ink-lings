'use client'

import { useState } from 'react'
import Image from 'next/image'
import { SignIn } from './sign-in'
import { SignUp } from './sign-up'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/ink_lings_logo_final.png"
              alt="Ink-lings Logo"
              width={120}
              height={120}
              className="h-auto"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ink-lings</h1>
          <p className="text-gray-600">
            {isSignUp ? 'Create your account to get started' : 'Welcome back! Sign in to continue'}
          </p>
        </div>

        {isSignUp ? <SignUp /> : <SignIn />}

        <Card className="bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              </p>
              <Button
                variant="link"
                onClick={() => setIsSignUp(!isSignUp)}
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                {isSignUp ? 'Sign in instead' : 'Create account'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
