import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface PromptPerformance {
  id: string;
  category_id: string;
  category_name: string;
  prompt_text: string;
  prompt_number: number;
  thumbs_up_count: number;
  thumbs_down_count: number;
  total_sent: number;
  response_rate: number;
  satisfaction_rate: number;
}

export interface UserAnalytics {
  total_users: number;
  active_users: number;
  new_users_this_month: number;
  top_categories: Array<{
    category: string;
    count: number;
  }>;
  timezone_distribution: Array<{
    timezone: string;
    count: number;
  }>;
}

export interface FeedbackAnalytics {
  total_feedback: number;
  thumbs_up_total: number;
  thumbs_down_total: number;
  overall_satisfaction: number;
  category_performance: PromptPerformance[];
  recent_feedback: Array<{
    id: string;
    feedback_type: 'up' | 'down';
    prompt_id: string;
    created_at: string;
  }>;
}

export async function getPromptPerformance(): Promise<PromptPerformance[]> {
  try {
    const { data, error } = await supabase
      .from('prompt_bank')
      .select(`
        id,
        category_id,
        category_name,
        prompt_text,
        prompt_number,
        thumbs_up_count,
        thumbs_down_count,
        total_sent
      `)
      .eq('is_active', true)
      .order('total_sent', { ascending: false });

    if (error) throw error;

    return data.map(prompt => ({
      ...prompt,
      response_rate: prompt.total_sent > 0 ? 
        ((prompt.thumbs_up_count + prompt.thumbs_down_count) / prompt.total_sent) * 100 : 0,
      satisfaction_rate: (prompt.thumbs_up_count + prompt.thumbs_down_count) > 0 ? 
        (prompt.thumbs_up_count / (prompt.thumbs_up_count + prompt.thumbs_down_count)) * 100 : 0
    }));
  } catch (error) {
    console.error('Error fetching prompt performance:', error);
    return [];
  }
}

export async function getUserAnalytics(): Promise<UserAnalytics> {
  try {
    // Get total users
    const { count: totalUsers } = await supabase
      .from('user_preferences')
      .select('*', { count: 'exact', head: true });

    // Get users with recent activity (active users)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { count: activeUsers } = await supabase
      .from('prompt_history')
      .select('*', { count: 'exact', head: true })
      .gte('sent_at', thirtyDaysAgo.toISOString());

    // Get new users this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const { count: newUsers } = await supabase
      .from('user_preferences')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString());

    // Get top categories
    const { data: categoryData } = await supabase
      .from('user_preferences')
      .select('categories');

    const categoryCounts: { [key: string]: number } = {};
    categoryData?.forEach(user => {
      user.categories?.forEach((category: string) => {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });
    });

    const topCategories = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get timezone distribution
    const { data: timezoneData } = await supabase
      .from('user_preferences')
      .select('timezone');

    const timezoneCounts: { [key: string]: number } = {};
    timezoneData?.forEach(user => {
      if (user.timezone) {
        timezoneCounts[user.timezone] = (timezoneCounts[user.timezone] || 0) + 1;
      }
    });

    const timezoneDistribution = Object.entries(timezoneCounts)
      .map(([timezone, count]) => ({ timezone, count }))
      .sort((a, b) => b.count - a.count);

    return {
      total_users: totalUsers || 0,
      active_users: activeUsers || 0,
      new_users_this_month: newUsers || 0,
      top_categories: topCategories,
      timezone_distribution: timezoneDistribution
    };
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    return {
      total_users: 0,
      active_users: 0,
      new_users_this_month: 0,
      top_categories: [],
      timezone_distribution: []
    };
  }
}

export async function getFeedbackAnalytics(): Promise<FeedbackAnalytics> {
  try {
    // Get total feedback counts
    const { count: totalFeedback } = await supabase
      .from('feedback_tokens')
      .select('*', { count: 'exact', head: true });

    const { data: feedbackData } = await supabase
      .from('feedback_tokens')
      .select('feedback_type')
      .order('created_at', { ascending: false });

    const thumbsUpTotal = feedbackData?.filter(f => f.feedback_type === 'up').length || 0;
    const thumbsDownTotal = feedbackData?.filter(f => f.feedback_type === 'down').length || 0;
    const overallSatisfaction = (thumbsUpTotal + thumbsDownTotal) > 0 ? 
      (thumbsUpTotal / (thumbsUpTotal + thumbsDownTotal)) * 100 : 0;

    // Get category performance
    const categoryPerformance = await getPromptPerformance();

    // Get recent feedback
    const { data: recentFeedback } = await supabase
      .from('feedback_tokens')
      .select('id, feedback_type, prompt_id, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    return {
      total_feedback: totalFeedback || 0,
      thumbs_up_total: thumbsUpTotal,
      thumbs_down_total: thumbsDownTotal,
      overall_satisfaction: overallSatisfaction,
      category_performance: categoryPerformance,
      recent_feedback: recentFeedback || []
    };
  } catch (error) {
    console.error('Error fetching feedback analytics:', error);
    return {
      total_feedback: 0,
      thumbs_up_total: 0,
      thumbs_down_total: 0,
      overall_satisfaction: 0,
      category_performance: [],
      recent_feedback: []
    };
  }
}



