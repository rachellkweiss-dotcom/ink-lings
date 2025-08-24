'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { DonationTile } from './donation-tile';

interface AccountPageProps {
  onEditPreferences: () => void;
  onViewHistory: () => void;
  onSignOut: () => void;
  userFirstName?: string;
}

export function AccountPage({ 
  onEditPreferences, 
  onViewHistory, 
  onSignOut,
  userFirstName 
}: AccountPageProps) {
  // Ensure page starts at top
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-blue-900/10 dark:to-cyan-900/10" style={{ fontFamily: 'var(--font-shadows-into-light)' }}>
      <div className="max-w-6xl mx-auto p-8">
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Image
              src="/ink_links_logo_final_final.png"
              alt="Ink-lings Logo"
              width={156}
              height={62}
              priority
            />
          </div>
          <Button
            onClick={onSignOut}
            variant="outline"
            size="sm"
            className="text-gray-600 hover:text-gray-800 border-gray-300 hover:border-gray-400"
          >
            Sign Out
          </Button>
        </div>

        {/* Welcome Message */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Your Ink-lings Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Choose what you'd like to do today
          </p>
        </div>

        {/* Main Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto mb-12">
          {/* Edit Preferences Tile */}
          <Card 
            className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow duration-200 cursor-pointer group"
            onClick={onEditPreferences}
          >
            <CardContent className="p-8 text-center">
              <div className="mb-4">
                <svg 
                  className="w-16 h-16 mx-auto text-blue-600 group-hover:text-blue-700 transition-colors duration-200" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
                  />
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                Edit Preferences
              </h2>
              <p className="text-gray-600 text-sm">
                Update your categories, schedule, and notifications
              </p>
            </CardContent>
          </Card>

          {/* Prompt History Tile */}
          <Card 
            className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow duration-200 cursor-pointer group"
            onClick={onViewHistory}
          >
            <CardContent className="p-8 text-center">
              <div className="mb-4">
                <svg 
                  className="w-16 h-16 mx-auto text-green-600 group-hover:text-green-700 transition-colors duration-200" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                Prompt History
              </h2>
              <p className="text-gray-600 text-sm">
                View your past journal prompts and entries
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Donation Section */}
        <div className="max-w-2xl mx-auto">
          <DonationTile userEmail={userFirstName ? `${userFirstName}@example.com` : 'user@example.com'} />
        </div>
      </div>
    </div>
  );
}
