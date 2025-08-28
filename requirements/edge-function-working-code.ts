import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  console.log('🚀 Edge function starting...');
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('📋 CORS preflight request');
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  // NO AUTHENTICATION - Allow all requests
  console.log('🔓 Function accessed - allowing public access');
  try {
    console.log('🔧 Creating Supabase client...');
    // Create Supabase client - Supabase provides these automatically
    const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
    console.log('🔑 Checking environment variables...');
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('Missing RESEND_API_KEY environment variable');
    }
    console.log('✅ RESEND_API_KEY found');
    // Get current time in UTC
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();
    console.log(`🕐 Cron job running at ${currentHour}:${currentMinute} UTC`);
    console.log('📊 Fetching users from database...');
    // Get all users with preferences
    const { data: users, error: usersError } = await supabase.from('user_preferences').select(`
        user_id, 
        notification_email,
        notification_days, 
        notification_time, 
        timezone, 
        categories,
        current_category_index
      `).neq('notification_days', '{}') // Only users who have notification days set
    .not('notification_time', 'is', null); // Only users who have notification time set
    if (usersError) {
      throw new Error(`Error fetching users: ${usersError.message}`);
    }
    if (!users || users.length === 0) {
      console.log('No users found');
      return new Response(JSON.stringify({
        message: 'No users found'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      });
    }
    let emailsSent = 0;
    let errors = 0;
    // Process each user
    for (const user of users){
      try {
        console.log(`\n👤 Processing user: ${user.user_id}`);
        // STEP 1.5: Check if today is a notification day
        const today = new Date();
        const dayNames = [
          'sunday',
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday'
        ];
        const todayName = dayNames[today.getUTCDay()];
        if (!user.notification_days.includes(todayName)) {
          console.log(`⏭️ User ${user.user_id} not scheduled for today (${todayName}). Selected days: ${user.notification_days.join(', ')}`);
          continue; // Skip this user
        }
        // STEP 1: Get user's prompt rotation data
        const { data: rotationData, error: rotationError } = await supabase.from('user_prompt_rotation').select('*').eq('uid', user.user_id) // Fixed: use 'uid' instead of 'user_id'
        .single();
        if (rotationError && rotationError.code !== 'PGRST116') {
          console.error(`❌ Error fetching rotation data for user ${user.user_id}:`, rotationError);
          errors++;
          continue;
        }
        // STEP 2: Parse user's notification time (12-hour format like "12:00 AM")
        const timeMatch = user.notification_time.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!timeMatch) {
          console.log(`Invalid time format for user ${user.user_id}: ${user.notification_time}`);
          continue;
        }
        let userPreferredHour = parseInt(timeMatch[1]);
        const userPreferredMinute = parseInt(timeMatch[2]);
        const isPM = timeMatch[3].toUpperCase() === 'PM';
        // Convert to 24-hour format
        if (isPM && userPreferredHour !== 12) {
          userPreferredHour += 12;
        } else if (!isPM && userPreferredHour === 12) {
          userPreferredHour = 0;
        }
        // STEP 3: Simple, direct timezone conversion
        const userTimezone = user.timezone || 'UTC';
        // Create notification time for today at the user's preferred time
        const notificationTimeLocal = new Date();
        notificationTimeLocal.setHours(userPreferredHour, userPreferredMinute, 0, 0);
        // For known timezones, apply the correct offset
        let timezoneOffsetHours = 0;
        if (userTimezone === 'America/Chicago') {
          timezoneOffsetHours = -5; // CDT is UTC-5 in August
        } else if (userTimezone === 'America/New_York') {
          timezoneOffsetHours = -4; // EDT is UTC-4 in August
        } else if (userTimezone === 'America/Denver') {
          timezoneOffsetHours = -6; // MDT is UTC-6 in August
        } else if (userTimezone === 'America/Los_Angeles') {
          timezoneOffsetHours = -7; // PDT is UTC-7 in August
        } else if (userTimezone === 'Europe/London') {
          timezoneOffsetHours = 0; // GMT is UTC+0
        } else if (userTimezone === 'Europe/Paris') {
          timezoneOffsetHours = 1; // CET is UTC+1 in August
        } else if (userTimezone === 'Asia/Tokyo') {
          timezoneOffsetHours = 9; // JST is UTC+9
        } else if (userTimezone === 'Australia/Sydney') {
          timezoneOffsetHours = 10; // AEST is UTC+10 in August
        } else if (userTimezone === 'America/Denver') {
          timezoneOffsetHours = -6; // MDT is UTC-6 in August
        } else if (userTimezone === 'America/Los_Angeles') {
          timezoneOffsetHours = -7; // PDT is UTC-7 in August
        } else if (userTimezone === 'Europe/London') {
          timezoneOffsetHours = 0; // GMT is UTC+0
        } else if (userTimezone === 'Europe/Paris') {
          timezoneOffsetHours = 1; // CET is UTC+1 in August
        } else if (userTimezone === 'Asia/Tokyo') {
          timezoneOffsetHours = 9; // JST is UTC+9
        } else if (userTimezone === 'Australia/Sydney') {
          timezoneOffsetHours = 10; // AEST is UTC+10 in August
        }
        // Convert to UTC
        const notificationTimeUTC = new Date(notificationTimeLocal.getTime() - timezoneOffsetHours * 60 * 60 * 1000);
        
        // STEP 4: Compare UTC times
        const timeDiff = Math.abs(now.getTime() - notificationTimeUTC.getTime()) / (1000 * 60); // minutes
        console.log(`🕐 User ${user.user_id}: ${user.notification_time} ${userTimezone} = UTC ${notificationTimeUTC.toISOString()}`);
        console.log(`⏰ Current UTC: ${now.toISOString()}, Time diff: ${timeDiff} minutes`);
        console.log(`🌍 Timezone offset: ${timezoneOffsetHours} hours`);
        
        if (timeDiff <= 10) {
          console.log(`✅ User ${user.user_id} ready for prompt. Time diff: ${timeDiff} minutes`);
          // STEP 5: Get current category and prompt count
          const currentCategoryId = rotationData?.next_category_to_send || user.categories[0];
          const categoryCountColumn = `${currentCategoryId.replace(/[^a-zA-Z0-9]/g, '_')}_current_count`;
          const currentPromptCount = rotationData?.[categoryCountColumn] || 1;
          console.log(`📝 Current category: ${currentCategoryId}, prompt count: ${currentPromptCount}`);
          // STEP 6: Get the prompt for this category and count
          const cleanCategoryId = currentCategoryId.replace(/[^a-zA-Z0-9-]/g, '');
          const { data: prompt, error: promptError } = await supabase.from('prompt_bank').select('*').eq('category_id', cleanCategoryId).eq('prompt_number', currentPromptCount).eq('is_active', true).single();
          if (promptError) {
            console.error(`❌ Error fetching prompt for user ${user.user_id}:`, promptError);
            errors++;
            continue;
          }
          // STEP 7: Get category name from the prompt data
          const categoryName = prompt.category_name; // ← Use the column from prompt_bank
          console.log(`✅ Found prompt: "${prompt.prompt_text}" for category: ${categoryName}`);
          
          // STEP 7.5: Generate feedback token for this email
          const feedbackToken = crypto.randomUUID();
          
          // STEP 8: Send email with prompt
          const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Your Ink-lings Journal Prompt</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                  background-color: #f8f9fa;
                }
                .container {
                  background-color: #ffffff;
                  border-radius: 12px;
                  padding: 30px;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .header {
                  text-align: center;
                  margin-bottom: 30px;
                }
                .logo {
                  width: 160px;
                  height: auto;
                  margin-bottom: 20px;
                }
                .main-title {
                  color: #1f2937;
                  font-size: 28px;
                  margin: 0;
                  font-weight: 600;
                }
                .prompt-box {
                  background-color: #ffffff;
                  border-left: 4px solid #2563eb;
                  color: #333;
                  padding: 25px;
                  border-radius: 8px;
                  margin: 25px 0;
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
                .category-tag {
                  display: inline-block;
                  background-color: #f3f4f6;
                  color: #374151;
                  padding: 8px 16px;
                  border-radius: 20px;
                  font-size: 14px;
                  font-weight: 500;
                  margin-bottom: 15px;
                  text-transform: capitalize;
                  border: 1px solid #d1d5db;
                }
                .prompt-text {
                  font-size: 20px;
                  font-weight: 500;
                  margin: 0;
                  line-height: 1.4;
                  font-style: italic;
                  color: #1f2937;
                }
                .footer {
                  text-align: center;
                  margin-top: 30px;
                  padding-top: 20px;
                  border-top: 1px solid #e5e7eb;
                  color: #6b7280;
                }
                .contact-link {
                  color: #2563eb;
                  text-decoration: none;
                  font-weight: 500;
                }
                .contact-link:hover {
                  text-decoration: underline;
                }

                @media (max-width: 600px) {
                  body {
                    padding: 15px;
                  }
                  .container {
                    padding: 20px;
                  }
                  .main-title {
                    font-size: 24px;
                  }
                  .prompt-text {
                    font-size: 18px;
                  }
                }
                @media (prefers-color-scheme: dark) {
                  body {
                    background-color: #1f2937;
                    color: #f9fafb;
                  }
                  .container {
                    background-color: #374151;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
                  }
                  .footer {
                    border-top-color: #4b5563;
                    color: #9ca3af;
                  }
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <img src="https://inklingsjournal.live/ink_lings_email_logo.png" alt="Ink-lings" class="logo">
                  <h1 class="main-title">✍️ Your Journal Prompt</h1>
                </div>
                
                <div class="prompt-box">
                  <div class="category-tag">${categoryName}</div>
                  <p class="prompt-text">"${prompt.prompt_text}"</p>
                </div>
                
                <div class="feedback-section" style="margin-top: 30px; text-align: center;">
                  <p style="margin-bottom: 15px; color: #6b7280; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    Tell us what you thought about this prompt
                  </p>
                  <div style="display: flex; justify-content: center; gap: 30px;">
                    <a href="https://www.inklingsjournal.live/api/feedback?token=${feedbackToken}&type=up&prompt_id=${cleanCategoryId}" 
                       style="text-decoration: none; display: inline-block; padding: 8px; border-radius: 50%; background-color: #f3f4f6; transition: background-color 0.2s;"
                       onmouseover="this.style.backgroundColor='#e5e7eb'"
                       onmouseout="this.style.backgroundColor='#f3f4f6'">
                      <span style="font-size: 24px;">👍</span>
                    </a>
                    <a href="https://www.inklingsjournal.live/api/feedback?token=${feedbackToken}&type=down&prompt_id=${cleanCategoryId}" 
                       style="text-decoration: none; display: inline-block; padding: 8px; border-radius: 50%; background-color: #f3f4f6; transition: background-color 0.2s;"
                       onmouseover="this.style.backgroundColor='#e5e7eb'"
                       onmouseout="this.style.backgroundColor='#f3f4f6'">
                      <span style="font-size: 24px;">👎</span>
                    </a>
                  </div>
                </div>
                
                <div class="footer">
                  <p>Happy journaling,<br><strong>Rachell</strong><br>Founder of Ink-lings</p>
                  <div style="margin-top: 20px;">
                    <a href="https://www.inklingsjournal.live/" class="contact-link">Manage Preferences</a>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `;
          // Format today's date as M/DD/YYYY
          const today = new Date();
          const formattedDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: 'Ink-lings <support@inklingsjournal.live>',
              to: user.notification_email,
              subject: `✍️ Your Journal Prompt - ${formattedDate}`,
              html: emailHtml
            })
          });
          if (emailResponse.ok) {
            emailsSent++;
            console.log(`✅ Email sent to user ${user.user_id}`);
            // STEP 9: Insert into prompt history
            const { error: historyError } = await supabase.from('prompt_history').insert({
              user_id: user.user_id,
              category_id: cleanCategoryId,
              prompt_text: prompt.prompt_text,
              prompt_number: currentPromptCount,
              email_sent_to: user.notification_email,
              sent_at: new Date().toISOString()
            });
            if (historyError) {
              console.error(`❌ Error inserting prompt history for user ${user.user_id}:`, historyError);
            } else {
              console.log(`✅ Prompt history recorded for user ${user.user_id}`);
            }
            // STEP 10: Update user prompt rotation
            const userCategories = user.categories || [];
            const currentCategoryIndex = userCategories.indexOf(cleanCategoryId);
            const nextCategoryIndex = (currentCategoryIndex + 1) % userCategories.length;
            const nextCategory = userCategories[nextCategoryIndex];
            // Recalculate the category count column name here
            const categoryCountColumnForUpdate = `${cleanCategoryId.replace(/-/g, '_')}_current_count`;
            console.log(`�� Updating rotation: ${cleanCategoryId} → ${nextCategory}`);
            console.log(`📊 Updating column: ${categoryCountColumnForUpdate}`);
            console.log(`🔢 Current count: ${rotationData?.[categoryCountColumnForUpdate] || 0}`);
            const { error: updateError } = await supabase.from('user_prompt_rotation').update({
              [categoryCountColumnForUpdate]: currentPromptCount + 1,
              next_category_to_send: nextCategory
            }).eq('uid', user.user_id);
            if (updateError) {
              console.error(`❌ Failed to update rotation for user ${user.user_id}:`, updateError);
            } else {
              console.log(`✅ Successfully updated rotation for user ${user.user_id}`);
              console.log(`📈 ${categoryCountColumnForUpdate} incremented from ${rotationData?.[categoryCountColumnForUpdate] || 0} to ${(rotationData?.[categoryCountColumnForUpdate] || 0) + 1}`);
              console.log(`�� next_category_to_send changed from ${cleanCategoryId} to ${nextCategory}`);
            }
          } else {
            errors++;
            console.log(`❌ Failed to send email to user ${user.user_id}`);
          }
        } else {
          console.log(`User ${user.user_id} not ready for prompt yet. Time diff: ${timeDiff} minutes`);
        }
      } catch (error) {
        errors++;
        console.error(`Error processing user ${user.user_id}:`, error);
      }
    }
    console.log(`�� Cron job completed: ${emailsSent} emails sent, ${errors} errors`);
    return new Response(JSON.stringify({
      success: true,
      emailsSent,
      errors,
      message: `Cron job completed: ${emailsSent} emails sent, ${errors} errors`
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('❌ Cron job failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
