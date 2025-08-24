'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { OnboardingProgress } from './onboarding-progress';
import { WelcomeHero } from './welcome-hero';
import { CategorySelection } from './category-selection';
import { NotificationSetup } from './notification-setup';
import { ScheduleSetup } from './schedule-setup';
import { SetupConfirmation } from './setup-confirmation';
import { JournalHistory } from './journal-history';
import { SignUp } from './sign-up';
import { SignIn } from './sign-in';
import { AccountPage } from './account-page';
import { UserPreferences } from '@/lib/types';
import { saveUserPreferences, getUserPreferences } from '@/lib/user-preferences';
import { Button } from './ui/button';
import { useAuth } from './auth-context';
import { startPromptScheduler } from '@/lib/prompt-scheduler';

type AppPhase = 'welcome' | 'create-account' | 'onboarding' | 'account' | 'complete';

type OnboardingPhase = 1 | 2 | 3 | 4;

type AuthMode = 'signup' | 'signin';

export function InkLingsApp() {
  const [appPhase, setAppPhase] = useState<AppPhase>('welcome');
  const [onboardingPhase, setOnboardingPhase] = useState<OnboardingPhase>(1);
  const [authMode, setAuthMode] = useState<AuthMode>('signup');
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);

  const { user, isEmailVerified, loading } = useAuth();



  // Start the automated prompt scheduler
  useEffect(() => {
    // Only start in development or when explicitly enabled
    if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENABLE_SCHEDULER === 'true') {
      console.log('🚀 Starting automated prompt scheduler...');
      startPromptScheduler();
    }
  }, []);

  // Check if user is already logged in and has preferences
  useEffect(() => {
    const loadUserPreferences = async () => {
      if (user && !loading) {
        if (isEmailVerified) {
          try {
            // Try to load from Supabase first
            const savedPreferences = await getUserPreferences(user.id);
            if (savedPreferences) {
              setUserPreferences(savedPreferences);
              // Also update localStorage as backup
              localStorage.setItem('ink-lings-preferences', JSON.stringify(savedPreferences));
              setAppPhase('account'); // Go directly to account page
              return;
            }
          } catch (error) {
            console.error('Error loading preferences from Supabase:', error);
          }
          
          // Fallback to localStorage
          const localPreferences = localStorage.getItem('ink-lings-preferences');
          if (localPreferences) {
            try {
              const parsed = JSON.parse(localPreferences);
              setUserPreferences(parsed);
              setAppPhase('account'); // Go directly to account page
            } catch (error) {
              console.error('Error parsing saved preferences:', error);
              setAppPhase('onboarding');
            }
          } else {
            setAppPhase('onboarding');
          }
        }
      }
    };

    loadUserPreferences();
  }, [user, loading, isEmailVerified]);

  // Smooth scroll to top on page transitions
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [appPhase, onboardingPhase]);

  const handleGetStarted = () => {
    setAppPhase('create-account');
    setAuthMode('signup');
  };



  const handleSignInSuccess = () => {
    // Only allow verified users to proceed to onboarding
    if (isEmailVerified) {
      setAppPhase('onboarding');
      setOnboardingPhase(1);
    } else {
      // User needs to verify email first
      // They can check their email and verify, then sign in again
    }
  };

  const handleSwitchToSignIn = () => {
    setAuthMode('signin');
  };

  const handleSwitchToSignUp = () => {
    setAuthMode('signup');
  };

  const handleCategoriesSelected = (categories: string[]) => {
    setUserPreferences(prev => ({
      ...prev,
      categories
    } as UserPreferences));
    setOnboardingPhase(2);
  };

  const handleNotificationsSet = (email: string) => {
    setUserPreferences(prev => ({
      ...prev,
      notification_email: email
    } as UserPreferences));
    setOnboardingPhase(3);
  };

  const handleScheduleSet = (schedule: { days: string[]; time: string; timezone: string }) => {
    setUserPreferences(prev => ({
      ...prev,
      notification_days: schedule.days,
      notification_time: schedule.time,
      timezone: schedule.timezone
    } as UserPreferences));
    setOnboardingPhase(4);
  };

  const handleSetupComplete = async () => {
    console.log('=== handleSetupComplete STARTED ===');
    console.log('User state:', user);
    console.log('User preferences state:', userPreferences);
    
    if (user && userPreferences) {
      try {
        console.log('Starting to save preferences for user:', user.id);
        console.log('User preferences to save:', userPreferences);
        
        // Save to Supabase
        const savedPreferences = await saveUserPreferences(user.id, {
          categories: userPreferences.categories,
          notification_email: userPreferences.notification_email,
          notification_days: userPreferences.notification_days,
          notification_time: userPreferences.notification_time,
          timezone: userPreferences.timezone,
          current_category_index: 0
        });
        
        console.log('Preferences saved to Supabase:', savedPreferences);
        
        // Also save to localStorage as backup
        localStorage.setItem('ink-lings-preferences', JSON.stringify(savedPreferences));
        
        // Update local state with the saved data
        setUserPreferences(savedPreferences);
      } catch (error) {
        console.error('Error saving preferences to Supabase:', error);
        if (error instanceof Error) {
          console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
        } else {
          console.error('Unknown error type:', error);
        }
        // Fallback to localStorage only
        localStorage.setItem('ink-lings-preferences', JSON.stringify(userPreferences));
      }
    } else {
      console.log('User or userPreferences not available:', { user: !!user, userPreferences: !!userPreferences });
    }
    
    setAppPhase('account');
  };

  const handleEditPreferences = async () => {
    if (user) {
      try {
        // Try to load from Supabase first
        const savedPreferences = await getUserPreferences(user.id);
        if (savedPreferences) {
          setUserPreferences(savedPreferences);
          console.log('Loaded preferences from Supabase:', savedPreferences);
          
          // Also update localStorage as backup
          localStorage.setItem('ink-lings-preferences', JSON.stringify(savedPreferences));
        } else {
          // Fallback to localStorage
          const localPreferences = localStorage.getItem('ink-lings-preferences');
          if (localPreferences) {
            try {
              const parsed = JSON.parse(localPreferences);
              setUserPreferences(parsed);
              console.log('Loaded preferences from localStorage:', parsed);
            } catch (error) {
              console.error('Error parsing localStorage preferences:', error);
              setAppPhase('welcome');
              return;
            }
          } else {
            console.log('No preferences found');
            setAppPhase('welcome');
            return;
          }
        }
      } catch (error) {
        console.error('Error loading preferences from Supabase:', error);
        // Fallback to localStorage
        const localPreferences = localStorage.getItem('ink-lings-preferences');
        if (localPreferences) {
          try {
            const parsed = JSON.parse(localPreferences);
            setUserPreferences(parsed);
            console.log('Loaded preferences from localStorage fallback:', parsed);
          } catch (error) {
            console.error('Error parsing localStorage preferences:', error);
            setAppPhase('welcome');
            return;
          }
        } else {
          console.log('No preferences found');
          setAppPhase('welcome');
          return;
        }
      }
    }
    
    setAppPhase('onboarding');
    setOnboardingPhase(4); // Go back to review/confirmation step
  };

  const handleViewHistory = () => {
    setAppPhase('complete');
  };

  const handleSignOut = () => {
    // Sign out and redirect to sign-in page
    setAppPhase('create-account');
    setAuthMode('signin');
    setUserPreferences(null);
  };

  const handleEditCategories = () => {
    setOnboardingPhase(1);
  };

  const handleEditNotifications = () => {
    setOnboardingPhase(2);
  };

  const handleEditSchedule = () => {
    setOnboardingPhase(3);
  };



  // Render welcome screen
  if (appPhase === 'welcome') {
    return <WelcomeHero onGetStarted={handleGetStarted} />;
  }

  // Render create account screen
  if (appPhase === 'create-account') {
    if (authMode === 'signup') {
              return <SignUp onSwitchToSignIn={handleSwitchToSignIn} />;
    } else {
      return <SignIn onSignInSuccess={handleSignInSuccess} onSwitchToSignUp={handleSwitchToSignUp} />;
    }
  }

  // Render onboarding flow
  if (appPhase === 'onboarding') {
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
              onClick={handleSignOut}
              variant="outline"
              size="sm"
              className="text-gray-600 hover:text-gray-800 border-gray-300 hover:border-gray-400"
            >
              Sign Out
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <OnboardingProgress currentPhase={onboardingPhase} />
          </div>

          {/* Onboarding Content */}
          {onboardingPhase === 1 && (
            <CategorySelection 
              onNext={handleCategoriesSelected} 
              onBack={() => setAppPhase('create-account')}
              existingSelections={userPreferences?.categories}
            />
          )}

          {onboardingPhase === 2 && (
            <NotificationSetup
              onNext={handleNotificationsSet}
              onBack={() => setOnboardingPhase(1)}
              accountEmail={user?.email}
              userFirstName={user?.user_metadata?.first_name || ''}
              existingEmail={userPreferences?.notification_email}
              selectedCategories={userPreferences?.categories || []}
            />
          )}

          {onboardingPhase === 3 && (
            <ScheduleSetup
              onNext={handleScheduleSet}
              onBack={() => setOnboardingPhase(2)}
              existingSchedule={userPreferences ? {
                days: userPreferences.notification_days,
                time: userPreferences.notification_time,
                timezone: userPreferences.timezone
              } : undefined}
            />
          )}

          {onboardingPhase === 4 && userPreferences && (
            <SetupConfirmation
              selectedCategories={userPreferences.categories}
              email={userPreferences.notification_email}
              schedule={{
                days: userPreferences.notification_days,
                time: userPreferences.notification_time,
                timezone: userPreferences.timezone
              }}
              onEditCategories={handleEditCategories}
              onEditNotifications={handleEditNotifications}
              onEditSchedule={handleEditSchedule}
              onComplete={handleSetupComplete}

            />
          )}

          {onboardingPhase === 4 && !userPreferences && (
            <div className="text-center py-12">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">Loading Preferences...</h3>
                <p className="text-yellow-700 text-sm">
                  Please wait while we load your saved preferences for editing.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render account page
  if (appPhase === 'account') {
    return (
      <AccountPage 
        onEditPreferences={handleEditPreferences} 
        onViewHistory={handleViewHistory} 
        onSignOut={handleSignOut}
        userFirstName={user?.user_metadata?.first_name || ''}
      />
    );
  }

  // Render complete app (history page)
  if (appPhase === 'complete') {
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
              onClick={handleSignOut}
              variant="outline"
              size="sm"
              className="text-gray-600 hover:text-gray-800 border-gray-300 hover:border-gray-400"
            >
              Sign Out
            </Button>
          </div>

          {/* Journal History */}
          <JournalHistory 
            userId={user?.id || ''}
            onBackToAccount={() => setAppPhase('account')}
          />
        </div>
        

      </div>
    );
  }

  return null;
}
