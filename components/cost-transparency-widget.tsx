'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from './ui/card';

export function CostTransparencyWidget() {
  const [donationTotal, setDonationTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Annual cost breakdown
  const ANNUAL_COST = 675; // $675/year total
  const GOAL_AMOUNT = 675; // Hide widget when $675+ is reached

  useEffect(() => {
    // Fetch actual donation total from API
    const fetchDonationTotal = async () => {
      try {
        const response = await fetch('/api/get-donation-total');
        const data = await response.json();
        
        if (data.success) {
          setDonationTotal(data.total);
        } else {
          console.error('Failed to fetch donation total:', data.error);
          setDonationTotal(0);
        }
      } catch (error) {
        console.error('Error fetching donation total:', error);
        setDonationTotal(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDonationTotal();
  }, []);

  // Calculate progress percentage (cap at 100%)
  const progressPercentage = Math.min((donationTotal / GOAL_AMOUNT) * 100, 100);
  
  // Cap donation total at goal amount for display
  const displayDonationTotal = Math.min(donationTotal, GOAL_AMOUNT);
  
  // Determine progress bar color based on percentage
  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 80) return 'bg-green-400';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Always show widget, even when goal is met

  if (isLoading) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-4"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader className="text-center pb-2">
        <h3 className="text-2xl font-semibold text-gray-800 mb-2">
          Cost Transparency
        </h3>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cost Breakdown */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Website Domain:</span>
            <span className="font-medium">$50</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Coding/Debugging:</span>
            <span className="font-medium">$275</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Data Storage:</span>
            <span className="font-medium">$350</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Dev Time Invested:</span>
            <span className="font-medium text-gray-900">Fueled by Coffee & Tips</span>
          </div>
          <div className="border-t pt-2">
            <div className="flex justify-between font-semibold">
              <span className="text-gray-900">Total Annual Cost:</span>
              <span className="text-gray-900">${ANNUAL_COST}</span>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="space-y-3">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              Community Progress: ${displayDonationTotal} of ${GOAL_AMOUNT} covered
            </p>
            <p className="text-xs text-gray-600">
              by awesome people like you! 🎉
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(progressPercentage)}`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>

          {/* Progress Percentage */}
          <div className="text-center">
            <span className={`text-sm font-medium ${
              progressPercentage >= 90 ? 'text-green-600' :
              progressPercentage >= 80 ? 'text-green-500' :
              progressPercentage >= 40 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {Math.round(progressPercentage)}% Complete
            </span>
          </div>
        </div>

        {/* Remaining Amount - Only show when goal not met */}
        {displayDonationTotal < GOAL_AMOUNT && (
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-medium">${Math.max(0, GOAL_AMOUNT - displayDonationTotal)}</span> still needed to cover costs
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
