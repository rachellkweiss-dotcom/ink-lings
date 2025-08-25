export interface JournalCategory {
  id: string;
  name: string;
  description: string;
  prompt: string;
  image: string;
}

export interface UserPreferences {
  id?: string;
  user_id?: string;
  categories: string[];
  notification_email: string;
  notification_days: string[];
  notification_time: string;
  timezone: string;
  created_at?: string;
  updated_at?: string;
  notification_time_utc?: string;
  next_prompt_utc?: string;
  last_prompt_sent?: string;
  current_category_index?: number;
  // Status flags for UI
  notificationsPaused?: boolean;
  deletionRequested?: boolean;
}

export interface JournalEntry {
  id: string;
  category: string;
  prompt: string;
  sentAt: string;
  completed: boolean;
  content?: string;
}
