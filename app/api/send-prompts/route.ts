import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { journalCategories } from '../../../lib/categories';

// Create a service role client that bypasses RLS for reading user data
const supabaseServiceRole = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Function to get the next prompt for a user in a specific category
async function getNextPrompt(userId: string, categoryId: string) {
  // Try to get progress from database first
  const { data: progress, error: progressError } = await supabaseServiceRole
    .from('user_prompt_progress')
    .select('current_prompt_number')
    .eq('user_id', userId)
    .eq('category_id', categoryId)
    .single();

  let currentPromptNumber = 1; // Default to 1 if no progress found
  
  if (progress && !progressError) {
    // All categories start at 1, so next prompt is current + 1
    currentPromptNumber = progress.current_prompt_number + 1;
  } else if (progressError && progressError.code !== 'PGRST116') {
    // Log error only if it's not "no rows returned"
    console.error('Error fetching progress for user', userId, 'category', categoryId, ':', progressError);
  }
  
  console.log(`Getting prompt for user ${userId}, category ${categoryId}, current number: ${currentPromptNumber}`);

  // Get the prompt from the prompt_bank table
  const { data: prompt, error: promptError } = await supabaseServiceRole
    .from('prompt_bank')
    .select('prompt_text')
    .eq('category_id', categoryId)
    .eq('prompt_number', currentPromptNumber)
    .eq('is_active', true)
    .single();

  if (promptError) {
    console.error('Error getting prompt from prompt_bank:', promptError);
    console.error('Category ID:', categoryId, 'Prompt Number:', currentPromptNumber);
    return null;
  }

  return {
    promptText: prompt.prompt_text,
    promptNumber: currentPromptNumber
  };
}

// Function to send a journal prompt email
async function sendJournalPromptEmail(
  userEmail: string,
  userName: string,
  categoryName: string,
  promptText: string
) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    throw new Error('RESEND_API_KEY not configured');
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>✍️ Your Ink-lings Journal Prompt</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { max-width: 200px; height: auto; }
        .prompt-box { background: #f8f9fa; border-left: 4px solid #007bff; padding: 20px; margin: 30px 0; border-radius: 8px; }
        .prompt-text { font-size: 18px; font-weight: 500; color: #2c3e50; margin: 0; }
        .category-tag { display: inline-block; background: #e9ecef; color: #495057; padding: 4px 12px; border-radius: 20px; font-size: 14px; margin-bottom: 15px; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://photos.app.goo.gl/SEPBTToHa8qsDzaH6" alt="Ink-lings" class="logo">
          <h1 style="color: #2c3e50; margin: 20px 0 10px 0;">✍️ Your Journal Prompt</h1>
        </div>
        
        <div class="prompt-box">
          <div class="category-tag">${categoryName}</div>
          <p class="prompt-text">"${promptText}"</p>
        </div>
        
        <div class="footer">
          <p>Happy journaling,<br>The Ink-lings Team</p>
          <p style="margin-top: 20px;">
            <a href="mailto:rachell.k.weiss@gmail.com" style="color: #007bff; text-decoration: none;">Contact Support</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Ink-lings <noreply@inklingsjournal.live>',
      to: userEmail,
      subject: 'Your Requested Prompt',
      html: emailHtml,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  return response.json();
}



// Function to ensure all user categories have progress entries
async function ensureUserCategoryProgress(userId: string, categories: string[]) {
  try {
    // Get existing progress for this user
    const { data: existingProgress, error: progressError } = await supabaseServiceRole
      .from('user_prompt_progress')
      .select('category_id, current_prompt_number')
      .eq('user_id', userId);

    if (progressError) {
      console.error('Error checking existing progress:', progressError);
      return;
    }

    const existingCategoryIds = existingProgress?.map(p => p.category_id) || [];
    
    // Find new categories that don't have progress entries
    const newCategories = categories.filter(cat => !existingCategoryIds.includes(cat));
    
    // Find removed categories (categories that exist in progress but not in current preferences)
    const removedCategories = existingCategoryIds.filter(cat => !categories.includes(cat));
    
    if (newCategories.length > 0) {
      console.log(`User ${userId} has new categories: ${newCategories.join(', ')}`);
      
      // Create progress entries for new categories starting at #1
      for (const categoryId of newCategories) {
        try {
          const { error: insertError } = await supabaseServiceRole
            .from('user_prompt_progress')
            .insert({
              user_id: userId,
              category_id: categoryId,
              current_prompt_number: 1
            });

          if (insertError) {
            console.error(`Error creating progress for category ${categoryId}:`, insertError);
          } else {
            console.log(`Created progress entry for user ${userId}, category ${categoryId} starting at #1`);
          }
        } catch (error) {
          console.error(`Error inserting progress for category ${categoryId}:`, error);
        }
      }
    }
    
    if (removedCategories.length > 0) {
      console.log(`User ${userId} removed categories: ${removedCategories.join(', ')} (progress preserved)`);
      // Note: We don't delete progress entries - they're preserved for if the user re-adds the category
    }
    
    // Log current progress for all categories
    console.log(`User ${userId} progress summary:`);
    for (const cat of categories) {
      const progress = existingProgress?.find(p => p.category_id === cat);
      const currentNumber = progress?.current_prompt_number || 1;
      console.log(`  ${cat}: prompt #${currentNumber}`);
    }
  } catch (error) {
    console.error('Error in ensureUserCategoryProgress:', error);
  }
}

// Main function to process and send prompts
async function processPrompts() {
  // Use local timezone for day detection (America/Chicago for testing)
  const now = new Date();
  const localTimezone = 'America/Chicago'; // This should match your timezone
  const localDate = new Date(now.toLocaleString("en-US", {timeZone: localTimezone}));
  const currentDay = localDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

  console.log(`Processing prompts for ${currentDay} (${localTimezone} time)`);
  console.log(`Current ${localTimezone} date: ${localDate.toDateString()}`);
  console.log(`Current ${localTimezone} time: ${localDate.toLocaleTimeString()}`);
  console.log(`Server UTC time: ${now.toISOString()}`);

  // Get all users who should receive prompts today (regardless of time)
  console.log(`Querying for users with notification_days containing: [${currentDay}]`);
  
  // Try a more direct approach - get all users first to debug
  const { data: allUsers, error: allUsersError } = await supabaseServiceRole
    .from('user_preferences')
    .select('*');
    
  console.log(`All users in database:`, allUsers);
  console.log(`All users error:`, allUsersError);
  
  // Now try the specific query
  const { data: users, error: usersError } = await supabaseServiceRole
    .from('user_preferences')
    .select(`
      user_id,
      notification_email,
      notification_days,
      notification_time,
      timezone,
      categories,
      current_category_index
    `)
    .contains('notification_days', [currentDay]);
    
  console.log(`Filtered query result:`, { users, error: usersError });
  
  // For each user, ensure all their categories have progress entries
  for (const user of users || []) {
    await ensureUserCategoryProgress(user.user_id, user.categories);
  }

  if (usersError) {
    console.error('Error getting users:', usersError);
    return { error: 'Failed to get users' };
  }

  if (!users || users.length === 0) {
    console.log('No users found for today');
    return { message: 'No users need prompts at this time' };
  }

  console.log(`Found ${users.length} users for today:`, users.map(u => ({ 
    id: u.user_id, 
    days: u.notification_days, 
    time: u.notification_time,
    timezone: u.timezone 
  })));

  const results = [];
  
  for (const user of users) {
    try {
      // Parse user's preferred time (stored as 12-hour format like "3:00 PM")
      const userTime = user.notification_time;
      const timeMatch = userTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
      
      if (!timeMatch) {
        console.error(`Invalid time format for user ${user.user_id}: ${userTime}`);
        continue;
      }
      
      let userPreferredHour = parseInt(timeMatch[1]);
      const userPreferredMinute = parseInt(timeMatch[2]);
      const isPM = timeMatch[3].toUpperCase() === 'PM';
      
      // Convert to 24-hour format for comparison
      if (isPM && userPreferredHour !== 12) {
        userPreferredHour += 12;
      } else if (!isPM && userPreferredHour === 12) {
        userPreferredHour = 0;
      }
      
      // Get current time in user's timezone
      const userTimezone = user.timezone || 'America/New_York'; // fallback
      const userLocalTime = new Date().toLocaleString("en-US", {timeZone: userTimezone});
      const userLocalDate = new Date(userLocalTime);
      const currentHour = userLocalDate.getHours();
      const currentMinute = userLocalDate.getMinutes();
      
      console.log(`User ${user.user_id}: Current time ${currentHour}:${currentMinute.toString().padStart(2, '0')}, Preferred time ${userPreferredHour}:${userPreferredMinute.toString().padStart(2, '0')}, Timezone: ${userTimezone}`);
      
      // Check: Is current time within 10 minutes of preferred time?
      // Scheduler runs at :55 to catch users who want emails at :00 of the next hour
      const currentTotalMinutes = currentHour * 60 + currentMinute;
      const preferredTotalMinutes = userPreferredHour * 60 + userPreferredMinute;
      const timeDiff = Math.abs(currentTotalMinutes - preferredTotalMinutes);
      const shouldSend = timeDiff < 10; // Within 10 minutes (scheduler at :55 catches :00 users)
      
      console.log(`Time difference: ${timeDiff} minutes, Should send: ${shouldSend}`);
      console.log(`Current total minutes: ${currentTotalMinutes}, Preferred total minutes: ${preferredTotalMinutes}`);
      console.log(`Current time: ${currentHour}:${currentMinute.toString().padStart(2, '0')}, Preferred: ${userPreferredHour}:${userPreferredMinute.toString().padStart(2, '0')}`);
      
      if (shouldSend) {
        console.log(`Processing user ${user.user_id} for category index ${user.current_category_index}`);
        
        // Get the category to use for this prompt
        const categoryIndex = user.current_category_index || 0;
        const categoryId = user.categories[categoryIndex];
        const category = journalCategories.find(cat => cat.id === categoryId);
        
        if (!category) {
          console.error(`Category ${categoryId} not found for user ${user.user_id}`);
          continue;
        }

        // Get the next prompt for this category
        const promptData = await getNextPrompt(user.user_id, categoryId);
        if (!promptData) {
          console.error(`No prompt found for user ${user.user_id} in category ${categoryId}`);
          continue;
        }

        // Send the email
        await sendJournalPromptEmail(
          user.notification_email,
          'there', // We'll get the actual name later
          category.name,
          promptData.promptText
        );

        // Log the prompt to history
        try {
          // Store the user's intended time (not scheduler time) for display
          // This shows users when they expected the email (e.g., 4:00 PM) not when it was sent (e.g., 3:55 PM)
          const userPreferredTime = new Date();
          const [hour] = user.notification_time.match(/(\d+):(\d+)\s*(AM|PM)/i)?.slice(1) || [];
          const userHour = parseInt(hour);
          const isPM = user.notification_time.includes('PM');
          
          // Set to user's preferred time in their timezone
          userPreferredTime.setHours(isPM && userHour !== 12 ? userHour + 12 : userHour === 12 ? 0 : userHour, 0, 0, 0);
          
          // Convert to UTC for storage in Supabase
          const utcTime = new Date(userPreferredTime.toLocaleString("en-US", {timeZone: "UTC"}));
          
          const { error: historyError } = await supabaseServiceRole
            .from('prompt_history')
            .insert({
              user_id: user.user_id,
              category_id: categoryId,
              prompt_text: promptData.promptText,
              prompt_number: promptData.promptNumber,
              email_sent_to: user.notification_email,
              sent_at: utcTime.toISOString() // Store in UTC
            });

          if (historyError) {
            console.error('Error logging prompt to history:', historyError);
          } else {
            console.log(`Logged prompt ${promptData.promptNumber} to history for user ${user.user_id}`);
          }
        } catch (error) {
          console.error('Error inserting prompt history:', error);
        }

        // Update progress in database
        const nextPromptNumber = promptData.promptNumber + 1;
        
        console.log(`Updated progress for user ${user.user_id}, category ${categoryId}: ${promptData.promptNumber} → ${nextPromptNumber}`);
        
        const { error: progressError } = await supabaseServiceRole
          .from('user_prompt_progress')
          .upsert({
            user_id: user.user_id,
            category_id: categoryId,
            current_prompt_number: nextPromptNumber,
            last_sent_date: now.toISOString()
          });

        if (progressError) {
          console.error('Database progress update failed:', progressError);
        } else {
          console.log(`Database progress updated successfully for user ${user.user_id}, category ${categoryId}`);
        }

        // Update user preferences to rotate to next category
        // Only rotate through currently active categories
        const activeCategories = user.categories.filter((cat: string) => {
          // Check if this category still exists in user's current preferences
          return user.categories.includes(cat);
        });
        
        if (activeCategories.length > 0) {
          const nextCategoryIndex = (categoryIndex + 1) % activeCategories.length;
          console.log(`Rotating category index for user ${user.user_id}: ${categoryIndex} → ${nextCategoryIndex} (${activeCategories.length} active categories)`);
          
          const { error: prefsError } = await supabaseServiceRole
            .from('user_preferences')
            .update({
              current_category_index: nextCategoryIndex,
              last_prompt_sent: now.toISOString()
            })
            .eq('user_id', user.user_id);

          if (prefsError) {
            console.error('Error updating user preferences:', prefsError);
          } else {
            console.log(`User preferences updated successfully for user ${user.user_id}`);
          }
        } else {
          console.log(`User ${user.user_id} has no active categories, skipping rotation`);
        }

        results.push({
          userId: user.user_id,
          email: user.notification_email,
          category: category.name,
          promptNumber: promptData.promptNumber,
          status: 'sent',
          timezone: userTimezone,
                  localTime: `${currentHour}:${currentMinute.toString().padStart(2, '0')}`,
        preferredTime: `${userPreferredHour}:${userPreferredMinute.toString().padStart(2, '0')}`
        });

        console.log(`Sent prompt ${promptData.promptNumber} in category ${category.name} to ${user.notification_email}`);
      } else {
        console.log(`User ${user.user_id} not ready for prompt yet. Time diff: ${timeDiff} minutes (current: ${currentHour}:${currentMinute.toString().padStart(2, '0')}, preferred: ${userPreferredHour}:${userPreferredMinute.toString().padStart(2, '0')})`);
      }
    } catch (error: unknown) {
      console.error(`Error processing user ${user.user_id}:`, error);
      results.push({
        userId: user.user_id,
        email: user.notification_email,
        status: 'error',
        error: (error as Error).message
      });
    }
  }

  return {
    message: `Processed ${users.length} users`,
    results
  };
}

export async function GET() {
  try {
    const result = await processPrompts();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in send-prompts API:', error);
    return NextResponse.json(
      { error: 'Failed to process prompts' },
      { status: 500 }
    );
  }
}

// For testing purposes - you can call this manually
export async function POST() {
  try {
    const result = await processPrompts();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in send-prompts API:', error);
    return NextResponse.json(
      { error: 'Failed to process prompts' },
      { status: 500 }
    );
  }
}
