import { supabase } from './supabase'
import { UserPreferences } from './types'

export async function saveUserPreferences(
  userId: string,
  preferences: Partial<UserPreferences>
) {
  console.log('=== saveUserPreferences FUNCTION STARTED ===');
  console.log('Function parameters:', { userId, preferences });
  
  try {
    console.log('Attempting to save preferences for user:', userId);
    console.log('Preferences data:', preferences);
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Current authenticated user:', user);
    
    if (!user) {
      throw new Error('No authenticated user found');
    }
    
    if (user.id !== userId) {
      throw new Error(`User ID mismatch: authenticated user ${user.id} vs requested user ${userId}`);
    }

    // Prepare the data to be inserted/updated
    const dataToUpsert = {
      user_id: userId,
      ...preferences,
      updated_at: new Date().toISOString(),
    };
    
    console.log('Data to upsert:', dataToUpsert);
    console.log('Supabase client ready:', !!supabase);

    // First check if a record already exists for this user
    const { data: existingRecord, error: checkError } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', userId)
      .single();

    console.log('Existing record check:', { existingRecord, checkError });

    let result;
    if (existingRecord) {
      // Update existing record
      console.log('Updating existing record with ID:', existingRecord.id);
      const { data, error } = await supabase
        .from('user_preferences')
        .update({
          ...preferences,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Update error:', error);
        throw error;
      }
      result = data;
    } else {
      // Insert new record
      console.log('Inserting new record');
      const { data, error } = await supabase
        .from('user_preferences')
        .insert(dataToUpsert)
        .select()
        .single();

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }
      result = data;
    }

    console.log('Successfully saved preferences:', result);
    return result;
  } catch (upsertError) {
    console.error('Save operation failed:', upsertError);
    console.error('Error type:', typeof upsertError);
    console.error('Error constructor:', upsertError?.constructor?.name);
    console.error('Error keys:', Object.keys(upsertError || {}));
    throw upsertError;
  }
}

export async function getUserPreferences(userId: string) {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 means no rows returned, which is fine for new users
    throw error
  }

  return data
}

export async function updateUserPreferences(
  userId: string,
  updates: Partial<UserPreferences>
) {
  const { data, error } = await supabase
    .from('user_preferences')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}
