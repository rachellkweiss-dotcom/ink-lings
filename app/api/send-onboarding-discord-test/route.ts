import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { rateLimit } from '@/lib/rate-limit';
import { logSuccess, logFailure } from '@/lib/audit-log';

const DISCORD_WEBHOOK_RE = /^https:\/\/(discord|discordapp)\.com\/api\/webhooks\/\d+\/[\w-]+$/;

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = rateLimit(request, 10, 60 * 1000);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const authResult = await authenticateRequest(request);
    if (authResult.error) {
      return authResult.error;
    }
    const authenticatedUser = authResult.user;

    const body = await request.json().catch(() => ({}));
    const webhookUrl: string | undefined = body?.webhookUrl;
    const userFirstName: string = (body?.userFirstName ?? 'there').toString();

    if (!webhookUrl || typeof webhookUrl !== 'string') {
      return NextResponse.json({ message: 'Missing webhookUrl' }, { status: 400 });
    }

    if (!DISCORD_WEBHOOK_RE.test(webhookUrl.trim())) {
      logFailure(
        request,
        'discord_webhook_invalid_format',
        authenticatedUser.id,
        authenticatedUser.email,
        'Webhook URL did not match Discord format',
      );
      return NextResponse.json(
        {
          message:
            'That doesn\u2019t look like a Discord webhook URL. It should start with https://discord.com/api/webhooks/',
        },
        { status: 400 },
      );
    }

    const embed = {
      title: 'Test message from Ink-lings \u2728',
      description: [
        `Hi ${userFirstName} \u2014 if you can see this in your Discord channel, your webhook is wired up correctly.`,
        '',
        '\u200B',
        'Your daily journal prompts will start arriving here on the schedule you set.',
      ].join('\n'),
    };

    const discordRes = await fetch(webhookUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        allowed_mentions: { parse: [] },
        embeds: [embed],
      }),
    });

    if (!discordRes.ok) {
      const errText = await discordRes.text().catch(() => '');
      logFailure(
        request,
        'discord_webhook_test_failed',
        authenticatedUser.id,
        authenticatedUser.email,
        `Discord returned ${discordRes.status}: ${errText.slice(0, 200)}`,
      );
      // Map a couple of common Discord error codes to friendlier messages.
      let message = `Discord rejected the request (HTTP ${discordRes.status}).`;
      if (discordRes.status === 404) {
        message = 'Webhook not found. It may have been deleted in Discord \u2014 create a new one and try again.';
      } else if (discordRes.status === 401 || discordRes.status === 403) {
        message = 'Discord refused the webhook (unauthorized). The URL or token is wrong; copy it again from Discord.';
      }
      return NextResponse.json({ message }, { status: 400 });
    }

    logSuccess(
      request,
      'discord_webhook_test_sent',
      authenticatedUser.id,
      authenticatedUser.email,
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('send-onboarding-discord-test error:', error);
    return NextResponse.json(
      { message: 'Unexpected server error sending Discord test message.' },
      { status: 500 },
    );
  }
}
