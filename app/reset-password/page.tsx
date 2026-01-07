'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

function ResetPasswordContent() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function initializeSession() {
      // Check for code parameter from Supabase password reset email
      const code = searchParams.get('code');
      
      if (code) {
        // Exchange the code for a session
        console.log('🔑 Exchanging recovery code for session...');
        console.log('Code:', code);
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        
        if (exchangeError) {
          console.error('Error exchanging code:', exchangeError);
          console.error('Error details:', JSON.stringify(exchangeError, null, 2));
          setError(`Reset link error: ${exchangeError.message}`);
          setLoading(false);
          return;
        }
        
        if (data.session) {
          console.log('✅ Session established for password reset');
          setIsAuthenticated(true);
          setLoading(false);
          // Remove the code from URL for cleaner UX
          window.history.replaceState({}, '', '/reset-password');
          return;
        }
      }
      
      // No code - check for existing session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // No session and no code - redirect to auth
        setError('No valid session. Please request a new password reset.');
        setLoading(false);
        return;
      }
      
      setIsAuthenticated(true);
      setLoading(false);
    }
    
    initializeSession();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      // Update password using Supabase directly
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }

      setMessage('Password updated successfully! Redirecting to your account...');
      
      // Redirect to account after a short delay
      setTimeout(() => {
        router.push('/account');
      }, 2000);

    } catch (err) {
      console.error('Password update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-blue-900/10 dark:to-cyan-900/10 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-blue-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error state if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-blue-900/10 dark:to-cyan-900/10" style={{ fontFamily: 'var(--font-shadows-into-light)' }}>
        <div className="max-w-6xl mx-auto p-8">
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
          <div className="max-w-md mx-auto">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-center text-gray-800">Reset Link Expired</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-gray-600">{error || 'This password reset link is invalid or has expired.'}</p>
                <Button
                  onClick={() => router.push('/auth')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  Back to Sign In
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
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

        <div className="max-w-md mx-auto">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-center text-gray-800">Reset Your Password</CardTitle>
              <CardDescription className="text-center text-gray-600">
                Enter your new password below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-medium">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    minLength={6}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 font-sans text-base"
                    style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 font-sans text-base"
                    style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                  />
                </div>

                {error && (
                  <div className="text-sm p-3 rounded-md border text-red-700 bg-red-50 border-red-200">
                    {error}
                  </div>
                )}

                {message && (
                  <div className="text-sm p-3 rounded-md border text-green-700 bg-green-50 border-green-200">
                    {message}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5"
                  disabled={loading}
                >
                  {loading ? 'Updating Password...' : 'Update Password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-blue-600">Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
