import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://inklingsjournal.live',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// List of user IDs who need catch-up prompts
// TO USE: Replace the placeholder below with actual user IDs who missed prompts
// Example format: 'user-id-1', 'user-id-2', 'user-id-3'
// 
// To find users who missed prompts, use the find_missed_prompts_downtime.sql query
const CATCHUP_USER_IDS: string[] = [
  // 'PLACEHOLDER_USER_ID_1',  // email@example.com
  // 'PLACEHOLDER_USER_ID_2',  // email2@example.com
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow POST requests (GET requests are likely bots/monitors)
  if (req.method !== 'POST') {
    console.warn(`❌ Invalid method: ${req.method}. Only POST requests are allowed.`);
    return new Response(JSON.stringify({
      success: false,
      error: 'Method not allowed',
      message: 'This function only accepts POST requests'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('Missing RESEND_API_KEY');
    }

    // Check if any user IDs are configured
    if (!CATCHUP_USER_IDS || CATCHUP_USER_IDS.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'No user IDs configured. Please edit CATCHUP_USER_IDS array in the function code.',
        instructions: 'Add user IDs to the CATCHUP_USER_IDS array at the top of the function file. See SEND_CATCHUP_PROMPTS.md for instructions.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // Deduplicate user IDs to prevent sending multiple emails to the same user
    const uniqueUserIds = [...new Set(CATCHUP_USER_IDS)];
    if (uniqueUserIds.length !== CATCHUP_USER_IDS.length) {
      console.log(`⚠️ Duplicate user IDs detected. Deduplicated from ${CATCHUP_USER_IDS.length} to ${uniqueUserIds.length} users.`);
    }

    console.log(`🚀 Starting catch-up prompts for ${uniqueUserIds.length} users...`);

    // Get these specific users
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
      .in('user_id', uniqueUserIds);

    if (usersError) {
      throw new Error(`Error fetching users: ${usersError.message}`);
    }

    if (!users || users.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'No users found'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    let emailsSent = 0;
    let errors = 0;
    const results: any[] = [];

    // Process each user (bypassing day/time checks since this is catch-up)
    // RATE LIMITING: Resend API allows 2 requests per second
    // We use 1 second delay between emails to stay safely under the limit
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      
      // Add 1 second delay between emails to avoid Resend rate limits
      // This ensures we stay well under the 2 requests/second limit
      if (i > 0) {
        console.log(`⏳ Rate limiting: waiting 1 second before next email...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      try {
        console.log(`\n📧 Processing user: ${user.user_id} (${user.notification_email})`);

        // SAFEGUARD: Check if user already received a prompt today
        // This prevents duplicate sends if the function is called multiple times
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStart = today.toISOString();
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);
        const todayEndISO = todayEnd.toISOString();

        const { data: recentPrompts, error: recentError } = await supabase
          .from('prompt_history')
          .select('id, sent_at')
          .eq('user_id', user.user_id)
          .gte('sent_at', todayStart)
          .lte('sent_at', todayEndISO);

        if (recentError) {
          console.error(`⚠️ Error checking recent prompts:`, recentError);
        } else if (recentPrompts && recentPrompts.length > 0) {
          console.log(`⏭️ Skipping user ${user.user_id}: Already received ${recentPrompts.length} prompt(s) today (most recent: ${recentPrompts[0].sent_at})`);
          results.push({ 
            user_id: user.user_id, 
            email: user.notification_email, 
            status: 'skipped', 
            message: `Already received ${recentPrompts.length} prompt(s) today` 
          });
          continue;
        }

        // Get user's prompt rotation data
        const { data: rotationData, error: rotationError } = await supabase
          .from('user_prompt_rotation')
          .select('*')
          .eq('uid', user.user_id)
          .single();

        if (rotationError || !rotationData) {
          console.error(`❌ Error fetching rotation for user ${user.user_id}:`, rotationError);
          errors++;
          results.push({ user_id: user.user_id, email: user.notification_email, status: 'error', message: 'No rotation data' });
          continue;
        }

        // Get the next category to send
        const currentCategoryId = rotationData.next_category_to_send || user.categories[0];
        const cleanCategoryId = currentCategoryId.replace(/[^a-zA-Z0-9-]/g, '');
        
        // Get current prompt count for this category
        const categoryCountColumn = `${currentCategoryId.replace(/[^a-zA-Z0-9]/g, '_')}_current_count`;
        const currentPromptCount = rotationData[categoryCountColumn] || 1;

        console.log(`📚 Category: ${cleanCategoryId}, Prompt #: ${currentPromptCount}`);

        // Get the prompt from prompt_bank
        const { data: prompt, error: promptError } = await supabase
          .from('prompt_bank')
          .select('*')
          .eq('category_id', cleanCategoryId)
          .eq('prompt_number', currentPromptCount)
          .eq('is_active', true)
          .single();

        if (promptError || !prompt) {
          console.error(`❌ Prompt not found for ${cleanCategoryId} #${currentPromptCount}`);
          errors++;
          results.push({ user_id: user.user_id, email: user.notification_email, status: 'error', message: 'Prompt not found' });
          continue;
        }

        // Get category name
        const categoryName = prompt.category_name || cleanCategoryId;

        // Generate feedback token
        const feedbackToken = crypto.randomUUID();

        // Get prompt ID for feedback
        const { data: promptBankData } = await supabase
          .from('prompt_bank')
          .select('id')
          .eq('category_id', prompt.category_id)
          .eq('prompt_number', prompt.prompt_number)
          .single();

        const actualPromptId = promptBankData?.id || 'unknown';

        // Get user's local time for date formatting (simplified approach)
        const now = new Date();
        const formattedDate = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;

        // Send email via Resend (using same template as send-prompts)
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
                <p style="margin-bottom: 15px; color: #6b7280; font-size: 14px;">
                  Anonymous Feedback - What do you think of your prompt today?
                </p>
                <table style="width: 100%; margin: 0 auto; text-align: center;">
                  <tr>
                    <td style="text-align: center;">
                      <a href="https://www.inklingsjournal.live/api/feedback?token=${feedbackToken}&type=up&prompt_id=${actualPromptId}" 
                         style="text-decoration: none; display: inline-block; padding: 8px; border-radius: 50%; background-color: #f3f4f6; border: 2px solid #e5e7eb; margin: 0 20px;">
                        <span style="font-size: 24px;">👍</span>
                      </a>
                      <a href="https://www.inklingsjournal.live/api/feedback?token=${feedbackToken}&type=down&prompt_id=${actualPromptId}" 
                         style="text-decoration: none; display: inline-block; padding: 8px; border-radius: 50%; background-color: #f3f4f6; border: 2px solid #e5e7eb; margin: 0 20px;">
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

        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Ink-lings <support@inklingsjournal.live>',
            to: user.notification_email,
            subject: `✍️ Your Journal Prompt - ${formattedDate}`,
            html: emailHtml
          })
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.text();
          throw new Error(`Resend API error: ${emailResponse.status} ${errorData}`);
        }

        const emailResult = await emailResponse.json();
        console.log(`✅ Email sent to ${user.notification_email}`);

        // Record in prompt_history
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
          console.error(`⚠️ Error recording history:`, historyError);
        }

        // Update rotation
        const userCategories = user.categories || [];
        const currentCategoryIndex = userCategories.indexOf(cleanCategoryId);
        const nextCategoryIndex = (currentCategoryIndex + 1) % userCategories.length;
        const nextCategory = userCategories[nextCategoryIndex];
        const categoryCountColumnForUpdate = `${currentCategoryId.replace(/[^a-zA-Z0-9]/g, '_')}_current_count`;

        await supabase
          .from('user_prompt_rotation')
          .update({
            [categoryCountColumnForUpdate]: currentPromptCount + 1,
            next_category_to_send: nextCategory
          })
          .eq('uid', user.user_id);

        emailsSent++;
        results.push({ user_id: user.user_id, email: user.notification_email, status: 'success' });

      } catch (error) {
        console.error(`❌ Error processing user ${user.user_id}:`, error);
        errors++;
        results.push({ user_id: user.user_id, email: user.notification_email, status: 'error', message: error.message });
      }
    }

    console.log(`\n✅ Catch-up complete: ${emailsSent} sent, ${errors} errors`);

    return new Response(JSON.stringify({
      success: true,
      emailsSent,
      errors,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('❌ Catch-up function error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

