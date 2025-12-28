'use client';

import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { journalCategories } from '../lib/categories';
import { GratitudeEnrollmentBanner } from './gratitude-enrollment-banner';

interface SetupConfirmationProps {
  selectedCategories: string[];
  email: string;
  schedule: { days: string[]; time: string; timezone: string };
  onEditCategories: () => void;
  onEditNotifications: () => void;
  onEditSchedule: () => void;

  onComplete: () => void;
}

export function SetupConfirmation({ 
  selectedCategories, 
  email, 
  schedule, 
  onEditCategories,
  onEditNotifications,
  onEditSchedule,

  onComplete
}: SetupConfirmationProps) {
  const [gratitudeEnrolled, setGratitudeEnrolled] = useState<boolean>(false);

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

  const getCategoryName = (id: string) => {
    if (id === '2026-gratitude') {
      return '2026 Gratitude';
    }
    const category = journalCategories.find(cat => cat.id === id);
    return category ? category.name : id;
  };

  const formatDays = (days: string[]) => {
    const dayLabels = {
      monday: 'Monday',
      tuesday: 'Tuesday', 
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
      sunday: 'Sunday'
    };
    
    // Define the correct day order
    const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    // Sort days according to the proper week order
    const sortedDays = days.sort((a, b) => {
      return dayOrder.indexOf(a) - dayOrder.indexOf(b);
    });
    
    return sortedDays.map(day => dayLabels[day as keyof typeof dayLabels] || day).join(', ');
  };

  const formatTime = (time: string) => {
    // Time is already in AM/PM format, just return as is
    return time;
  };

  return (
    <div className="max-w-2xl mx-auto p-6" style={{ fontFamily: 'var(--font-shadows-into-light)' }}>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">4. Review & Complete</h1>
        <p className="text-lg text-gray-600">
          Review your selections before we set up your personalized journal experience.
        </p>
      </div>

      {gratitudeEnrolled && <GratitudeEnrollmentBanner />}

      <div className="space-y-6 mb-8">
        {/* Selected Categories */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl text-gray-900">Journal Topics</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onEditCategories}
              className="text-sm border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              Edit
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {gratitudeEnrolled && (
                <Badge 
                  key="2026-gratitude"
                  className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-3 py-1"
                >
                  2026 Gratitude
                </Badge>
              )}
              {selectedCategories.map((categoryId) => (
                <Badge 
                  key={categoryId}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-3 py-1"
                >
                  {getCategoryName(categoryId)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Email */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl text-gray-900">Notification Email</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onEditNotifications}
              className="text-sm border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              Edit
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>{email}</p>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl text-gray-900">Notification Schedule</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onEditSchedule}
              className="text-sm border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              Edit
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="font-medium text-gray-700">Days: </span>
              <span className="text-gray-600" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>{formatDays(schedule.days)}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Time: </span>
              <span className="text-gray-600" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>{formatTime(schedule.time)}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Timezone: </span>
              <span className="text-gray-600" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>{schedule.timezone}</span>
            </div>
          </CardContent>
        </Card>
      </div>



      <div className="flex justify-center items-center">
        <Button 
          onClick={onComplete}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-3"
        >
          Complete Setup
        </Button>
      </div>
    </div>
  );
}


