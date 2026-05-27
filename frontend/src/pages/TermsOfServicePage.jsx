import { Link } from 'react-router-dom'
import { Radio, ArrowLeft } from 'lucide-react'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-surface-muted">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-gray-900">
            <span className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center"><Radio size={16} /></span>
            StreamSync
          </Link>
          <Link to="/" className="btn-ghost text-sm gap-1"><ArrowLeft size={16} /> Home</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12 prose-legal">
        <h1 className="text-display text-gray-900 !mt-0 mb-2">Terms of Service</h1>
        <p className="text-caption text-gray-400 mb-8">Last updated: May 2026</p>

        <h2>1. Acceptance</h2>
        <p>
          By accessing StreamSync, you agree to these Terms of Service. If you do not agree, do not use the service.
        </p>

        <h2>2. Service description</h2>
        <p>
          StreamSync provides software to stream pre-recorded video content to third-party live platforms via RTMP. We are not affiliated with YouTube, Twitch, Meta, or other platform operators.
        </p>

        <h2>3. User responsibilities</h2>
        <ul>
          <li>You must comply with each platform&apos;s terms of service and community guidelines.</li>
          <li>You are solely responsible for content you stream and its copyright compliance.</li>
          <li>You must maintain valid stream keys and respect regional restrictions (e.g. TikTok in India).</li>
          <li>You may not use StreamSync for illegal, harmful, or fraudulent activity.</li>
        </ul>

        <h2>4. Account and access</h2>
        <p>
          You are responsible for safeguarding your login credentials. We may suspend accounts that violate these terms or pose security risks.
        </p>

        <h2>5. Availability</h2>
        <p>
          We strive for high uptime but do not guarantee uninterrupted service. Platform outages, FFmpeg errors, or third-party API changes may affect streaming.
        </p>

        <h2>6. Limitation of liability</h2>
        <p>
          StreamSync is provided &ldquo;as is.&rdquo; To the maximum extent permitted by law, Purple Merit is not liable for indirect damages, lost revenue, or platform enforcement actions against your channels.
        </p>

        <h2>7. Changes</h2>
        <p>
          We may update these terms. Continued use after changes constitutes acceptance.
        </p>

        <h2>8. Contact</h2>
        <p>
          Questions: <Link to="/support" className="text-brand-600 hover:underline">Contact Support</Link>.
        </p>
      </main>
    </div>
  )
}
