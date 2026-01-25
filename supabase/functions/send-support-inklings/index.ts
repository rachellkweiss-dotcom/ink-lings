import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://inklingsjournal.live',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Stripe
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2025-07-30.basil',
})

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Email configuration
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const FROM_EMAIL = 'Ink-lings <hello@inklingsjournal.live>'

// Constants
const ANNUAL_COST = 675 // $675/year total
const MIN_PROMPTS_FOR_SUPPORT_EMAIL = 30 // Minimum prompts before sending support email
const MIN_DAYS_BETWEEN_OTHER_EMAILS = 10 // Minimum days since other emails for first support email
const DAYS_BETWEEN_SUPPORT_EMAILS = 120 // Days between repeat support emails
const RESEND_RATE_LIMIT_DELAY_MS = 200 // Delay between email sends for rate limiting

// Helper function to add delay for rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // SECURITY: Require secret token for authentication
  // This function MUST have SEND_SUPPORT_CRON_SECRET set in Supabase Dashboard
  const expectedToken = Deno.env.get('SEND_SUPPORT_CRON_SECRET');
  
  if (!expectedToken) {
    console.error('❌ SEND_SUPPORT_CRON_SECRET is not configured');
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
    console.log('=== Support Ink-lings Email Cron Job Started ===')

    // Step 1: Check if we've hit the annual goal ($675)
    console.log('Checking annual donation goal...')
    const donationTotal = await getRollingAnnualDonations()
    console.log(`Current donation total: $${donationTotal}`)

    if (donationTotal >= ANNUAL_COST) {
      console.log(`Goal reached ($${donationTotal} >= $${ANNUAL_COST}). Skipping support emails.`)
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Goal reached ($${donationTotal} >= $${ANNUAL_COST}). No support emails sent.` 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Step 2: Find users with more than 30 prompts
    console.log('Finding eligible users (>30 prompts)...')
    const eligibleUsers = await findEligibleUsers()
    console.log(`Found ${eligibleUsers.length} users with >${MIN_PROMPTS_FOR_SUPPORT_EMAIL} prompts`)

    if (eligibleUsers.length === 0) {
      console.log('No eligible users found')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No eligible users found (need >30 prompts)' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Step 3: Check email milestones and send emails
    let emailsSent = 0
    let emailsSkipped = 0

    for (const user of eligibleUsers) {
      const shouldSendEmail = await checkAndUpdateEmailMilestone(user.user_id)
      
      if (shouldSendEmail) {
        try {
          // Rate limiting: add delay before sending
          if (emailsSent > 0) {
            await delay(RESEND_RATE_LIMIT_DELAY_MS)
          }
          
          await sendSupportEmail(user, donationTotal)
          emailsSent++
          console.log(`✅ Support email sent to user ${user.user_id} (${user.notification_email})`)
        } catch (error) {
          console.error(`❌ Failed to send email to user ${user.user_id}:`, error)
        }
      } else {
        emailsSkipped++
        console.log(`⏭️ Skipped email for user ${user.user_id}`)
      }
    }

    console.log(`=== Support Email Job Complete ===`)
    console.log(`Emails sent: ${emailsSent}`)
    console.log(`Emails skipped: ${emailsSkipped}`)
    console.log(`Donation total: $${donationTotal}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent,
        emailsSkipped,
        donationTotal,
        message: `Support email job completed. Sent: ${emailsSent}, Skipped: ${emailsSkipped}` 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in support email cron job:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

// Get rolling annual donation total (August to August) - Ink-lings only
async function getRollingAnnualDonations(): Promise<number> {
  try {
    const now = new Date()
    const currentYear = now.getFullYear()
    
    // Start date: August 22 of current year (or previous year if we're before August 22)
    let startYear = currentYear
    if (now.getMonth() < 7 || (now.getMonth() === 7 && now.getDate() < 22)) {
      startYear = currentYear - 1
    }
    
    const startDate = new Date(startYear, 7, 22) // Month 7 = August (0-indexed)
    const endDate = new Date(startYear + 1, 7, 22)
    
    // Convert to Unix timestamp for Stripe (seconds since epoch)
    const startTimestamp = Math.floor(startDate.getTime() / 1000)
    const endTimestamp = Math.floor(endDate.getTime() / 1000)
    
    // Get checkout sessions to filter by product (Ink-lings only)
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
      created: {
        gte: startTimestamp,
        lt: endTimestamp
      },
      expand: ['data.line_items']
    })

    let totalDonations = 0
    let inklingsCount = 0

    for (const session of sessions.data) {
      if (session.payment_status !== 'paid') continue
      
      // Check if this is an Ink-lings donation by looking at line items
      const lineItems = session.line_items?.data || []
      const isInklings = lineItems.some(item => {
        const productName = item.description || ''
        return productName.toLowerCase().includes('ink-lings') || 
               productName.toLowerCase().includes('inklings')
      })
      
      // Also check metadata for donationType (Ink-lings donations have this)
      const hasInklingsMetadata = session.metadata?.donationType !== undefined
      
      if (isInklings || hasInklingsMetadata) {
        const amount = (session.amount_total || 0) / 100
        totalDonations += amount
        inklingsCount++
        console.log(`Ink-lings Donation: $${amount}`)
      }
    }

    console.log(`Found ${inklingsCount} Ink-lings donations out of ${sessions.data.length} total sessions`)

    return totalDonations
  } catch (error) {
    console.error('Error getting donation total from Stripe:', error)
    return 0
  }
}

// Find users with more than 30 prompts
async function findEligibleUsers() {
  console.log(`=== FINDING ELIGIBLE USERS ===`)
  console.log(`Looking for users with more than ${MIN_PROMPTS_FOR_SUPPORT_EMAIL} prompts`)
  
  // Get all users with their email addresses
  const { data: allUsers, error: allUsersError } = await supabase
    .from('user_preferences')
    .select(`
      user_id,
      notification_email
    `)

  if (allUsersError) {
    console.error('Error fetching all users:', allUsersError)
    throw allUsersError
  }

  console.log(`Total users in user_preferences: ${allUsers?.length || 0}`)
  
  if (!allUsers || allUsers.length === 0) {
    console.log('No users found in user_preferences table')
    return []
  }

  // For each user, count their prompts from prompt_history
  const eligibleUsers: Array<{ user_id: string; notification_email: string; prompt_count: number }> = []
  
  for (const user of allUsers) {
    const { count, error: countError } = await supabase
      .from('prompt_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.user_id)
    
    if (countError) {
      console.error(`Error counting prompts for user ${user.user_id}:`, countError)
      continue
    }
    
    const promptCount = count || 0
    
    // Only include users with more than 30 prompts
    if (promptCount > MIN_PROMPTS_FOR_SUPPORT_EMAIL) {
      eligibleUsers.push({
        user_id: user.user_id,
        notification_email: user.notification_email,
        prompt_count: promptCount
      })
      console.log(`  ✓ User ${user.user_id} - ${user.notification_email} - ${promptCount} prompts (eligible)`)
    } else {
      console.log(`  ✗ User ${user.user_id} - ${promptCount} prompts (not eligible, need >${MIN_PROMPTS_FOR_SUPPORT_EMAIL})`)
    }
  }

  console.log(`Eligible users: ${eligibleUsers.length}`)
  return eligibleUsers
}

// Check if we should send email and update timestamp if needed
async function checkAndUpdateEmailMilestone(userId: string): Promise<boolean> {
  try {
    console.log(`=== CHECKING EMAIL MILESTONE FOR USER ${userId} ===`)
    
    // Get current email milestone record (including other email types for cooldown check)
    const { data: milestone, error } = await supabase
      .from('email_milestones')
      .select('support_inklings, set_preferences, alt_notifications')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching email milestone:', error)
      return false
    }

    const now = new Date()
    console.log(`Current time: ${now.toISOString()}`)
    
    // CASE 1: First-time support email (no support_inklings timestamp)
    if (!milestone || !milestone.support_inklings) {
      console.log(`No previous support email timestamp found for user ${userId}`)
      
      // Check if any other emails were sent in the last 10 days
      const otherEmailsTooRecent = checkOtherEmailsTooRecent(milestone, now)
      
      if (otherEmailsTooRecent) {
        console.log(`⏭️ Other emails sent within ${MIN_DAYS_BETWEEN_OTHER_EMAILS} days - skipping first support email`)
        return false
      }
      
      console.log(`No recent other emails - will send first support email`)
      
      const { error: updateError } = await supabase
        .from('email_milestones')
        .upsert({
          user_id: userId,
          support_inklings: now.toISOString()
        })
      
      if (updateError) {
        console.error(`Error updating email_milestones for user ${userId}:`, updateError)
        return false
      }
      
      console.log(`✅ Updated email_milestones for user ${userId} with timestamp: ${now.toISOString()}`)
      return true
    }

    // CASE 2: Repeat support email (has support_inklings timestamp)
    const lastSent = new Date(milestone.support_inklings)
    const daysDiff = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60 * 24)
    
    console.log(`Previous support email sent: ${lastSent.toISOString()}`)
    console.log(`Days since last support email: ${Math.round(daysDiff)} (need ${DAYS_BETWEEN_SUPPORT_EMAILS} days)`)

    if (daysDiff >= DAYS_BETWEEN_SUPPORT_EMAILS) {
      console.log(`${Math.round(daysDiff)} days have passed - will send repeat support email`)
      
      const { error: updateError } = await supabase
        .from('email_milestones')
        .upsert({
          user_id: userId,
          support_inklings: now.toISOString()
        })
      
      if (updateError) {
        console.error(`Error updating email_milestones for user ${userId}:`, updateError)
        return false
      }
      
      console.log(`✅ Updated email_milestones for user ${userId} with new timestamp: ${now.toISOString()}`)
      return true
    }

    console.log(`Only ${Math.round(daysDiff)} days since last support email - skipping (need ${DAYS_BETWEEN_SUPPORT_EMAILS} days)`)
    return false
  } catch (error) {
    console.error('Error checking email milestone:', error)
    return false
  }
}

// Check if other email types were sent within the cooldown period
function checkOtherEmailsTooRecent(milestone: any, now: Date): boolean {
  if (!milestone) return false
  
  const emailTypesToCheck = ['set_preferences', 'alt_notifications']
  
  for (const emailType of emailTypesToCheck) {
    const timestamp = milestone[emailType]
    if (timestamp) {
      const sentDate = new Date(timestamp)
      const daysDiff = (now.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24)
      
      if (daysDiff < MIN_DAYS_BETWEEN_OTHER_EMAILS) {
        console.log(`  ${emailType} sent ${Math.round(daysDiff)} days ago (within ${MIN_DAYS_BETWEEN_OTHER_EMAILS} day cooldown)`)
        return true
      }
    }
  }
  
  return false
}

// Send support email to user
async function sendSupportEmail(user: any, donationTotal: number) {
  const progressPercentage = Math.min((donationTotal / ANNUAL_COST) * 100, 100)
  const remainingAmount = Math.max(0, ANNUAL_COST - donationTotal)
  
  // Determine progress bar color
  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 90) return '#10b981' // green-500
    if (percentage >= 80) return '#34d399' // green-400
    if (percentage >= 40) return '#eab308' // yellow-500
    return '#ef4444' // red-500
  }

  const progressBarColor = getProgressBarColor(progressPercentage)

  const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Support Ink-lings</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            max-width: 200px;
            height: auto;
            margin-bottom: 20px;
        }
        h1 {
            color: #1e40af;
            font-size: 28px;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #6b7280;
            font-size: 16px;
            margin-bottom: 30px;
        }
        .content {
            margin-bottom: 30px;
        }
        .cost-breakdown {
            background: #f0f9ff;
            border: 2px solid #0ea5e9;
            border-radius: 8px;
            padding: 20px;
            margin: 20px auto;
            max-width: 400px;
        }
        .cost-title {
            font-size: 18px;
            font-weight: 600;
            color: #0c4a6e;
            margin-bottom: 15px;
            text-align: center;
        }
        .cost-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            padding: 8px 0;
            border-bottom: 1px solid #e0f2fe;
        }
        .cost-item:last-of-type {
            border-bottom: none;
        }
        .cost-label {
            color: #374151;
            text-align: left;
            flex: 1;
        }
        .cost-value {
            font-weight: 600;
            color: #0c4a6e;
            text-align: right;
            flex: 0 0 auto;
        }
        .total-cost {
            border-top: 2px solid #0ea5e9;
            padding-top: 10px;
            margin-top: 10px;
            font-weight: 700;
            font-size: 16px;
        }
        .progress-section {
            margin: 20px 0;
        }
        .progress-text {
            text-align: center;
            margin-bottom: 10px;
            color: #374151;
        }
        .progress-bar-container {
            width: 100%;
            height: 20px;
            background-color: #e5e7eb;
            border-radius: 10px;
            overflow: hidden;
            margin-bottom: 10px;
        }
        .progress-bar {
            height: 100%;
            background-color: ${progressBarColor};
            transition: width 0.3s ease;
            border-radius: 10px;
        }
        .progress-percentage {
            text-align: center;
            font-weight: 600;
            color: ${progressBarColor};
        }
        .remaining-amount {
            background: #fef3c7;
            border: 2px solid #f59e0b;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            margin: 20px 0;
        }
        .remaining-text {
            color: #92400e;
            font-weight: 600;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: #ffffff !important;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 700;
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
            transition: transform 0.2s;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
            box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
        }
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(59, 130, 246, 0.4);
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
        .thank-you {
            background: #f0fdf4;
            border: 2px solid #22c55e;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
        }
        .thank-you-text {
            color: #166534;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://inklingsjournal.live/ink_lings_email_logo.png" alt="Ink-lings Logo" class="logo">
            <h1>Keeping the Ink Flowing</h1>
            <p class="subtitle">A gentle request for support</p>
        </div>

        <div class="content">
            <p>Hi there!</p>
            
            <p>I hope you've been enjoying your journal prompts! I wanted to reach out with a gentle request for support.</p>
            
            <p>Ink-lings is a passion project that I've been running for free, but it does have some costs to keep the site and automation running smoothly. I believe in transparency, so I wanted to share the breakdown with you.</p>

            <div class="cost-breakdown">
                <div class="cost-title">Cost Transparency</div>
                <div class="cost-item">
                    <span class="cost-label">Website Domain:</span>
                    <span class="cost-value">$50</span>
                </div>
                <div class="cost-item">
                    <span class="cost-label">Coding/Debugging:</span>
                    <span class="cost-value">$275</span>
                </div>
                <div class="cost-item">
                    <span class="cost-label">Data Storage:</span>
                    <span class="cost-value">$350</span>
                </div>
                <div class="cost-item">
                    <span class="cost-label">Dev Time Invested:</span>
                    <span class="cost-value">Fueled by Coffee & Tips</span>
                </div>
                <div class="cost-item total-cost">
                    <span class="cost-label">Total Annual Cost:</span>
                    <span class="cost-value">$675</span>
                </div>
            </div>

            <div class="progress-section">
                <div class="progress-text">
                    Community Progress: $${donationTotal.toFixed(0)} of $${ANNUAL_COST} covered
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${progressPercentage}%"></div>
                </div>
                <div class="progress-percentage">
                    ${Math.round(progressPercentage)}% Complete
                </div>
            </div>

            ${remainingAmount > 0 ? `
            <div class="remaining-amount">
                <div class="remaining-text">
                    $${remainingAmount.toFixed(0)} still needed to cover this year's costs
                </div>
            </div>
            ` : `
            <div class="thank-you">
                <div class="thank-you-text">
                    🎉 Amazing! We've reached our goal for this year! Thank you to everyone who contributed!
                </div>
            </div>
            `}

            <p>If you've found value in Ink-lings and would like to help keep it running, any contribution would be incredibly appreciated. Every bit helps!</p>

            <div style="text-align: center;">
                <a href="https://buy.stripe.com/dRm4gAebs6N38Xa0ks24001" class="cta-button">
                    Support Ink-lings
                </a>
            </div>

            <p>No pressure at all - I'm grateful you're part of the Ink-lings community regardless. Thank you for your time and for making journaling a part of your routine!</p>

            <p>With gratitude,<br>
            Rachell<br>
            <em>Founder of Ink-lings</em></p>
        </div>
    </div>
</body>
</html>
  `

  const emailData = {
    from: FROM_EMAIL,
    to: user.notification_email,
    subject: 'A gentle request for support - Keeping Ink-lings running',
    html: emailHtml,
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailData),
  })

  if (!response.ok) {
    const errorData = await response.text()
    throw new Error(`Failed to send email: ${response.status} ${errorData}`)
  }

  return await response.json()
}
