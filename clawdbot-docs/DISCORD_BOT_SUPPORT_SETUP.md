# Discord Bot Support System Setup

This guide explains how to configure your Discord bot (OpenClaw) to work with the Remember-lings support ticket system.

## Overview

The support system works as follows:

1. **User submits a ticket** → Creates a Discord thread in your support channel
2. **OpenClaw responds** in the Discord thread
3. **Discord bot detects the response** → Calls your webhook API
4. **Webhook saves the message** and emails the user
5. **User replies** from the web UI → Message posted to Discord thread
6. **Cycle continues** until ticket is closed

---

## Prerequisites

- Discord bot with access to your support channel
- Bot has permissions to:
  - Read messages in threads
  - Send messages in threads
  - Create public threads
  - Manage threads (for archiving)

---

## Environment Variables Needed

Add these to your `.env.local` and Vercel:

```env
# Your Discord bot token (from Discord Developer Portal)
DISCORD_BOT_TOKEN=your_bot_token_here

# The channel ID where support threads will be created
DISCORD_SUPPORT_CHANNEL_ID=your_channel_id_here

# OpenClaw's bot ID (for tagging)
DISCORD_OPENCLAW_BOT_ID=1467371986056511622

# Secret to verify webhook calls (generate with: openssl rand -hex 32)
DISCORD_SUPPORT_WEBHOOK_SECRET=your_secret_here
```

---

## How to Get Your Discord Bot Token

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your bot application (or create one)
3. Go to **Bot** in the left sidebar
4. Click **Reset Token** (or **Copy** if visible)
5. Save this token as `DISCORD_BOT_TOKEN`

---

## How to Get Your Channel ID

1. Open Discord
2. Go to **User Settings** → **Advanced** → Enable **Developer Mode**
3. Right-click on your support channel
4. Click **Copy Channel ID**
5. Save this as `DISCORD_SUPPORT_CHANNEL_ID`

---

## Bot Code: Listening for Messages

Your Discord bot needs to listen for messages in threads and forward them to your webhook.

### Example using discord.js (Node.js)

```javascript
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Your configuration
const SUPPORT_CHANNEL_ID = process.env.DISCORD_SUPPORT_CHANNEL_ID;
const WEBHOOK_URL = 'https://remember-lings.live/api/support/webhook/discord';
const WEBHOOK_SECRET = process.env.DISCORD_SUPPORT_WEBHOOK_SECRET;

// Your bot's own ID (to ignore its own messages)
const MY_BOT_ID = 'your_bot_id_here';

client.on('messageCreate', async (message) => {
  // Ignore messages from your own bot
  if (message.author.id === MY_BOT_ID) return;
  
  // Only process messages in threads
  if (!message.channel.isThread()) return;
  
  // Only process threads in the support channel
  if (message.channel.parentId !== SUPPORT_CHANNEL_ID) return;
  
  // Ignore messages from the ticket creator (user messages come from the web UI)
  // We only want to forward bot/admin responses
  // You may need to track which users created which threads
  
  try {
    const payload = {
      message_id: message.id,
      content: message.content,
      thread_id: message.channel.id,
      author_id: message.author.id,
      author_username: message.author.displayName || message.author.username,
      author_is_bot: message.author.bot,
      timestamp: message.createdAt.toISOString(),
    };

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-discord-webhook-secret': WEBHOOK_SECRET,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Webhook failed:', await response.text());
    } else {
      console.log('Webhook sent for message:', message.id);
    }
  } catch (error) {
    console.error('Error sending webhook:', error);
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
```

### Example using discord.py (Python)

```python
import discord
import aiohttp
import os

SUPPORT_CHANNEL_ID = int(os.getenv('DISCORD_SUPPORT_CHANNEL_ID'))
WEBHOOK_URL = 'https://remember-lings.live/api/support/webhook/discord'
WEBHOOK_SECRET = os.getenv('DISCORD_SUPPORT_WEBHOOK_SECRET')
MY_BOT_ID = 'your_bot_id_here'

intents = discord.Intents.default()
intents.message_content = True
intents.guilds = True

client = discord.Client(intents=intents)

@client.event
async def on_message(message):
    # Ignore messages from your own bot
    if str(message.author.id) == MY_BOT_ID:
        return
    
    # Only process messages in threads
    if not isinstance(message.channel, discord.Thread):
        return
    
    # Only process threads in the support channel
    if message.channel.parent_id != SUPPORT_CHANNEL_ID:
        return
    
    payload = {
        'message_id': str(message.id),
        'content': message.content,
        'thread_id': str(message.channel.id),
        'author_id': str(message.author.id),
        'author_username': message.author.display_name or message.author.name,
        'author_is_bot': message.author.bot,
        'timestamp': message.created_at.isoformat(),
    }
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(
                WEBHOOK_URL,
                json=payload,
                headers={
                    'Content-Type': 'application/json',
                    'x-discord-webhook-secret': WEBHOOK_SECRET,
                }
            ) as response:
                if response.status != 200:
                    print(f'Webhook failed: {await response.text()}')
                else:
                    print(f'Webhook sent for message: {message.id}')
        except Exception as e:
            print(f'Error sending webhook: {e}')

client.run(os.getenv('DISCORD_BOT_TOKEN'))
```

---

## Webhook Payload Format

Your bot should send this JSON payload to the webhook:

```json
{
  "message_id": "1234567890123456789",
  "content": "The actual message text from Discord",
  "thread_id": "1234567890123456789",
  "author_id": "1467371986056511622",
  "author_username": "OpenClaw",
  "author_is_bot": true,
  "timestamp": "2026-02-04T15:30:00.000Z"
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `message_id` | string | Discord message ID (for deduplication) |
| `content` | string | The message text |
| `thread_id` | string | Discord thread ID (maps to ticket) |
| `author_id` | string | Discord user ID of the author |
| `author_username` | string | Display name to show in the UI |
| `author_is_bot` | boolean | `true` for bots (OpenClaw), `false` for humans |
| `timestamp` | string | ISO 8601 timestamp |

---

## Required Headers

```
Content-Type: application/json
x-discord-webhook-secret: YOUR_WEBHOOK_SECRET
```

The `x-discord-webhook-secret` header must match your `DISCORD_SUPPORT_WEBHOOK_SECRET` environment variable, or the request will be rejected with a 401 error.

---

## Closing Tickets from Discord

To close a ticket from Discord, include one of these keywords in a message:

- `!close`
- `[resolved]`
- `[closed]`

Example message:
```
This issue has been resolved. !close
```

When the webhook receives a message containing these keywords, it will:
1. Mark the ticket as "resolved"
2. Archive the Discord thread
3. Send a "ticket resolved" email to the user with a feedback request

---

## What Happens When the Webhook is Called

1. **Verifies the secret** - Returns 401 if invalid
2. **Finds the ticket** by `thread_id` - If no ticket found, ignores (returns 200)
3. **Checks for duplicates** - If `message_id` already exists, skips
4. **Saves the message** to `support_messages` table
5. **Detects close commands** - If found, closes ticket and archives thread
6. **Sends email notification** to the user about the new response

---

## Testing the Webhook

You can test the webhook manually using curl:

```bash
curl -X POST https://remember-lings.live/api/support/webhook/discord \
  -H "Content-Type: application/json" \
  -H "x-discord-webhook-secret: YOUR_SECRET_HERE" \
  -d '{
    "message_id": "test123",
    "content": "Test message from Discord",
    "thread_id": "YOUR_THREAD_ID",
    "author_id": "1467371986056511622",
    "author_username": "OpenClaw",
    "author_is_bot": true,
    "timestamp": "2026-02-04T15:30:00.000Z"
  }'
```

Expected response:
```json
{
  "success": true,
  "action": "message_saved"
}
```

---

## Troubleshooting

### Webhook returns 401 Unauthorized
- Check that `x-discord-webhook-secret` header matches `DISCORD_SUPPORT_WEBHOOK_SECRET`

### Webhook returns 200 but message not saved
- The `thread_id` may not match any ticket in the database
- Check the `discord_thread_id` column in `support_tickets` table

### Messages are duplicated
- The webhook is idempotent - check if `message_id` is being sent correctly

### User not receiving email notifications
- Check `RESEND_API_KEY` is set correctly
- Check the ticket's `email` field is valid

### OpenClaw not responding
- Ensure messages include the bot mention: `<@1467371986056511622>`
- Check OpenClaw's configuration for responding to mentions

---

## Architecture Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   User visits   │     │  Discord Thread │     │   Remember-lings│
│   /support      │     │   (Support)     │     │   API           │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │ 1. Submit ticket      │                       │
         ├──────────────────────────────────────────────►│
         │                       │                       │
         │                       │ 2. Create thread      │
         │                       │◄──────────────────────┤
         │                       │                       │
         │                       │ 3. Post initial msg   │
         │                       │   (@OpenClaw)         │
         │                       │◄──────────────────────┤
         │                       │                       │
         │                       │ 4. OpenClaw responds  │
         │                       │                       │
         │                       │ 5. Bot calls webhook  │
         │                       ├──────────────────────►│
         │                       │                       │
         │ 6. Email notification │                       │
         │◄──────────────────────────────────────────────┤
         │                       │                       │
         │ 7. User replies       │                       │
         │   (from web UI)       │                       │
         ├──────────────────────────────────────────────►│
         │                       │                       │
         │                       │ 8. Post reply         │
         │                       │   (@OpenClaw)         │
         │                       │◄──────────────────────┤
         │                       │                       │
         └───────────────────────┴───────────────────────┘
```

---

## Summary Checklist

- [ ] Get Discord bot token
- [ ] Get support channel ID
- [ ] Generate webhook secret
- [ ] Add environment variables to `.env.local` and Vercel
- [ ] Add message listener to your Discord bot
- [ ] Configure listener to call webhook for thread messages
- [ ] Test with a sample ticket
- [ ] Verify emails are being sent
