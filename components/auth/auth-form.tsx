'use client';

import { useState } from 'react';
import { SignUp } from './sign-up';
import { SignIn } from './sign-in';

interface AuthFormProps {
  onSuccess: () => void;
}

export function AuthForm({ onSuccess }: AuthFormProps) {
  // Check if user is coming from email verification or wants to sign up
  const [isSignUp, setIsSignUp] = useState(() => {
    if (typeof window === 'undefined') return false;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('signup') === 'true';
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        {isSignUp ? (
          <SignUp
            onSwitchToSignIn={() => setIsSignUp(false)}
          />
        ) : (
          <SignIn
            onSuccess={onSuccess}
            onSwitchToSignUp={() => setIsSignUp(true)}
          />
        )}
      </div>
    </div>
  );
}
