'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface Ticket {
  token: string;
  email: string;
  name: string | null;
  ticketType: string;
  subject: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

interface Message {
  id: string;
  senderType: 'user' | 'admin' | 'bot';
  senderName: string;
  content: string;
  createdAt: string;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getStatusBadge(status: string) {
  const config: Record<string, { label: string; className: string }> = {
    open: { label: 'Open', className: 'bg-blue-100 text-blue-800 border-blue-200' },
    in_progress: { label: 'In Progress', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    resolved: { label: 'Resolved', className: 'bg-green-100 text-green-800 border-green-200' },
    closed: { label: 'Closed', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  };
  const { label, className } = config[status] || config.open;
  return <Badge variant="outline" className={className}>{label}</Badge>;
}

function getTypeBadge(ticketType: string) {
  const config: Record<string, { label: string; emoji: string }> = {
    help: { label: 'Help', emoji: '❓' },
    bug: { label: 'Bug', emoji: '🐛' },
    account_deletion: { label: 'Deletion', emoji: '🗑️' },
  };
  const { label, emoji } = config[ticketType] || { label: ticketType, emoji: '📩' };
  return <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200">{emoji} {label}</Badge>;
}

export default function SupportChatPage() {
  const params = useParams();
  const token = params.token as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchTicket = useCallback(async () => {
    try {
      const response = await fetch(`/api/support/tickets/${token}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to load ticket');
        return;
      }

      setTicket(data.ticket);
      setMessages(data.messages);
    } catch {
      setError('Unable to load your support request. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || sending) return;

    setSending(true);
    setSendError('');

    try {
      const response = await fetch(`/api/support/tickets/${token}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSendError(data.error || 'Failed to send message');
        return;
      }

      // Add the new message to the list
      setMessages((prev) => [...prev, data.message]);
      setReplyContent('');

      // Refocus textarea
      textareaRef.current?.focus();
    } catch {
      setSendError('Unable to send your message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const isTicketClosed = ticket?.status === 'resolved' || ticket?.status === 'closed';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your request...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <p className="text-red-600 mb-4">{error || 'Ticket not found'}</p>
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Go to Ink-lings
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {ticket.subject}
              </h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {getTypeBadge(ticket.ticketType)}
                {getStatusBadge(ticket.status)}
                <span className="text-xs text-gray-500">
                  Opened {formatDate(ticket.createdAt)}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchTicket()}
              className="shrink-0 text-xs"
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="space-y-4 mb-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.senderType === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 ${
                  msg.senderType === 'user'
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : msg.senderType === 'bot'
                    ? 'bg-purple-100 text-purple-900 border border-purple-200 rounded-bl-md'
                    : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md shadow-sm'
                }`}
              >
                {msg.senderType !== 'user' && (
                  <p className={`text-xs font-medium mb-1 ${
                    msg.senderType === 'bot' ? 'text-purple-600' : 'text-blue-600'
                  }`}>
                    {msg.senderName}
                  </p>
                )}
                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                <p className={`text-xs mt-1 ${
                  msg.senderType === 'user' ? 'text-blue-200' : 'text-gray-400'
                }`}>
                  {formatFullDate(msg.createdAt)}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Resolved Banner */}
        {isTicketClosed && (
          <div className="p-4 border-2 border-green-200 rounded-lg bg-green-50 text-center mb-6">
            <p className="text-green-800 font-medium">
              This request has been resolved.
            </p>
            {ticket.resolvedAt && (
              <p className="text-green-600 text-sm mt-1">
                Resolved on {formatFullDate(ticket.resolvedAt)}
              </p>
            )}
            <p className="text-green-700 text-sm mt-2">
              Need more help? <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium underline">Submit a new request</Link>
            </p>
          </div>
        )}

        {/* Reply Input */}
        {!isTicketClosed && (
          <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent pt-4 pb-6">
            <form onSubmit={handleSendReply}>
              <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                <textarea
                  ref={textareaRef}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Type your reply..."
                  maxLength={2000}
                  rows={3}
                  className="w-full px-4 py-3 text-sm resize-none outline-none placeholder:text-gray-400 bg-transparent"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply(e);
                    }
                  }}
                />
                <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 bg-gray-50">
                  <span className="text-xs text-gray-400">
                    {replyContent.length}/2000
                  </span>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!replyContent.trim() || sending}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4"
                  >
                    {sending ? 'Sending...' : 'Send'}
                  </Button>
                </div>
              </div>
              {sendError && (
                <p className="text-red-600 text-xs mt-2 text-center">{sendError}</p>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
