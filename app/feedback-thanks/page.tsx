'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export default function FeedbackThanksPage() {
  const router = useRouter();

  const handleReturn = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-blue-900/10 dark:to-cyan-900/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-8 pb-8">
          <div className="text-6xl mb-6">👏</div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Thank you for your anonymous feedback!
          </h1>
          
          <Button 
            onClick={handleReturn}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-3"
          >
            Return to Ink-lings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
