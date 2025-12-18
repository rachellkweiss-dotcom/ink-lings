import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://inklingsjournal.live',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // SECURITY: Require secret token for authentication
  // - If SEND_15_MILESTONE_CRON_SECRET is set: requires matching token
  // - If SEND_15_MILESTONE_CRON_SECRET is NOT set: allows all requests (for testing/development)
  const expectedToken = Deno.env.get('SEND_15_MILESTONE_CRON_SECRET');
  
  if (expectedToken) {
    // Secret token is configured - require authentication
    const providedToken = req.headers.get('x-cron-secret') || req.headers.get('authorization')?.replace('Bearer ', '');
    
    if (providedToken !== expectedToken) {
      console.warn('❌ Unauthorized access attempt - invalid or missing secret token');
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 401
      });
    }
    console.log('✅ Function accessed - secret token validated');
  } else {
    // No secret token configured - allow access (for Supabase cron or testing)
    console.log('⚠️ Function accessed - no secret required (SEND_15_MILESTONE_CRON_SECRET not set)');
  }

  try {
    console.log('🚀 15-Prompt Milestone Email Edge Function starting...')
    
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('Missing RESEND_API_KEY environment variable')
    }

    console.log('📊 Finding users who need 15-prompt milestone email...')
    
    // Step 1: Get users with exactly 15 prompts sent
    const { data: usersWith15Prompts, error: usersError } = await supabase
      .from('user_preferences')
      .select(`
        user_id,
        notification_email,
        users!inner(email)
      `)
      .eq('total_prompts_sent_count', 15)

    if (usersError) {
      throw new Error(`Error fetching users with 15 prompts: ${usersError.message}`)
    }

    console.log(`Found ${usersWith15Prompts?.length || 0} users with exactly 15 prompts`)

    if (!usersWith15Prompts || usersWith15Prompts.length === 0) {
      console.log('No users found with 15 prompts. Exiting.')
      return new Response(
        JSON.stringify({ 
          success: true, 
          emailsSent: 0,
          message: 'No users found with 15 prompts'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 2: Check email_milestones table for each user
    const usersToEmail = []
    
    for (const userPref of usersWith15Prompts) {
      const { data: milestoneData, error: milestoneError } = await supabase
        .from('email_milestones')
        .select('alt_notifications')
        .eq('user_id', userPref.user_id)
        .single()

      if (milestoneError && milestoneError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error(`Error checking milestone for user ${userPref.user_id}:`, milestoneError)
        continue
      }

      // If alt_notifications is empty/null, this user should receive the email
      if (!milestoneData || !milestoneData.alt_notifications) {
        usersToEmail.push({
          user_id: userPref.user_id,
          email: userPref.users.email
        })
      } else {
        console.log(`User ${userPref.user_id} already received alt_notifications email, skipping`)
      }
    }

    console.log(`Found ${usersToEmail.length} users who need the 15-prompt milestone email`)

    if (usersToEmail.length === 0) {
      console.log('No users need the milestone email. Exiting.')
      return new Response(
        JSON.stringify({ 
          success: true, 
          emailsSent: 0,
          message: 'No users need the milestone email'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 3: Send emails to eligible users
    let emailsSent = 0

    for (const user of usersToEmail) {
      try {
        console.log(`📧 Sending 15-prompt milestone email to ${user.email}`)

        // Email HTML template (15-prompt milestone)
        const emailHtml = `<!doctype html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>You've Received 15 Prompts! - Ink-lings</title>
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
    You've received 15 journal prompts! Let's make sure you're getting the most out of Ink-lings.
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

        <!-- Main Message -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px; background:#ffffff !important; border:1px solid #e9ecef !important; border-radius:8px; box-shadow:0 1px 3px 0 rgba(0,0,0,0.1); margin-bottom:24px;" class="container card">
          <tr>
            <td class="px" style="padding:32px;">
              <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#1e293b !important; font-size:16px; line-height:1.6; margin:0 0 24px;">
                Hey there!
              </p>
              <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#475569 !important; font-size:16px; line-height:1.6; margin:0 0 16px;">
                You've received 15 journal prompts! 🎉 That's amazing progress on your journaling journey.
              </p>
              <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#475569 !important; font-size:16px; line-height:1.6; margin:0 0 24px;">
                Now that you're getting into the rhythm, I want to make sure you're getting the most out of Ink-lings. Here are your options:
              </p>
              
              <!-- Option 1 -->
              <div style="margin:24px 0; padding:20px; background:#f8f9fa; border-radius:8px; border-left:4px solid #28a745;">
                <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#1e293b !important; font-size:16px; font-weight:600; margin:0 0 8px;">
                  ✅ Love getting the emails? Great!
                </p>
                <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#475569 !important; font-size:14px; line-height:1.5; margin:0;">
                  They'll keep coming! No action needed on your part.
                </p>
              </div>

              <!-- Option 2 -->
              <div style="margin:24px 0; padding:20px; background:#f8f9fa; border-radius:8px; border-left:4px solid #007bff;">
                <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#1e293b !important; font-size:16px; font-weight:600; margin:0 0 8px;">
                  📱 Want notifications on your phone?
                </p>
                <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#475569 !important; font-size:14px; line-height:1.5; margin:0 0 12px;">
                  Let me show you how to set up Discord notifications for your journal prompts!
                </p>
                <div style="text-align:center;">
                  <a href="https://scribehow.com/viewer/Set_Up_Google_Apps_Script_for_Ink-lings_Discord_Integration__cMLKU2KATh26_MOoUUo28g" style="background:#007bff !important; color:#ffffff !important; text-decoration:none; padding:12px 24px; border-radius:6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:14px; font-weight:500; display:inline-block;">
                    View Step-by-Step Guide
                  </a>
                </div>
              </div>

              <!-- Option 3 -->
              <div style="margin:24px 0; padding:20px; background:#f8f9fa; border-radius:8px; border-left:4px solid #ffc107;">
                <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#1e293b !important; font-size:16px; font-weight:600; margin:0 0 8px;">
                  🤔 Too technical for you?
                </p>
                <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#475569 !important; font-size:14px; line-height:1.5; margin:0 0 12px;">
                  No worries! I can help you out. I'll set up your Discord notifications for you.
                </p>
                <div style="text-align:center;">
                  <a href="https://buy.stripe.com/5kQ6oI0kC9Zffly0ks24000" style="background:#ffc107 !important; color:#1e293b !important; text-decoration:none; padding:12px 24px; border-radius:6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:14px; font-weight:500; display:inline-block;">
                    Get Help Setting Up ($15)
                  </a>
                </div>
              </div>
            </td>
          </tr>
        </table>

        <!-- Pen Recommendation -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px; background:#ffffff !important; border:1px solid #e9ecef !important; border-radius:8px; box-shadow:0 1px 3px 0 rgba(0,0,0,0.1); margin-bottom:24px;" class="container card">
          <tr>
            <td class="px" style="padding:32px;">
              <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#1e293b !important; font-size:16px; line-height:1.6; margin:0 0 24px;">
                <strong>Keep up the great work! And if you're going to write, you should use these pens - they rock!</strong>
              </p>
              
              <!-- BIC Pen Recommendation -->
              <div style="margin-bottom:20px; padding:16px; background:#f8f9fa; border-radius:8px;">
                <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#1e293b !important; font-size:14px; font-weight:600; margin:0 0 8px;">
                  ✒️ My Favorite Pens:
                </p>
                <div style="display:flex; align-items:center; gap:12px;">
                  <img src="https://inklingsjournal.live/bic_pen.png" alt="BIC Round Stic Pens" style="width:80px; height:80px; object-fit:cover; border-radius:4px;">
                  <div>
                    <a href="https://amzn.to/3K37fqv" style="color:#007bff !important; text-decoration:none; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:14px; font-weight:500;">
                      BIC Round Stic Xtra Life Pens
                    </a>
                    <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#64748b !important; font-size:12px; margin:4px 0 0 0;">
                      Ultra long-lasting, smooth writing
                    </p>
                  </div>
                </div>
              </div>
              
              <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#64748b !important; font-size:12px; line-height:1.5; margin:0; font-style:italic;">
                <strong>Note:</strong> This is a commission-based affiliate link. If you make a purchase, I may earn a small commission at no extra cost to you.
              </p>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px; background:#ffffff !important; border:1px solid #e9ecef !important; border-radius:8px; box-shadow:0 1px 3px 0 rgba(0,0,0,0.1);" class="container card">
          <tr>
            <td class="px" style="padding:32px;">
              <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#64748b !important; font-size:14px; line-height:1.5; margin:0; text-align:center;">
                Keep up the amazing journaling!<br>
                You're doing great with 15 prompts under your belt!<br><br>
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
</html>`

        // Send email via Resend
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Ink-lings <support@inklingsjournal.live>',
            to: user.email,
            subject: "You've Received 15 Prompts! 🎉",
            html: emailHtml,
          })
        })

        if (resendResponse.ok) {
          console.log(`✅ Email sent successfully to ${user.email}`)
          
          // Update email_milestones table with timestamp
          const { error: updateError } = await supabase
            .from('email_milestones')
            .upsert({
              user_id: user.user_id,
              alt_notifications: new Date().toISOString()
            })

          if (updateError) {
            console.error(`❌ Error updating email_milestones for ${user.email}:`, updateError)
          } else {
            console.log(`✅ Email milestone timestamp updated for ${user.email}`)
            emailsSent++
          }
        } else {
          console.error(`❌ Failed to send email to ${user.email}:`, await resendResponse.text())
        }

      } catch (error) {
        console.error(`❌ Error processing user ${user.email}:`, error)
      }
    }

    console.log(`🎉 15-Prompt Milestone Email Function completed. Emails sent: ${emailsSent}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent,
        totalUsersProcessed: usersToEmail.length,
        message: `Successfully sent ${emailsSent} 15-prompt milestone emails`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error in 15-prompt milestone email function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})



