'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';

interface NotificationSetupProps {
  onNext: (email: string) => void;
  onBack: () => void;
  userFirstName?: string;
  accountEmail?: string; // This will be their sign-in email
  existingEmail?: string; // For editing existing preferences
}

export function NotificationSetup({ onNext, onBack, userFirstName, accountEmail, existingEmail }: NotificationSetupProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  // Ensure page starts at top
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Initialize email with existing email, account email, or empty
  useEffect(() => {
    if (existingEmail) {
      setEmail(existingEmail);
    } else if (accountEmail) {
      setEmail(accountEmail);
    }
  }, [accountEmail, existingEmail]);

  // Debug logging
  console.log('NotificationSetup received accountEmail:', accountEmail);
  console.log('NotificationSetup current email state:', email);

  const handleSendTestEmail = async () => {
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          subject: '✍️ Confirmed, this is your journaling inbox',
          html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Ink-lings Journaling Inbox Confirmation</title>
                <style>
                    body {
                        margin: 0;
                        padding: 0;
                        font-family: 'Shadows Into Light', cursive, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                        background-color: #f8fafc;
                        color: #1e293b;
                        line-height: 1.6;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                    }
                    .logo {
                        max-width: 200px;
                        height: auto;
                        margin-bottom: 10px;
                    }

                    .content-card {
                        background: white;
                        border-radius: 12px;
                        padding: 40px;
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                        margin-bottom: 30px;
                    }
                    .greeting {
                        font-size: 18px;
                        font-weight: 600;
                        margin-bottom: 20px;
                        color: #1e293b;
                    }
                    .message {
                        font-size: 16px;
                        margin-bottom: 20px;
                        color: #1e293b;
                    }
                    .highlight {
                        color: #1e293b;
                        font-weight: 500;
                    }
                    .closing {
                        margin-top: 30px;
                        color: #1e293b;
                        font-size: 16px;
                    }
                    .signature {
                        font-size: 18px;
                        font-weight: 600;
                        color: #1e293b;
                    }
                    .footer {
                        text-align: center;
                        color: #1e293b;
                        font-size: 14px;
                    }
                    @media only screen and (max-width: 600px) {
                        .container {
                            padding: 15px;
                        }
                        .content-card {
                            padding: 30px 20px;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <img src="https://your-domain.com/logo_for_emails.png" alt="Ink-lings Logo" class="logo">

                    </div>
                    
                    <div class="content-card">
                        <div class="greeting">Hi ${userFirstName || 'there'},</div>
                        
                        <div class="message">
                            You're all set — this is the email address we'll use to send your <span class="highlight">Ink-lings</span> journaling prompts.
                        </div>
                        
                        <div class="message">
                            No need to reply. Just keep an eye out for your first prompt on the schedule you chose.
                        </div>
                        
                        <div class="message">
                            In the meantime, grab a pen and your favorite notebook — you're about to start building a legacy one page at a time.
                        </div>
                        
                        <div class="closing">
                            Talk soon,<br><br>
                            <span class="signature">The Ink-lings Team</span>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>Need help? <a href="mailto:rachell.k.weiss@gmail.com" style="color: #0891b2; text-decoration: underline; font-weight: 500;">Contact Support</a></p>
                    </div>
                </div>
            </body>
            </html>
          `,
        }),
      });

      if (response.ok) {
        toast.success('Test email sent successfully!');
        setShowSuccessPopup(true); // Show the success popup
      } else {
        const error = await response.json();
        toast.error(`Failed to send email: ${error.message}`);
      }
    } catch (error) {
      toast.error('Failed to send test email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (email.trim()) {
      onNext(email.trim());
    } else {
      toast.error('Please enter an email address');
    }
  };

  const handleSkipTest = () => {
    setShowSkipConfirm(true);
  };

  const handleConfirmSkip = () => {
    setShowSkipConfirm(false);
    if (email.trim()) {
      onNext(email.trim());
    } else {
      toast.error('Please enter an email address');
    }
  };

  const handleCancelSkip = () => {
    setShowSkipConfirm(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6" style={{ fontFamily: 'var(--font-shadows-into-light)' }}>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">2. Set Up Notifications</h1>
        <p className="text-lg text-gray-600">
          We default sending your prompts to your Ink-lings account email. If this is the right address, test it now. If you want to use a different email, enter the new delivery email and test.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl text-gray-900">Email Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Delivery email for your journal prompts:
            </label>
            <Input
              id="email"
              type="email"
              placeholder="your-email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full font-sans text-base"
              style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
            />
          </div>
          
          <Button
            onClick={handleSendTestEmail}
            disabled={!email || isLoading}
            variant="outline"
            className="w-full border-cyan-500 text-cyan-600 hover:bg-cyan-50"
          >
            {isLoading ? 'Sending...' : 'Send Test Notification'}
          </Button>

          <Button
            onClick={handleSkipTest}
            disabled={!email || isLoading}
            variant="ghost"
            className="w-full text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          >
            Skip Test
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-start items-center">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Back
        </Button>
      </div>

      {/* Success Popup Modal */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center shadow-xl">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                You've got a message!
              </h3>
              <p className="text-gray-600">
                Check to make sure it came through!
              </p>
            </div>
            
            <Button 
              onClick={handleNext}
              disabled={!email.trim()}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-3"
            >
              Next: Choose Schedule
            </Button>
          </div>
        </div>
      )}

      {/* Skip Confirmation Popup Modal */}
      {showSkipConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center shadow-xl">
            <div className="mb-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Skip Email Test?
              </h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to skip testing your email? We recommend testing to make sure you'll receive your journal prompts.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <Button 
                onClick={handleCancelSkip}
                variant="outline"
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmSkip}
                disabled={!email.trim()}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                Yes, Skip Test
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
