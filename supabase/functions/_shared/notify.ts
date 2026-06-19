// Shared notifier for recurring prompt edge functions.
//
// Handles per-user delivery to either email (Resend) or a Discord webhook,
// and auto-falls-back from Discord -> email when the webhook fails so the
// user never silently misses a prompt. notification_channel is NOT auto-
// flipped on failure; the user keeps Discord as their preference until they
// fix the webhook themselves on the account page.

export type NotificationChannel = 'email' | 'discord';

export interface PromptUser {
  notification_channel: NotificationChannel | null | undefined;
  notification_email: string;
  discord_webhook_url?: string | null;
}

export interface DiscordEmbed {
  title: string;
  description: string;
}

export interface SendPromptPayload {
  subject: string;
  emailHtml: string;
  discordEmbed: DiscordEmbed;
}

export interface SendPromptEnv {
  resendApiKey: string;
  fromAddress?: string; // e.g. 'Ink-lings <support@inklingsjournal.live>'
}

export interface SendPromptResult {
  ok: boolean;
  channel: NotificationChannel;
  fellBackToEmail?: boolean;
  error?: string;
}

const DEFAULT_FROM = 'Ink-lings <support@inklingsjournal.live>';

// Banner prepended to the email body when we had to fall back from Discord.
// Inline styled so it survives stripped/dark-mode rendering.
function fallbackBanner(): string {
  return `
    <div style="background:#fef3c7; border-left:4px solid #f59e0b; color:#92400e; padding:14px 18px; border-radius:8px; margin:0 0 20px 0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:14px; line-height:1.5;">
      <strong>Heads up:</strong> we tried to send today's prompt to your Discord channel and it failed
      (likely because the webhook was deleted or revoked). We delivered it by email this time so you
      wouldn't miss it.
      <br><br>
      To restore Discord delivery, open Ink-lings, go to your account page, click
      <em>Edit Current Preferences</em>, and paste a fresh Discord webhook URL.
    </div>
  `;
}

function injectBanner(emailHtml: string, banner: string): string {
  // Prefer to slot the banner just inside the existing .container div so it
  // inherits the email's card padding. Fall back to prepending to <body> or to
  // the whole string if neither marker is present.
  const containerOpenRe = /(<div[^>]*class="[^"]*\bcontainer\b[^"]*"[^>]*>)/i;
  if (containerOpenRe.test(emailHtml)) {
    return emailHtml.replace(containerOpenRe, `$1\n${banner}`);
  }
  const bodyOpenRe = /(<body[^>]*>)/i;
  if (bodyOpenRe.test(emailHtml)) {
    return emailHtml.replace(bodyOpenRe, `$1\n${banner}`);
  }
  return banner + emailHtml;
}

async function postEmail(
  to: string,
  subject: string,
  html: string,
  env: SendPromptEnv,
): Promise<{ ok: boolean; status: number; body?: string }> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.fromAddress ?? DEFAULT_FROM,
      to,
      subject,
      html,
    }),
  });
  const text = res.ok ? undefined : await res.text().catch(() => undefined);
  return { ok: res.ok, status: res.status, body: text };
}

async function postDiscord(
  webhookUrl: string,
  embed: DiscordEmbed,
): Promise<{ ok: boolean; status: number; body?: string }> {
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      allowed_mentions: { parse: [] },
      embeds: [embed],
    }),
  });
  const text = res.ok ? undefined : await res.text().catch(() => undefined);
  return { ok: res.ok, status: res.status, body: text };
}

/**
 * Send a single prompt notification to the user via their preferred channel.
 *
 * Behavior:
 *   - channel='email'   -> POST to Resend with the provided HTML.
 *   - channel='discord' -> POST to the user's webhook URL with the provided embed.
 *                          On any failure (non-2xx, network throw, missing URL),
 *                          fall back to the email branch with a notice banner
 *                          prepended to the body. fellBackToEmail=true is set.
 */
export async function sendPromptNotification(
  user: PromptUser,
  payload: SendPromptPayload,
  env: SendPromptEnv,
): Promise<SendPromptResult> {
  const channel: NotificationChannel = user.notification_channel === 'discord' ? 'discord' : 'email';

  if (channel === 'email') {
    try {
      const res = await postEmail(user.notification_email, payload.subject, payload.emailHtml, env);
      if (res.ok) return { ok: true, channel: 'email' };
      return {
        ok: false,
        channel: 'email',
        error: `Resend HTTP ${res.status}${res.body ? `: ${res.body.slice(0, 200)}` : ''}`,
      };
    } catch (err) {
      return {
        ok: false,
        channel: 'email',
        error: `Resend threw: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  // Discord branch with auto-fallback.
  const webhookUrl = (user.discord_webhook_url ?? '').trim();
  let discordError: string | undefined;

  if (!webhookUrl) {
    discordError = 'discord_webhook_url is empty';
  } else {
    try {
      const res = await postDiscord(webhookUrl, payload.discordEmbed);
      if (res.ok) return { ok: true, channel: 'discord' };
      discordError = `Discord HTTP ${res.status}${res.body ? `: ${res.body.slice(0, 200)}` : ''}`;
    } catch (err) {
      discordError = `Discord threw: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  console.warn(
    `[notify] Discord delivery failed for ${user.notification_email}; falling back to email. Reason: ${discordError}`,
  );

  try {
    const fallbackHtml = injectBanner(payload.emailHtml, fallbackBanner());
    const res = await postEmail(user.notification_email, payload.subject, fallbackHtml, env);
    if (res.ok) {
      return { ok: true, channel: 'email', fellBackToEmail: true, error: discordError };
    }
    return {
      ok: false,
      channel: 'email',
      fellBackToEmail: true,
      error: `Discord failed (${discordError}); email fallback also failed: Resend HTTP ${res.status}${
        res.body ? `: ${res.body.slice(0, 200)}` : ''
      }`,
    };
  } catch (err) {
    return {
      ok: false,
      channel: 'email',
      fellBackToEmail: true,
      error: `Discord failed (${discordError}); email fallback threw: ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }
}

// ----------------------------------------------------------------------------
// Embed builders (kept here so all callers produce identical-looking embeds).
// ----------------------------------------------------------------------------

const ZWSP = '\u200B';

function feedbackUrls(token: string, promptId: string | number) {
  const base = `https://www.inklingsjournal.live/api/feedback?token=${encodeURIComponent(token)}`;
  return {
    up: `${base}&type=up&prompt_id=${encodeURIComponent(String(promptId))}`,
    down: `${base}&type=down&prompt_id=${encodeURIComponent(String(promptId))}`,
  };
}

function feedbackLine(token: string, promptId: string | number): string {
  const { up, down } = feedbackUrls(token, promptId);
  return `\ud83d\udc4d [Love It](${up}) // \ud83d\udc4e [Not My Fav](${down})`;
}

// Discord embed description hard limit is 4096 chars; clamp defensively.
function clampDescription(s: string): string {
  const MAX = 4096;
  if (s.length <= MAX) return s;
  return s.slice(0, MAX - 1).trimEnd() + '\u2026';
}

/**
 * Build the Discord embed for a regular daily journal prompt.
 * Mirrors the user's Apps Script "Ink-lings" labeled-mail-to-Discord script.
 */
export function buildRegularPromptEmbed(args: {
  categoryName: string;
  promptText: string;
  feedbackToken: string;
  promptId: string | number;
}): DiscordEmbed {
  const lines = [
    args.categoryName,
    '',
    `"${args.promptText}"`,
    '',
    ZWSP,
    '',
    feedbackLine(args.feedbackToken, args.promptId),
  ];
  return {
    title: "Today's Prompt \u270d\ufe0f",
    description: clampDescription(lines.join('\n')),
  };
}

/**
 * Build the Discord embed for a 2026 gratitude challenge prompt.
 * Mirrors the user's Apps Script "ink-lings gratitude" labeled-mail-to-Discord script.
 */
export function buildGratitudePromptEmbed(args: {
  formattedDate: string; // e.g. "January 1, 2026"
  stoicBlurb?: string | null;
  promptText: string;
  feedbackToken: string;
  promptId: string | number;
}): DiscordEmbed {
  const blurb = (args.stoicBlurb ?? '').trim();
  const lines: string[] = [
    `**${args.formattedDate}**`,
    '',
  ];
  if (blurb) {
    lines.push(blurb, '');
  }
  lines.push(
    `** ${args.promptText}**`,
    '',
    ZWSP,
    feedbackLine(args.feedbackToken, args.promptId),
  );
  return {
    title: "Today's Gratitude Prompt \ud83d\udcdd",
    description: clampDescription(lines.join('\n')),
  };
}
