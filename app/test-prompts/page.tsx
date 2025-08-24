'use client';

import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export default function TestPromptsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ message: string; results?: Array<{ email: string; category?: string; promptNumber?: number; status: string; error?: string }> } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testSendPrompts = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/send-prompts', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const createTestUser = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Get current time and day - set to trigger within 10-minute window
      const now = new Date();
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Set test time to current time (should be within 10-minute window)
      const testTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      
      console.log(`Creating test user for ${currentDay} at ${testTime} (current time)`);
      
      // Also log what the system will compare
      console.log(`System will check: Current time vs ${testTime}, should be 0 minutes difference`);

      const response = await fetch('/api/create-test-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'rkweiss89@gmail.com',
          timezone: 'America/Chicago', // CST timezone
          notificationDays: [currentDay],
          notificationTime: testTime,
          categories: ['personal-reflection', 'playful-whimsical']
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const testDatabase = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/test-db');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">🧪 Test Prompt System</h1>
          <p className="text-lg text-gray-600">
            Test the automated journal prompt sending system
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Manual Test</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Click the button below to manually trigger the prompt sending system. 
              This will check all users who should receive prompts right now and send them emails.
            </p>
            <Button 
              onClick={testSendPrompts}
              disabled={isLoading}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {isLoading ? 'Processing...' : 'Send Prompts Now'}
            </Button>
            
            <div className="mt-4">
              <Button 
                onClick={createTestUser}
                disabled={isLoading}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                {isLoading ? 'Creating...' : 'Create Test User'}
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                Creates a test user with preferences set to trigger prompts right now
              </p>
            </div>
            
            <div className="mt-4">
              <Button 
                onClick={testDatabase}
                disabled={isLoading}
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                {isLoading ? 'Testing...' : 'Test Database Connection'}
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                Tests if we can connect to the database and what permissions we have
              </p>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800">Result</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-green-800">Summary:</h3>
                  <p className="text-green-700">{result.message}</p>
                </div>
                
                {result.results && result.results.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-green-800 mb-2">Details:</h3>
                    <div className="space-y-2">
                      {result.results.map((item: { email: string; category?: string; promptNumber?: number; status: string; error?: string }, index: number) => (
                        <div key={index} className="bg-white p-3 rounded border">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{item.email}</p>
                              {item.category && (
                                <p className="text-sm text-gray-600">
                                  Category: {item.category} (Prompt #{item.promptNumber})
                                </p>
                              )}
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              item.status === 'sent' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                          {item.error && (
                            <p className="text-red-600 text-sm mt-1">{item.error}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">1. User Selection</h3>
              <p className="text-gray-600">
                The system checks all users who have selected today as one of their notification days.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">2. Time Check</h3>
              <p className="text-gray-600">
                For each user, it checks if it&apos;s within 1 hour of their preferred notification time.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">3. Prompt Selection</h3>
              <p className="text-gray-600">
                It rotates through the user&apos;s selected categories and picks the next prompt number for that category.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">4. Email Sending</h3>
              <p className="text-gray-600">
                Sends a personalized email with the journal prompt using your Resend API.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">5. Progress Tracking</h3>
              <p className="text-gray-600">
                Updates the database to track which prompts have been sent and rotates to the next category.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
