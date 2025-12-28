'use client';

import { Card, CardContent } from './ui/card';

export function GratitudeEnrollmentBanner() {
  return (
    <Card className="mb-6 border-2 border-orange-500 bg-gradient-to-br from-blue-100 via-orange-100 to-amber-100">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-base font-semibold text-gray-900">
              ✨ You're enrolled in the 2026 Gratitude Challenge!
            </p>
            <p className="text-sm text-gray-700 mt-1">
              These prompts will arrive daily, separate from your regular journal prompt schedule.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

