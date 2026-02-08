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

// Clawdbot Supabase (social_media table)
const CLAWDBOT_SUPABASE_URL = Deno.env.get('CLAWDBOT_SUPABASE_URL')
const CLAWDBOT_SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('CLAWDBOT_SUPABASE_SERVICE_ROLE_KEY')
const clawdbotSupabase = CLAWDBOT_SUPABASE_URL && CLAWDBOT_SUPABASE_SERVICE_ROLE_KEY
  ? createClient(CLAWDBOT_SUPABASE_URL, CLAWDBOT_SUPABASE_SERVICE_ROLE_KEY)
  : null

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
    permalink: string | null
    reach: number | null
    views: number | null
    saved: number | null
    shares: number | null
    totalInteractions: number | null
  }>
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

// ============================================================
// Social media performance tracking
// ============================================================

function extractShortcode(url: string): string | null {
  // Matches /p/CODE/, /reel/CODE/, /tv/CODE/ etc.
  const match = url.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/)
  return match ? match[1] : null
}

async function syncPerformanceToSocialMedia(posts: IGStats['recentPosts']): Promise<number> {
  if (!clawdbotSupabase) {
    console.log('⚠️ Clawdbot Supabase not configured — skipping social media performance sync')
    return 0
  }

  let updatedCount = 0

  for (const post of posts) {
    if (!post.permalink) continue

    const shortcode = extractShortcode(post.permalink)
    if (!shortcode) continue

    // Find matching rows where instagram_permalink contains this shortcode
    const { data: matches, error: fetchError } = await clawdbotSupabase
      .from('social_media')
      .select('id, instagram_permalink, performance_history')
      .eq('product', 'ink-lings')
      .not('instagram_permalink', 'is', null)

    if (fetchError) {
      console.warn(`⚠️ Error querying social_media: ${fetchError.message}`)
      continue
    }

    // Match by shortcode extracted from the stored permalink
    const matchingRows = (matches || []).filter((row: any) => {
      if (!row.instagram_permalink) return false
      const rowShortcode = extractShortcode(row.instagram_permalink)
      return rowShortcode === shortcode
    })

    if (matchingRows.length === 0) continue

    // Build the performance snapshot
    const snapshot = {
      recorded_at: new Date().toISOString(),
      reach: post.reach,
      views: post.views,
      likes: post.likeCount,
      comments: post.commentsCount,
      saved: post.saved,
      shares: post.shares,
      total_interactions: post.totalInteractions,
    }

    for (const row of matchingRows) {
      const history = Array.isArray(row.performance_history) ? row.performance_history : []
      history.push(snapshot)

      const { error: updateError } = await clawdbotSupabase
        .from('social_media')
        .update({ performance_history: history })
        .eq('id', row.id)

      if (updateError) {
        console.warn(`⚠️ Error updating social_media row ${row.id}: ${updateError.message}`)
      } else {
        updatedCount++
        console.log(`✅ Updated performance for post ${shortcode} (row ${row.id})`)
      }
    }
  }

  return updatedCount
}

async function fetchMediaInsights(mediaId: string, accessToken: string): Promise<{
  reach: number | null
  views: number | null
  saved: number | null
  shares: number | null
  totalInteractions: number | null
}> {
  try {
    // These metrics work for FEED (static/carousel) and REELS
    const metrics = 'reach,saved,shares,views,total_interactions'

    const response = await fetch(
      `https://graph.instagram.com/v24.0/${mediaId}/insights?metric=${metrics}&access_token=${accessToken}`
    )

    if (!response.ok) {
      console.warn(`⚠️ Could not fetch insights for media ${mediaId}`)
      return { reach: null, views: null, saved: null, shares: null, totalInteractions: null }
    }

    const data = await response.json()
    const metricsMap: Record<string, number> = {}
    for (const item of (data.data || [])) {
      metricsMap[item.name] = item.values?.[0]?.value ?? 0
    }

    return {
      reach: metricsMap['reach'] ?? null,
      views: metricsMap['views'] ?? null,
      saved: metricsMap['saved'] ?? null,
      shares: metricsMap['shares'] ?? null,
      totalInteractions: metricsMap['total_interactions'] ?? null,
    }
  } catch (error) {
    console.warn(`⚠️ Error fetching insights for media ${mediaId}:`, error)
    return { reach: null, views: null, saved: null, shares: null, totalInteractions: null }
  }
}

async function fetchInstagramStats(): Promise<IGStats | null> {
  if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_USER_ID) {
    console.log('⚠️ Instagram credentials not configured — skipping Instagram analytics')
    return null
  }

  try {
    let currentToken = INSTAGRAM_ACCESS_TOKEN

    // Try to refresh the token proactively (keeps it alive for another 60 days)
    const refreshResult = await refreshInstagramToken(currentToken)
    if (refreshResult) {
      currentToken = refreshResult.token
      const daysLeft = Math.floor(refreshResult.expiresIn / 86400)
      console.log(`✅ Instagram token refreshed — expires in ${daysLeft} days`)
    }

    // Fetch account info (follower count, follows count, media count)
    const accountResponse = await fetch(
      `https://graph.instagram.com/v24.0/${INSTAGRAM_USER_ID}?fields=followers_count,follows_count,media_count&access_token=${currentToken}`
    )

    if (!accountResponse.ok) {
      const errorText = await accountResponse.text()
      throw new Error(`Instagram account request failed: ${accountResponse.status} ${errorText}`)
    }

    const accountData = await accountResponse.json()

    // Fetch recent media with engagement metrics
    // Get enough posts to cover the 3-day window
    const mediaResponse = await fetch(
      `https://graph.instagram.com/v24.0/${INSTAGRAM_USER_ID}/media?fields=id,caption,like_count,comments_count,timestamp,media_type,permalink&limit=20&access_token=${currentToken}`
    )

    let recentPosts: IGStats['recentPosts'] = []

    if (mediaResponse.ok) {
      const mediaData = await mediaResponse.json()
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

      const recentMedia = (mediaData.data || [])
        .filter((post: any) => new Date(post.timestamp) >= threeDaysAgo)

      // Fetch insights for each recent post in parallel
      const insightsResults = await Promise.all(
        recentMedia.map((post: any) =>
          fetchMediaInsights(post.id, currentToken)
        )
      )

      recentPosts = recentMedia.map((post: any, i: number) => ({
        caption: post.caption ? post.caption.substring(0, 80) + (post.caption.length > 80 ? '...' : '') : '(no caption)',
        likeCount: post.like_count || 0,
        commentsCount: post.comments_count || 0,
        timestamp: post.timestamp,
        mediaType: post.media_type || 'UNKNOWN',
        permalink: post.permalink || null,
        ...insightsResults[i],
      }))
    } else {
      console.warn('⚠️ Could not fetch Instagram media, continuing with account stats only')
    }

    return {
      followerCount: accountData.followers_count || 0,
      followsCount: accountData.follows_count || 0,
      mediaCount: accountData.media_count || 0,
      recentPosts,
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

    // Total authenticated users
    supabase.auth.admin.listUsers({ page: 1, perPage: 10000 }),

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
    totalUsers: totalUsersResult.data?.users?.length || 0,
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

function buildDiscordMessage(appStats: AppStats, gaStats: GAStats | null, igStats: IGStats | null) {
  const userMentions = DISCORD_USER_IDS.map(id => `<@${id}>`).join(' ')

  const lines: string[] = []

  lines.push(`${userMentions}`)
  lines.push(``)
  lines.push(`**📊 Ink-lings Stats Report**`)
  lines.push(``)

  // Users section
  lines.push(`**👥 Users**`)
  lines.push(`New Users (Last 3 Days): ${appStats.newUsers}`)
  lines.push(`Total Authenticated Users: ${appStats.totalUsers}`)
  lines.push(`Receiving Prompts: ${appStats.usersReceivingPrompts}`)
  lines.push(`2026 Gratitude Challenge: ${appStats.gratitudeChallengeEnrolled}`)
  lines.push(``)

  // Prompts section
  lines.push(`**📝 Prompts (Last 3 Days)**`)
  lines.push(`Sent: ${appStats.promptsSent}`)
  lines.push(`👍 Positive Reactions: ${appStats.positiveReactions}`)
  lines.push(`👎 Negative Reactions: ${appStats.negativeReactions}`)
  lines.push(``)

  // Website analytics section
  if (gaStats) {
    const referrersText = gaStats.topReferrers.length > 0
      ? gaStats.topReferrers.map(r => `${r.source} (${r.sessions})`).join(', ')
      : 'No referrer data'

    lines.push(`**🌐 Website Analytics (Last 3 Days)**`)
    lines.push(`Active Users: ${gaStats.activeUsers}`)
    lines.push(`Sessions: ${gaStats.sessions}`)
    lines.push(`Page Views: ${gaStats.pageViews}`)
    lines.push(`Unique Visitors: ${gaStats.uniqueVisitors}`)
    lines.push(`Top Referrers: ${referrersText}`)
    lines.push(``)
  } else {
    lines.push(`**🌐 Website Analytics (Last 3 Days)**`)
    lines.push(`GA credentials not configured`)
    lines.push(``)
  }

  // Instagram section
  if (igStats) {
    lines.push(`**📸 Instagram (@ink_lings_journal)**`)
    lines.push(`Followers: ${igStats.followerCount}`)
    lines.push(`Following: ${igStats.followsCount}`)
    lines.push(`Total Posts: ${igStats.mediaCount}`)
    lines.push(``)

    if (igStats.recentPosts.length > 0) {
      lines.push(`**📱 Posts Since Last Report (${igStats.recentPosts.length})**`)
      igStats.recentPosts.forEach((post, i) => {
        const date = new Date(post.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        const type = post.mediaType === 'VIDEO' ? '🎬' : post.mediaType === 'CAROUSEL_ALBUM' ? '🎠' : '🖼️'
        const link = post.permalink ? `${post.permalink}` : ''
        lines.push(`${i + 1}. ${type} ${date} — ${link}`)
        lines.push(`   ❤️ ${post.likeCount} 💬 ${post.commentsCount} 👁️ ${post.views ?? '—'} 📣 ${post.reach ?? '—'} 💾 ${post.saved ?? '—'} 🔄 ${post.shares ?? '—'}`)
        lines.push(`   ${post.caption}`)
      })
      lines.push(``)
    } else {
      lines.push(`No new posts in the last 3 days`)
      lines.push(``)
    }
  } else {
    lines.push(`**📸 Instagram**`)
    lines.push(`Instagram credentials not configured`)
    lines.push(``)
  }

  return { content: lines.join('\n') }
}

async function sendToDiscord(appStats: AppStats, gaStats: GAStats | null, igStats: IGStats | null): Promise<void> {
  const payload = buildDiscordMessage(appStats, gaStats, igStats)

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

    // Sync Instagram performance data to Clawdbot social_media table
    let performanceUpdates = 0
    if (igStats && igStats.recentPosts.length > 0) {
      performanceUpdates = await syncPerformanceToSocialMedia(igStats.recentPosts)
      console.log(`📊 Updated performance for ${performanceUpdates} social_media rows`)
    }

    // Send to Discord
    await sendToDiscord(appStats, gaStats, igStats)

    console.log('=== Discord Stats Report Complete ===')

    return new Response(JSON.stringify({
      success: true,
      message: 'Stats report sent to Discord',
      appStats,
      gaStats: gaStats || 'not configured',
      igStats: igStats || 'not configured',
      performanceUpdates,
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
