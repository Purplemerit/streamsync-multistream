import { Link } from 'react-router-dom'
import { Radio, ArrowLeft } from 'lucide-react'

export default function PrivacyPolicyPage() {
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
        <h1 className="text-display text-gray-900 !mt-0 mb-2">Privacy Policy</h1>
        <p className="text-caption text-gray-400 mb-8">Last updated: May 2026</p>

        <h2>1. Introduction</h2>
        <p>
          StreamSync (&ldquo;we,&rdquo; &ldquo;us&rdquo;) operated by Purple Merit, Bengaluru, respects your privacy. This policy explains how we collect, use, and protect personal data when you use our multistreaming platform.
        </p>

        <h2>2. Information we collect</h2>
        <ul>
          <li>Account information: name, email, profile picture (via Google OAuth if used).</li>
          <li>Stream configuration: platform stream keys and RTMP URLs stored encrypted at rest on our servers.</li>
          <li>Content: uploaded video files and metadata (title, size, upload date).</li>
          <li>Usage data: stream history, session duration, platforms streamed, and technical logs.</li>
        </ul>

        <h2>3. How we use your data</h2>
        <p>
          We use your information to authenticate you, deliver multistreaming services via FFmpeg, display dashboards and history, send service notifications, and improve platform reliability.
        </p>

        <h2>4. Stream keys and security</h2>
        <p>
          Stream keys are sensitive credentials. We store them to enable live streaming on your behalf. You are responsible for keeping keys confidential and rotating them if compromised. Do not share your StreamSync login credentials.
        </p>

        <h2>5. Third-party platforms</h2>
        <p>
          When you connect YouTube or Twitch OAuth, we receive tokens subject to those platforms&apos; privacy policies. We do not sell your personal data to third parties.
        </p>

        <h2>6. Data retention</h2>
        <p>
          Videos and stream history are retained until you delete them or close your account, subject to administrator policies on your deployment.
        </p>

        <h2>7. Your rights</h2>
        <p>
          You may request access, correction, or deletion of your account data by contacting support. Users in applicable jurisdictions may have additional rights under local law.
        </p>

        <h2>8. Contact</h2>
        <p>
          Privacy questions: <Link to="/support" className="text-brand-600 hover:underline">Contact Support</Link>.
        </p>
      </main>
    </div>
  )
}
