'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if this is coming from an OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    
    // If there are OAuth parameters, let the auth callback handle it
    if (urlParams.get('code') || urlParams.get('state') || hash.includes('access_token')) {
      // Redirect to auth callback to handle OAuth
      router.push('/auth/callback' + window.location.search + window.location.hash);
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
