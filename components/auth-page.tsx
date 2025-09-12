'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { SignIn } from './sign-in'
import { SignUp } from './sign-up'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const router = useRouter()

  const handleSignInSuccess = () => {
    console.log('✅ Sign-in successful, redirecting to account')
    router.push('/account')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-blue-900/10 dark:to-cyan-900/10" style={{ fontFamily: 'var(--font-shadows-into-light)' }}>
      {/* Top Header - Logo and Tagline */}
      <div className="w-full pt-8 pb-4">
        <div className="max-w-6xl mx-auto px-8 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <Image
              src="/ink_links_logo_final_final.png"
              alt="Ink-lings Logo"
              width={390}
              height={156}
              priority
              className="h-24 w-auto"
            />
          </div>
          
          <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto font-bold" style={{ fontFamily: 'var(--font-shadows-into-light)' }}>
            When you don&apos;t know what to write, we&apos;ll guide the ink.
          </p>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-200px)]">
        {/* Left Side - Video Section */}
        <div className="hidden lg:flex lg:w-3/5 flex-col items-start justify-start p-8">
          <div className="w-full max-w-4xl">
            {/* Video Player */}
            <Card className="w-full overflow-hidden shadow-2xl border-blue-200 dark:border-blue-800">
              <CardContent className="p-0">
                <div className="aspect-video bg-black">
                  <video
                    className="w-full h-full object-cover"
                    controls
                    poster="/icon_final_final_white.png"
                    preload="metadata"
                  >
                    <source src="/Ink-lings_welcome_video.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Side - Auth Forms */}
        <div className="w-full lg:w-2/5 flex items-start justify-center p-8">
          <div className="max-w-md w-full">
            {isSignUp ? (
              <SignUp onSwitchToSignIn={() => setIsSignUp(false)} />
            ) : (
              <SignIn 
                onSignInSuccess={handleSignInSuccess}
                onSwitchToSignUp={() => setIsSignUp(true)} 
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
