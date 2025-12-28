'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { DonationTile } from './donation-tile';
import { CostTransparencyWidget } from './cost-transparency-widget';
import { UserPreferences } from '@/lib/types';
import { GratitudeEnrollmentBanner } from './gratitude-enrollment-banner';
import { toast } from 'sonner';

interface AccountPageProps {
  onEditPreferences: () => void;
  onViewHistory: () => void;
  onSignOut: () => void;
  onStopNotifications: () => void;
  userFirstName?: string;
  userEmail?: string;
  userPreferences?: UserPreferences | null;
}

export function AccountPage({ 
  onEditPreferences, 
  onViewHistory, 
  onSignOut,
  onStopNotifications,
  userFirstName,
  userEmail,
  userPreferences 
}: AccountPageProps) {
  const [gratitudeEnrolled, setGratitudeEnrolled] = useState<boolean>(false);
  const [isStoppingGratitude, setIsStoppingGratitude] = useState<boolean>(false);

  // Ensure page starts at top
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Check gratitude enrollment status
  useEffect(() => {
    const checkGratitudeStatus = async () => {
      try {
        const response = await fetch('/api/gratitude-challenge/status');
        if (response.ok) {
          const data = await response.json();
          setGratitudeEnrolled(data.enrolled && data.active);
        }
      } catch (error) {
        console.error('Error checking gratitude status:', error);
      }
    };

    checkGratitudeStatus();
  }, []);

  const handleStopGratitudeNotifications = async () => {
    setIsStoppingGratitude(true);
    try {
      const response = await fetch('/api/gratitude-challenge/deactivate', {
        method: 'POST'
      });

      if (response.ok) {
        setGratitudeEnrolled(false);
        toast.success('Gratitude challenge notifications stopped. You can re-enroll anytime from your preferences.');
      } else {
        const errorData = await response.json();
        toast.error(`Failed to stop notifications: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error stopping gratitude notifications:', error);
      toast.error('Failed to stop notifications. Please try again.');
    } finally {
      setIsStoppingGratitude(false);
    }
  };

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
            Choose what you&apos;d like to do today
          </p>
        </div>

        {/* Admin Dashboard Link */}
        {userFirstName === 'Rachell' && (
          <div className="max-w-2xl mx-auto mb-6">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 text-center">
              <p className="text-purple-800 font-medium mb-3">
                👑 Admin Access Available
              </p>
              <Button
                onClick={() => window.location.href = '/admin'}
                className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white"
              >
                Access Admin Dashboard
              </Button>
            </div>
          </div>
        )}

        {/* Status Flags */}
        {userPreferences?.notificationsPaused && (
          <div className="max-w-2xl mx-auto mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-blue-800 font-medium">
                ⏸️ Notifications Paused; Restart them in your Account Preferences at any time
              </p>
            </div>
          </div>
        )}

        {/* Notifications Paused Flag - Check if notification_days is empty */}
        {userPreferences?.notification_days && userPreferences.notification_days.length === 0 && (
          <div className="max-w-2xl mx-auto mb-6">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
              <p className="text-orange-800 font-medium">
                ⏸️ Notifications currently paused, edit your Current Preferences to start the ink flowing again
              </p>
            </div>
          </div>
        )}

        {userPreferences?.deletionRequested && (
          <div className="max-w-2xl mx-auto mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-800 font-medium">
                🗑️ Account Deletion Initiated; You&apos;ll receive confirmation via our team when completed
              </p>
            </div>
          </div>
        )}

        {/* Gratitude Challenge Banner */}
        {gratitudeEnrolled && (
          <div className="max-w-2xl mx-auto mb-6">
            <Card className="border-2 border-orange-500 bg-gradient-to-br from-blue-100 via-orange-100 to-amber-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-shrink-0">
                      <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-semibold text-gray-900">
                        ✨ You&apos;re enrolled in the 2026 Gratitude Challenge!
                      </p>
                      <p className="text-sm text-gray-700 mt-1">
                        These prompts will arrive daily, separate from your regular journal prompt schedule.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleStopGratitudeNotifications}
                    disabled={isStoppingGratitude}
                    variant="outline"
                    className="flex-shrink-0 bg-white hover:bg-orange-50 text-orange-700 border-orange-300 hover:border-orange-400"
                  >
                    {isStoppingGratitude ? 'Stopping...' : 'Stop Notifications'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto mb-12">
          {/* Account Changes Tile */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="mb-4">
                <svg 
                  className="w-16 h-16 mx-auto text-blue-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
                  />
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Account Changes
              </h2>
              
              <div className="space-y-3">
                <Button 
                  onClick={onEditPreferences}
                  className="w-full bg-blue-50/50 hover:bg-blue-100/70 text-gray-800 border-2 border-blue-200 hover:border-blue-300"
                  size="lg"
                >
                  Edit Current Preferences
                </Button>
                
                <Button 
                  onClick={onStopNotifications}
                  variant="outline"
                  className="w-full bg-orange-50/50 hover:bg-orange-100/70 text-orange-800 border-2 border-orange-200 hover:border-orange-300"
                  size="lg"
                >
                  Stop Notifications
                </Button>
              </div>
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
        <div className="max-w-4xl mx-auto">
          {/* Separator Header Tile */}
          <div className="mb-6">
            <Card className="bg-blue-50/80 backdrop-blur-sm border-blue-200 shadow-md">
              <CardContent className="p-6 text-center">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                  Keeping the Ink flowing
                </h2>
                <p className="text-gray-900 text-sm leading-relaxed max-w-3xl mx-auto">
                  Ink-lings is a passion project. If you&apos;ve enjoyed the prompts and want to help keep it going, 
                  you can chip in below. Every bit helps because the site and automation have associated costs to keep running. 
                  We want to be transparent; so here&apos;s the break down. — thank you!
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Donation Tile - 60% width (3/5 columns) */}
            <div className="lg:col-span-3">
              <DonationTile userEmail={userEmail || 'user@example.com'} />
            </div>
            
            {/* Cost Transparency Widget - 40% width (2/5 columns) */}
            <div className="lg:col-span-2">
              <CostTransparencyWidget />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
