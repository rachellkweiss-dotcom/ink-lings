import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { UserPreferences } from './types'

// Lazy-initialized Supabase client to avoid build-time errors
let supabaseInstance: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set');
    }
    
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
}

// Export a proxy that lazily initializes the client
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return getSupabase()[prop as keyof SupabaseClient];
  }
});

// Re-export types for convenience
export type { UserPreferences }
