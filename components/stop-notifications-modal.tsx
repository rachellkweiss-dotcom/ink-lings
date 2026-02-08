'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useSupport } from './support-context';

interface StopNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPauseNotifications: () => void;
  onDeleteAccount: () => void;
  isNewUser: boolean;
  /** Optional metadata for account deletion support ticket */
  deletionMeta?: { registrationMethod?: string; userFirstName?: string };
}

export function StopNotificationsModal({ 
  isOpen, 
  onClose, 
  onPauseNotifications, 
  onDeleteAccount, 
  isNewUser,
  deletionMeta,
}: StopNotificationsModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { openSupport } = useSupport();

  if (!isOpen) return null;

  const handlePause = async () => {
    setIsProcessing(true);
    try {
      await onPauseNotifications();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = () => {
    // Close this modal and open the support modal pre-filled for account deletion
    onClose();
    openSupport({
      ticketType: 'account_deletion',
      deletionMeta,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-xl text-gray-900">
            🛑 Stop Notifications
          </CardTitle>
          <p className="text-gray-600 text-sm mt-2">
            What would you like to do?
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Pause Notifications Option - Only show for existing users */}
          {!isNewUser && (
            <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
              <h3 className="font-semibold text-blue-900 mb-2">
                ⏸️ Pause Notifications
              </h3>
              <p className="text-blue-700 text-sm mb-3">
                Temporarily stop receiving prompts. Your progress is saved and you can resume anytime by updating your schedule.
              </p>
              <Button 
                onClick={handlePause}
                disabled={isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                {isProcessing ? 'Pausing...' : 'Pause Notifications'}
              </Button>
            </div>
          )}

          {/* Delete Account Option */}
          <div className="p-4 border-2 border-red-200 rounded-lg bg-red-50">
            <h3 className="font-semibold text-red-900 mb-2">
              🗑️ Request Account Deletion
            </h3>
            <p className="text-red-700 text-sm mb-3">
              Submit a request to permanently delete your account. We&apos;ll process this manually and contact you to confirm the deletion.
            </p>
            <Button 
              onClick={handleDelete}
              disabled={isProcessing}
              variant="destructive"
              className="w-full"
              size="sm"
            >
              Request Deletion
            </Button>
          </div>

          {/* Cancel Button */}
          <Button 
            onClick={onClose}
            variant="outline"
            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
            size="sm"
          >
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
