import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://inklingsjournal.live',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// List of user IDs who missed prompts during the outage
// Time range: 2025-12-27 18:55:03.576+00 UTC to 2025-12-29 21:14:03.576+00 CST
// Map of user_id -> number of prompts missed
const BACKFILL_USERS: Record<string, number> = {
  '01150a91-5390-450d-8120-253f2e19502b': 3,  // trishac292@gmail.com
  '65436103-68aa-4dde-b7c6-6d8ae00b0e4f': 2,  // aleesa.cahill.622@gmail.com
  '1e318b04-c42e-4b99-ab1e-2308e60d53a9': 2,  // glitter.reader6@gmail.com
  'e406614a-b0fd-4b23-a476-a05c98fd4cc7': 2,  // jolivares.lbc@gmail.com
  '64608354-7d3d-46fb-87d6-45fdb70d5537': 2,  // josankowski@gmail.com
  '1b4cf4f0-be8a-4931-b4b2-7a4801585a8e': 2,  // rkweiss89@gmail.com
  '77aa4e57-66c7-479c-a3ef-1a4dac502fa4': 2,  // schottnathan@gmail.com
  'f93c5db5-435a-48e0-978e-dec69d237cd4': 1,  // hellerozalina@gmail.com
  '3a0acc8a-8f89-49bd-a0e2-18e6a277ee79': 1,  // hoping4humanity@gmail.com
  '95d95320-4f32-4e85-bab7-7285012a3893': 1,  // joann.pruden@gmail.com
  '70a955b1-0334-4f10-8a85-55cfb54595a5': 1,  // kathleenskovacich@gmail.com
  'e0ee0bac-18ce-43f9-bc6c-9fa6966f7085': 1,  // lighthouseskrapbooker@hotmail.com
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('🚀 Apology/backfill function starting...');

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

    // Check if any user IDs are configured
    const backfillUserIds = Object.keys(BACKFILL_USERS);
    if (!backfillUserIds || backfillUserIds.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'No user IDs configured. Please edit BACKFILL_USERS object in the function code.',
        instructions: 'Add user IDs and their missed prompt counts to the BACKFILL_USERS object at the top of the function file.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    console.log(`🚀 Starting apology/backfill emails for ${backfillUserIds.length} users...`);

    // Get these specific users with their preferences
    const { data: users, error: usersError } = await supabase
      .from('user_preferences')
      .select(`
        user_id,
        notification_email,
        categories,
        gratitude_2026_token,
        gratitude_2026_expires
      `)
      .in('user_id', backfillUserIds);

    if (usersError) {
      throw new Error(`Error fetching users: ${usersError.message}`);
    }

    if (!users || users.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'No users found with the provided IDs'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    let emailsSent = 0;
    let errors = 0;
    const results: Array<{ user_id: string; email: string; status: string; message?: string }> = [];

    // Time range for calculating missed prompts
    const outageStart = new Date('2025-12-27T18:55:03.576Z');
    const outageEnd = new Date('2025-12-30T03:14:03.576Z'); // 2025-12-29 21:14:03.576 CST = 2025-12-30 03:14:03.576 UTC

    // Process each user
    for (const user of users) {
      try {
        console.log(`\n📧 Processing user: ${user.user_id} (${user.notification_email})`);

        // Get user's prompt rotation data
        const { data: rotationData, error: rotationError } = await supabase
          .from('user_prompt_rotation')
          .select('*')
          .eq('user_id', user.user_id)
          .single();

        if (rotationError && rotationError.code !== 'PGRST116') {
          console.error(`❌ Error fetching rotation data for user ${user.user_id}:`, rotationError);
          errors++;
          results.push({ user_id: user.user_id, email: user.notification_email, status: 'error', message: 'No rotation data' });
          continue;
        }

        // Get the missed prompts by following rotation logic
        // We'll get the next prompts based on their current rotation state
        // Most users missed 1-3 prompts during the outage period
        const missedPrompts: Array<{
          categoryId: string;
          categoryName: string;
          promptText: string;
          promptNumber: number;
          promptId: string;
        }> = [];

        // Start with current rotation state (this is where they should be now)
        // We'll get the next prompts they should have received during the outage
        let currentCategoryId = rotationData?.next_category_to_send || user.categories[0];
        const userCategories = user.categories || [];
        
        // Get the exact number of prompts they missed (from SQL query results)
        const maxPromptsToGet = BACKFILL_USERS[user.user_id] || 1;
        console.log(`📊 User ${user.user_id} missed ${maxPromptsToGet} prompt(s)`);

        // Track rotation state as we collect prompts (so we can update it correctly later)
        let trackingRotationData = rotationData ? { ...rotationData } : null;

        for (let i = 0; i < maxPromptsToGet; i++) {
          const cleanCategoryId = currentCategoryId.replace(/[^a-zA-Z0-9-]/g, '');
          const categoryCountColumn = `${currentCategoryId.replace(/[^a-zA-Z0-9]/g, '_')}_current_count`;
          const currentPromptCount = trackingRotationData?.[categoryCountColumn] || 1;

          // Get the prompt
          const { data: prompt, error: promptError } = await supabase
            .from('prompt_bank')
            .select('*')
            .eq('category_id', cleanCategoryId)
            .eq('prompt_number', currentPromptCount)
            .eq('is_active', true)
            .single();

          if (promptError || !prompt) {
            console.error(`❌ Error fetching prompt for category ${cleanCategoryId} #${currentPromptCount}:`, promptError);
            break; // Stop if we can't get a prompt
          }

          // Get prompt ID for feedback
          const { data: promptBankData } = await supabase
            .from('prompt_bank')
            .select('id')
            .eq('category_id', prompt.category_id)
            .eq('prompt_number', prompt.prompt_number)
            .single();

          missedPrompts.push({
            categoryId: cleanCategoryId,
            categoryName: prompt.category_name || cleanCategoryId,
            promptText: prompt.prompt_text,
            promptNumber: currentPromptCount,
            promptId: promptBankData?.id || 'unknown'
          });

          // Update tracking rotation data (simulate what would have happened)
          if (trackingRotationData) {
            trackingRotationData[categoryCountColumn] = currentPromptCount + 1;
          }

          // Move to next category (simulate what would have happened)
          const currentCategoryIndex = userCategories.indexOf(currentCategoryId);
          const nextCategoryIndex = (currentCategoryIndex + 1) % userCategories.length;
          currentCategoryId = userCategories[nextCategoryIndex];
          if (trackingRotationData) {
            trackingRotationData.next_category_to_send = currentCategoryId;
          }
        }

        if (missedPrompts.length === 0) {
          console.error(`❌ No prompts found for user ${user.user_id}`);
          errors++;
          results.push({ user_id: user.user_id, email: user.notification_email, status: 'error', message: 'No prompts found' });
          continue;
        }

        console.log(`✅ Found ${missedPrompts.length} prompts for user ${user.user_id}`);

        // Check gratitude challenge enrollment status
        const isGratitudeEnrolled = !user.gratitude_2026_token; // NULL = enrolled, token exists = not enrolled
        const gratitudeToken = user.gratitude_2026_token;
        const gratitudeEnrollmentUrl = gratitudeToken 
          ? `https://www.inklingsjournal.live/api/gratitude-challenge/enroll-email?token=${gratitudeToken}`
          : null;

        // Build email HTML
        const promptsHtml = missedPrompts.map((prompt, index) => `
          <div class="prompt-box" style="margin-bottom: ${index < missedPrompts.length - 1 ? '30px' : '0'};">
            <div class="category-tag">${prompt.categoryName}</div>
            <p class="prompt-text">"${prompt.promptText}"</p>
          </div>
        `).join('');

        const gratitudeSection = `
          <div style="background-color: #ffffff; border: 1px solid #e9ecef; border-radius: 8px; padding: 32px; margin: 30px 0;">
            <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
              I'm excited to introduce the <strong>2026 Gratitude Challenge</strong> - a year-long journey of daily gratitude prompts designed to help you reflect on the moments, people, and experiences that bring joy to your life.
            </p>
            <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
              Starting January 1st, 2026, you'll receive a daily gratitude prompt every day separate from your normal ink-lings schedule. Each prompt is carefully crafted to help you cultivate a deeper sense of appreciation and mindfulness throughout the year.
            </p>
            ${isGratitudeEnrolled
              ? `
                <div style="background-color: #f3f4f6; border: 2px solid #d1d5db; border-radius: 8px; padding: 20px; margin: 24px 0 0; text-align: center;">
                    <p style="color: #6b7280; font-size: 14px; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                      Nevermind, you're already signed up for the 2026 Gratitude Challenge! 🎉
                    </p>
                  </div>
                `
              : `
                <div style="text-align: center; margin: 24px 0 0;">
                  <a href="${gratitudeEnrollmentUrl}" style="background-color: #f97316; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; font-weight: 600; display: inline-block;">
                    Join the 2026 Gratitude Challenge
                  </a>
                  <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #64748b; font-size: 14px; line-height: 1.5; margin: 16px 0 0;">
                    Just click the button above to enroll - it only takes a second! You can opt out anytime from your account settings.
                  </p>
                </div>
              `
            }
          </div>
        `;

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>We're sorry - here are your missed prompts</title>
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
              .apology-section {
                background-color: #fef3c7;
                border-left: 4px solid #f59e0b;
                padding: 20px;
                border-radius: 8px;
                margin: 25px 0;
              }
              .apology-text {
                color: #92400e;
                font-size: 16px;
                line-height: 1.6;
                margin: 0;
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
              .instagram-link {
                color: #e4405f;
                text-decoration: none;
                font-weight: 500;
              }
              .instagram-link:hover {
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
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img src="https://inklingsjournal.live/ink_lings_email_logo.png" alt="Ink-lings" class="logo">
                <h1 class="main-title">✍️ We're sorry - here are your missed prompts</h1>
              </div>
              
              <div class="apology-section">
                <p class="apology-text">
                  So sorry I paused your prompts, I got caught up in building the 2026 Gratitude Challenge and vibe coding got away from me...and I broke the system. But, it's fixed! Here are the prompts that you missed!
                </p>
              </div>
              
              ${promptsHtml}
              
              ${gratitudeSection}
              
              <div style="text-align: center; margin: 30px 0;">
                <p style="color: #475569; font-size: 16px; margin-bottom: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  And while I'm piling on the info - I'm finally building out some social media for what I've built, if you'd like to follow ink-lings on Instagram <a href="https://instagram.com/ink_lings_journal" class="instagram-link">@ink_lings_journal</a> join me there!
                </p>
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

        // Send email via Resend
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Ink-lings <support@inklingsjournal.live>',
            to: user.notification_email,
            subject: "We're sorry - here are your missed prompts",
            html: emailHtml
          })
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.text();
          console.error(`❌ Failed to send email to ${user.notification_email}:`, errorData);
          errors++;
          results.push({ user_id: user.user_id, email: user.notification_email, status: 'error', message: 'Email send failed' });
          continue;
        }

        const emailResult = await emailResponse.json();
        console.log(`✅ Email sent to ${user.notification_email}`);

        // Update rotation and prompt_history for each prompt
        // Use the tracking rotation data we built while collecting prompts
        for (const prompt of missedPrompts) {
          // Record in prompt_history
          const { error: historyError } = await supabase
            .from('prompt_history')
            .insert({
              user_id: user.user_id,
              category_id: prompt.categoryId,
              prompt_text: prompt.promptText,
              prompt_number: prompt.promptNumber,
              email_sent_to: user.notification_email,
              sent_at: new Date().toISOString()
            });

          if (historyError) {
            console.error(`❌ Error inserting prompt history for prompt ${prompt.categoryId} #${prompt.promptNumber}:`, historyError);
          }
        }

        // Update rotation once with final state (after all prompts)
        if (trackingRotationData && missedPrompts.length > 0) {
          const finalCategoryCountColumn = `${missedPrompts[missedPrompts.length - 1].categoryId.replace(/-/g, '_')}_current_count`;
          const finalNextCategory = trackingRotationData.next_category_to_send;

          // Build update object with all category count updates
          const updateData: Record<string, any> = {
            next_category_to_send: finalNextCategory
          };

          // Update all category counts that changed
          for (const prompt of missedPrompts) {
            const categoryCountColumn = `${prompt.categoryId.replace(/-/g, '_')}_current_count`;
            updateData[categoryCountColumn] = prompt.promptNumber + 1;
          }

          const { error: updateError } = await supabase
            .from('user_prompt_rotation')
            .update(updateData)
            .eq('user_id', user.user_id);

          if (updateError) {
            console.error(`❌ Failed to update rotation:`, updateError);
          } else {
            console.log(`✅ Updated rotation for user ${user.user_id}`);
          }
        }

        emailsSent++;
        results.push({ 
          user_id: user.user_id, 
          email: user.notification_email, 
          status: 'success',
          message: `Sent ${missedPrompts.length} missed prompts`
        });

        // Rate limiting: 1 second delay between emails
        if (emailsSent < users.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        console.error(`Error processing user ${user.user_id}:`, error);
        errors++;
        results.push({ 
          user_id: user.user_id, 
          email: user.notification_email, 
          status: 'error', 
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`🎉 Backfill complete: ${emailsSent} emails sent, ${errors} errors`);

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
    console.error('❌ Function failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

