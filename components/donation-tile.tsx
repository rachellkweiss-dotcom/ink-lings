'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DonationTileProps {
  userEmail: string;
}

export function DonationTile({ userEmail }: DonationTileProps) {
  const [isDonating, setIsDonating] = useState(false);
  const [customAmount, setCustomAmount] = useState('');


  const handleDonation = async (amount: number, donationType: string) => {
    setIsDonating(true);
    try {
      const response = await fetch('/api/create-donation-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          donationType,
          customerEmail: userEmail,
        }),
      });

      const result = await response.json();

      if (result.success && result.url) {
        // Redirect to Stripe Checkout
        window.location.href = result.url;
      } else {
        console.error('Failed to create donation session:', result.error);
        alert('Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Donation error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsDonating(false);
    }
  };

  const handleCustomDonation = () => {
    const amount = parseFloat(customAmount);
    if (amount >= 1) {
      handleDonation(Math.round(amount * 100), 'custom_donation');
    } else {
      alert('Please enter an amount of $1 or more.');
    }
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
      <CardHeader className="text-center">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Support Ink-lings
        </h2>
        <p className="text-gray-600 text-sm">
          Ink-lings is a passion project. If you&apos;ve enjoyed the prompts and want to help keep it going, 
          you can chip in here. Every bit helps — thank you!
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Donation Tiers */}
        <div className="space-y-3">
          {/* Coffee & Journaling */}
          <Button
            onClick={() => handleDonation(500, 'coffee_journaling')}
            disabled={isDonating}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
            size="sm"
          >
            ☕ Coffee & Journaling - $5
          </Button>

          {/* Monthly Supporter */}
          <Button
            onClick={() => handleDonation(500, 'monthly_supporter')}
            disabled={isDonating}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
            size="sm"
          >
            ✒️ Monthly Supporter - $5/month
          </Button>

          {/* Custom Amount */}
          <div className="space-y-2 p-4 border-2 border-blue-200 rounded-lg bg-blue-50/50">
            <Label htmlFor="custom-amount" className="text-sm text-gray-600">
              💵 Digital Tip Jar - Pay what you want
            </Label>
            <div className="flex space-x-2">
              <Input
                id="custom-amount"
                type="number"
                min="1"
                step="0.01"
                placeholder="Enter amount ($1+)"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="flex-1 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
              <Button
                onClick={handleCustomDonation}
                disabled={isDonating || !customAmount}
                className="bg-green-600 hover:bg-green-700 text-white transition-colors duration-200"
                size="sm"
              >
                Give
              </Button>
            </div>
          </div>
        </div>

        {/* Status */}
        {isDonating && (
          <div className="text-center py-2">
            <div className="inline-flex items-center space-x-2 text-blue-600">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Preparing your donation...</span>
            </div>
          </div>
        )}

        {/* Trust Indicators */}
        <div className="pt-2 border-t border-gray-200">
          <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
            <span className="flex items-center space-x-1">
              <span>🔒</span>
              <span>Secure</span>
            </span>
            <span className="flex items-center space-x-1">
              <span>💳</span>
              <span>Stripe</span>
            </span>
            <span className="flex items-center space-x-1">
              <span>✨</span>
              <span>Thank You</span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
