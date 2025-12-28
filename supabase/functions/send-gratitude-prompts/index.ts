import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://inklingsjournal.live',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  console.log('🚀 Gratitude Challenge Edge function starting...');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('📋 CORS preflight request');
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  // SECURITY: Require secret token for authentication
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
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('Missing RESEND_API_KEY environment variable');
    }

    // Check for test mode parameters
    const url = new URL(req.url);
    const testEmail = url.searchParams.get('test_email');
    const testDayOfYear = url.searchParams.get('day_of_year');
    const isTestMode = !!testEmail;

    if (isTestMode) {
      console.log(`🧪 TEST MODE: Sending test email to ${testEmail}`);
    }

    // Get current time in UTC
    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();
    console.log(`🕐 Cron job running at ${currentHour}:${currentMinute} UTC on ${currentYear}`);

    // Only run during 2026 (January 1, 2026 to December 31, 2026) - unless test mode
    if (currentYear !== 2026 && !isTestMode) {
      console.log(`⏭️ Skipping - not 2026 (current year: ${currentYear})`);
      return new Response(JSON.stringify({
        success: true,
        message: `Not 2026 - this function only runs during 2026 (current year: ${currentYear})`,
        emailsSent: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // Check if it's the right time (16:00 UTC = 11:00 AM EST / 12:00 PM EDT) - unless test mode
    if (currentHour !== 16 && !isTestMode) {
      console.log(`⏭️ Skipping - not 16:00 UTC (current time: ${currentHour}:${currentMinute} UTC)`);
      return new Response(JSON.stringify({
        success: true,
        message: `Not the right time - runs at 16:00 UTC (current: ${currentHour}:${currentMinute} UTC)`,
        emailsSent: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // Calculate day of year (1-365) - use test parameter if provided
    const dayOfYear = testDayOfYear ? parseInt(testDayOfYear, 10) : (() => {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    })();
    console.log(`📅 Day of year: ${dayOfYear}${isTestMode ? ' (TEST MODE)' : ''}`);

    // Get the prompt for the specified day of year
    const { data: prompt, error: promptError } = await supabase
      .from('prompt_bank')
      .select('id, prompt_text, category_name, stoic_blurb')
      .eq('category_id', '2026-gratitude')
      .eq('prompt_number', dayOfYear)
      .eq('is_active', true)
      .single();

    if (promptError || !prompt) {
      throw new Error(`Prompt not found for day ${dayOfYear}: ${promptError?.message || 'No prompt data'}`);
    }

    console.log(`✅ Found prompt for day ${dayOfYear}: "${prompt.prompt_text.substring(0, 50)}..."`);

    // TEST MODE: Send to test email only
    if (isTestMode) {
      try {
        // Generate feedback token
        const feedbackToken = crypto.randomUUID();

        // Convert day of year to actual date (January 1, 2026 + dayOfYear - 1 days)
        const startDate2026 = new Date(2026, 0, 1); // January 1, 2026
        const actualDate = new Date(startDate2026);
        actualDate.setDate(actualDate.getDate() + dayOfYear - 1);
        
        // Format date as "January 1, 2026"
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                            'July', 'August', 'September', 'October', 'November', 'December'];
        const formattedDate = `${monthNames[actualDate.getMonth()]} ${actualDate.getDate()}, ${actualDate.getFullYear()}`;

        // Create email HTML (same as production)
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your Ink-lings Gratitude Prompt</title>
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
                border-left: 4px solid #f97316;
                color: #333;
                padding: 25px;
                border-radius: 8px;
                margin: 25px 0;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              }
              .category-tag {
                display: inline-block;
                background-color: #fef3c7;
                color: #92400e;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 500;
                margin-bottom: 15px;
                text-transform: capitalize;
                border: 1px solid #fcd34d;
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
              .feedback-links {
                margin-top: 20px;
                text-align: center;
              }
              .feedback-link {
                display: inline-block;
                margin: 0 10px;
                padding: 8px 16px;
                text-decoration: none;
                border-radius: 6px;
                font-size: 14px;
              }
              .feedback-link.positive {
                background-color: #10b981;
                color: white;
              }
              .feedback-link.negative {
                background-color: #ef4444;
                color: white;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img src="https://inklingsjournal.live/ink_lings_email_logo.png" alt="Ink-lings" class="logo">
                <h1 class="main-title">✍️ Your Gratitude Prompt</h1>
              </div>
              
              <div class="prompt-box">
                <div class="category-tag">2026 Gratitude Challenge - ${formattedDate}</div>
                ${prompt.stoic_blurb ? `<p style="font-size: 16px; line-height: 1.6; color: #475569; margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-style: italic;">${prompt.stoic_blurb}</p>` : ''}
                <p class="prompt-text">"${prompt.prompt_text}"</p>
              </div>
              
              <div class="feedback-section" style="margin-top: 30px; text-align: center; width: 100%;">
                <p style="margin-bottom: 15px; color: #6b7280; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  Anonymous Feedback - What do you think of your prompt today?
                </p>
                <table style="width: 100%; margin: 0 auto; text-align: center;">
                  <tr>
                    <td style="text-align: center;">
                      <a href="https://www.inklingsjournal.live/api/feedback?token=${feedbackToken}&type=up&prompt_id=${prompt.id}" 
                         style="text-decoration: none; display: inline-block; padding: 8px; border-radius: 50%; background-color: #f3f4f6; transition: background-color 0.2s; border: 2px solid #e5e7eb; margin: 0 20px;"
                         onmouseover="this.style.backgroundColor='#e5e7eb'"
                         onmouseout="this.style.backgroundColor='#f3f4f6'">
                        <span style="font-size: 24px;">👍</span>
                      </a>
                      <a href="https://www.inklingsjournal.live/api/feedback?token=${feedbackToken}&type=down&prompt_id=${prompt.id}" 
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
                  <a href="https://www.inklingsjournal.live/" style="color: #2563eb; text-decoration: none; font-weight: 500;">Manage Preferences</a>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;

        // Send email via Resend
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Ink-lings <prompts@inklingsjournal.live>',
            to: testEmail,
            subject: `A Year of Gratitude - ${formattedDate} [TEST]`,
            html: emailHtml
          })
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.text();
          throw new Error(`Resend API error: ${errorData}`);
        }

        const emailData = await emailResponse.json();
        console.log(`✅ Test email sent to ${testEmail} (ID: ${emailData.id})`);

        return new Response(JSON.stringify({
          success: true,
          testMode: true,
          dayOfYear,
          emailSent: testEmail,
          message: 'Test email sent successfully'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        });
      } catch (error) {
        console.error(`❌ Error sending test email:`, error);
        return new Response(JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        });
      }
    }

    // PRODUCTION MODE: Get all active gratitude challenge participants
    const { data: participants, error: participantsError } = await supabase
      .from('gratitude_2026_participants')
      .select('user_id, notification_time_utc, last_prompt_sent')
      .eq('active', true);

    if (participantsError) {
      throw new Error(`Error fetching participants: ${participantsError.message}`);
    }

    if (!participants || participants.length === 0) {
      console.log('No active gratitude challenge participants found');
      return new Response(JSON.stringify({
        success: true,
        message: 'No active participants',
        emailsSent: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    console.log(`📧 Found ${participants.length} active participants`);

    // Get user emails from user_preferences
    const userIds = participants.map(p => p.user_id);
    const { data: userPrefs, error: userPrefsError } = await supabase
      .from('user_preferences')
      .select('user_id, notification_email')
      .in('user_id', userIds);

    if (userPrefsError) {
      throw new Error(`Error fetching user preferences: ${userPrefsError.message}`);
    }

    // Create a map of user_id to email
    const userEmailMap = new Map(
      (userPrefs || []).map(up => [up.user_id, up.notification_email])
    );

    let emailsSent = 0;
    let errors = 0;
    const results: Array<{ user_id: string; email: string; status: string; message?: string }> = [];

    // Send emails to each participant
    for (const participant of participants) {
      const userEmail = userEmailMap.get(participant.user_id);
      
      if (!userEmail) {
        console.error(`❌ No email found for user ${participant.user_id}`);
        errors++;
        results.push({
          user_id: participant.user_id,
          email: 'unknown',
          status: 'error',
          message: 'No email found in user_preferences'
        });
        continue;
      }

      // Check if user already received today's prompt
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.toISOString();
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);
      const todayEndISO = todayEnd.toISOString();

      const { data: recentPrompts, error: recentError } = await supabase
        .from('prompt_history')
        .select('id')
        .eq('user_id', participant.user_id)
        .eq('category_id', '2026-gratitude')
        .eq('prompt_number', dayOfYear)
        .gte('sent_at', todayStart)
        .lte('sent_at', todayEndISO);

      if (recentError) {
        console.error(`⚠️ Error checking recent prompts for user ${participant.user_id}:`, recentError);
      } else if (recentPrompts && recentPrompts.length > 0) {
        console.log(`⏭️ Skipping user ${participant.user_id}: Already received today's gratitude prompt`);
        results.push({
          user_id: participant.user_id,
          email: userEmail,
          status: 'skipped',
          message: 'Already received today'
        });
        continue;
      }

      try {
        // Generate feedback token
        const feedbackToken = crypto.randomUUID();

        // Convert day of year to actual date (January 1, 2026 + dayOfYear - 1 days)
        const startDate2026 = new Date(2026, 0, 1); // January 1, 2026
        const actualDate = new Date(startDate2026);
        actualDate.setDate(actualDate.getDate() + dayOfYear - 1);
        
        // Format date as "January 1, 2026"
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                            'July', 'August', 'September', 'October', 'November', 'December'];
        const formattedDate = `${monthNames[actualDate.getMonth()]} ${actualDate.getDate()}, ${actualDate.getFullYear()}`;

        // Create email HTML (using same template as regular prompts)
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your Ink-lings Gratitude Prompt</title>
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
                border-left: 4px solid #f97316;
                color: #333;
                padding: 25px;
                border-radius: 8px;
                margin: 25px 0;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              }
              .category-tag {
                display: inline-block;
                background-color: #fef3c7;
                color: #92400e;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 500;
                margin-bottom: 15px;
                text-transform: capitalize;
                border: 1px solid #fcd34d;
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
              .feedback-links {
                margin-top: 20px;
                text-align: center;
              }
              .feedback-link {
                display: inline-block;
                margin: 0 10px;
                padding: 8px 16px;
                text-decoration: none;
                border-radius: 6px;
                font-size: 14px;
              }
              .feedback-link.positive {
                background-color: #10b981;
                color: white;
              }
              .feedback-link.negative {
                background-color: #ef4444;
                color: white;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img src="https://inklingsjournal.live/ink_lings_email_logo.png" alt="Ink-lings" class="logo">
                <h1 class="main-title">✍️ Your Gratitude Prompt</h1>
              </div>
              
              <div class="prompt-box">
                <div class="category-tag">2026 Gratitude Challenge - ${formattedDate}</div>
                ${prompt.stoic_blurb ? `<p style="font-size: 16px; line-height: 1.6; color: #475569; margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-style: italic;">${prompt.stoic_blurb}</p>` : ''}
                <p class="prompt-text">"${prompt.prompt_text}"</p>
              </div>
              
              <div class="feedback-section" style="margin-top: 30px; text-align: center; width: 100%;">
                <p style="margin-bottom: 15px; color: #6b7280; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  Anonymous Feedback - What do you think of your prompt today?
                </p>
                <table style="width: 100%; margin: 0 auto; text-align: center;">
                  <tr>
                    <td style="text-align: center;">
                      <a href="https://www.inklingsjournal.live/api/feedback?token=${feedbackToken}&type=up&prompt_id=${prompt.id}" 
                         style="text-decoration: none; display: inline-block; padding: 8px; border-radius: 50%; background-color: #f3f4f6; transition: background-color 0.2s; border: 2px solid #e5e7eb; margin: 0 20px;"
                         onmouseover="this.style.backgroundColor='#e5e7eb'"
                         onmouseout="this.style.backgroundColor='#f3f4f6'">
                        <span style="font-size: 24px;">👍</span>
                      </a>
                      <a href="https://www.inklingsjournal.live/api/feedback?token=${feedbackToken}&type=down&prompt_id=${prompt.id}" 
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
                  <a href="https://www.inklingsjournal.live/" style="color: #2563eb; text-decoration: none; font-weight: 500;">Manage Preferences</a>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;

        // Send email via Resend
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Ink-lings <prompts@inklingsjournal.live>',
            to: userEmail,
            subject: `A Year of Gratitude - ${formattedDate}`,
            html: emailHtml
          })
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.text();
          throw new Error(`Resend API error: ${errorData}`);
        }

        const emailData = await emailResponse.json();
        console.log(`✅ Email sent to ${userEmail} (ID: ${emailData.id})`);

        // Add to prompt_history (but don't increment regular counts)
        const { error: historyError } = await supabase
          .from('prompt_history')
          .insert({
            user_id: participant.user_id,
            category_id: '2026-gratitude',
            prompt_text: prompt.prompt_text,
            prompt_number: dayOfYear,
            email_sent_to: userEmail,
            feedback_token: feedbackToken
          });

        if (historyError) {
          console.error(`⚠️ Error adding to prompt_history for user ${participant.user_id}:`, historyError);
        }

        // Update last_prompt_sent in gratitude_2026_participants
        const { error: updateError } = await supabase
          .from('gratitude_2026_participants')
          .update({
            last_prompt_sent: dayOfYear,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', participant.user_id);

        if (updateError) {
          console.error(`⚠️ Error updating last_prompt_sent for user ${participant.user_id}:`, updateError);
        }

        emailsSent++;
        results.push({
          user_id: participant.user_id,
          email: userEmail,
          status: 'sent'
        });

        // Rate limiting: 1 second delay between emails
        if (emailsSent < participants.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        console.error(`❌ Error sending email to ${userEmail}:`, error);
        errors++;
        results.push({
          user_id: participant.user_id,
          email: userEmail,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`\n📊 Summary: ${emailsSent} emails sent, ${errors} errors, ${results.filter(r => r.status === 'skipped').length} skipped`);

    return new Response(JSON.stringify({
      success: true,
      dayOfYear,
      emailsSent,
      errors,
      totalParticipants: participants.length,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('❌ Fatal error in gratitude challenge function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

