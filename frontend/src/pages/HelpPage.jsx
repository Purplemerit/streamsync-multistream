import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Radio, Search, ChevronDown, ArrowLeft } from 'lucide-react'

const FAQ = [
  {
    category: 'Getting Started',
    items: [
      { q: 'What is StreamSync?', a: 'StreamSync lets you stream a pre-recorded video live to up to 10 platforms at once using FFmpeg — no OBS required.' },
      { q: 'How do I create an account?', a: 'Click Get Started on the homepage, register with email or Google, then upload a video from My Videos.' },
      { q: 'What file formats are supported?', a: 'MP4, MOV, AVI, and MKV up to 2GB per upload.' },
    ],
  },
  {
    category: 'Stream Keys',
    items: [
      { q: 'Where do I find my stream key?', a: 'Each platform provides keys in its creator dashboard (YouTube Studio, Twitch Dashboard, etc.). Copy the key into Stream Keys.' },
      { q: 'Kick and Instagram need extra fields?', a: 'Yes — both require a custom RTMP URL from your platform dashboard in addition to the stream key.' },
      { q: 'Session vs permanent keys?', a: 'Instagram, TikTok, and BIGO use session keys that expire — refresh before each stream.' },
    ],
  },
  {
    category: 'Platforms',
    items: [
      { q: 'Which platforms are supported?', a: 'YouTube, Twitch, Facebook, Kick, Rumble, Telegram, X, Instagram, TikTok, and BIGO LIVE.' },
      { q: 'TikTok in India?', a: 'TikTok is banned in India — keys may not work for Indian users.' },
      { q: 'X (Twitter) requirements?', a: 'X live streaming typically requires Premium and an active stream key from the platform.' },
    ],
  },
  {
    category: 'Multi-Account',
    items: [
      { q: 'How many accounts per platform?', a: 'Up to 15 labeled accounts per platform (e.g. Main Channel, Gaming, Brand).' },
      { q: 'Can I stream to two YouTube channels?', a: 'Yes — save two YouTube accounts and select both on the Go Live page.' },
      { q: 'How does history track accounts?', a: 'Each stream session records accountId and label per destination.' },
    ],
  },
  {
    category: 'Billing',
    items: [
      { q: 'Is StreamSync free?', a: 'Check with your organization — StreamSync is deployed per your team\'s plan.' },
      { q: 'Storage limits?', a: 'Videos are stored on your deployment server; respect the 2GB per-file upload limit.' },
    ],
  },
]

function FaqItem({ q, a, open, onToggle }) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white transition-all duration-200">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors duration-200"
      >
        <span className="font-medium text-gray-900 text-sm pr-4">{q}</span>
        <ChevronDown size={18} className={`text-gray-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${open ? 'max-h-96' : 'max-h-0'}`}>
        <p className="px-5 pb-4 text-body text-gray-600">{a}</p>
      </div>
    </div>
  )
}

export default function HelpPage() {
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return FAQ
    return FAQ.map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) => item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
      ),
    })).filter((cat) => cat.items.length > 0)
  }, [query])

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

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-display text-gray-900 mb-2">Help Centre</h1>
        <p className="text-body text-gray-500 mb-8">Search FAQs or browse by topic.</p>

        <div className="relative mb-10">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search help articles..."
            className="input-field pl-11"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="text-gray-500 text-center py-12">No results for &ldquo;{query}&rdquo;</p>
        ) : (
          filtered.map((cat) => (
            <section key={cat.category} className="mb-10">
              <h2 className="text-heading-lg text-gray-900 mb-4">{cat.category}</h2>
              <div className="space-y-3">
                {cat.items.map((item) => {
                  const id = `${cat.category}-${item.q}`
                  return (
                    <FaqItem
                      key={id}
                      q={item.q}
                      a={item.a}
                      open={openId === id}
                      onToggle={() => setOpenId(openId === id ? null : id)}
                    />
                  )
                })}
              </div>
            </section>
          ))
        )}

        <p className="text-center text-caption text-gray-500 mt-12">
          Still need help? <Link to="/support" className="text-brand-600 font-medium hover:underline">Contact support</Link>
        </p>
      </main>
    </div>
  )
}
