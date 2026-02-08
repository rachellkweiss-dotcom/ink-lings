'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from './auth-context';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTicketType?: 'help' | 'bug' | 'account_deletion';
  /** Extra metadata for account deletion (registrationMethod, userFirstName) */
  deletionMeta?: { registrationMethod?: string; userFirstName?: string };
}

const ALL_TICKET_TYPES = [
  { value: 'help', label: 'Help / Question', emoji: '❓', description: 'Ask us anything about Ink-lings' },
  { value: 'bug', label: 'Bug Report', emoji: '🐛', description: 'Something not working right? Let us know' },
  { value: 'account_deletion', label: 'Account Deletion', emoji: '🗑️', description: 'Request to delete your account and data', authOnly: true },
] as const;

export function SupportModal({ isOpen, onClose, defaultTicketType, deletionMeta }: SupportModalProps) {
  const { user } = useAuth();

  // Unauth users see Bug + Help only; auth users see all 3
  // Exception: if defaultTicketType is account_deletion (opened from stop-notifications), show it regardless
  const ticketTypes = ALL_TICKET_TYPES.filter(
    (t) => !t.authOnly || user || defaultTicketType === 'account_deletion'
  );
  const [ticketType, setTicketType] = useState<string>(defaultTicketType || '');
  const [subject, setSubject] = useState(defaultTicketType === 'account_deletion' ? 'Account Deletion Request' : '');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [name, setName] = useState(
    user?.user_metadata?.first_name || user?.user_metadata?.full_name || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState<{ chatUrl: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!ticketType) {
      setError('Please select a request type.');
      return;
    }
    if (!subject.trim()) {
      setError('Please enter a subject.');
      return;
    }
    if (!description.trim()) {
      setError('Please describe your request.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!user && !name.trim()) {
      setError('Please enter your name.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ticketType,
          subject: subject.trim(),
          description: description.trim(),
          email: email.trim(),
          name: name.trim() || undefined,
          registrationMethod: deletionMeta?.registrationMethod,
          userFirstName: deletionMeta?.userFirstName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      setSuccessData({ chatUrl: data.chatUrl });
    } catch {
      setError('Unable to submit your request. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form state
    setTicketType(defaultTicketType || '');
    setSubject(defaultTicketType === 'account_deletion' ? 'Account Deletion Request' : '');
    setDescription('');
    setError('');
    setSuccessData(null);
    onClose();
  };

  // Success state - auto-close after brief confirmation
  if (successData) {
    return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-xl text-gray-900">
            Request Submitted
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border-2 border-green-200 rounded-lg bg-green-50 text-center">
              <p className="text-green-800 font-medium mb-2">
                We received your request and are working on it.
              </p>
              <p className="text-green-700 text-sm">
                Check your email for a confirmation with a link to track your request.
              </p>
            </div>

            <Button
              onClick={handleClose}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              Got it
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <Card className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-xl text-gray-900">
            Contact Support
          </CardTitle>
          <p className="text-gray-600 text-sm mt-1">
            How can we help?
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Ticket Type Selector */}
            <div className="space-y-2">
              <Label className="text-gray-700">What do you need help with?</Label>
              <div className="grid grid-cols-1 gap-2">
                {ticketTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      setTicketType(type.value);
                      if (type.value === 'account_deletion' && !subject) {
                        setSubject('Account Deletion Request');
                      }
                    }}
                    className={`p-3 border-2 rounded-lg text-left transition-all ${
                      ticketType === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{type.emoji}</span>
                      <span className="font-medium text-gray-900">{type.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 ml-6">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Account Deletion Warning */}
            {ticketType === 'account_deletion' && (
              <div className="p-3 border-2 border-amber-200 rounded-lg bg-amber-50">
                <p className="text-amber-800 text-sm">
                  <strong>Note:</strong> Your notifications will be automatically paused when you submit this request. We&apos;ll contact you to confirm the deletion.
                </p>
              </div>
            )}

            {/* Subject */}
            <div className="space-y-1.5">
              <Label htmlFor="support-subject" className="text-gray-700">Subject</Label>
              <Input
                id="support-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of your request"
                maxLength={200}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="support-description" className="text-gray-700">Description</Label>
              <textarea
                id="support-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please describe your request in detail..."
                maxLength={5000}
                rows={4}
                required
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-y min-h-[100px]"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="support-email" className="text-gray-700">Email</Label>
              <Input
                id="support-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={!!user?.email}
              />
              {!user && (
                <p className="text-xs text-gray-500">We&apos;ll use this to send you updates on your request.</p>
              )}
            </div>

            {/* Name */}
            {!user && (
              <div className="space-y-1.5">
                <Label htmlFor="support-name" className="text-gray-700">Name</Label>
                <Input
                  id="support-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  maxLength={100}
                  required
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 border border-red-200 rounded-lg bg-red-50">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                onClick={handleClose}
                variant="outline"
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                size="sm"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
