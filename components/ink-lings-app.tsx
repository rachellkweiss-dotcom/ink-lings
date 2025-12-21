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
import { StopNotificationsModal } from './stop-notifications-modal';
import { UserPreferences, UserPromptRotation } from '@/lib/types';
import { saveUserPreferences, getUserPreferences } from '@/lib/user-preferences';
import { Button } from './ui/button';
import { useAuth } from './auth-context';
import { startPromptScheduler } from '@/lib/prompt-scheduler';
import { supabase } from '@/lib/supabase';

type AppPhase = 'welcome' | 'create-account' | 'onboarding' | 'account' | 'complete';

type OnboardingPhase = 1 | 2 | 3 | 4;

type AuthMode = 'signup' | 'signin';

interface InkLingsAppProps {
  initialPhase?: AppPhase;
}

export function InkLingsApp({ initialPhase = 'onboarding' }: InkLingsAppProps) {
  const [appPhase, setAppPhase] = useState<AppPhase>(initialPhase);
  const [onboardingPhase, setOnboardingPhase] = useState<OnboardingPhase>(1);
  const [authMode, setAuthMode] = useState<AuthMode>('signup');
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [showStopModal, setShowStopModal] = useState(false);

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
        } else {
          // User is not verified, stay in onboarding phase
          setAppPhase('onboarding');
        }
      }
    };

    loadUserPreferences();
  }, [user, loading, isEmailVerified]);

  // Check for password reset redirect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('🔍 Checking for password reset redirect...');
      console.log('Current URL:', window.location.href);
      
      const urlParams = new URLSearchParams(window.location.search);
      const type = urlParams.get('type');
      const token = urlParams.get('token');
      
      console.log('URL Parameters:', { type, token });
      
      if (type === 'recovery' && token) {
        // This is a password reset redirect
        console.log('✅ Password reset detected, redirecting to reset page');
        console.log('Redirecting to:', `/reset-password?token=${token}&type=recovery`);
        window.location.href = `/reset-password?token=${token}&type=recovery`;
      } else {
        console.log('❌ No password reset parameters found');
      }
    }
  }, []);

  // New approach: Check auth state for password reset mode
  useEffect(() => {
    const checkForPasswordReset = async () => {
      if (typeof window !== 'undefined') {
        console.log('🔍 Checking user auth state for password reset mode...');
        
        try {
          // Check if user is in password reset mode by looking at their session
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.log('❌ Error getting session:', error.message);
            return;
          }
          
          if (session) {
            console.log('🔍 User has active session, checking for password reset state...');
            
            // Check if this is a fresh password reset session
            // We can detect this by checking if the user was just created or if they have a specific flag
            const userMetadata = session.user.user_metadata;
            console.log('User metadata:', userMetadata);
            
            // If user has no preferences and just landed here, they might be in password reset mode
            if (!userPreferences && userMetadata && Object.keys(userMetadata).length === 0) {
              console.log('🔍 Potential password reset user detected (no metadata)');
              
              // Check if they have a reset token in their session
              const { data: resetData, error: resetError } = await supabase.auth.verifyOtp({
                token: session.access_token,
                type: 'recovery',
                email: session.user.email || ''
              });
              
              if (!resetError && resetData) {
                console.log('✅ Password reset session confirmed, redirecting to reset page');
                window.location.href = `/reset-password?token=${session.access_token}&type=recovery`;
                return;
              }
            }
            
            console.log('✅ User appears to be in normal auth mode');
          } else {
            console.log('❌ No active session found');
          }
        } catch (error) {
          console.error('❌ Error checking password reset state:', error);
        }
      }
    };
    
    // Run the check immediately and when user state changes
    checkForPasswordReset();
  }, [user, userPreferences]);

  // Fallback token validation - check for reset tokens in localStorage or URL
  useEffect(() => {
    const checkForResetToken = async () => {
      if (typeof window !== 'undefined') {
        // Check URL parameters first
        const urlParams = new URLSearchParams(window.location.search);
        let resetToken = urlParams.get('token');
        let tokenType = urlParams.get('type');
        
        // If no URL params, check localStorage for stored token
        if (!resetToken) {
          const storedToken = localStorage.getItem('ink-lings-reset-token');
          const storedType = localStorage.getItem('ink-lings-reset-type');
          if (storedToken && storedType === 'recovery') {
            resetToken = storedToken;
            tokenType = storedType;
            console.log('🔍 Found stored reset token in localStorage');
          }
        }
        
        if (resetToken && tokenType === 'recovery') {
          console.log('🔍 Found reset token, validating with Supabase...');
          
          try {
            // Validate the token with Supabase
            const { error } = await supabase.auth.verifyOtp({
              token: resetToken,
              type: 'recovery',
              email: '' // Add empty email for recovery type
            });
            
            if (error) {
              console.log('❌ Token validation failed:', error.message);
              // Clear invalid tokens
              localStorage.removeItem('ink-lings-reset-token');
              localStorage.removeItem('ink-lings-reset-type');
            } else {
              console.log('✅ Token validated successfully, redirecting to reset page');
              // Store token temporarily and redirect
              localStorage.setItem('ink-lings-reset-token', resetToken);
              localStorage.setItem('ink-lings-reset-type', tokenType);
              window.location.href = `/reset-password?token=${resetToken}&type=recovery`;
            }
          } catch (error) {
            console.error('❌ Error validating token:', error);
          }
        }
      }
    };
    
    // Run the check
    checkForResetToken();
  }, []);

  // Smooth scroll to top on page transitions
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [appPhase, onboardingPhase]);

  const handleGetStarted = () => {
    // This function is no longer used since we redirect to /auth
    // Keeping it for backward compatibility but it won't be called
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
          timezone: userPreferences.timezone
        });
        
        console.log('Preferences saved to Supabase:', savedPreferences);
        
        // Create user_prompt_rotation record for simplified prompt management
        try {
          // First check if user already has a rotation record
          const { data: existingRotation } = await supabase
            .from('user_prompt_rotation')
            .select('*')
            .eq('uid', user.id)
            .single();
          
          if (existingRotation) {
            // User already has preferences - update with new categories
            const updateData: Partial<UserPromptRotation> = {
              next_category_to_send: userPreferences.categories[0] // Reset to first category
            };
            
            console.log('=== ROTATION UPDATE DEBUG ===');
            console.log('User preferences categories:', userPreferences.categories);
            console.log('Existing rotation data:', existingRotation);
            
            // For each category in user preferences, check and update if needed
            userPreferences.categories.forEach(category => {
              const categoryKey = category.replace(/-/g, '_') + '_current_count';
              console.log(`Checking category: ${category} -> column: ${categoryKey}`);
              console.log(`Current value: ${existingRotation[categoryKey]}`);
              
              // Check if this category column has a value of 0 and update to 1
              if (existingRotation[categoryKey] === 0 || existingRotation[categoryKey] === null) {
                updateData[categoryKey] = 1;
                console.log(`✅ Updating ${categoryKey} from ${existingRotation[categoryKey]} to 1`);
              } else {
                console.log(`⏭️ Leaving ${categoryKey} unchanged at ${existingRotation[categoryKey]}`);
              }
              // If count > 0, leave it unchanged (preserve progress)
            });
            
            console.log('Final update data:', updateData);
            
            // Update existing record
            console.log('🚀 Executing database update...');
            const { error: updateError } = await supabase
              .from('user_prompt_rotation')
              .update(updateData)
              .eq('uid', user.id);
            
            if (updateError) {
              console.error('❌ Error updating user_prompt_rotation record:', updateError);
            } else {
              console.log('✅ User prompt rotation record updated successfully');
            }
            
          } else {
            // New user - create initial record
            const baseRecord: UserPromptRotation = {
              uid: user.id,
              next_category_to_send: userPreferences.categories[0],
              work_craft_current_count: 0,
              community_society_current_count: 0,
              creativity_arts_current_count: 0,
              future_aspirations_current_count: 0,
              gratitude_joy_current_count: 0,
              health_body_current_count: 0,
              learning_growth_current_count: 0,
              memory_past_current_count: 0,
              money_life_admin_current_count: 0,
              nature_senses_current_count: 0,
              personal_reflection_current_count: 0,
              philosophy_values_current_count: 0,
              playful_whimsical_current_count: 0,
              relationships_current_count: 0,
              risk_adventure_current_count: 0,
              tech_media_current_count: 0,
              travel_place_current_count: 0,
              wildcard_surreal_current_count: 0
            };
            
            // Set enrolled categories to 1
            userPreferences.categories.forEach(category => {
              const categoryKey = category.replace(/-/g, '_') + '_current_count';
              if (baseRecord.hasOwnProperty(categoryKey)) {
                baseRecord[categoryKey] = 1;
              }
            });
            
            const { error: createError } = await supabase
              .from('user_prompt_rotation')
              .insert(baseRecord);
            
            if (createError) {
              console.error('Error creating user_prompt_rotation record:', createError);
            } else {
              console.log('User prompt rotation record created successfully');
            }
          }
          
        } catch (rotationError) {
          console.error('Error with user_prompt_rotation record:', rotationError);
        }
        
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
              window.location.href = '/auth';
              return;
            }
          } else {
            console.log('No preferences found');
            window.location.href = '/auth';
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
              window.location.href = '/auth';
              return;
            }
          } else {
            console.log('No preferences found');
            window.location.href = '/auth';
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

  const handleSignOut = async () => {
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      }
      
      // Clear local storage
      localStorage.removeItem('ink-lings-preferences');
      
      // Clear local state
      setUserPreferences(null);
      // Redirect to auth page instead of setting app phase
      window.location.href = '/auth';
      
      console.log('✅ User signed out successfully');
    } catch (error) {
      console.error('Error during sign out:', error);
      // Fallback: still clear local state and redirect
      setUserPreferences(null);
      window.location.href = '/auth';
    }
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

  const handleStopNotifications = () => {
    setShowStopModal(true);
  };

  const handlePauseNotifications = async () => {
    if (!user?.id) return;
    
    try {
      // Use cookie-based authentication (credentials: 'include' sends cookies automatically)
      // No need for Bearer token - server reads session from cookies
      const response = await fetch('/api/pause-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({}) // Empty body - auth handled by session cookies
      });

      if (response.ok) {
        // Close modal and redirect to account page with pause status
        setShowStopModal(false);
        setAppPhase('account');
        // Set a flag to show notifications paused status
        setUserPreferences(prev => prev ? { ...prev, notificationsPaused: true } : null);
      } else {
        console.error('Failed to pause notifications');
        alert('Failed to pause notifications. Please try again.');
      }
    } catch (error) {
      console.error('Error pausing notifications:', error);
      alert('Failed to pause notifications. Please try again.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.id) return;
    
    try {
      // Use cookie-based authentication (credentials: 'include' sends cookies automatically)
      // No need for Bearer token - server reads session from cookies
      const response = await fetch('/api/request-account-deletion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({ 
          // Optional metadata - email/userId verified against authenticated user
          userFirstName: user.user_metadata?.first_name,
          registrationMethod: user.app_metadata?.provider || 'email'
        })
      });

      if (response.ok) {
        // Close modal and redirect to account page with deletion status
        setShowStopModal(false);
        setAppPhase('account');
        // Clear notification prefs locally and flag deletion requested
        setUserPreferences(prev => prev ? { 
          ...prev, 
          notification_days: [],
          notification_time: '',
          timezone: '',
          notification_email: '',
          notificationsPaused: true,
          deletionRequested: true
        } : null);
        // Clear localStorage backup of preferences to avoid stale UI
        localStorage.removeItem('ink-lings-preferences');
      } else {
        console.error('Failed to submit deletion request');
        alert('Failed to submit deletion request. Please try again or contact support.');
      }
    } catch (error) {
      console.error('Error submitting deletion request:', error);
      alert('Error submitting deletion request. Please try again or contact support.');
    }
  };

  // Welcome and create-account phases are now handled by /auth route
  // These phases are no longer rendered here

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
              onBack={() => window.location.href = '/auth'}
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
      <>
        <AccountPage 
          onEditPreferences={handleEditPreferences} 
          onViewHistory={handleViewHistory} 
          onSignOut={handleSignOut}
          onStopNotifications={handleStopNotifications}
          userFirstName={user?.user_metadata?.first_name || ''}
          userEmail={user?.email || ''}
          userPreferences={userPreferences}
        />
        
        {/* Stop Notifications Modal */}
        <StopNotificationsModal
          isOpen={showStopModal}
          onClose={() => setShowStopModal(false)}
          onPauseNotifications={handlePauseNotifications}
          onDeleteAccount={handleDeleteAccount}
          isNewUser={!userPreferences?.notification_days?.length}
        />
      </>
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

}
