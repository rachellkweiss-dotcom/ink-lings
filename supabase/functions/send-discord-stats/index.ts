import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://inklingsjournal.live',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Discord configuration
const DISCORD_WEBHOOK_URL = Deno.env.get('DISCORD_STATS_WEBHOOK_URL') || 
  'https://discord.com/api/webhooks/1469761179575648276/-sRG_2VDD3meqAJk5yz0Sm5vbH4BtJekOD4GONzFbF_e8QYxWjTgiJu4Vr_5Z-zyKF7q'
const DISCORD_USER_IDS = ['1467371986056511622', '1014222908463255652']

// GA configuration
const GA_SERVICE_ACCOUNT_EMAIL = Deno.env.get('GA_SERVICE_ACCOUNT_EMAIL')
const GA_PRIVATE_KEY = Deno.env.get('GA_PRIVATE_KEY')
const GA_PROPERTY_ID = Deno.env.get('GA_PROPERTY_ID')

// Instagram configuration
const INSTAGRAM_ACCESS_TOKEN = Deno.env.get('INSTAGRAM_ACCESS_TOKEN')
const INSTAGRAM_USER_ID = Deno.env.get('INSTAGRAM_USER_ID')
const INSTAGRAM_APP_SECRET = Deno.env.get('INSTAGRAM_APP_SECRET')

// ============================================================
// Types
// ============================================================

interface AppStats {
  newUsers: number
  totalUsers: number
  usersReceivingPrompts: number
  gratitudeChallengeEnrolled: number
  promptsSent: number
  positiveReactions: number
  negativeReactions: number
}

interface GAStats {
  activeUsers: number
  sessions: number
  pageViews: number
  uniqueVisitors: number
  topReferrers: Array<{ source: string; sessions: number }>
}

interface IGStats {
  followerCount: number
  followsCount: number
  mediaCount: number
  recentPosts: Array<{
    caption: string
    likeCount: number
    commentsCount: number
    timestamp: string
    mediaType: string
  }>
  tokenExpiresIn: number | null // days until token expires
  tokenRefreshed: boolean
}

// ============================================================
// Google Analytics Data API helpers
// ============================================================

function base64url(data: string): string {
  return btoa(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function base64urlFromBytes(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function getGoogleAccessToken(): Promise<string> {
  if (!GA_SERVICE_ACCOUNT_EMAIL || !GA_PRIVATE_KEY) {
    throw new Error('GA credentials not configured')
  }

  const now = Math.floor(Date.now() / 1000)

  const header = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss: GA_SERVICE_ACCOUNT_EMAIL,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }

  const b64Header = base64url(JSON.stringify(header))
  const b64Payload = base64url(JSON.stringify(payload))
  const signatureInput = `${b64Header}.${b64Payload}`

  // Import the RSA private key
  const pemContents = GA_PRIVATE_KEY
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\\n/g, '')
    .replace(/\n/g, '')
    .trim()

  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))

  const key = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signatureInput)
  )

  const b64Signature = base64urlFromBytes(new Uint8Array(signature))
  const jwt = `${signatureInput}.${b64Signature}`

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  })

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text()
    throw new Error(`Failed to get Google access token: ${tokenResponse.status} ${errorText}`)
  }

  const tokenData = await tokenResponse.json()
  return tokenData.access_token
}

async function fetchGAStats(): Promise<GAStats | null> {
  if (!GA_SERVICE_ACCOUNT_EMAIL || !GA_PRIVATE_KEY || !GA_PROPERTY_ID) {
    console.log('⚠️ GA credentials not configured — skipping website analytics')
    return null
  }

  try {
    const accessToken = await getGoogleAccessToken()

    // Fetch core metrics
    const metricsResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${GA_PROPERTY_ID}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: '3daysAgo', endDate: 'today' }],
          metrics: [
            { name: 'activeUsers' },
            { name: 'sessions' },
            { name: 'screenPageViews' },
            { name: 'totalUsers' },
          ],
        }),
      }
    )

    if (!metricsResponse.ok) {
      const errorText = await metricsResponse.text()
      throw new Error(`GA metrics request failed: ${metricsResponse.status} ${errorText}`)
    }

    const metricsData = await metricsResponse.json()
    const metricValues = metricsData.rows?.[0]?.metricValues || []

    // Fetch top referrers
    const referrersResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${GA_PROPERTY_ID}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: '3daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'sessionSource' }],
          metrics: [{ name: 'sessions' }],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: 5,
        }),
      }
    )

    if (!referrersResponse.ok) {
      const errorText = await referrersResponse.text()
      throw new Error(`GA referrers request failed: ${referrersResponse.status} ${errorText}`)
    }

    const referrersData = await referrersResponse.json()
    const topReferrers = (referrersData.rows || []).map((row: any) => ({
      source: row.dimensionValues?.[0]?.value || 'unknown',
      sessions: parseInt(row.metricValues?.[0]?.value || '0', 10),
    }))

    return {
      activeUsers: parseInt(metricValues[0]?.value || '0', 10),
      sessions: parseInt(metricValues[1]?.value || '0', 10),
      pageViews: parseInt(metricValues[2]?.value || '0', 10),
      uniqueVisitors: parseInt(metricValues[3]?.value || '0', 10),
      topReferrers,
    }
  } catch (error) {
    console.error('❌ Error fetching GA stats:', error)
    return null
  }
}

// ============================================================
// Instagram Graph API helpers
// ============================================================

async function refreshInstagramToken(currentToken: string): Promise<{ token: string; expiresIn: number } | null> {
  try {
    const response = await fetch(
      `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${currentToken}`
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Instagram token refresh failed: ${response.status} ${errorText}`)
      return null
    }

    const data = await response.json()
    return {
      token: data.access_token,
      expiresIn: data.expires_in, // seconds
    }
  } catch (error) {
    console.error('❌ Error refreshing Instagram token:', error)
    return null
  }
}

async function fetchInstagramStats(): Promise<IGStats | null> {
  if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_USER_ID) {
    console.log('⚠️ Instagram credentials not configured — skipping Instagram analytics')
    return null
  }

  try {
    let currentToken = INSTAGRAM_ACCESS_TOKEN
    let tokenRefreshed = false
    let tokenExpiresIn: number | null = null

    // Try to refresh the token proactively (keeps it alive for another 60 days)
    // Only works if token is at least 24 hours old and not yet expired
    const refreshResult = await refreshInstagramToken(currentToken)
    if (refreshResult) {
      currentToken = refreshResult.token
      tokenExpiresIn = Math.floor(refreshResult.expiresIn / 86400) // convert seconds to days
      tokenRefreshed = true
      console.log(`✅ Instagram token refreshed — expires in ${tokenExpiresIn} days`)

      // Update the token in Supabase secrets for next run
      // Note: This won't update the Deno env var, but the new token is used for this run.
      // The token needs to be manually updated in Supabase secrets if refresh succeeds.
      // We'll log it so you know to update if needed.
      console.log('ℹ️ If using Supabase secrets, update INSTAGRAM_ACCESS_TOKEN with the refreshed token.')
    }

    // Fetch account info (follower count, follows count, media count)
    const accountResponse = await fetch(
      `https://graph.instagram.com/v22.0/${INSTAGRAM_USER_ID}?fields=followers_count,follows_count,media_count&access_token=${currentToken}`
    )

    if (!accountResponse.ok) {
      const errorText = await accountResponse.text()
      throw new Error(`Instagram account request failed: ${accountResponse.status} ${errorText}`)
    }

    const accountData = await accountResponse.json()

    // Fetch recent media (last 6 posts) with engagement metrics
    const mediaResponse = await fetch(
      `https://graph.instagram.com/v22.0/${INSTAGRAM_USER_ID}/media?fields=caption,like_count,comments_count,timestamp,media_type&limit=6&access_token=${currentToken}`
    )

    let recentPosts: IGStats['recentPosts'] = []

    if (mediaResponse.ok) {
      const mediaData = await mediaResponse.json()
      recentPosts = (mediaData.data || []).map((post: any) => ({
        caption: post.caption ? post.caption.substring(0, 80) + (post.caption.length > 80 ? '...' : '') : '(no caption)',
        likeCount: post.like_count || 0,
        commentsCount: post.comments_count || 0,
        timestamp: post.timestamp,
        mediaType: post.media_type || 'UNKNOWN',
      }))
    } else {
      console.warn('⚠️ Could not fetch Instagram media, continuing with account stats only')
    }

    return {
      followerCount: accountData.followers_count || 0,
      followsCount: accountData.follows_count || 0,
      mediaCount: accountData.media_count || 0,
      recentPosts,
      tokenExpiresIn,
      tokenRefreshed,
    }
  } catch (error) {
    console.error('❌ Error fetching Instagram stats:', error)
    return null
  }
}

// ============================================================
// Supabase queries
// ============================================================

async function fetchAppStats(): Promise<AppStats> {
  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
  const threeDaysAgoISO = threeDaysAgo.toISOString()

  // Run all queries in parallel
  const [
    newUsersResult,
    totalUsersResult,
    receivingPromptsResult,
    gratitudeResult,
    promptsSentResult,
    positiveReactionsResult,
    negativeReactionsResult,
  ] = await Promise.all([
    // New users in last 3 days
    supabase
      .from('user_preferences')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', threeDaysAgoISO),

    // Total users
    supabase
      .from('user_preferences')
      .select('*', { count: 'exact', head: true }),

    // Users receiving prompts (have notification days and time set)
    supabase
      .from('user_preferences')
      .select('*', { count: 'exact', head: true })
      .neq('notification_days', '{}')
      .not('notification_time', 'is', null),

    // Gratitude challenge enrolled
    supabase
      .from('gratitude_2026_participants')
      .select('*', { count: 'exact', head: true })
      .eq('active', true),

    // Prompts sent in last 3 days
    supabase
      .from('prompt_history')
      .select('*', { count: 'exact', head: true })
      .gte('sent_at', threeDaysAgoISO),

    // Positive reactions in last 3 days
    supabase
      .from('feedback_tokens')
      .select('*', { count: 'exact', head: true })
      .eq('feedback_type', 'up')
      .gte('created_at', threeDaysAgoISO),

    // Negative reactions in last 3 days
    supabase
      .from('feedback_tokens')
      .select('*', { count: 'exact', head: true })
      .eq('feedback_type', 'down')
      .gte('created_at', threeDaysAgoISO),
  ])

  return {
    newUsers: newUsersResult.count || 0,
    totalUsers: totalUsersResult.count || 0,
    usersReceivingPrompts: receivingPromptsResult.count || 0,
    gratitudeChallengeEnrolled: gratitudeResult.count || 0,
    promptsSent: promptsSentResult.count || 0,
    positiveReactions: positiveReactionsResult.count || 0,
    negativeReactions: negativeReactionsResult.count || 0,
  }
}

// ============================================================
// Discord webhook
// ============================================================

function buildDiscordEmbed(appStats: AppStats, gaStats: GAStats | null, igStats: IGStats | null) {
  const userMentions = DISCORD_USER_IDS.map(id => `<@${id}>`).join(' ')

  const fields = [
    {
      name: '👥 Users',
      value: [
        `• New Users (Last 3 Days): **${appStats.newUsers}**`,
        `• Total Users: **${appStats.totalUsers}**`,
        `• Receiving Prompts: **${appStats.usersReceivingPrompts}**`,
        `• 2026 Gratitude Challenge: **${appStats.gratitudeChallengeEnrolled}**`,
      ].join('\n'),
      inline: false,
    },
    {
      name: '📝 Prompts (Last 3 Days)',
      value: [
        `• Sent: **${appStats.promptsSent}**`,
        `• 👍 Positive Reactions: **${appStats.positiveReactions}**`,
        `• 👎 Negative Reactions: **${appStats.negativeReactions}**`,
      ].join('\n'),
      inline: false,
    },
  ]

  if (gaStats) {
    const referrersText = gaStats.topReferrers.length > 0
      ? gaStats.topReferrers.map(r => `${r.source} (${r.sessions})`).join(', ')
      : 'No referrer data'

    fields.push({
      name: '🌐 Website Analytics (Last 3 Days)',
      value: [
        `• Active Users: **${gaStats.activeUsers}**`,
        `• Sessions: **${gaStats.sessions}**`,
        `• Page Views: **${gaStats.pageViews}**`,
        `• 👥 Unique Visitors: **${gaStats.uniqueVisitors}**`,
        `• 🔗 Top Referrers: ${referrersText}`,
      ].join('\n'),
      inline: false,
    })
  } else {
    fields.push({
      name: '🌐 Website Analytics (Last 3 Days)',
      value: '_GA credentials not configured — set GA_SERVICE_ACCOUNT_EMAIL, GA_PRIVATE_KEY, and GA_PROPERTY_ID secrets to enable._',
      inline: false,
    })
  }

  // Instagram stats section
  if (igStats) {
    const igLines = [
      `• Followers: **${igStats.followerCount}**`,
      `• Following: **${igStats.followsCount}**`,
      `• Total Posts: **${igStats.mediaCount}**`,
    ]

    if (igStats.tokenRefreshed && igStats.tokenExpiresIn !== null) {
      igLines.push(`• 🔑 Token: Refreshed (expires in ${igStats.tokenExpiresIn} days)`)
    }

    fields.push({
      name: '📸 Instagram (@ink_lings_journal)',
      value: igLines.join('\n'),
      inline: false,
    })

    // Add recent posts performance if available
    if (igStats.recentPosts.length > 0) {
      const postLines = igStats.recentPosts.slice(0, 5).map((post, i) => {
        const date = new Date(post.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        return `${i + 1}. ${date} — ❤️ ${post.likeCount} 💬 ${post.commentsCount} — _${post.caption}_`
      })

      fields.push({
        name: '📱 Recent Posts Performance',
        value: postLines.join('\n'),
        inline: false,
      })
    }
  } else {
    fields.push({
      name: '📸 Instagram',
      value: '_Instagram credentials not configured — set INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_USER_ID secrets to enable._',
      inline: false,
    })
  }

  return {
    content: userMentions,
    embeds: [
      {
        title: '📊 Ink-lings Stats Report',
        color: 0x3b82f6, // blue
        fields,
        footer: {
          text: 'Ink-lings Stats Bot • Reports every 3 days',
        },
        timestamp: new Date().toISOString(),
      },
    ],
  }
}

async function sendToDiscord(appStats: AppStats, gaStats: GAStats | null, igStats: IGStats | null): Promise<void> {
  const payload = buildDiscordEmbed(appStats, gaStats, igStats)

  const response = await fetch(DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Discord webhook failed: ${response.status} ${errorText}`)
  }

  console.log('✅ Stats sent to Discord successfully')
}

// ============================================================
// Main handler
// ============================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // SECURITY: Require secret token for authentication
  const expectedToken = Deno.env.get('DISCORD_STATS_CRON_SECRET')

  if (!expectedToken) {
    console.error('❌ DISCORD_STATS_CRON_SECRET is not configured')
    return new Response(JSON.stringify({
      success: false,
      error: 'Server configuration error',
      message: 'This function requires authentication but no secret is configured',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }

  const providedToken = req.headers.get('x-cron-secret') || 
    req.headers.get('authorization')?.replace('Bearer ', '')

  if (!providedToken || providedToken !== expectedToken) {
    console.warn('❌ Unauthorized access attempt — invalid or missing secret token')
    return new Response(JSON.stringify({
      success: false,
      error: 'Unauthorized',
      message: 'Valid secret token required',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 401,
    })
  }

  console.log('✅ Function accessed — secret token validated')

  try {
    console.log('=== Discord Stats Report Started ===')

    // Fetch app stats, GA stats, and Instagram stats in parallel
    const [appStats, gaStats, igStats] = await Promise.all([
      fetchAppStats(),
      fetchGAStats(),
      fetchInstagramStats(),
    ])

    console.log('App stats:', JSON.stringify(appStats))
    console.log('GA stats:', gaStats ? JSON.stringify(gaStats) : 'not available')
    console.log('IG stats:', igStats ? JSON.stringify(igStats) : 'not available')

    // Send to Discord
    await sendToDiscord(appStats, gaStats, igStats)

    console.log('=== Discord Stats Report Complete ===')

    return new Response(JSON.stringify({
      success: true,
      message: 'Stats report sent to Discord',
      appStats,
      gaStats: gaStats || 'not configured',
      igStats: igStats || 'not configured',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('❌ Error in Discord stats report:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
