'use client';

import { Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useSearchParams } from 'next/navigation';

function FeedbackThanksContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message');

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-blue-900/10 dark:to-cyan-900/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-8 pb-8">
          <div className="text-6xl mb-6">👏</div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {message === 'already-voted' 
              ? 'You\'ve already provided feedback for this prompt!' 
              : 'Thank you for your anonymous feedback!'
            }
          </h1>
          
          <p className="text-gray-600 text-sm">
            You can close this window now.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function FeedbackThanksPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <FeedbackThanksContent />
    </Suspense>
  );
}
