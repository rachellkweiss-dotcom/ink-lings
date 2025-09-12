'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if this is coming from an OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    
    // If there are OAuth parameters in hash, handle them client-side
    if (hash.includes('access_token') || hash.includes('code')) {
      // Parse hash parameters and redirect to auth callback with query params
      const hashParams = new URLSearchParams(hash.substring(1));
      const code = hashParams.get('code') || hashParams.get('access_token');
      const state = hashParams.get('state');
      
      if (code) {
        // Redirect to auth callback with proper query parameters
        const callbackUrl = `/auth/callback?code=${encodeURIComponent(code)}${state ? `&state=${encodeURIComponent(state)}` : ''}`;
        router.push(callbackUrl);
        return;
      }
    }
    
    // If there are OAuth parameters in query, let the auth callback handle it
    if (urlParams.get('code') || urlParams.get('state')) {
      router.push('/auth/callback' + window.location.search);
      return;
    }
    
    // Otherwise, redirect to auth page
    router.push('/auth');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
