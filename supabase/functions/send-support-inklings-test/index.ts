import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
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

// Constants
const ANNUAL_COST = 675 // $675/year total
const SUPPORT_MILESTONES = [30, 80, 130, 200] // Prompt counts that trigger support emails
const MIN_DAYS_BETWEEN_EMAILS = 10 // Minimum days between support emails

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== Support Ink-lings Email Cron Job Started (TEST MODE - NO EMAILS SENT) ===')

    // Step 1: Check if we've hit the annual goal ($675)
    console.log('Checking annual donation goal...')
    const donationTotal = await getRollingAnnualDonations()
    console.log(`Current donation total: $${donationTotal}`)

    if (donationTotal >= ANNUAL_COST) {
      console.log(`Goal reached ($${donationTotal} >= $${ANNUAL_COST}). Skipping support emails.`)
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Goal reached ($${donationTotal} >= $${ANNUAL_COST}). No support emails sent.`,
          testMode: true
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Step 2: Find users who have reached support milestones
    console.log('Finding users at support milestones...')
    const milestoneUsers = await findUsersAtMilestones()
    console.log(`Found ${milestoneUsers.length} users at milestones`)

    if (milestoneUsers.length === 0) {
      console.log('No users found at support milestones')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No users found at support milestones',
          testMode: true
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Step 3: Check email milestones and simulate email sending
    let emailsWouldBeSent = 0
    let emailsWouldBeSkipped = 0
    const emailDetails = []

    for (const user of milestoneUsers) {
      const shouldSendEmail = await checkAndUpdateEmailMilestone(user.user_id)
      
      if (shouldSendEmail) {
        // SIMULATE EMAIL SENDING - NO ACTUAL EMAIL SENT
        console.log(`[TEST MODE] Would send support email to user ${user.user_id} (${user.notification_email})`)
        console.log(`[TEST MODE] Email would include: donation total $${donationTotal}, progress ${Math.round((donationTotal / ANNUAL_COST) * 100)}%`)
        
        emailsWouldBeSent++
        emailDetails.push({
          userId: user.user_id,
          email: user.notification_email,
          promptCount: user.total_prompts_sent_count,
          action: 'WOULD_SEND'
        })
      } else {
        emailsWouldBeSkipped++
        console.log(`[TEST MODE] Would skip email for user ${user.user_id} (recently sent)`)
        emailDetails.push({
          userId: user.user_id,
          email: user.notification_email,
          promptCount: user.total_prompts_sent_count,
          action: 'WOULD_SKIP'
        })
      }
    }

    console.log(`=== Support Email Job Complete (TEST MODE) ===`)
    console.log(`Emails that would be sent: ${emailsWouldBeSent}`)
    console.log(`Emails that would be skipped: ${emailsWouldBeSkipped}`)
    console.log(`Donation total: $${donationTotal}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsWouldBeSent,
        emailsWouldBeSkipped,
        donationTotal,
        emailDetails,
        testMode: true,
        message: `Support email job completed (TEST MODE). Would send: ${emailsWouldBeSent}, Would skip: ${emailsWouldBeSkipped}` 
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
        error: error.message,
        testMode: true
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

// Get rolling annual donation total (August to August)
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
    
    // Get payments only within the rolling annual period
    const payments = await stripe.paymentIntents.list({
      limit: 100, // Get up to 100 payments
      created: {
        gte: startTimestamp,
        lt: endTimestamp
      }
    })

    // Debug: Log all payments first
    console.log(`=== DEBUGGING ALL PAYMENTS ===`)
    payments.data.forEach((payment, index) => {
      console.log(`Payment ${index + 1}:`)
      console.log(`  - Status: ${payment.status}`)
      console.log(`  - Amount: $${payment.amount / 100}`)
      console.log(`  - Description: "${payment.description}"`)
      console.log(`  - Metadata:`, payment.metadata)
      console.log(`  - Created: ${new Date(payment.created * 1000).toISOString()}`)
      console.log(`  - ID: ${payment.id}`)
    })

    // Filter for successful payments that are donations
    const donationPayments = payments.data.filter(payment => {
      // Must be successful
      if (payment.status !== 'succeeded') {
        console.log(`Skipping payment ${payment.id} - not succeeded (${payment.status})`)
        return false
      }
      
      // Check if it's a donation by looking at metadata
      const metadata = payment.metadata || {}
      const donationType = metadata.donationType
      
      // Count donations from:
      // 1. App donations (TIP_JAR and COFFEE_JOURNALING)
      // 2. Direct Stripe payment link donations
      const isAppDonation = donationType === 'TIP_JAR' || donationType === 'COFFEE_JOURNALING'
      
      // Check if it's from the direct Stripe payment link
      // This link: https://buy.stripe.com/dRm4gAebs6N38Xa0ks24001
      // Since description is null, we'll include all successful payments that aren't app donations
      // as they're likely from the direct Stripe link
      const isDirectLinkDonation = !isAppDonation && payment.status === 'succeeded'
      
      console.log(`Payment ${payment.id}:`)
      console.log(`  - isAppDonation: ${isAppDonation} (donationType: ${donationType})`)
      console.log(`  - isDirectLinkDonation: ${isDirectLinkDonation} (description: "${payment.description}")`)
      console.log(`  - Will include: ${isAppDonation || isDirectLinkDonation}`)
      
      return isAppDonation || isDirectLinkDonation
    })

    console.log(`Found ${donationPayments.length} donation payments out of ${payments.data.length} total payments`)

    // Calculate total amount from donation payments within the period
    let totalDonations = 0
    
    donationPayments.forEach(payment => {
      // Convert from cents to dollars and add to total
      totalDonations += payment.amount / 100
      
      // Determine donation type for logging
      const metadata = payment.metadata || {}
      const donationType = metadata.donationType
      let donationSource = 'Unknown'
      
      if (donationType === 'TIP_JAR') {
        donationSource = 'App Tip Jar'
      } else if (donationType === 'COFFEE_JOURNALING') {
        donationSource = 'App Coffee + Journal'
      } else if (payment.description?.includes('Ink-lings') || 
                 payment.description?.includes('support') ||
                 payment.description?.includes('donation')) {
        donationSource = 'Direct Stripe Link'
      }
      
      console.log(`Donation: $${payment.amount / 100} (${donationSource})`)
    })

    return totalDonations
  } catch (error) {
    console.error('Error getting donation total from Stripe:', error)
    return 0
  }
}

// Find users who have reached support milestones
async function findUsersAtMilestones() {
  console.log(`=== DEBUGGING USER PREFERENCES ===`)
  console.log(`Looking for users with prompt counts: ${SUPPORT_MILESTONES.join(', ')}`)
  
  // First, let's see ALL users and their prompt counts
  const { data: allUsers, error: allUsersError } = await supabase
    .from('user_preferences')
    .select(`
      user_id,
      notification_email,
      total_prompts_sent_count
    `)

  if (allUsersError) {
    console.error('Error fetching all users:', allUsersError)
    throw allUsersError
  }

  console.log(`Total users in user_preferences: ${allUsers?.length || 0}`)
  
  if (allUsers && allUsers.length > 0) {
    console.log('All users and their prompt counts:')
    allUsers.forEach((user, index) => {
      console.log(`  User ${index + 1}: ${user.user_id} - ${user.notification_email} - ${user.total_prompts_sent_count} prompts`)
    })
  } else {
    console.log('No users found in user_preferences table')
  }

  // Now get only milestone users
  const { data: users, error } = await supabase
    .from('user_preferences')
    .select(`
      user_id,
      notification_email,
      total_prompts_sent_count
    `)
    .in('total_prompts_sent_count', SUPPORT_MILESTONES)

  if (error) {
    console.error('Error fetching milestone users:', error)
    throw error
  }

  console.log(`Users at milestones: ${users?.length || 0}`)
  return users || []
}

// Check if we should send email and update timestamp if needed
async function checkAndUpdateEmailMilestone(userId: string): Promise<boolean> {
  try {
    console.log(`=== CHECKING EMAIL MILESTONE FOR USER ${userId} ===`)
    
    // Get current email milestone record
    const { data: milestone, error } = await supabase
      .from('email_milestones')
      .select('support_inklings')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching email milestone:', error)
      return false
    }

    const now = new Date()
    console.log(`Current time: ${now.toISOString()}`)
    
    // If no timestamp exists, send email and record timestamp
    if (!milestone || !milestone.support_inklings) {
      console.log(`[TEST MODE] No previous support email timestamp found for user ${userId}`)
      console.log(`[TEST MODE] Will update email_milestones with current timestamp`)
      
      // TEST MODE: Actually update the database to test the logic
      const { error: updateError } = await supabase
        .from('email_milestones')
        .upsert({
          user_id: userId,
          support_inklings: now.toISOString()
        })
      
      if (updateError) {
        console.error(`[TEST MODE] Error updating email_milestones for user ${userId}:`, updateError)
        return false
      }
      
      console.log(`[TEST MODE] Successfully updated email_milestones for user ${userId} with timestamp: ${now.toISOString()}`)
      return true
    }

    // Check if more than 10 days have passed
    const lastSent = new Date(milestone.support_inklings)
    const daysDiff = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60 * 24)
    
    console.log(`Previous support email sent: ${lastSent.toISOString()}`)
    console.log(`Days since last email: ${Math.round(daysDiff)} (minimum: ${MIN_DAYS_BETWEEN_EMAILS})`)

    if (daysDiff >= MIN_DAYS_BETWEEN_EMAILS) {
      console.log(`[TEST MODE] ${Math.round(daysDiff)} days have passed since last email - will update timestamp`)
      
      // TEST MODE: Actually update the database to test the logic
      const { error: updateError } = await supabase
        .from('email_milestones')
        .upsert({
          user_id: userId,
          support_inklings: now.toISOString()
        })
      
      if (updateError) {
        console.error(`[TEST MODE] Error updating email_milestones for user ${userId}:`, updateError)
        return false
      }
      
      console.log(`[TEST MODE] Successfully updated email_milestones for user ${userId} with new timestamp: ${now.toISOString()}`)
      return true
    }

    console.log(`[TEST MODE] Only ${Math.round(daysDiff)} days since last email - will skip (minimum ${MIN_DAYS_BETWEEN_EMAILS} days required)`)
    return false
  } catch (error) {
    console.error('Error checking email milestone:', error)
    return false
  }
}
