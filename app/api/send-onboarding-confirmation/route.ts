import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseServiceRole = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function POST(request: NextRequest) {
  try {
    const { userId, userEmail, userFirstName, selectedCategories, isTestEmail } = await request.json();

    if (!userEmail || !userFirstName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // For test emails, always use static content
    let categoryName = 'Sample Category';
    let promptText = 'What thought does the color yellow bring up for you today?';
    
    // Only fetch real data for non-test emails
    if (!isTestEmail && userId && userId !== 'test-user') {
      try {
        // Fetch user's categories from user_preferences
        const { data: userPrefs, error: prefsError } = await supabaseServiceRole
          .from('user_preferences')
          .select('selected_categories')
          .eq('user_id', userId)
          .single();

        if (!prefsError && userPrefs && userPrefs.selected_categories && userPrefs.selected_categories.length > 0) {
          const firstCategoryId = userPrefs.selected_categories[0];
          
          // Get category name
          const { data: categoryData, error: categoryError } = await supabaseServiceRole
            .from('journal_categories')
            .select('name')
            .eq('id', firstCategoryId)
            .single();

          if (!categoryError && categoryData) {
            categoryName = categoryData.name;
          }

          // Get prompt
          const { data: firstPrompt, error: promptError } = await supabaseServiceRole
            .from('prompt_bank')
            .select('prompt_text')
            .eq('category_id', firstCategoryId)
            .eq('prompt_number', 1)
            .single();

          if (!promptError && firstPrompt) {
            promptText = firstPrompt.prompt_text;
          }
        }
      } catch (error) {
        console.error('Error fetching user preferences:', error);
        // Fallback to default values
      }
    }

    // Calculate first prompt date (next occurrence of their schedule)
    const now = new Date();
    const firstPromptDate = new Date(now);
    firstPromptDate.setDate(now.getDate() + 1); // Default to tomorrow
    
    // Format the date for display
    const formattedDate = firstPromptDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });

    // Create the email HTML
    const emailHtml = `
      <!doctype html>
      <html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
      <head>
        <meta charset="utf-8">
        <meta name="x-apple-disable-message-reformatting">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <meta name="color-scheme" content="light dark">
        <meta name="supported-color-schemes" content="light dark">
        <title>Welcome to Ink-lings - Your First Prompt!</title>
        <!--[if mso]>
        <style type="text/css">
          body, table, td, div, p, a {font-family: Arial, sans-serif !important;}
        </style>
        <![endif]-->
        <style>
          /* Force light mode colors */
          body { background:#f8f9fa !important; }
          .bg-page { background:#f8f9fa !important; }
          .card { background:#ffffff !important; border-color:#e9ecef !important; }
          
          /* Mobile spacing fixes */
          @media only screen and (max-width:600px){
            .container { width:100% !important; }
            .px { padding-left:20px !important; padding-right:20px !important; }
          }
        </style>
      </head>
      <body style="margin:0; padding:0; background:#f8f9fa !important;">
        <!-- Preheader (hidden) -->
        <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
          You're all set! Here's what your Ink-lings journal prompts will look like.
        </div>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa !important;" class="bg-page">
          <tr>
            <td align="center" style="padding:40px 20px;">
              <!-- Logo -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;" class="container">
                <tr>
                  <td align="center" style="padding-bottom:32px;">
                    <img src="https://inklingsjournal.live/ink_lings_email_logo.png" width="160" height="auto" alt="Ink‑lings" style="display:block; margin:0 auto; border:0; outline:none; text-decoration:none;">
                  </td>
                </tr>
              </table>

              <!-- Welcome Message -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px; background:#ffffff !important; border:1px solid #e9ecef !important; border-radius:8px; box-shadow:0 1px 3px 0 rgba(0,0,0,0.1); margin-bottom:24px;" class="container card">
                <tr>
                  <td class="px" style="padding:32px;">
                    <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#1e293b !important; font-size:16px; line-height:1.6; margin:0 0 24px;">
                      Hey ${userFirstName},
                    </p>
                    <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#475569 !important; font-size:16px; line-height:1.6; margin:0 0 16px;">
                      You're all set! Here's what your prompts will look like:
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Sample Prompt (Same format as delivery emails) -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px; background:#ffffff !important; border:1px solid #e9ecef !important; border-radius:8px; box-shadow:0 1px 3px 0 rgba(0,0,0,0.1); margin-bottom:24px;" class="container card">
                <tr>
                  <td class="px" style="padding:32px;">
                    <div style="background:#f8f9fa; border-left:4px solid #007bff; padding:20px; border-radius:8px;">
                      <div style="display:inline-block; background:#e9ecef; color:#495057; padding:4px 12px; border-radius:20px; font-size:14px; margin-bottom:15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                        ${categoryName}
                      </div>
                      <p style="font-size:18px; font-weight:500; color:#2c3e50; margin:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                        "${promptText}"
                      </p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Get Ready Section -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px; background:#ffffff !important; border:1px solid #e9ecef !important; border-radius:8px; box-shadow:0 1px 3px 0 rgba(0,0,0,0.1); margin-bottom:24px;" class="container card">
                <tr>
                  <td class="px" style="padding:32px;">
                    <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#1e293b !important; font-size:16px; line-height:1.6; margin:0 0 24px;">
                      <strong>Get your supplies ready!</strong> You'll need pen and paper to get started.
                    </p>
                    <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#475569 !important; font-size:14px; line-height:1.6; margin:0 0 16px;">
                      I'm a basic Bic pen girl myself, but here are my recommendations for a journal and pen storage:
                    </p>
                    
                    <!-- Journal Recommendation -->
                    <div style="margin-bottom:20px; padding:16px; background:#f8f9fa; border-radius:8px;">
                      <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#1e293b !important; font-size:14px; font-weight:600; margin:0 0 8px;">
                        📓 Journal Recommendation:
                      </p>
                      <div style="display:flex; align-items:center; gap:12px;">
                        <img src="https://inklingsjournal.live/notebook_recommendation.png" alt="Spiral Notebook" style="width:80px; height:80px; object-fit:cover; border-radius:4px;">
                        <div>
                          <a href="https://amzn.to/45AJUoA" style="color:#007bff !important; text-decoration:none; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:14px; font-weight:500;">
                            Spiral Notebook
                          </a>
                          <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#64748b !important; font-size:12px; margin:4px 0 0 0;">
                            Perfect for daily journaling
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Pen Storage Recommendation -->
                    <div style="margin-bottom:20px; padding:16px; background:#f8f9fa; border-radius:8px;">
                      <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#1e293b !important; font-size:14px; font-weight:600; margin:0 0 8px;">
                        ✒️ Pen Storage:
                      </p>
                      <div style="display:flex; align-items:center; gap:12px;">
                        <img src="https://inklingsjournal.live/pen_holder_recommendation.png" alt="Pen Organizer" style="width:80px; height:80px; object-fit:cover; border-radius:4px;">
                        <div>
                          <a href="https://amzn.to/47dBYuG" style="color:#007bff !important; text-decoration:none; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:14px; font-weight:500;">
                            Pen Organizer Case
                          </a>
                          <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#64748b !important; font-size:12px; margin:4px 0 0 0;">
                            Keep your pens organized
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#64748b !important; font-size:12px; line-height:1.5; margin:0; font-style:italic;">
                      <strong>Note:</strong> These are commission-based affiliate links. If you make a purchase, I may earn a small commission at no extra cost to you.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px; background:#ffffff !important; border:1px solid #e9ecef !important; border-radius:8px; box-shadow:0 1px 3px 0 rgba(0,0,0,0.1);" class="container card">
                <tr>
                  <td class="px" style="padding:32px;">
                    ${!isTestEmail ? `
                    <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#475569 !important; font-size:16px; line-height:1.6; margin:0 0 16px;">
                      Your first scheduled prompt will arrive on ${formattedDate}.
                    </p>
                    ` : ''}
                    <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#64748b !important; font-size:14px; line-height:1.5; margin:0; text-align:center;">
                      Happy journaling,<br>
                      Rachell<br>
                      <span style="color:#007bff !important;">Founder of Ink-lings</span>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Send the email using Resend
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Ink-lings <support@inklingsjournal.live>',
        to: userEmail,
        subject: isTestEmail ? '✍️ Test: Your Ink-lings Journal Prompt Sample' : '✍️ Welcome to Ink-lings - Your First Prompt!',
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to send email: ${error}`);
    }

    // Set up user prompt progress in the database (only for non-test emails)
    if (!isTestEmail && userId !== 'test-user' && selectedCategories && selectedCategories.length > 0) {
      // First category starts at 1 (prompt #1 sent), others start at 1 (ready for first prompt)
      const firstCategoryId = selectedCategories[0];
      
      for (const categoryId of selectedCategories) {
        const isFirstCategory = categoryId === firstCategoryId;
        
        const { error: progressError } = await supabaseServiceRole
          .from('user_prompt_progress')
          .upsert({
            user_id: userId,
            category_id: categoryId,
            current_prompt_number: isFirstCategory ? 1 : 1, // First category: 1 (sent), Others: 1 (ready)
            last_sent_date: isFirstCategory ? new Date().toISOString() : null
          });

        if (progressError) {
          console.error(`Error setting up progress for category ${categoryId}:`, progressError);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: isTestEmail ? 'Test email sent successfully' : 'Onboarding confirmation email sent successfully',
      categoryName,
      promptText
    });

  } catch (error) {
    console.error('Error sending onboarding confirmation email:', error);
    return NextResponse.json(
      { error: 'Failed to send onboarding confirmation email' },
      { status: 500 }
    );
  }
}
