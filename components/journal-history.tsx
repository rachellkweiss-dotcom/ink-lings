'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { journalCategories } from '@/lib/categories';

interface PromptHistoryItem {
  id: string;
  category: string;
  promptText: string;
  promptNumber: number;
  sentAt: string;
  emailSentTo: string;
}

interface JournalHistoryProps {
  userId: string;
  onBackToAccount?: () => void;
}

export function JournalHistory({ userId, onBackToAccount }: JournalHistoryProps) {
  const [promptHistory, setPromptHistory] = useState<PromptHistoryItem[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<PromptHistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ensure page starts at top
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Fetch prompt history when component mounts
  useEffect(() => {
    const fetchPromptHistory = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/user-prompt-history?userId=${userId}`);
        const result = await response.json();
        
        if (result.success) {
          // Filter to only show prompts from the last 90 days
          const ninetyDaysAgo = new Date();
          ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
          
          const recentPrompts = result.data.filter((entry: PromptHistoryItem) => {
            const entryDate = new Date(entry.sentAt);
            return entryDate >= ninetyDaysAgo;
          });
          
          setPromptHistory(recentPrompts);
          setFilteredEntries(recentPrompts);
        } else {
          setError('Failed to fetch prompt history');
        }
      } catch (err) {
        setError('Error loading prompt history');
        console.error('Error fetching prompt history:', err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchPromptHistory();
    }
  }, [userId]);

  // Filter entries based on search criteria
  useEffect(() => {
    let filtered = promptHistory;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(entry =>
        entry.promptText.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(entry => entry.category === selectedCategory);
    }

    // Filter by date
    if (selectedDate) {
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.sentAt).toISOString().split('T')[0];
        return entryDate === selectedDate;
      });
    }

    setFilteredEntries(filtered);
  }, [promptHistory, searchTerm, selectedCategory, selectedDate]);

  const getCategoryName = (id: string) => {
    const category = journalCategories.find(cat => cat.id === id);
    return category?.name || id;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedDate('');
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            Prompt History
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Reflect on your journaling journey and revisit past prompts from the last 3 months
          </p>
        </div>
        
        <Card className="text-center py-12">
          <CardContent className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400">Loading your prompt history...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            Prompt History
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Reflect on your journaling journey and revisit past prompts from the last 3 months
          </p>
        </div>
        
        <Card className="text-center py-12 border-red-200 bg-red-50">
          <CardContent className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-red-900">Error Loading History</h3>
              <p className="text-red-600">{error}</p>
            </div>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page Title */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
          Prompt History
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Reflect on your journaling journey and revisit past prompts from the last 3 months
        </p>
      </div>

      {/* Back to Account Button */}
      {onBackToAccount && (
        <div className="text-center">
          <Button
            onClick={onBackToAccount}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 transition-colors duration-200"
          >
            ← Back to Account
          </Button>
        </div>
      )}

      {/* Filters */}
      <Card className="max-w-3xl mx-auto">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
            </svg>
            <span>Filter & Search</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {/* Search by keyword */}
            <div className="space-y-1">
              <Label htmlFor="search" className="text-sm font-medium">Search prompts</Label>
              <Input
                id="search"
                placeholder="Search by keyword..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 w-full"
              />
            </div>

            {/* Filter by category */}
            <div className="space-y-1">
              <Label htmlFor="category" className="text-sm font-medium">Filter by category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {journalCategories
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter by date */}
            <div className="space-y-1">
              <Label htmlFor="date" className="text-sm font-medium">Filter by date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-9 w-full"
              />
            </div>
          </div>

          {/* Clear filters */}
          {(searchTerm || selectedCategory || selectedDate) && (
            <div className="flex justify-center mt-4">
              <Button
                onClick={clearFilters}
                variant="outline"
                size="sm"
              >
                Clear all filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">
            {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
          </Badge>
          {filteredEntries.length !== promptHistory.length && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              of {promptHistory.length} total
            </span>
          )}
        </div>
      </div>

      {/* Journal Entries */}
      {filteredEntries.length > 0 ? (
        <div className="space-y-3">
          {filteredEntries.map((entry) => (
            <Card key={entry.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="space-y-2">
                  {/* Entry Header */}
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="text-xs">
                      {getCategoryName(entry.category)}
                    </Badge>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(entry.sentAt)}
                    </span>
                  </div>

                  {/* Prompt */}
                  <p className="text-gray-700 dark:text-gray-300 italic">
                    &ldquo;{entry.promptText}&rdquo;
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Empty State */
        <Card className="text-center py-12">
          <CardContent className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {promptHistory.length === 0 ? 'No Prompts Yet' : 'No entries match your filters'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {promptHistory.length === 0 
                  ? 'They\'ll be coming soon based on the schedule you chose.'
                  : 'Try adjusting your search criteria or clear the filters.'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
