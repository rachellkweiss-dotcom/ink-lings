'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Settings, LogOut, Key } from 'lucide-react';

interface FloatingSettingsProps {
  onSignOut: () => void;
  onResetPassword?: () => void;
}

export function FloatingSettings({ onSignOut, onResetPassword }: FloatingSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50" ref={dropdownRef}>
      {/* Settings Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full bg-white/90 hover:bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-200"
        size="icon"
      >
        <Settings className="w-5 h-5 text-gray-600" />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[180px] py-2">
          {/* Password Reset Option */}
          {onResetPassword && (
            <button
              onClick={() => {
                onResetPassword();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center space-x-3"
            >
              <Key className="w-4 h-4 text-gray-500" />
              <span>Reset Password</span>
            </button>
          )}

          {/* Sign Out Option */}
          <button
            onClick={() => {
              onSignOut();
              setIsOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center space-x-3"
          >
            <LogOut className="w-4 h-4 text-gray-500" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}
