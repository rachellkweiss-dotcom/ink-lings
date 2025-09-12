'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthPage } from '@/components/auth-page';
import { supabase } from '@/lib/supabase';

function AuthHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  useEffect(() => {
    async function handleOAuth() {
      // If there's an error, show it
      if (error) {
        console.error('OAuth error:', error);
        return; // Stay on auth page to show error
      }

      // If there's a code, process it
      if (code) {
        console.log('🔄 Processing OAuth code in auth page');
        
        try {
          console.log('🔄 Exchanging OAuth code for session');
          
          // Exchange code for session
          const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (sessionError) {
            console.error('Session exchange error:', sessionError);
            return; // Stay on auth page
          }

          if (!session?.user) {
            console.error('No user in session');
            return; // Stay on auth page
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
            return; // Stay on auth page
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
          console.error('Unexpected error in OAuth handler:', error);
        }
      }
    }

    handleOAuth();
  }, [code, error, router]);

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
