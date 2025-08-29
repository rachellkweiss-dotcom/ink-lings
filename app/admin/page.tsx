'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  getPromptPerformance, 
  getUserAnalytics, 
  getFeedbackAnalytics,
  type PromptPerformance,
  type UserAnalytics,
  type FeedbackAnalytics
} from '@/lib/admin-utils';
import { getRollingAnnualDonations, getLifetimeDonations } from '@/lib/stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminDashboard() {
  const [user, setUser] = useState<{ email?: string; user_metadata?: { email?: string }; id?: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPrompts: 0,
    totalFeedback: 0,
    totalDonations: 0
  });
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [promptData, setPromptData] = useState<PromptPerformance[]>([]);
  const [userData, setUserData] = useState<UserAnalytics | null>(null);
  const [feedbackData, setFeedbackData] = useState<FeedbackAnalytics | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        // Check if user is admin (you can implement your own admin logic)
        // For now, we&apos;ll check if the user email matches admin criteria
        console.log('🔍 Admin check - User object:', user);
        console.log('🔍 Admin check - User email:', user.email);
        console.log('🔍 Admin check - User metadata:', user.user_metadata);
        
        // Check both possible email locations for Google OAuth
        const userEmail = user.email || user.user_metadata?.email;
        const isAdminUser = userEmail === 'rkweiss89@gmail.com';
        
        console.log('🔍 Admin check - Final email:', userEmail);
        console.log('🔍 Admin check - Is admin:', isAdminUser);
        
        setIsAdmin(isAdminUser);
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      setLoadingData(true);
      
      // Load basic stats
      // Get total authenticated users from auth.users
      const { count: userCount } = await supabase.auth.admin.listUsers();
      
      // Get users with saved preferences from user_preferences table
      const { count: preferencesCount } = await supabase
        .from('user_preferences')
        .select('*', { count: 'exact', head: true });

      // Get Stripe donation data
      let rollingAnnualTotal = 0;
      let lifetimeTotal = 0;
      try {
        [rollingAnnualTotal, lifetimeTotal] = await Promise.all([
          getRollingAnnualDonations(),
          getLifetimeDonations()
        ]);
      } catch (error) {
        console.error('Error getting Stripe data:', error);
      }

      setStats({
        totalUsers: userCount || 0,
        totalPrompts: preferencesCount || 0, // This will show Users with Saved Preferences
        totalFeedback: rollingAnnualTotal, // Rolling annual donations
        totalDonations: lifetimeTotal // Lifetime donations
      });

      setLastUpdated(new Date().toLocaleString());

      // Temporarily disable detailed data loading to debug basic stats
      console.log('Skipping detailed data loading for now to debug basic stats');
      
      // Set empty data for now
      setPromptData([]);
      setUserData(null);
      setFeedbackData(null);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadStats();
    }
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-cyan-50 flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <div className="text-6xl mb-6">🚫</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Access Denied
            </h1>
            <p className="text-gray-600 mb-6">
              You don&apos;t have permission to access the admin dashboard.
            </p>
            
            {/* Debug Info */}
            {user && (
              <div className="bg-gray-100 p-4 rounded-lg mb-6 text-left text-sm">
                <p className="font-semibold mb-2">Debug Info:</p>
                <p>Email: {user.email || 'Not found'}</p>
                <p>Metadata Email: {user.user_metadata?.email || 'Not found'}</p>
                <p>User ID: {user.id || 'Not found'}</p>
              </div>
            )}
            
            <Button 
              onClick={() => window.history.back()}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-cyan-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600">
              Monitor your journal app&apos;s performance and user engagement
            </p>
            {lastUpdated && (
              <p className="text-sm text-gray-500 mt-1">
                Last updated: {lastUpdated}
              </p>
            )}
          </div>
          <Button
            onClick={loadStats}
            disabled={loadingData}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
          >
            {loadingData ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Refreshing...
              </>
            ) : (
              '🔄 Refresh Data'
            )}
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Badge variant="secondary">Active</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Registered users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Users with Saved Preferences</CardTitle>
              <Badge variant="secondary">Configured</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPrompts}</div>
              <p className="text-xs text-muted-foreground">
                Users who have set up preferences
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rolling Annual Donations</CardTitle>
              <Badge variant="secondary">Aug-Aug</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalFeedback}</div>
              <p className="text-xs text-muted-foreground">
                Aug to Aug total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Lifetime Donations</CardTitle>
              <Badge variant="secondary">All Time</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalDonations}</div>
              <p className="text-xs text-muted-foreground">
                Lifetime total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="prompts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="prompts">Prompt Data</TabsTrigger>
            <TabsTrigger value="users">User Data</TabsTrigger>
            <TabsTrigger value="money">Money, Money, Money</TabsTrigger>
            <TabsTrigger value="feedback">Prompt Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="prompts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Prompt Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading prompt data...</p>
                  </div>
                ) : promptData.length > 0 ? (
                  <div className="space-y-4">
                    {promptData.slice(0, 10).map((prompt) => (
                      <div key={prompt.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">
                              {prompt.category_name} - Prompt #{prompt.prompt_number}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {prompt.prompt_text.length > 100 
                                ? `${prompt.prompt_text.substring(0, 100)}...` 
                                : prompt.prompt_text}
                            </p>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-2xl font-bold text-blue-600">
                              {prompt.satisfaction_rate.toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-500">Satisfaction</div>
                          </div>
                        </div>
                        <div className="flex space-x-4 text-sm text-gray-600">
                          <span>👍 {prompt.thumbs_up_count}</span>
                          <span>👎 {prompt.thumbs_down_count}</span>
                          <span>📧 {prompt.total_sent}</span>
                          <span>📊 {prompt.response_rate.toFixed(1)}% response rate</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-8">
                    No prompt data available yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading user data...</p>
                  </div>
                ) : userData ? (
                  <div className="space-y-6">
                    {/* User Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {userData.total_users}
                        </div>
                        <div className="text-sm text-gray-600">Total Users</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {userData.active_users}
                        </div>
                        <div className="text-sm text-gray-600">Active Users (30 days)</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {userData.new_users_this_month}
                        </div>
                        <div className="text-sm text-gray-600">New This Month</div>
                      </div>
                    </div>

                    {/* Top Categories */}
                    {userData.top_categories.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Most Popular Categories</h3>
                        <div className="space-y-2">
                          {userData.top_categories.slice(0, 5).map((category, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <span className="text-lg">#{index + 1}</span>
                                <span className="font-medium text-gray-900">{category.category}</span>
                              </div>
                              <Badge variant="secondary">{category.count} users</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Timezone Distribution */}
                    {userData.timezone_distribution.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3">User Timezone Distribution</h3>
                        <div className="space-y-2">
                          {userData.timezone_distribution.slice(0, 5).map((tz, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <span className="font-medium text-gray-900">{tz.timezone}</span>
                              <Badge variant="outline">{tz.count} users</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-8">
                    No user data available yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="money" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Financial Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading financial data...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Financial Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          ${stats.totalDonations}
                        </div>
                        <div className="text-sm text-gray-600">Total Donations</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {stats.totalDonations > 0 ? Math.ceil(stats.totalDonations / 5) : 0}
                        </div>
                        <div className="text-sm text-gray-600">Estimated Donors</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          ${stats.totalDonations > 0 ? (stats.totalDonations / stats.totalUsers * 100).toFixed(2) : 0}
                        </div>
                        <div className="text-sm text-gray-600">Revenue per User</div>
                      </div>
                    </div>

                    {/* Donation Insights */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h3 className="font-semibold text-yellow-800 mb-2">💡 Donation Insights</h3>
                      <div className="text-sm text-yellow-700 space-y-1">
                        <p>• Average donation: ${stats.totalDonations > 0 ? (stats.totalDonations / Math.max(1, Math.ceil(stats.totalDonations / 5))).toFixed(2) : 0}</p>
                        <p>• Donation rate: {stats.totalUsers > 0 ? ((Math.ceil(stats.totalDonations / 5) / stats.totalUsers) * 100).toFixed(1) : 0}% of users</p>
                        <p>• Monthly goal: $50 to cover hosting and automation costs</p>
                      </div>
                    </div>

                    {/* Cost Breakdown */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Monthly Operating Costs</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium text-gray-900">Hosting & Domain</span>
                          <Badge variant="outline">$15/month</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium text-gray-900">Email Service</span>
                          <Badge variant="outline">$25/month</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium text-gray-900">Database & Storage</span>
                          <Badge variant="outline">$10/month</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-t-2 border-green-200">
                          <span className="font-bold text-gray-900">Total Monthly Cost</span>
                          <Badge variant="secondary" className="bg-green-100 text-green-800">$50/month</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Feedback Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading feedback data...</p>
                  </div>
                ) : feedbackData ? (
                  <div className="space-y-6">
                    {/* Overall Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {feedbackData.overall_satisfaction.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">Overall Satisfaction</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {feedbackData.thumbs_up_total}
                        </div>
                        <div className="text-sm text-gray-600">Total 👍</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                          {feedbackData.thumbs_down_total}
                        </div>
                        <div className="text-sm text-gray-600">Total 👎</div>
                      </div>
                    </div>

                    {/* Recent Feedback */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Recent Feedback</h3>
                      {feedbackData.recent_feedback.length > 0 ? (
                        <div className="space-y-2">
                          {feedbackData.recent_feedback.map((feedback) => (
                            <div key={feedback.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                              <span className="text-2xl">
                                {feedback.feedback_type === 'up' ? '👍' : '👎'}
                              </span>
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">
                                  Prompt ID: {feedback.prompt_id}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(feedback.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-600 text-center py-4">
                          No feedback received yet.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-8">
                    No feedback data available yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
