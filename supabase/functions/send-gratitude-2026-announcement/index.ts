import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Edge function to send 2026 Gratitude Challenge announcement emails
 * 
 * This function:
 * 1. Finds all users with user_preferences (current users)
 * 2. Generates a unique token for each user
 * 3. Stores token and expiration in user_preferences
 * 4. Sends personalized email with enrollment button
 * 
 * Usage:
 * - Call via HTTP POST with secret in header
 * - Optional: Pass test=true to only send to first user
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Note: Authentication removed for one-time use - function will be deleted after use

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!

    if (!supabaseUrl || !supabaseServiceRoleKey || !resendApiKey) {
      console.error('Missing required environment variables')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Check query parameters
    const url = new URL(req.url)
    const isTest = url.searchParams.get('test') === 'true'
    const userId = url.searchParams.get('user_id') // Optional: send to specific user

    console.log(`📧 Starting gratitude announcement email send (test: ${isTest}, user_id: ${userId || 'all'})`)

    // Step 1: Get users with user_preferences
    let query = supabase
      .from('user_preferences')
      .select(`
        user_id,
        notification_email,
        timezone,
        gratitude_2026_token
      `)
      .not('notification_email', 'is', null)

    // If specific user_id provided, filter to that user (ignore token check for testing)
    if (userId) {
      query = query.eq('user_id', userId)
      console.log(`📧 Targeting specific user: ${userId}`)
    } else {
      // Otherwise, only users who haven't received email yet
      query = query.is('gratitude_2026_token', null)
    }

    const { data: users, error: usersError } = await query

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch users', details: usersError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!users || users.length === 0) {
      console.log('No users found to email')
      return new Response(
        JSON.stringify({ message: 'No users found to email', sent: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Limit to first user if test mode (and no specific user_id)
    const usersToEmail = (isTest && !userId) ? users.slice(0, 1) : users
    console.log(`📧 Sending to ${usersToEmail.length} user(s)`)

    // Step 2: Generate tokens and send emails
    let emailsSent = 0
    let errors = 0

    for (const user of usersToEmail) {
      try {
        // Generate unique token
        const token = crypto.randomUUID()
        
        // Set expiration to 30 days from now
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 30)
        const expiresAtISO = expiresAt.toISOString()

        // Update user_preferences with token and expiration
        const { error: updateError } = await supabase
          .from('user_preferences')
          .update({
            gratitude_2026_token: token,
            gratitude_2026_expires: expiresAtISO
          })
          .eq('user_id', user.user_id)

        if (updateError) {
          console.error(`Failed to update token for user ${user.user_id}:`, updateError)
          errors++
          continue
        }

        // Build enrollment URL
        const enrollmentUrl = `https://www.inklingsjournal.live/api/gratitude-challenge/enroll-email?token=${token}`

        // Email HTML template (embedded)
        const emailHtml = `<!doctype html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Join the 2026 Gratitude Challenge - Ink-lings</title>
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
    Join us for the 2026 Gratitude Challenge - daily prompts to help you reflect on what brings joy to your life.
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
                I'm excited to introduce the <strong>2026 Gratitude Challenge</strong> - a year-long journey of daily gratitude prompts designed to help you reflect on the moments, people, and experiences that bring joy to your life.
              </p>
              <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#475569 !important; font-size:16px; line-height:1.6; margin:0 0 24px;">
                Starting January 1st, 2026, you'll receive a daily gratitude prompt every day separate from your normal ink-lings schedule. Each prompt is carefully crafted to help you cultivate a deeper sense of appreciation and mindfulness throughout the year.
              </p>
              
              <!-- Call to Action Button -->
              <div style="text-align:center; margin:32px 0;">
                <a href="${enrollmentUrl}" style="background:#f97316 !important; color:#ffffff !important; text-decoration:none; padding:16px 32px; border-radius:8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:16px; font-weight:600; display:inline-block;">
                  Join the 2026 Gratitude Challenge
                </a>
              </div>
              
              <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#64748b !important; font-size:14px; line-height:1.5; margin:24px 0 0;">
                Just click the button above to enroll - it only takes a second! You can opt out anytime from your account settings.
              </p>
            </td>
          </tr>
        </table>

        <!-- What to Expect Section -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px; background:#ffffff !important; border:1px solid #e9ecef !important; border-radius:8px; box-shadow:0 1px 3px 0 rgba(0,0,0,0.1); margin-bottom:24px;" class="container card">
          <tr>
            <td class="px" style="padding:32px;">
              <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#1e293b !important; font-size:16px; font-weight:600; margin:0 0 16px;">
                What to Expect:
              </p>
              <ul style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#475569 !important; font-size:14px; line-height:1.8; margin:0; padding-left:20px;">
                <li style="margin-bottom:8px;">📅 <strong>365 daily prompts</strong> - one for each day of 2026</li>
                <li style="margin-bottom:8px;">💭 <strong>Thoughtful prompts</strong> - designed to help you reflect and appreciate</li>
                <li style="margin-bottom:8px;">🔄 <strong>Easy to manage</strong> - pause or opt out anytime from your account</li>
              </ul>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px; background:#ffffff !important; border:1px solid #e9ecef !important; border-radius:8px; box-shadow:0 1px 3px 0 rgba(0,0,0,0.1);" class="container card">
          <tr>
            <td class="px" style="padding:32px;">
              <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#64748b !important; font-size:14px; line-height:1.5; margin:0; text-align:center;">
                Looking forward to sharing this gratitude journey with you!<br><br>
                Rachell<br>
                <span style="color:#f97316 !important;">Founder of Ink-lings</span>
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
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Ink-lings <support@inklingsjournal.live>',
            to: user.notification_email,
            subject: 'Join the 2026 Gratitude Challenge',
            html: emailHtml
          })
        })

        if (!resendResponse.ok) {
          const errorData = await resendResponse.text()
          console.error(`Failed to send email to ${user.notification_email}:`, errorData)
          errors++
          
          // Rollback token if email failed
          await supabase
            .from('user_preferences')
            .update({
              gratitude_2026_token: null,
              gratitude_2026_expires: null
            })
            .eq('user_id', user.user_id)
          
          continue
        }

        emailsSent++
        console.log(`✅ Sent email to ${user.notification_email}`)

        // Rate limiting: Resend API allows 2 requests per second
        // Wait 500ms between emails
        if (emailsSent < usersToEmail.length) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }

      } catch (error) {
        console.error(`Error processing user ${user.user_id}:`, error)
        errors++
      }
    }

    console.log(`📧 Email send complete: ${emailsSent} sent, ${errors} errors`)

    return new Response(
      JSON.stringify({
        success: true,
        sent: emailsSent,
        errors: errors,
        total: usersToEmail.length
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

