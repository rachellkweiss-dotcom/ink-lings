import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Set up Discord notifications | Ink-lings',
  description:
    'Step-by-step guide for delivering your Ink-lings journal prompts to a Discord channel using a webhook.',
};

export default function DiscordSetupPage() {
  return (
    <div
      className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-blue-900/10 dark:to-cyan-900/10"
      style={{ fontFamily: 'var(--font-shadows-into-light)' }}
    >
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
            Set Up Discord for Your Prompts
          </h1>
          <p
            className="text-center text-gray-600 mb-8"
            style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
          >
            About 5 minutes. You only have to do this once.
          </p>

          <div
            className="prose prose-lg max-w-none"
            style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
          >
            <h2 className="text-2xl font-semibold text-gray-800 mt-2 mb-4">Why Discord?</h2>
            <p className="mb-4">
              Discord is a free messaging app a lot of folks already use for friends, hobby groups,
              or work. If you live there, getting your daily journal prompt as a Discord message
              keeps it out of an overloaded inbox and right in front of you. If you don&apos;t use
              Discord yet, you can make a free personal server in a couple of minutes &mdash; it&apos;s
              yours, no one else has to see it.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">
              What&apos;s a webhook?
            </h2>
            <p className="mb-6">
              A webhook is a private URL that Ink-lings uses to post messages into one specific
              Discord channel. You create it on Discord&apos;s side, paste it back into Ink-lings,
              and we use it to deliver your prompts. Treat the URL like a password &mdash; anyone
              who has it can post into that channel.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">
              Step-by-step
            </h2>
            <ol className="list-decimal pl-6 mb-6 space-y-3">
              <li>
                Open{' '}
                <a
                  href="https://discord.com/login"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-600 hover:text-cyan-700 underline"
                >
                  https://discord.com/login
                </a>{' '}
                in a new browser tab.
              </li>
              <li>Already have a Discord account? Log in.</li>
              <li>Don&apos;t have a Discord account? Create one.</li>
              <li>If you just created your account, verify your email before continuing.</li>
              <li>
                On the left sidebar in Discord, click the <strong>+</strong> icon to add a server,
                then choose <strong>Create My Own</strong>.
              </li>
              <li>Click <strong>For me and my friends</strong>.</li>
              <li>
                Click the <strong>Server Name</strong> field and name it whatever you want &mdash;
                this is yours.
              </li>
              <li>
                In your new server, the default <code>#general</code> text channel is fine, or
                click the <strong>+</strong> next to &quot;Text Channels&quot; to make a new one
                (e.g. <code>#ink-lings</code>).
              </li>
              <li>
                Hover over that channel name and click the gear icon to open{' '}
                <strong>Edit Channel</strong> &rarr; <strong>Integrations</strong>. (Or open{' '}
                <strong>Server Settings</strong> from the dropdown next to your server name and go
                to <strong>Integrations</strong>.)
              </li>
              <li>
                Click <strong>Webhooks</strong> &rarr; <strong>New Webhook</strong>.
              </li>
              <li>
                Give the webhook a name (e.g. &quot;Ink-lings&quot;), confirm the channel it posts
                to, and optionally upload an avatar.
              </li>
              <li>
                Click <strong>Copy Webhook URL</strong>.
              </li>
              <li>
                Come back to the Ink-lings tab, paste the URL into the <strong>Discord webhook URL</strong>{' '}
                field, and click <strong>Send Test to Discord</strong>.
              </li>
              <li>
                If you see the test message appear in your Discord channel, you&apos;re done.
                Finish your onboarding (or save your preferences) and you&apos;ll start getting your
                prompts there.
              </li>
            </ol>

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">
              Want phone notifications?
            </h2>
            <p className="mb-6">
              By default we don&apos;t use <code>@everyone</code> or any other ping, so whether your
              phone buzzes is up to your Discord notification settings. To get a push for every
              prompt, right-click the channel name in Discord (or long-press on mobile) and set{' '}
              <strong>Notifications</strong> to <strong>All Messages</strong>. We recommend keeping
              the webhook in a dedicated channel so this doesn&apos;t make every other conversation
              noisy.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Troubleshooting</h2>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>
                <strong>Test failed?</strong> The most common cause is a stale or deleted webhook.
                Go back to your channel&apos;s Integrations &rarr; Webhooks page, copy the URL again
                (or recreate the webhook), and paste it in fresh.
              </li>
              <li>
                <strong>URL doesn&apos;t paste cleanly?</strong> Make sure you copied the full URL.
                It should start with <code>https://discord.com/api/webhooks/</code>.
              </li>
              <li>
                <strong>Changed your mind?</strong> You can switch back to email anytime from your
                account page &mdash; click <strong>Edit Current Preferences</strong> and pick the{' '}
                <strong>Email</strong> tab.
              </li>
              <li>
                <strong>If a prompt fails to post to Discord</strong> (e.g. you deleted the
                webhook), we&apos;ll automatically fall back to delivering that prompt by email so
                you don&apos;t miss it, and we&apos;ll tell you in that email how to fix the
                webhook.
              </li>
            </ul>

            <p className="mt-10 text-center text-sm text-gray-500">
              Need help? Email{' '}
              <a
                href="mailto:support@inklingsjournal.live"
                className="text-cyan-600 hover:text-cyan-700 underline"
              >
                support@inklingsjournal.live
              </a>{' '}
              and I&apos;ll walk you through it. &mdash; Rachell
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
