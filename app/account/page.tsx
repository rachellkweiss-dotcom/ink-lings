'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { InkLingsApp } from '@/components/ink-lings-app';
import { Toaster } from '@/components/ui/sonner';
import { useAuth } from '@/components/auth-context';

export default function Account() {
  const { user, loading } = useAuth();
  const router = useRouter();

  console.log('🏠 Account page loaded - user:', user ? 'present' : 'null', 'loading:', loading);

  useEffect(() => {
    console.log('🔄 Account page useEffect - user:', user ? 'present' : 'null', 'loading:', loading);
    // If user is not authenticated and not loading, redirect to auth
    if (!loading && !user) {
      console.log('❌ No authenticated user, redirecting to auth');
      router.push('/auth');
    }
  }, [user, loading, router]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user, don't render anything (will redirect)
  if (!user) {
    return null;
  }

  return (
    <>
      <InkLingsApp initialPhase="account" />
      <Toaster />
    </>
  );
}