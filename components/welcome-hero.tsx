'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface WelcomeHeroProps {
  onGetStarted: () => void;
}

export function WelcomeHero({ onGetStarted }: WelcomeHeroProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-white via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-blue-900/10 dark:to-cyan-900/10" style={{ fontFamily: 'var(--font-shadows-into-light)' }}>
      <div className="max-w-4xl mx-auto text-center space-y-8">
        {/* Hero Section */}
        <div className="space-y-6">
          {/* Logo */}
          <div className="flex justify-center">
            <Image
              src="/ink_links_logo_final_final.png"
              alt="Ink-lings Logo"
              width={390}
              height={156}
              priority
            />
          </div>
          
          <p className="text-2xl md:text-3xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto font-bold" style={{ fontFamily: 'var(--font-shadows-into-light)' }}>
            When you don&apos;t know what to write, we&apos;ll guide the ink.
          </p>
        </div>

        {/* Video Player */}
        <Card className="w-full max-w-3xl mx-auto overflow-hidden shadow-2xl border-blue-200 dark:border-blue-800">
          <CardContent className="p-0">
            <div className="aspect-video bg-black">
              <video
                className="w-full h-full object-cover"
                controls
                poster="/icon_final_final_white.png"
                preload="metadata"
              >
                <source src="/Ink-lings.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="space-y-4">
          <Button 
            onClick={onGetStarted}
            size="lg" 
            className="text-xl px-8 py-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            Get Started
          </Button>
          <p className="text-base text-gray-600 dark:text-gray-400">
            Begin your journaling journey in just a few steps
          </p>
        </div>
      </div>
    </div>
  );
}
