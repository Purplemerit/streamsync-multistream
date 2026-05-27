import { Link } from 'react-router-dom'
import { Radio } from 'lucide-react'

const footerLinks = [
  { to: '/help', label: 'Help Centre' },
  { to: '/support', label: 'Support' },
  { to: '/privacy-policy', label: 'Privacy Policy' },
  { to: '/terms-of-service', label: 'Terms of Service' },
]

export default function LandingFooter() {
  return (
    <footer className="bg-[#1E1B4B] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-14">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
          <div className="max-w-sm">
            <Link to="/" className="flex items-center gap-2 mb-4 group">
              <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-500 text-white transition-transform duration-200 group-hover:scale-105">
                <Radio size={18} />
              </span>
              <span className="text-lg font-bold">StreamSync</span>
            </Link>
            <p className="text-sm text-indigo-200/90 leading-relaxed">
              Multistream pre-recorded video to 10 platforms — one upload, every destination. Built for creators who scale.
            </p>
          </div>

          <nav className="flex flex-col sm:flex-row sm:flex-wrap gap-x-10 gap-y-3 text-sm">
            {footerLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-indigo-200/90 hover:text-white transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-10 pt-8 border-t border-indigo-800/60">
          <p className="text-sm text-indigo-300/80 text-center sm:text-left">
            © 2026 StreamSync — Purple Merit, Bengaluru
          </p>
        </div>
      </div>
    </footer>
  )
}
