'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function DonationSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [donationDetails, setDonationDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      // In a real app, you'd verify the session with your backend
      // For now, we'll show a generic success message
      setLoading(false);
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-purple-600">Processing your donation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-blue-900/10 dark:to-cyan-900/10" style={{ fontFamily: 'var(--font-shadows-into-light)' }}>
      <div className="max-w-2xl mx-auto p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Image
            src="/ink_links_logo_final_final.png"
            alt="Ink-lings Logo"
            width={156}
            height={62}
            priority
            className="mx-auto mb-6"
          />
          <Badge variant="outline" className="bg-green-100 text-green-800 mb-4">
            ✓ Donation Successful
          </Badge>
        </div>

        {/* Success Card */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-4xl">💝</span>
            </div>
            <CardTitle className="text-3xl text-green-800 mb-2">
              Thank You So Much!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Next Steps */}
            <div className="text-center space-y-4">
              <p className="text-gray-600 text-lg">
                Ink flows best when the well doesn't run dry. Thank you for keeping Ink-lings writing prompts flowing!
              </p>
              
              <div className="flex justify-center">
                <Button
                  onClick={() => window.location.href = '/account'}
                  className="bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
                >
                  Back to Account
                </Button>
              </div>
            </div>

            {/* Social Sharing */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-3">
                Love Ink-lings? Share it with friends!
              </p>
              <div className="flex justify-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const text = "I'm loving these daily journal prompts from Ink-lings! Check it out: ";
                    const url = window.location.origin;
                    navigator.share?.({ title: 'Ink-lings', text, url }) || 
                    navigator.clipboard.writeText(text + url);
                  }}
                  className="text-blue-600 hover:text-blue-700 transition-colors duration-200"
                >
                  📱 Share
                </Button>
              </div>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
