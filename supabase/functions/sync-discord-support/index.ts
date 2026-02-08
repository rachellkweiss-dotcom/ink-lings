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
const DISCORD_API_BASE = 'https://discord.com/api/v10'
const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN')
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

// ============================================================
// Types
// ============================================================

interface SupportTicket {
  id: string
  token: string
  email: string
  name: string | null
  subject: string
  status: string
  discord_thread_id: string
  user_id: string | null
}

interface DiscordMessage {
  id: string
  content: string
  author: {
    id: string
    username: string
    global_name?: string
    bot: boolean
  }
  timestamp: string
}

// ============================================================
// Discord API helpers
// ============================================================

function getDiscordHeaders(): Record<string, string> {
  return {
    'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
    'Content-Type': 'application/json',
  }
}

let cachedBotUserId: string | null = null

async function getBotUserId(): Promise<string> {
  if (cachedBotUserId) return cachedBotUserId

  const response = await fetch(`${DISCORD_API_BASE}/users/@me`, {
    headers: getDiscordHeaders(),
  })

  if (!response.ok) {
    throw new Error(`Failed to get bot user: ${response.status}`)
  }

  const data = await response.json()
  cachedBotUserId = data.id
  return data.id
}

async function fetchThreadMessages(threadId: string, limit = 50): Promise<DiscordMessage[]> {
  const response = await fetch(
    `${DISCORD_API_BASE}/channels/${threadId}/messages?limit=${limit}`,
    { headers: getDiscordHeaders() }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`Failed to fetch messages for thread ${threadId}: ${response.status} ${errorText}`)
    return []
  }

  return await response.json()
}

async function archiveThread(threadId: string): Promise<void> {
  const response = await fetch(
    `${DISCORD_API_BASE}/channels/${threadId}`,
    {
      method: 'PATCH',
      headers: getDiscordHeaders(),
      body: JSON.stringify({ archived: true }),
    }
  )

  if (!response.ok) {
    console.error(`Failed to archive thread ${threadId}: ${response.status}`)
  }
}

async function sendDiscordMessage(threadId: string, content: string): Promise<void> {
  const response = await fetch(
    `${DISCORD_API_BASE}/channels/${threadId}/messages`,
    {
      method: 'POST',
      headers: getDiscordHeaders(),
      body: JSON.stringify({ content }),
    }
  )

  if (!response.ok) {
    console.error(`Failed to send message to thread ${threadId}: ${response.status}`)
  }
}

// ============================================================
// Email notification
// ============================================================

async function sendReplyNotification(ticket: SupportTicket, newMessageCount: number): Promise<void> {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured — skipping reply notification email')
    return
  }

  const siteUrl = 'https://inklingsjournal.live'
  const chatUrl = `${siteUrl}/support/chat/${ticket.token}`
  const greeting = ticket.name ? `Hi ${ticket.name},` : 'Hi there,'

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f0f4ff;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2563eb, #06b6d4); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">You have a reply</h1>
          <p style="margin: 8px 0 0; opacity: 0.9;">Ink-lings Support</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <p>${greeting}</p>
          
          <p>You have a reply on your support request. Click below to view and respond.</p>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="${chatUrl}" 
               style="display: inline-block; background: linear-gradient(135deg, #2563eb, #06b6d4); color: white; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              View Reply and Respond Here
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
            Ink-lings Support &bull; <a href="${siteUrl}" style="color: #2563eb; text-decoration: none;">inklingsjournal.live</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Ink-lings <support@inklingsjournal.live>',
        to: ticket.email,
        subject: `You have a reply on your support request - Ink-lings`,
        html,
      }),
    })

    if (!response.ok) {
      console.error(`Failed to send reply notification to ${ticket.email}:`, await response.text())
    } else {
      console.log(`Reply notification sent to ${ticket.email}`)
    }
  } catch (error) {
    console.error(`Error sending reply notification:`, error)
  }
}

// ============================================================
// Resolution email with star rating
// ============================================================

async function sendResolutionEmail(ticket: SupportTicket): Promise<void> {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured — skipping resolution email')
    return
  }

  const siteUrl = 'https://inklingsjournal.live'
  const greeting = ticket.name ? `Hi ${ticket.name},` : 'Hi there,'

  // Build 5 individual star links — clicking star N rates N/5
  const starLinks = [1, 2, 3, 4, 5].map((n) => {
    const url = `${siteUrl}/api/support/feedback?token=${ticket.token}&rating=${n}`
    return `<a href="${url}" style="text-decoration: none; font-size: 36px; color: #f59e0b; padding: 0 4px;" title="${n} star${n > 1 ? 's' : ''}">★</a>`
  }).join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f0f4ff;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2563eb, #06b6d4); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Your request has been resolved</h1>
          <p style="margin: 8px 0 0; opacity: 0.9;">Ink-lings Support</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <p>${greeting}</p>
          
          <p>Your support request has been resolved. We hope we were able to help!</p>
          
          <p style="font-weight: 600; text-align: center; margin-top: 25px; margin-bottom: 8px;">How did we do?</p>
          
          <div style="text-align: center; margin: 0 0 25px;">
            ${starLinks}
          </div>
          
          <p style="text-align: center; color: #6b7280; font-size: 13px;">Click the stars to rate your experience</p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
            Ink-lings Support &bull; <a href="${siteUrl}" style="color: #2563eb; text-decoration: none;">inklingsjournal.live</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Ink-lings <support@inklingsjournal.live>',
        to: ticket.email,
        subject: 'Your support request has been resolved - Ink-lings',
        html,
      }),
    })

    if (!response.ok) {
      console.error(`Failed to send resolution email to ${ticket.email}:`, await response.text())
    } else {
      console.log(`Resolution email sent to ${ticket.email}`)
    }
  } catch (error) {
    console.error(`Error sending resolution email:`, error)
  }
}

// ============================================================
// Close command detection
// ============================================================

function hasCloseCommand(content: string): boolean {
  const lowerContent = content.toLowerCase()
  return lowerContent.includes('!close') ||
    lowerContent.includes('[resolved]') ||
    lowerContent.includes('[close]')
}

function hasDeleteCommand(content: string): boolean {
  return content.toLowerCase().includes('[delete]')
}

// ============================================================
// Account deletion
// ============================================================

async function resolveUserId(ticket: SupportTicket): Promise<string | null> {
  // Use the ticket's linked user_id if available
  if (ticket.user_id) return ticket.user_id

  // Otherwise look up by email in public.users
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('email', ticket.email)
    .single()

  return data?.id || null
}

async function deleteUserAccount(userId: string, email: string): Promise<{ success: boolean, errors: string[] }> {
  const errors: string[] = []

  // Helper to delete from a table and track errors
  async function deleteFrom(table: string, column: string, value: string) {
    const { error } = await supabase.from(table).delete().eq(column, value)
    if (error) {
      errors.push(`${table}: ${error.message}`)
      console.error(`Failed to delete from ${table}:`, error.message)
    } else {
      console.log(`Deleted from ${table} where ${column} = ${value}`)
    }
  }

  // 1. Delete support_messages for all of this user's tickets
  const { data: userTickets } = await supabase
    .from('support_tickets')
    .select('id')
    .or(`user_id.eq.${userId},email.eq.${email}`)

  if (userTickets && userTickets.length > 0) {
    for (const t of userTickets) {
      await deleteFrom('support_messages', 'ticket_id', t.id)
    }
  }

  // 2. Delete all support_tickets (by user_id and email to cover all)
  await deleteFrom('support_tickets', 'user_id', userId)
  const { error: ticketEmailErr } = await supabase.from('support_tickets').delete().eq('email', email)
  if (ticketEmailErr) {
    errors.push(`support_tickets (email): ${ticketEmailErr.message}`)
  }

  // 3. Delete from all user-data tables
  await deleteFrom('gratitude_2026_participants', 'user_id', userId)
  await deleteFrom('email_milestones', 'user_id', userId)
  await deleteFrom('user_prompt_progress', 'user_id', userId)
  await deleteFrom('user_prompt_rotation', 'user_id', userId)
  await deleteFrom('prompt_history', 'user_id', userId)
  await deleteFrom('user_preferences', 'user_id', userId)

  // 4. Delete from public.users
  await deleteFrom('users', 'id', userId)

  // 5. Delete from auth.users (Supabase admin API)
  const { error: authError } = await supabase.auth.admin.deleteUser(userId)
  if (authError) {
    errors.push(`auth.users: ${authError.message}`)
    console.error('Failed to delete auth user:', authError.message)
  } else {
    console.log(`Deleted auth user ${userId}`)
  }

  return { success: errors.length === 0, errors }
}

// ============================================================
// Account deletion email
// ============================================================

async function sendAccountDeletionEmail(email: string, name: string | null): Promise<void> {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured — skipping account deletion email')
    return
  }

  const siteUrl = 'https://inklingsjournal.live'
  const greeting = name ? `Hi ${name},` : 'Hi there,'

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f0f4ff;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2563eb, #06b6d4); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Account Deleted</h1>
          <p style="margin: 8px 0 0; opacity: 0.9;">Ink-lings</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <p>${greeting}</p>
          
          <p>We've completed your request and removed your account and associated data from Ink-lings.</p>
          
          <p>If you have questions or believe this was done in error, you're welcome to reach out.</p>
          
          <p>Thanks for having tried Ink-lings.</p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
            Ink-lings &bull; <a href="${siteUrl}" style="color: #2563eb; text-decoration: none;">inklingsjournal.live</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Ink-lings <support@inklingsjournal.live>',
        to: email,
        subject: 'Your Ink-lings account has been deleted',
        html,
      }),
    })

    if (!response.ok) {
      console.error(`Failed to send account deletion email to ${email}:`, await response.text())
    } else {
      console.log(`Account deletion email sent to ${email}`)
    }
  } catch (error) {
    console.error(`Error sending account deletion email:`, error)
  }
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
  const expectedToken = Deno.env.get('DISCORD_SUPPORT_CRON_SECRET')

  if (!expectedToken) {
    console.error('DISCORD_SUPPORT_CRON_SECRET is not configured')
    return new Response(JSON.stringify({
      success: false,
      error: 'Server configuration error',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }

  const providedToken = req.headers.get('x-cron-secret') ||
    req.headers.get('authorization')?.replace('Bearer ', '')

  if (!providedToken || providedToken !== expectedToken) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Unauthorized',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 401,
    })
  }

  if (!DISCORD_BOT_TOKEN) {
    return new Response(JSON.stringify({
      success: false,
      error: 'DISCORD_BOT_TOKEN not configured',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }

  try {
    console.log('=== Discord Support Sync Started ===')

    // Get the bot's own user ID so we can filter its messages
    const botUserId = await getBotUserId()
    console.log(`Bot user ID: ${botUserId}`)

    // Fetch all open/in_progress tickets with Discord threads
    const { data: tickets, error: ticketError } = await supabase
      .from('support_tickets')
      .select('id, token, email, name, subject, status, discord_thread_id, user_id')
      .in('status', ['open', 'in_progress'])
      .not('discord_thread_id', 'is', null)

    if (ticketError) {
      throw new Error(`Failed to fetch tickets: ${ticketError.message}`)
    }

    if (!tickets || tickets.length === 0) {
      console.log('No open tickets with Discord threads to sync')
      return new Response(JSON.stringify({
        success: true,
        message: 'No tickets to sync',
        ticketsProcessed: 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    console.log(`Found ${tickets.length} open ticket(s) to sync`)

    let totalNewMessages = 0
    let ticketsClosed = 0
    let accountsDeleted = 0

    for (const ticket of tickets) {
      try {
        // Fetch existing message IDs for this ticket to deduplicate
        const { data: existingMessages } = await supabase
          .from('support_messages')
          .select('discord_message_id')
          .eq('ticket_id', ticket.id)
          .not('discord_message_id', 'is', null)

        const existingDiscordIds = new Set(
          (existingMessages || []).map((m: { discord_message_id: string }) => m.discord_message_id)
        )

        // Fetch messages from Discord thread
        const discordMessages = await fetchThreadMessages(ticket.discord_thread_id)

        // Filter to new messages not posted by our bot (those are user replies posted through the API)
        const newMessages = discordMessages.filter((msg: DiscordMessage) =>
          !existingDiscordIds.has(msg.id) &&
          msg.author.id !== botUserId
        )

        if (newMessages.length === 0) {
          continue
        }

        console.log(`Ticket ${ticket.id}: ${newMessages.length} new message(s) from Discord`)

        let ticketShouldClose = false
        let ticketShouldDelete = false

        // Save new messages to the database
        for (const msg of newMessages) {
          const senderType = msg.author.bot ? 'bot' : 'admin'
          const senderName = 'Annie from Ink-lings'

          const { error: insertError } = await supabase
            .from('support_messages')
            .insert({
              ticket_id: ticket.id,
              sender_type: senderType,
              sender_name: senderName,
              content: msg.content,
              discord_message_id: msg.id,
              created_at: msg.timestamp,
            })

          if (insertError) {
            // Likely a unique constraint violation (duplicate) - skip
            if (insertError.code === '23505') {
              console.log(`Skipping duplicate message ${msg.id}`)
              continue
            }
            console.error(`Failed to save message ${msg.id}:`, insertError.message)
            continue
          }

          totalNewMessages++

          // Check for delete command (account deletion)
          if (hasDeleteCommand(msg.content)) {
            ticketShouldDelete = true
          }

          // Check for close commands
          if (hasCloseCommand(msg.content)) {
            ticketShouldClose = true
          }
        }

        // Handle account deletion — takes priority over close
        if (ticketShouldDelete) {
          console.log(`[DELETE] Account deletion triggered for ticket ${ticket.id} (${ticket.email})`)

          const userId = await resolveUserId(ticket)

          if (!userId) {
            console.error(`Could not resolve user ID for ticket ${ticket.id} (${ticket.email})`)
            await sendDiscordMessage(
              ticket.discord_thread_id,
              `⚠️ Could not find a user account for **${ticket.email}**. No data was deleted. Please verify the email and try again.`
            )
          } else {
            // Capture info before deletion wipes the records
            const userEmail = ticket.email
            const userName = ticket.name
            const threadId = ticket.discord_thread_id

            console.log(`Deleting account for user ${userId} (${userEmail})`)
            const result = await deleteUserAccount(userId, userEmail)

            if (result.success) {
              await sendDiscordMessage(
                threadId,
                `✅ Account deletion complete for **${userEmail}**.\n\nAll user data has been removed:\n• Authentication & account\n• Preferences\n• Prompt history & progress\n• Prompt rotation\n• Email milestones\n• Gratitude challenge enrollment\n• Support tickets & messages\n\nFarewell email has been sent.`
              )
            } else {
              await sendDiscordMessage(
                threadId,
                `⚠️ Account deletion for **${userEmail}** completed with errors:\n${result.errors.map(e => `• ${e}`).join('\n')}\n\nPlease review the logs and verify manually.`
              )
            }

            // Send farewell email
            await new Promise(resolve => setTimeout(resolve, 500))
            await sendAccountDeletionEmail(userEmail, userName)

            // Archive the Discord thread
            await archiveThread(threadId)

            accountsDeleted++
          }
        } else {
          // Handle ticket closure
          if (ticketShouldClose) {
            const { error: closeError } = await supabase
              .from('support_tickets')
              .update({
                status: 'resolved',
                resolved_at: new Date().toISOString(),
              })
              .eq('id', ticket.id)

            if (closeError) {
              console.error(`Failed to close ticket ${ticket.id}:`, closeError.message)
            } else {
              console.log(`Ticket ${ticket.id} resolved via Discord close command`)
              ticketsClosed++

              // Archive the Discord thread
              await archiveThread(ticket.discord_thread_id)
            }
          }

          // Send email notification to user
          if (newMessages.length > 0) {
            // Rate limit emails: 500ms delay between sends
            await new Promise(resolve => setTimeout(resolve, 500))

            if (ticketShouldClose) {
              // Ticket was just resolved — send resolution email with rating stars
              await sendResolutionEmail(ticket)
            } else {
              // Normal reply — send standard reply notification
              await sendReplyNotification(ticket, newMessages.length)
            }
          }
        }

      } catch (ticketError) {
        console.error(`Error processing ticket ${ticket.id}:`, ticketError)
        // Continue processing other tickets
      }
    }

    console.log(`=== Discord Support Sync Complete ===`)
    console.log(`Tickets processed: ${tickets.length}, New messages: ${totalNewMessages}, Tickets closed: ${ticketsClosed}, Accounts deleted: ${accountsDeleted}`)

    return new Response(JSON.stringify({
      success: true,
      message: 'Sync complete',
      ticketsProcessed: tickets.length,
      newMessages: totalNewMessages,
      ticketsClosed,
      accountsDeleted,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error in Discord support sync:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
