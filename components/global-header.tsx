'use client';

import Image from 'next/image';
import { Button } from './ui/button';

interface GlobalHeaderProps {
  userFirstName: string;
  onSignOut: () => void;
}

export function GlobalHeader({ userFirstName, onSignOut }: GlobalHeaderProps) {
  return (
    <header className="w-full bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Small Ink-lings Logo */}
          <div className="flex items-center">
            <Image
              src="/ink_links_logo_final_final.png"
              alt="Ink-lings Logo"
              width={120}
              height={48}
              priority
              className="h-8 w-auto"
            />
          </div>

          {/* Center: Welcome Message */}
          <div className="flex-1 text-center">
            <h1 className="text-xl font-semibold text-gray-800">
              Welcome, {userFirstName}
            </h1>
          </div>

          {/* Right: Sign Out Button */}
          <div className="flex items-center">
            <Button
              onClick={onSignOut}
              variant="outline"
              size="sm"
              className="text-gray-700 hover:text-gray-900 border-gray-300 hover:border-gray-400"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
