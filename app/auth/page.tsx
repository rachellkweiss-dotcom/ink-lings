'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthPage } from '@/components/auth-page';
import { supabase } from '@/lib/supabase';

function AuthHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function handleEmailVerification() {
      // Check for email verification parameters
      const token = searchParams.get('token');
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type');

      console.log('🔍 Auth page - checking for verification params:', { token: token ? 'present' : 'missing', tokenHash: tokenHash ? 'present' : 'missing', type });

      if (type === 'signup' && (token || tokenHash)) {
        console.log('📧 Email verification detected, processing...');
        
        try {
          // Verify the email
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash || token,
            type: 'signup'
          });

          if (error) {
            console.error('Email verification error:', error);
            return; // Stay on auth page to show error
          }

          if (data.user) {
            console.log('✅ Email verified successfully for:', data.user.email);
            // Redirect to onboarding for new users
            router.push('/onboarding');
          }
        } catch (error) {
          console.error('Unexpected error during email verification:', error);
        }
      }
    }

    handleEmailVerification();
  }, [searchParams, router]);

  return <AuthPage />;
}

export default function Auth() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthHandler />
    </Suspense>
  );
}
