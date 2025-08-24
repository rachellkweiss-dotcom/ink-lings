'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface ScheduleSetupProps {
  onNext: (schedule: { days: string[]; time: string; timezone: string }) => void;
  onBack: () => void;
  existingSchedule?: { days: string[]; time: string; timezone: string };
}

export function ScheduleSetup({ onNext, onBack, existingSchedule }: ScheduleSetupProps) {
  const [selectedDays, setSelectedDays] = useState<string[]>(existingSchedule?.days || []);
  const [selectedTime, setSelectedTime] = useState(existingSchedule?.time || '9:00 AM');
  const [selectedTimezone, setSelectedTimezone] = useState(existingSchedule?.timezone || 'America/New_York');

  // Ensure page starts at top
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const daysOfWeek = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ];

  const timeSlots = [
    '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
    '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM'
  ];

  const timezones = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Europe/Paris', label: 'Paris (CET)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEST)' }
  ];

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleNext = () => {
    if (selectedDays.length > 0) {
      onNext({
        days: selectedDays,
        time: selectedTime,
        timezone: selectedTimezone
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6" style={{ fontFamily: 'var(--font-shadows-into-light)' }}>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">3. Choose Schedule</h1>
        <p className="text-lg text-gray-600">
          Pick when you'd like to receive your journal prompts. Choose the days and time that work best for your routine.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl text-gray-900">Notification Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-3 mb-6 max-w-md mx-auto">
            {daysOfWeek.map((day) => (
              <Button
                key={day.value}
                variant={selectedDays.includes(day.value) ? "default" : "outline"}
                onClick={() => toggleDay(day.value)}
                className={`${
                  selectedDays.includes(day.value)
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                } min-w-[60px] text-sm px-2`}
              >
                {day.label.slice(0, 3)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl text-gray-900">Notification Time</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What time should we send your prompts?
            </label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger className="w-full" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
                <SelectValue style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }} />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What's your timezone?
            </label>
            <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
              <SelectTrigger className="w-full" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
                <SelectValue style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }} />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Back
        </Button>
        <Button 
          onClick={handleNext}
          disabled={selectedDays.length === 0}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-3"
        >
          Next: Review & Complete
        </Button>
      </div>
    </div>
  );
}
