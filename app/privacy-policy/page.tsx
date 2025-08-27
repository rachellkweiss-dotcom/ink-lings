export default function PrivacyPolicyPage() {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-blue-900/10 dark:to-cyan-900/10" style={{ fontFamily: 'var(--font-shadows-into-light)' }}>
        <div className="max-w-4xl mx-auto p-8">
          <div className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Privacy Policy</h1>
  
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-600 mb-6"><strong>Last Updated:</strong> August 2025</p>
  
              <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">What We Collect</h2>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li><strong>Identifiers:</strong> Email address.</li>
                <li><strong>Preferences:</strong> Selected journal categories, notification schedule, timezone.</li>
                <li><strong>Authentication:</strong> Supabase session identifiers and necessary security cookies; authentication method (Google OAuth or email/password).</li>
                <li><strong>Service Logs:</strong> Basic device/browser info, IP address, timestamps, email/prompt delivery status.</li>
                <li><strong>We do not collect:</strong> Your journal entries or other personal responses to prompts.</li>
              </ul>
  
              <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">How We Use Data</h2>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li><strong>Perform the service (contract):</strong> Authenticate your account, send prompts on your schedule, store preferences, and secure your session.</li>
                <li><strong>Improve & protect (legitimate interests):</strong> Diagnose issues, measure deliverability, prevent abuse/fraud.</li>
                <li><strong>Communications:</strong> Transactional emails (account, prompts, critical notices). We only send optional updates with your consent; you can opt out anytime.</li>
              </ul>
  
              <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Cookies & Similar Technologies</h2>
              <p className="mb-6">
                We use <strong>strictly necessary</strong> cookies set by Supabase Auth to keep you signed in and secure the session.
                We do not use advertising cookies or cross-site tracking pixels.
              </p>
  
              <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Data Storage & Security</h2>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li><strong>Database:</strong> Supabase (PostgreSQL) with TLS in transit and encryption at rest.</li>
                <li><strong>Hosting:</strong> Vercel for application hosting and logs.</li>
                <li><strong>Email:</strong> Resend for transactional email delivery.</li>
                <li><strong>Controls:</strong> Least-privilege access, credential management, and routine backups/monitoring.</li>
              </ul>
  
              <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">International Data Transfers</h2>
              <p className="mb-6">
                Our processors (Supabase, Vercel, Resend) may process data in the United States and other countries.
                Where required, we rely on Standard Contractual Clauses or equivalent safeguards for cross-border transfers.
              </p>
  
              <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Data Sharing</h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <strong>We do NOT sell your data.</strong><br />
                <strong>We do NOT share your data with third parties</strong> except to operate the service:
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li><strong>Supabase</strong> (authentication & database)</li>
                  <li><strong>Vercel</strong> (app hosting)</li>
                  <li><strong>Resend</strong> (email delivery)</li>
                  <li><strong>Stripe</strong> (donations, if you choose to donate)</li>
                </ul>
              </div>
  
              <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Your Rights</h2>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li><strong>Access / Correction:</strong> View and update your information in the app or by request.</li>
                <li><strong>Deletion:</strong> Request account deletion at any time.</li>
                <li><strong>Pause:</strong> Stop notifications at any time in settings.</li>
                <li><strong>Export:</strong> Contact us to request a machine-readable export of your data.</li>
              </ul>
  
              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Regional Disclosures</h3>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li><strong>California (CPRA):</strong> We <em>do not sell or share</em> personal information for cross-context behavioral advertising.</li>
                <li><strong>EEA/UK (GDPR):</strong> Our legal bases are <em>contract</em> (to provide the service) and <em>legitimate interests</em> (to secure and improve it). You may have additional rights to object or complain to your local authority.</li>
              </ul>
  
              <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">How to Exercise Your Rights</h2>
              <p className="mb-6">
                Email <a href="mailto:support@inklingsjournal.live" className="text-blue-600 underline">support@inklingsjournal.live</a> from the address on file.
                We may ask you to verify ownership by replying from that address before we act on your request.
              </p>
  
              <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Data Retention</h2>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li><strong>Active accounts:</strong> Retained while your account is open.</li>
                <li><strong>Prompt & delivery logs:</strong> Retained up to <strong>90 days</strong> for troubleshooting and abuse prevention.</li>
                <li><strong>Deleted accounts:</strong> Active records removed within <strong>30 days</strong> of a verified request; residual copies may remain in encrypted backups for up to <strong>90 days</strong> and then purge on routine cycles.</li>
              </ul>
  
              <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Children</h2>
              <p className="mb-6">
                Ink-lings is not directed to children under 13, and we do not knowingly collect personal information from children.
                If you believe a child has provided data, contact us and we will delete it.
              </p>
  
              <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Changes</h2>
              <p className="mb-6">
                We may update this policy from time to time. If we make material changes, we will notify you by email or in-app notice.
                Continued use after changes become effective constitutes acceptance.
              </p>
  
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 mt-0 mb-4">Contact</h2>
                <p><strong>Email:</strong> <a href="mailto:support@inklingsjournal.live" className="text-blue-600 underline">support@inklingsjournal.live</a></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
