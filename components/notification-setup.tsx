'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';
import { GratitudeEnrollmentBanner } from './gratitude-enrollment-banner';
import type { NotificationChannel } from '@/lib/types';

interface NotificationSetupProps {
  onNext: (data: {
    channel: NotificationChannel;
    email: string;
    discordWebhookUrl: string | null;
  }) => void;
  onBack: () => void;
  userFirstName?: string;
  accountEmail?: string;
  existingEmail?: string;
  existingChannel?: NotificationChannel;
  existingDiscordWebhookUrl?: string | null;
  selectedCategories?: string[];
}

// Validates Discord incoming webhook URLs. Both discord.com and discordapp.com
// hosts are accepted (Discord's docs still reference both).
const DISCORD_WEBHOOK_RE = /^https:\/\/(discord|discordapp)\.com\/api\/webhooks\/\d+\/[\w-]+$/;

export function NotificationSetup({
  onNext,
  onBack,
  userFirstName,
  accountEmail,
  existingEmail,
  existingChannel,
  existingDiscordWebhookUrl,
  selectedCategories,
}: NotificationSetupProps) {
  const [channel, setChannel] = useState<NotificationChannel>(existingChannel ?? 'email');
  const [email, setEmail] = useState('');
  const [webhookUrl, setWebhookUrl] = useState(existingDiscordWebhookUrl ?? '');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [gratitudeEnrolled, setGratitudeEnrolled] = useState<boolean>(false);
  // Track whether the user has sent a successful test in *this* channel, so
  // that the primary "Next" button can skip the confirm prompt if they did.
  // Switching channels (or editing the value after testing) re-arms the prompt.
  const [emailTested, setEmailTested] = useState(false);
  const [discordTested, setDiscordTested] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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

  useEffect(() => {
    if (existingEmail) {
      setEmail(existingEmail);
    } else if (accountEmail) {
      setEmail(accountEmail);
    }
  }, [accountEmail, existingEmail]);

  const webhookValid = DISCORD_WEBHOOK_RE.test(webhookUrl.trim());
  const emailValid = email.trim().length > 0;
  const canProceed = channel === 'email' ? emailValid : webhookValid;

  // The user is editing existing preferences whenever they have a saved channel.
  // We surface a "Currently:" callout so they can see (and confirm or change)
  // what's already configured before they pick anything else.
  const isEditing = Boolean(existingChannel);
  const currentChannelLabel = existingChannel === 'discord' ? 'Discord' : 'Email';
  const maskWebhook = (url: string) =>
    url.replace(/(\/api\/webhooks\/\d+\/)[\w-]+/, '$1\u2022\u2022\u2022\u2022\u2022\u2022');
  const isChangingChannel = isEditing && channel !== existingChannel;

  const handleSendTestEmail = async () => {
    if (!emailValid) {
      toast.error('Please enter an email address');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/send-onboarding-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test-user',
          userEmail: email,
          userFirstName: userFirstName || 'there',
          selectedCategories: selectedCategories || [],
          categoryNames: [],
          isTestEmail: true,
        }),
      });

      if (response.ok) {
        toast.success('Test email sent successfully!');
        setEmailTested(true);
        setShowSuccessPopup(true);
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(`Failed to send email: ${errorData.message ?? response.statusText}`);
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      toast.error('Failed to send test email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTestDiscord = async () => {
    if (!webhookValid) {
      toast.error('That doesn\u2019t look like a Discord webhook URL. It should start with https://discord.com/api/webhooks/');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/send-onboarding-discord-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: webhookUrl.trim(),
          userFirstName: userFirstName || 'there',
        }),
      });

      if (response.ok) {
        toast.success('Test message sent to Discord!');
        setDiscordTested(true);
        setShowSuccessPopup(true);
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(
          `Discord rejected the webhook: ${errorData.message ?? response.statusText}. Double-check the URL and try again.`,
        );
      }
    } catch (error) {
      console.error('Error sending test Discord message:', error);
      toast.error('Failed to send to Discord. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const hasTestedCurrentChannel = channel === 'email' ? emailTested : discordTested;

  const commitAndAdvance = () => {
    if (channel === 'email') {
      onNext({ channel: 'email', email: email.trim(), discordWebhookUrl: null });
    } else {
      onNext({
        channel: 'discord',
        email: (existingEmail || accountEmail || '').trim(),
        discordWebhookUrl: webhookUrl.trim(),
      });
    }
  };

  // Primary "Next" button. If the user has tested this channel in this session
  // we go straight through; otherwise we surface the skip-confirm modal so they
  // explicitly acknowledge they're moving on without confirming delivery.
  const handleNext = () => {
    if (!canProceed) {
      toast.error(
        channel === 'email'
          ? 'Please enter an email address'
          : 'Please enter a valid Discord webhook URL',
      );
      return;
    }
    if (!hasTestedCurrentChannel) {
      setShowSkipConfirm(true);
      return;
    }
    commitAndAdvance();
  };

  const handleConfirmSkip = () => {
    setShowSkipConfirm(false);
    if (canProceed) commitAndAdvance();
    else {
      toast.error(
        channel === 'email'
          ? 'Please enter an email address'
          : 'Please enter a valid Discord webhook URL',
      );
    }
  };
  const handleCancelSkip = () => setShowSkipConfirm(false);

  return (
    <div className="max-w-2xl mx-auto p-6" style={{ fontFamily: 'var(--font-shadows-into-light)' }}>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">2. Set Up Notifications</h1>
        <p className="text-lg text-gray-600">
          Pick how you want your journal prompts delivered. You can use email or a Discord channel
          you control.
        </p>
      </div>

      {gratitudeEnrolled && <GratitudeEnrollmentBanner />}

      {isEditing && (
        <div
          className="mb-6 rounded-lg border border-cyan-200 bg-cyan-50/70 p-4 text-sm"
          style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
        >
          <p className="font-medium text-cyan-900">
            Currently sending your prompts via {currentChannelLabel}
          </p>
          <p className="mt-1 text-cyan-800/80">
            {existingChannel === 'discord' && existingDiscordWebhookUrl
              ? `Webhook: ${maskWebhook(existingDiscordWebhookUrl)}`
              : `Email: ${existingEmail || accountEmail || '(none on file)'}`}
          </p>
          {isChangingChannel && (
            <p className="mt-2 text-xs text-cyan-700">
              You&apos;re switching to <strong>{channel === 'discord' ? 'Discord' : 'Email'}</strong>.
              The change saves when you finish the rest of onboarding.
            </p>
          )}
        </div>
      )}

      <div className="mb-6 flex rounded-lg border border-gray-200 bg-white p-1">
        <button
          type="button"
          onClick={() => setChannel('email')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            channel === 'email'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
          style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
        >
          Email
        </button>
        <button
          type="button"
          onClick={() => setChannel('discord')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            channel === 'discord'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
          style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
        >
          Discord
        </button>
      </div>

      {channel === 'email' ? (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">Email Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              We default to sending your prompts to your Ink-lings account email. If this is the
              right address, test it now. If you want to use a different email, enter the new
              delivery email and test.
            </p>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Delivery email for your journal prompts:
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your-email@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailTested) setEmailTested(false);
                }}
                className="w-full font-sans text-base"
                style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
              />
            </div>

            <Button
              onClick={handleSendTestEmail}
              disabled={!emailValid || isLoading}
              variant="outline"
              className="w-full border-cyan-500 text-cyan-600 hover:bg-cyan-50"
            >
              {isLoading ? 'Sending...' : emailTested ? 'Send Another Test' : 'Send Test Notification'}
            </Button>

            <Button
              onClick={handleNext}
              disabled={!emailValid || isLoading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
            >
              Next: Choose Schedule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">Discord Webhook</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Paste the Webhook URL from your Discord channel below. We&apos;ll deliver your daily
              prompts there instead of email.
            </p>
            <p className="text-sm">
              <a
                href="/discord-setup"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-600 hover:text-cyan-700 underline"
              >
                New to Discord? See setup instructions &rarr;
              </a>
            </p>
            <div>
              <label htmlFor="webhook" className="block text-sm font-medium text-gray-700 mb-2">
                Discord webhook URL:
              </label>
              <Input
                id="webhook"
                type="url"
                placeholder="https://discord.com/api/webhooks/..."
                value={webhookUrl}
                onChange={(e) => {
                  setWebhookUrl(e.target.value);
                  if (discordTested) setDiscordTested(false);
                }}
                className="w-full font-sans text-sm"
                style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
              />
              {webhookUrl.length > 0 && !webhookValid && (
                <p className="mt-2 text-xs text-red-600">
                  That doesn&apos;t look like a Discord webhook URL. It should start with
                  https://discord.com/api/webhooks/
                </p>
              )}
            </div>

            <Button
              onClick={handleSendTestDiscord}
              disabled={!webhookValid || isLoading}
              variant="outline"
              className="w-full border-cyan-500 text-cyan-600 hover:bg-cyan-50"
            >
              {isLoading ? 'Sending...' : discordTested ? 'Send Another Test' : 'Send Test to Discord'}
            </Button>

            <Button
              onClick={handleNext}
              disabled={!webhookValid || isLoading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
            >
              Next: Choose Schedule
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-start items-center">
        <Button
          variant="outline"
          onClick={onBack}
          className="border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Back
        </Button>
      </div>

      {showSuccessPopup && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center shadow-xl">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                You&apos;ve got a message!
              </h3>
              <p className="text-gray-600">
                {channel === 'email'
                  ? 'Check to make sure it came through!'
                  : 'Check your Discord channel to confirm the test landed!'}
              </p>
            </div>

            <Button
              onClick={handleNext}
              disabled={!canProceed}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-3"
            >
              Next: Choose Schedule
            </Button>
          </div>
        </div>
      )}

      {showSkipConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center shadow-xl">
            <div className="mb-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Continue without testing?
              </h3>
              <p className="text-gray-600 mb-4">
                You haven&apos;t sent a test {channel === 'email' ? 'email' : 'Discord message'} yet.
                We recommend testing now so you know your prompts will arrive where you expect.
              </p>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={handleCancelSkip}
                variant="outline"
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Go Back &amp; Test
              </Button>
              <Button
                onClick={handleConfirmSkip}
                disabled={!canProceed}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                Continue Anyway
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
