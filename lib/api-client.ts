/**
 * Helper function to make authenticated API requests
 * Automatically includes the user's session token in the Authorization header
 */

import { supabase } from './supabase';

/**
 * Make an authenticated fetch request
 * Automatically includes the session token in the Authorization header
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Get the current session
  const { data: { session } } = await supabase.auth.getSession();
  
  // Build headers
  const headers = new Headers(options.headers);
  
  // Add Authorization header if we have a session
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }
  
  // Add Content-Type if not already set and we have a body
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  
  // Make the request with the auth header
  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Make an authenticated fetch request and parse JSON response
 */
export async function authenticatedFetchJson<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await authenticatedFetch(url, options);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `Request failed with status ${response.status}`);
  }
  
  return response.json();
}

