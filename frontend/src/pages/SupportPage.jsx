import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Radio, ArrowLeft, Send, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SupportPage() {
  const [form, setForm] = useState({ name: '', email: '', issueType: 'technical', message: '' })
  const [sending, setSending] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSending(true)
    setTimeout(() => {
      toast.success('Message sent! We typically respond within 24–48 hours.')
      setForm({ name: '', email: '', issueType: 'technical', message: '' })
      setSending(false)
    }, 800)
  }

  return (
    <div className="min-h-screen bg-surface-muted">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-gray-900">
            <span className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center"><Radio size={16} /></span>
            StreamSync
          </Link>
          <Link to="/help" className="btn-ghost text-sm gap-1"><ArrowLeft size={16} /> Help</Link>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-12">
        <h1 className="text-display text-gray-900 mb-2">Contact Support</h1>
        <p className="text-body text-gray-500 mb-6">Describe your issue and we&apos;ll get back to you.</p>

        <div className="flex items-start gap-3 p-4 rounded-xl bg-brand-50 border border-brand-100 mb-8">
          <Clock size={20} className="text-brand-600 shrink-0 mt-0.5" />
          <p className="text-sm text-brand-800">
            <strong>Expected response time:</strong> 24–48 business hours. Urgent streaming outages — mention &ldquo;Urgent&rdquo; in your message.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 sm:p-8 space-y-5">
          <div>
            <label className="text-caption font-semibold text-gray-600 block mb-1.5">Name</label>
            <input
              required
              className="input-field"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-caption font-semibold text-gray-600 block mb-1.5">Email</label>
            <input
              type="email"
              required
              className="input-field"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="text-caption font-semibold text-gray-600 block mb-1.5">Issue type</label>
            <select
              className="input-field"
              value={form.issueType}
              onChange={(e) => setForm({ ...form, issueType: e.target.value })}
            >
              <option value="technical">Technical / Streaming</option>
              <option value="account">Account & Login</option>
              <option value="billing">Billing</option>
              <option value="feature">Feature request</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-caption font-semibold text-gray-600 block mb-1.5">Message</label>
            <textarea
              required
              rows={5}
              className="input-field resize-y min-h-[120px]"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Include platform names, error messages, and session details if relevant."
            />
          </div>
          <button type="submit" disabled={sending} className="btn-primary w-full py-3 gap-2">
            <Send size={18} /> {sending ? 'Sending...' : 'Send message'}
          </button>
        </form>
      </main>
    </div>
  )
}
