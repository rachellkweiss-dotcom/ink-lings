import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://inklingsjournal.live',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  console.log('🚀 Edge function starting...');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('📋 CORS preflight request');
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  // SECURITY: Require secret token for authentication
  // This function MUST have SEND_PROMPTS_CRON_SECRET set in Supabase Dashboard
  const expectedToken = Deno.env.get('SEND_PROMPTS_CRON_SECRET');
  
  if (!expectedToken) {
    console.error('❌ SEND_PROMPTS_CRON_SECRET is not configured');
    return new Response(JSON.stringify({
      success: false,
      error: 'Server configuration error',
      message: 'This function requires authentication but no secret is configured'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
  
  // Validate the provided token
  const providedToken = req.headers.get('x-cron-secret') || req.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!providedToken || providedToken !== expectedToken) {
    console.warn('❌ Unauthorized access attempt - invalid or missing secret token');
    return new Response(JSON.stringify({
      success: false,
      error: 'Unauthorized',
      message: 'Valid secret token required'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 401
    });
  }
  
  console.log('✅ Function accessed - secret token validated');

  try {
    // TEST MODE: Check if test email is requested
    let testEmail = null;
    let testCategory = 'personal-reflection';
    
    try {
      const body = await req.json();
      testEmail = body.testEmail || null;
      testCategory = body.testCategory || 'personal-reflection';
    } catch {
      // Body might be empty or not JSON, that's fine
    }
    
    if (testEmail) {
      console.log(`🧪 TEST MODE: Sending test email to ${testEmail} with category ${testCategory}`);
    }
    
    console.log('🔧 Creating Supabase client...');
    
    // Create Supabase client - Supabase provides these automatically
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    );
    
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
    const { data: users, error: usersError } = await supabase
      .from('user_preferences')
      .select(`
        user_id, 
        notification_email,
        notification_days, 
        notification_time, 
        timezone, 
        categories,
        notification_time_utc
      `)
      .neq('notification_days', '{}') // Only users who have notification days set
      .not('notification_time', 'is', null); // Only users who have notification time set

    if (usersError) {
      throw new Error(`Error fetching users: ${usersError.message}`);
    }

    // TEST MODE: If testEmail is provided, send test email and return
    if (testEmail) {
      console.log(`🧪 TEST MODE: Sending test email to ${testEmail}`);
      
      // Get a test prompt from the specified category
      const cleanCategoryId = testCategory.replace(/[^a-zA-Z0-9-]/g, '');
      const { data: testPrompt, error: promptError } = await supabase
        .from('prompt_bank')
        .select('*')
        .eq('category_id', cleanCategoryId)
        .eq('prompt_number', 1)
        .eq('is_active', true)
        .single();

      if (promptError || !testPrompt) {
        return new Response(JSON.stringify({
          success: false,
          error: `Could not find test prompt for category: ${testCategory}`,
          details: promptError
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }

      // Generate test email HTML (same format as regular prompts)
      const feedbackToken = crypto.randomUUID();
      const categoryName = testPrompt.category_name || testCategory;
      const now = new Date();
      const formattedDate = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;
      const feedbackUrl = `https://inklingsjournal.live/feedback-thanks?token=${feedbackToken}`;

      const emailHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Your Ink-lings Prompt - TEST</title>
</head>
<body style="margin:0; padding:20px; background:#f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width:600px; margin:0 auto; background:#ffffff; padding:32px; border-radius:8px; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="color:#1e293b; margin-top:0;">🧪 TEST EMAIL</h1>
    <p style="color:#64748b; font-size:14px; margin-bottom:24px;">This is a test email from the send-prompts function.</p>
    
    <div style="background:#f1f5f9; padding:20px; border-radius:8px; margin:24px 0;">
      <p style="color:#475569; font-size:12px; margin:0 0 8px; text-transform:uppercase; letter-spacing:0.5px;">Category</p>
      <p style="color:#1e293b; font-size:18px; font-weight:600; margin:0;">${categoryName}</p>
    </div>
    
    <div style="margin:24px 0;">
      <p style="color:#475569; font-size:12px; margin:0 0 8px; text-transform:uppercase; letter-spacing:0.5px;">Your Prompt for ${formattedDate}</p>
      <p style="color:#1e293b; font-size:20px; line-height:1.6; margin:0;">${testPrompt.prompt_text}</p>
    </div>
    
    <div style="margin-top:32px; padding-top:24px; border-top:1px solid #e2e8f0;">
      <p style="color:#64748b; font-size:12px; margin:0;">This is a test email. In production, users would see a feedback link here.</p>
    </div>
  </div>
</body>
</html>`;

      // Send test email
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Ink-lings <support@inklingsjournal.live>',
          to: testEmail,
          subject: `🧪 TEST: Your Ink-lings Prompt - ${categoryName}`,
          html: emailHtml,
        })
      });

      if (resendResponse.ok) {
        const result = await resendResponse.json();
        return new Response(JSON.stringify({
          success: true,
          testMode: true,
          message: `Test email sent successfully to ${testEmail}`,
          category: testCategory,
          prompt: testPrompt.prompt_text,
          emailId: result.id
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        });
      } else {
        const errorText = await resendResponse.text();
        return new Response(JSON.stringify({
          success: false,
          testMode: true,
          error: 'Failed to send test email',
          details: errorText
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        });
      }
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
    for (const user of users) {
      try {
        console.log(`\n👤 Processing user: ${user.user_id}`);

        // STEP 1: Get current UTC day and time
        const currentUTC = new Date();
        console.log(`🕐 Current UTC: ${currentUTC.toISOString()}`);

        // STEP 2: Get current UTC day in the user's timezone
        const userTimezone = user.timezone || 'UTC';
        
        // Get timezone offset in hours
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
        }

        // Convert current UTC time to user's local time
        const userLocalTime = new Date(currentUTC.getTime() + timezoneOffsetHours * 60 * 60 * 1000);
        const userLocalDay = userLocalTime.getUTCDay(); // This gives us the day in user's local timezone
        
        const dayNames = [
          'sunday',
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday'
        ];
        const userLocalDayName = dayNames[userLocalDay];

        console.log(`🌍 User local time: ${userLocalTime.toISOString()} (${userLocalDayName})`);
        console.log(`📅 User notification days: ${user.notification_days.join(', ')}`);

        // STEP 3: Compare UTC day to user_preferences day
        if (!user.notification_days.includes(userLocalDayName)) {
          console.log(`⏭️ User ${user.user_id} not scheduled for today (${userLocalDayName}). Selected days: ${user.notification_days.join(', ')}`);
          continue; // Skip this user
        }

        console.log(`✅ User ${user.user_id} scheduled for today (${userLocalDayName})`);

        // STEP 4: Simple time comparison (temporary debug version)
        if (!user.notification_time_utc) {
          console.log(`❌ User ${user.user_id} missing notification_time_utc`);
          continue;
        }

        // Just log the values for now to see what we're working with
        console.log(`🕐 User ${user.user_id}: notification_time_utc = ${user.notification_time_utc}`);
        console.log(`🕐 User ${user.user_id}: currentUTC = ${currentUTC.toISOString()}`);

        // Simple time check - just compare hours for now
        const storedTime = new Date(user.notification_time_utc);
        const storedHour = storedTime.getUTCHours();
        const currentHour = currentUTC.getUTCHours();

        console.log(`🕐 User ${user.user_id}: Stored hour: ${storedHour}, Current hour: ${currentHour}`);

        // Temporary: just check if hours are the same (for debugging)
        if (storedHour === currentHour) {
          console.log(`✅ User ${user.user_id} ready for prompt. Hours match: ${storedHour}`);

          // STEP 5: Get user's prompt rotation data (only now that we know they're ready)
          const { data: rotationData, error: rotationError } = await supabase
            .from('user_prompt_rotation')
            .select('*')
            .eq('user_id', user.user_id)
            .single();

          if (rotationError && rotationError.code !== 'PGRST116') {
            console.error(`❌ Error fetching rotation data for user ${user.user_id}:`, rotationError);
            errors++;
            continue;
          }

          // STEP 6: Get current category and prompt count
          const currentCategoryId = rotationData?.next_category_to_send || user.categories[0];
          const categoryCountColumn = `${currentCategoryId.replace(/[^a-zA-Z0-9]/g, '_')}_current_count`;
          const currentPromptCount = rotationData?.[categoryCountColumn] || 1;

          console.log(`📝 Current category: ${currentCategoryId}, prompt count: ${currentPromptCount}`);

          // STEP 7: Get the prompt for this category and count
          const cleanCategoryId = currentCategoryId.replace(/[^a-zA-Z0-9-]/g, '');
          const { data: prompt, error: promptError } = await supabase
            .from('prompt_bank')
            .select('*')
            .eq('category_id', cleanCategoryId)
            .eq('prompt_number', currentPromptCount)
            .eq('is_active', true)
            .single();

          if (promptError) {
            console.error(`❌ Error fetching prompt for user ${user.user_id}:`, promptError);
            errors++;
            continue;
          }

          // STEP 8: Get category name from the prompt data
          const categoryName = prompt.category_name; // ← Use the column from prompt_bank
          console.log(`✅ Found prompt: "${prompt.prompt_text}" for category: ${categoryName}`);

          // STEP 9: Generate feedback token for this email
          const feedbackToken = crypto.randomUUID();

          // Get the actual prompt ID from prompt_bank for feedback tracking
          const { data: promptBankData, error: promptBankError } = await supabase
            .from('prompt_bank')
            .select('id')
            .eq('category_id', prompt.category_id)
            .eq('prompt_number', prompt.prompt_number)
            .single();

          if (promptBankError) {
            console.error(`❌ Error fetching prompt_bank ID for feedback:`, promptBankError);
            // Continue without feedback functionality
          }

          const actualPromptId = promptBankData?.id || 'unknown';

          // STEP 10: Send email with prompt
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
                
                <div class="feedback-section" style="margin-top: 30px; text-align: center; width: 100%;">
                  <p style="margin-bottom: 15px; color: #6b7280; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    Anonymous Feedback - What do you think of your prompt today?
                  </p>
                  <table style="width: 100%; margin: 0 auto; text-align: center;">
                    <tr>
                      <td style="text-align: center;">
                        <a href="https://www.inklingsjournal.live/api/feedback?token=${feedbackToken}&type=up&prompt_id=${actualPromptId}" 
                           style="text-decoration: none; display: inline-block; padding: 8px; border-radius: 50%; background-color: #f3f4f6; transition: background-color 0.2s; border: 2px solid #e5e7eb; margin: 0 20px;"
                           onmouseover="this.style.backgroundColor='#e5e7eb'"
                           onmouseout="this.style.backgroundColor='#f3f4f6'">
                          <span style="font-size: 24px;">👍</span>
                        </a>
                        <a href="https://www.inklingsjournal.live/api/feedback?token=${feedbackToken}&type=down&prompt_id=${actualPromptId}" 
                           style="text-decoration: none; display: inline-block; padding: 8px; border-radius: 50%; background-color: #f3f4f6; transition: background-color 0.2s; border: 2px solid #e5e7eb; margin: 0 20px;"
                           onmouseover="this.style.backgroundColor='#e5e7eb'"
                           onmouseout="this.style.backgroundColor='#f3f4f6'">
                          <span style="font-size: 24px;">👎</span>
                        </a>
                      </td>
                    </tr>
                  </table>
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

          // Format today's date as M/DD/YYYY using the user's local time we already calculated
          const formattedDate = `${userLocalTime.getMonth() + 1}/${userLocalTime.getDate()}/${userLocalTime.getFullYear()}`;

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

            // STEP 11: Insert into prompt history
            const { error: historyError } = await supabase
              .from('prompt_history')
              .insert({
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

            // STEP 12: Update user prompt rotation
            const userCategories = user.categories || [];
            const currentCategoryIndex = userCategories.indexOf(cleanCategoryId);
            const nextCategoryIndex = (currentCategoryIndex + 1) % userCategories.length;
            const nextCategory = userCategories[nextCategoryIndex];

            // Recalculate the category count column name here
            const categoryCountColumnForUpdate = `${cleanCategoryId.replace(/-/g, '_')}_current_count`;

            console.log(`🔄 Updating rotation: ${cleanCategoryId} → ${nextCategory}`);
            console.log(`📊 Updating column: ${categoryCountColumnForUpdate}`);
            console.log(`🔢 Current count: ${rotationData?.[categoryCountColumnForUpdate] || 0}`);

            const { error: updateError } = await supabase
              .from('user_prompt_rotation')
              .update({
                [categoryCountColumnForUpdate]: currentPromptCount + 1,
                next_category_to_send: nextCategory
              })
              .eq('user_id', user.user_id);

            if (updateError) {
              console.error(`❌ Failed to update rotation for user ${user.user_id}:`, updateError);
            } else {
              console.log(`✅ Successfully updated rotation for user ${user.user_id}`);
              console.log(`📈 ${categoryCountColumnForUpdate} incremented from ${rotationData?.[categoryCountColumnForUpdate] || 0} to ${(rotationData?.[categoryCountColumnForUpdate] || 0) + 1}`);
              console.log(`🔄 next_category_to_send changed from ${cleanCategoryId} to ${nextCategory}`);
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

    console.log(`🎉 Cron job completed: ${emailsSent} emails sent, ${errors} errors`);

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

