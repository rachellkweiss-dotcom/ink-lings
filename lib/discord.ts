/**
 * Discord REST API helpers for the support ticket system.
 * Uses Discord Bot token for authentication.
 * 
 * These helpers create threads, post messages, and fetch messages
 * from Discord channels using the REST API (no persistent bot needed).
 */

const DISCORD_API_BASE = 'https://discord.com/api/v10';

function getHeaders(): Record<string, string> {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    throw new Error('DISCORD_BOT_TOKEN environment variable is not set');
  }
  // DEBUG: Log masked token to verify env var is loading correctly
  console.log(`[Discord] Token loaded: ${token.substring(0, 10)}...${token.substring(token.length - 5)} (length: ${token.length})`);
  return {
    'Authorization': `Bot ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Get the bot's own user ID (used to filter out bot-posted messages during polling)
 */
let cachedBotUserId: string | null = null;

export async function getBotUserId(): Promise<string> {
  if (cachedBotUserId) return cachedBotUserId;
  
  const response = await fetch(`${DISCORD_API_BASE}/users/@me`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get bot user: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  cachedBotUserId = data.id;
  return data.id;
}

/**
 * Create a new thread in the support channel and post an initial message.
 * Uses "Create Thread without Message" (Forum-style) or "Start Thread in Channel".
 * 
 * @returns The created thread's ID
 */
export async function createSupportThread(
  subject: string,
  initialMessage: string
): Promise<{ threadId: string; messageId: string }> {
  const channelId = process.env.DISCORD_SUPPORT_CHANNEL_ID;
  if (!channelId) {
    throw new Error('DISCORD_SUPPORT_CHANNEL_ID environment variable is not set');
  }

  // Create a Forum post with the initial message
  // Forum channels support inline message content in the thread creation request
  const threadResponse = await fetch(
    `${DISCORD_API_BASE}/channels/${channelId}/threads`,
    {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        name: subject.substring(0, 100), // Discord thread name max 100 chars
        auto_archive_duration: 10080, // 7 days
        message: {
          content: initialMessage,
        },
      }),
    }
  );

  if (!threadResponse.ok) {
    const errorText = await threadResponse.text();
    throw new Error(`Failed to create Discord thread: ${threadResponse.status} ${errorText}`);
  }

  const threadData = await threadResponse.json();
  const threadId = threadData.id;
  const messageId = threadData.message?.id || '';

  return { threadId, messageId };
}

/**
 * Post a message to an existing Discord thread.
 * 
 * @returns The created message's ID
 */
export async function postToThread(
  threadId: string,
  content: string
): Promise<string> {
  const response = await fetch(
    `${DISCORD_API_BASE}/channels/${threadId}/messages`,
    {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ content }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to post to Discord thread: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.id;
}

/**
 * Fetch messages from a Discord thread.
 * Used by the polling cron to sync Discord replies back to the database.
 * 
 * @param threadId - The Discord thread/channel ID
 * @param after - Optional message ID to fetch messages after (for pagination)
 * @param limit - Max messages to fetch (default 50, max 100)
 */
export interface DiscordMessage {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    bot: boolean;
  };
  timestamp: string;
}

export async function getThreadMessages(
  threadId: string,
  after?: string,
  limit: number = 50
): Promise<DiscordMessage[]> {
  const params = new URLSearchParams({ limit: Math.min(limit, 100).toString() });
  if (after) {
    params.set('after', after);
  }

  const response = await fetch(
    `${DISCORD_API_BASE}/channels/${threadId}/messages?${params.toString()}`,
    {
      headers: getHeaders(),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch thread messages: ${response.status} ${errorText}`);
  }

  const messages: DiscordMessage[] = await response.json();
  return messages;
}

/**
 * Archive a Discord thread (used when a ticket is resolved).
 */
export async function archiveThread(threadId: string): Promise<void> {
  const response = await fetch(
    `${DISCORD_API_BASE}/channels/${threadId}`,
    {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ archived: true }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Failed to archive Discord thread: ${response.status} ${errorText}`);
    // Don't throw - archiving is not critical
  }
}

/**
 * Build the initial Discord message for a new support ticket.
 * Tags the configured user for notification.
 */
export function buildTicketMessage(opts: {
  ticketType: string;
  subject: string;
  description: string;
  email: string;
  name?: string;
  userId?: string;
  token: string;
}): string {
  const tagUserId = process.env.DISCORD_TAG_USER_ID;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://inklingsjournal.live';
  
  const typeEmoji = {
    help: '❓',
    bug: '🐛',
    account_deletion: '🗑️',
  }[opts.ticketType] || '📩';

  const typeLabel = {
    help: 'Help / Question',
    bug: 'Bug Report',
    account_deletion: 'Account Deletion',
  }[opts.ticketType] || opts.ticketType;

  const lines: string[] = [];
  
  if (tagUserId) {
    lines.push(`<@${tagUserId}> New support ticket!`);
    lines.push('');
  }

  lines.push(`${typeEmoji} **${typeLabel}**`);
  lines.push(`**Subject:** ${opts.subject}`);
  lines.push(`**From:** ${opts.name || 'Anonymous'} (${opts.email})`);
  if (opts.userId) {
    lines.push(`**User ID:** ${opts.userId}`);
  }
  lines.push(`**Chat Link:** ${siteUrl}/support/chat/${opts.token}`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(opts.description);

  return lines.join('\n');
}
