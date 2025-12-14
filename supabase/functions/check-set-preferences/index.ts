import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Set Preferences Email Edge Function starting...')
    
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('Missing RESEND_API_KEY environment variable')
    }

    console.log('📊 Finding users who need set_preferences email...')
    
    // Step 1: Get auth users who don't have user_preferences (never completed onboarding)
    // We need to use a different approach since we can't directly query auth.users
    const { data: allUsers, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      throw new Error(`Error fetching users: ${usersError.message}`)
    }

    console.log(`Found ${allUsers?.users?.length || 0} total auth users`)

    // Get all user_preferences to compare against
    const { data: userPrefs, error: prefsError } = await supabase
      .from('user_preferences')
      .select('user_id')

    if (prefsError) {
      throw new Error(`Error fetching user preferences: ${prefsError.message}`)
    }

    const userPrefsIds = userPrefs?.map(p => p.user_id) || []
    
    // Filter users who don't have user_preferences
    const usersWithoutPrefs = allUsers?.users?.filter(user => 
      !userPrefsIds.includes(user.id)
    ) || []

    console.log(`Found ${usersWithoutPrefs.length} users without preferences`)

    // Step 2: Filter users who signed up more than 2 days ago
    const twoDaysAgo = new Date()
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
    
    const eligibleUsers = usersWithoutPrefs.filter(user => 
      new Date(user.created_at) < twoDaysAgo
    )

    console.log(`Found ${eligibleUsers.length} users who signed up more than 2 days ago`)

    // Step 3: Check email_milestones table to see who already received the email
    const { data: emailMilestones, error: milestonesError } = await supabase
      .from('email_milestones')
      .select('user_id, set_preferences')
      .in('user_id', eligibleUsers.map(u => u.id))

    if (milestonesError) {
      throw new Error(`Error fetching email milestones: ${milestonesError.message}`)
    }

    // Step 4: Filter out users who already received the email
    const usersToEmail = eligibleUsers.filter(user => {
      const milestone = emailMilestones?.find(m => m.user_id === user.id)
      return !milestone || !milestone.set_preferences
    })

    console.log(`Found ${usersToEmail.length} users who need the set_preferences email`)

    let emailsSent = 0

    // Step 5: Send emails to eligible users
    for (const user of usersToEmail) {
      try {
        console.log(`Sending set_preferences email to: ${user.email}`)

        // Add rate limiting - wait 500ms between emails to respect Resend's 2/second limit
        if (emailsSent > 0) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }

        // Email HTML template
        const emailHtml = `
<!doctype html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Don't Forget to Set Your Preferences - Ink-lings</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, div, p, a {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
  <style>/* Force light mode colors */
    body { background:#f8f9fa !important; }
    .bg-page { background:#f8f9fa !important; }
    .card { background:#ffffff !important; border-color:#e9ecef !important; }
    /* Mobile spacing fixes */
    @media only screen and (max-width:600px){
      .container { width:100% !important; }
      .px { padding-left:20px !important; padding-right:20px !important; }
    }</style>
<!-- Preheader (hidden) -->
<div style="display: none; max-height: 0; overflow: hidden; opacity: 0; mso-hide: all;">You're not receiving journal prompts yet because we don't know what you want and when.</div>
<table class="bg-page" style="background: #f8f9fa !important;" role="presentation" width="100%" cellspacing="0" cellpadding="0">
  <tbody>
    <tr>
      <td style="padding: 40px 20px;" align="center"><!-- Logo -->
        <table class="container" style="max-width: 640px;" role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tbody>
            <tr>
              <td style="padding-bottom: 32px;" align="center">
                <img style="display: block; margin: 0 auto; border: 0; outline: none; text-decoration: none;" src="https://inklingsjournal.live/ink_lings_email_logo.png" alt="Ink‑lings" width="160" height="auto">
              </td>
            </tr>
          </tbody>
        </table>
<!-- Main Message -->
        <table class="container card" style="max-width: 640px; background: #ffffff !important; border: 1px solid #e9ecef !important; border-radius: 8px; box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1); margin-bottom: 24px;" role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tbody>
            <tr>
              <td class="px" style="padding: 32px;">
                <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b !important; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">Hey there!</p>
                <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #475569 !important; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">You're not receiving journal prompts yet because we don't know what you want and when.</p>
                <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #475569 !important; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">Keep in mind, these prompts don't have to be just for journaling, it could be talking points with the people in your life too! Ink-lings doesn't have to apply to just ink.
                  <br>
                  <br>Ready to start your journaling journey?
                  <br>
                  <br>Set your preferences and get your first prompt!
                </p>
<!-- Call to Action Button -->
                <div style="text-align: center; margin: 32px 0;">
                  <a href="https://inklingsjournal.live/" style="background: #007bff !important; color: #ffffff !important; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; font-weight: 600; display: inline-block;">Set Your Preferences</a>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
<!-- Pen Recommendation -->
        <table class="container card" style="max-width: 640px; background: #ffffff !important; border: 1px solid #e9ecef !important; border-radius: 8px; box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1); margin-bottom: 24px;" role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tbody>
            <tr>
              <td class="px" style="padding: 32px;">
                <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b !important; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                  <strong>But if you're going to write, you should use these pens - they rock!</strong>
                </p>
<!-- BIC Pen Recommendation -->
                <div style="margin-bottom: 20px; padding: 16px; background: #f8f9fa; border-radius: 8px;">
                  <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b !important; font-size: 14px; font-weight: 600; margin: 0 0 8px;">✒️ My Favorite Pens:</p>
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <img style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px;" src="https://inklingsjournal.live/bic_pen.png" alt="BIC Round Stic Pens">
                    <div>
                      <a href="https://amzn.to/3K37fqv" style="color: #007bff !important; text-decoration: none; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 500;">BIC Round Stic Xtra Life Pens</a>
                      <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #64748b !important; font-size: 12px; margin: 4px 0 0 0;">Ultra long-lasting, smooth writing</p>
                    </div>
                  </div>
                </div>
                <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #64748b !important; font-size: 12px; line-height: 1.5; margin: 0; font-style: italic;">
                  <strong>Note:</strong> This is a commission-based affiliate link. If you make a purchase, I may earn a small commission at no extra cost to you.
                </p>
              </td>
            </tr>
          </tbody>
        </table>
<!-- Footer -->
        <table class="container card" style="max-width: 640px; background: #ffffff !important; border: 1px solid #e9ecef !important; border-radius: 8px; box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1);" role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tbody>
            <tr>
              <td class="px" style="padding: 32px;">
                <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #64748b !important; font-size: 14px; line-height: 1.5; margin: 0; text-align: center;">Rachell
                  <br>
                  <span style="color: #007bff !important;">Founder of Ink-lings</span>
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
  </tbody>
</table>
        `

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
            subject: "Don't Forget to Set Your Preferences",
            html: emailHtml,
          })
        })

        if (resendResponse.ok) {
          console.log(`✅ Email sent successfully to ${user.email}`)
          
          // Update email_milestones table with timestamp
          const { error: updateError } = await supabase
            .from('email_milestones')
            .upsert({
              user_id: user.id,
              set_preferences: new Date().toISOString()
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

    console.log(`🎉 Set Preferences Email Function completed. Emails sent: ${emailsSent}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent,
        totalUsersProcessed: usersToEmail.length,
        message: `Successfully sent ${emailsSent} set_preferences emails`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Set Preferences Email Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
