'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  useEffect(() => {
    async function handleCallback() {
      if (!code) {
        console.error('No code in client callback');
        router.push('/auth?error=no_code');
        return;
      }

      try {
        console.log('🔄 Processing OAuth code client-side');
        
        // Exchange code for session
        const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
        
        if (sessionError) {
          console.error('Session exchange error:', sessionError);
          router.push('/auth?error=session_error');
          return;
        }

        if (!session?.user) {
          console.error('No user in session');
          router.push('/auth?error=no_user');
          return;
        }

        console.log('✅ User authenticated:', session.user.id);

        // Check if user has completed onboarding (has row in user_preferences)
        const { data: preferences, error: preferencesError } = await supabase
          .from('user_preferences')
          .select('id')
          .eq('user_id', session.user.id)
          .single();

        if (preferencesError && preferencesError.code !== 'PGRST116') {
          // PGRST116 is "not found" error, which is expected for new users
          console.error('Error checking user preferences:', preferencesError);
          router.push('/auth?error=preferences_error');
          return;
        }

        // If user has preferences, they've completed onboarding
        if (preferences) {
          console.log('✅ User has completed onboarding, redirecting to account');
          router.push('/account');
        } else {
          console.log('✅ New user needs onboarding, redirecting to onboarding');
          router.push('/onboarding');
        }

      } catch (error) {
        console.error('Unexpected error in client callback:', error);
        router.push('/auth?error=unexpected_error');
      }
    }

    handleCallback();
  }, [code, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign-in...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackClient() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
