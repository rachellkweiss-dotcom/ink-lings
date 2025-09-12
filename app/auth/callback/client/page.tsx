'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function AuthCallbackContent() {
  const router = useRouter();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      console.log('🔍 Client-side OAuth callback handler');
      
      try {
        // Get the current session (Supabase should have processed the OAuth)
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
          router.push('/auth?error=session_failed');
          return;
        }

        if (!session?.user) {
          console.error('❌ No user in session');
          router.push('/auth?error=no_user');
          return;
        }

        console.log('✅ OAuth successful for user:', session.user.email);
        
        // Check if user has preferences
        console.log('🔍 Checking user preferences...');
        const { data: preferences, error: prefError } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        console.log('User preferences:', preferences);
        console.log('Preferences error:', prefError);

        if (preferences && preferences.notification_email) {
          // User has complete preferences, redirect to account page
          console.log('✅ User has preferences, redirecting to account');
          router.push('/account');
        } else {
          // New user or incomplete preferences, redirect to onboarding
          console.log('🆕 New user or incomplete preferences, redirecting to onboarding');
          router.push('/onboarding');
        }

      } catch (error) {
        console.error('❌ Unexpected error in OAuth callback:', error);
        router.push('/auth?error=unexpected');
      }
    };

    handleOAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Processing authentication...</p>
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
      <AuthCallbackContent />
    </Suspense>
  );
}