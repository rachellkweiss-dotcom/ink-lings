'use client';

import Image from 'next/image';
import { Button } from './ui/button';
import { OnboardingProgress } from './onboarding-progress';

interface OnboardingCompleteProps {
  onGoToAccount: () => void;
}

export function OnboardingComplete({ onGoToAccount }: OnboardingCompleteProps) {
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

        {/* Progress Bar - All 4 phases completed */}
        <div className="mb-8">
          <OnboardingProgress currentPhase={4} />
        </div>

        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-8 rounded-lg border border-cyan-200 max-w-2xl mx-auto">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">You&apos;re All Set! 🎉</h3>
            <p className="text-lg text-gray-600 mb-6">
              We&apos;ll start sending you personalized journal prompts based on your preferences. 
              Get ready to discover new insights about yourself through writing!
            </p>
            
            <Button 
              onClick={onGoToAccount}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-3 text-lg"
            >
              Go to Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

