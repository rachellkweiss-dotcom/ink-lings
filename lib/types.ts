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

export interface UserPromptRotation {
  uid: string;
  next_category_to_send: string;
  work_craft_current_count: number;
  community_society_current_count: number;
  creativity_arts_current_count: number;
  future_aspirations_current_count: number;
  gratitude_joy_current_count: number;
  health_body_current_count: number;
  learning_growth_current_count: number;
  memory_past_current_count: number;
  money_life_admin_current_count: number;
  nature_senses_current_count: number;
  personal_reflection_current_count: number;
  philosophy_values_current_count: number;
  playful_whimsical_current_count: number;
  relationships_current_count: number;
  risk_adventure_current_count: number;
  tech_media_current_count: number;
  travel_place_current_count: number;
  wildcard_surreal_current_count: number;
  [key: string]: string | number; // Index signature for dynamic property access
}
