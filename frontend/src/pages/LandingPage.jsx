import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  Radio,
  Upload,
  ListChecks,
  Play,
  Zap,
  BarChart3,
  ChevronRight,
  ArrowRight,
} from 'lucide-react'
import { PLATFORMS } from '../constants/platforms'
import ScrollReveal from '../components/ui/ScrollReveal'
import LandingFooter from '../components/landing/LandingFooter'
import HeroMeshCanvas from '../components/landing/HeroMeshCanvas'
import HeroStarfield from '../components/landing/HeroStarfield'
import { PlatformBrandIcon } from '../components/landing/platformBrandIcons'

const steps = [
  {
    num: '01',
    icon: Upload,
    title: 'Upload your video',
    desc: 'Drop your pre-recorded MP4 (up to 2GB). We handle encoding and delivery.',
  },
  {
    num: '02',
    icon: ListChecks,
    title: 'Select platforms',
    desc: 'Pick where to go live — up to 15 labeled accounts per platform.',
  },
  {
    num: '03',
    icon: Play,
    title: 'Go live everywhere',
    desc: 'One click starts FFmpeg tee streaming to every destination at once.',
  },
]

const whyFeatures = [
  {
    icon: Upload,
    title: 'One upload, everywhere',
    desc: 'Upload once and reach YouTube, Twitch, Facebook, and seven more platforms simultaneously.',
  },
  {
    icon: Zap,
    title: 'Up to 150 streams at once',
    desc: 'Ten platforms × fifteen accounts per platform — multistream at true scale.',
  },
  {
    icon: BarChart3,
    title: 'Real-time analytics',
    desc: 'Monitor live status, viewer signals, and stream health from one dashboard.',
  },
]

export default function LandingPage() {
  const [staggered, setStaggered] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setStaggered(true), 150)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-600 text-white shadow-soft transition-transform duration-200 group-hover:scale-105">
              <Radio size={18} />
            </span>
            <span className="text-xl font-bold text-gray-900">StreamSync</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/help" className="hidden sm:inline btn-ghost text-sm py-2">Help</Link>
            <Link to="/login" className="btn-secondary text-sm py-2 px-4">Login</Link>
            <Link to="/register" className="btn-primary text-sm py-2 px-4">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section
        className="relative min-h-screen w-full flex flex-col items-center justify-center pt-24 pb-16 px-4 sm:px-8 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
        }}
      >
        <HeroMeshCanvas />
        <HeroStarfield />

        <div className="relative z-[10] w-full max-w-4xl mx-auto flex flex-col items-center text-center landing-hero-text px-4 py-8 sm:py-10">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50/80 border border-brand-200/80 px-3 py-1.5 rounded-full mb-8">
            <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
            Multistream SaaS for creators
          </p>

          <h1 className="text-6xl md:text-7xl font-black text-gray-900 tracking-tight leading-[1.05] mb-6">
            Stream everywhere.
            <br />
            <span className="relative inline-block text-brand-600 mt-1">
              One upload.
              <span className="hero-underline-glow" aria-hidden />
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 max-w-[520px] mx-auto mb-10 leading-relaxed">
            Riverside-quality simplicity for pre-recorded live. Upload once, select your accounts, and go live on 10 platforms simultaneously.
          </p>

          <div className="btn-shimmer-wrap inline-flex rounded-xl mb-6">
            <Link
              to="/register"
              className="btn-primary px-8 py-4 text-lg font-bold inline-flex items-center gap-2 relative z-[1]"
            >
              Start free
              <ArrowRight size={20} strokeWidth={2.5} />
            </Link>
          </div>

          <p className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-10">
            <span className="text-amber-400 tracking-wide" aria-hidden>
              ★★★★★
            </span>
            <span className="font-medium">Loved by 500+ creators</span>
          </p>

          <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
            {PLATFORMS.map((p, i) => (
              <span
                key={p.id}
                className={`inline-flex items-center gap-1.5 text-xs font-medium bg-white/90 border border-gray-200/90 rounded-full px-3 py-1.5 shadow-soft transition-all duration-500 ease-out ${
                  staggered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${p.dot}`} />
                {p.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 1: How it works ─── */}
      <section className="py-24 px-4 sm:px-8" style={{ background: '#FAFAFA' }}>
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 text-center mb-16 tracking-tight">
              Go live in 3 simple steps
            </h2>
          </ScrollReveal>

          <div className="relative grid md:grid-cols-3 gap-8 md:gap-6">
            {/* Dashed connector + traveling dot (desktop) */}
            <div
              className="hidden md:block absolute top-[4.5rem] left-[18%] right-[18%] h-0 pointer-events-none"
              aria-hidden
            >
              <div className="relative w-full border-t-2 border-dashed border-brand-300/80">
                <span className="step-connector-dot absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-brand-600 shadow-glow" />
              </div>
            </div>

            {steps.map((step, i) => (
              <ScrollReveal key={step.num} delay={i * 120}>
                <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center relative z-10 transition-all duration-200 hover:shadow-card-hover hover:-translate-y-1">
                  <p className="text-5xl font-black text-brand-600/90 mb-4 leading-none">{step.num}</p>
                  <div className="w-14 h-14 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center mx-auto mb-5">
                    <step.icon size={28} strokeWidth={2} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 2: Platform grid ─── */}
      <section className="py-24 px-4 sm:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 text-center mb-14 tracking-tight">
              Stream to 10 platforms simultaneously
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
            {PLATFORMS.map((p, i) => (
              <ScrollReveal key={p.id} delay={i * 50}>
                <div
                  className="group bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 text-center transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 hover:border-transparent"
                  style={{
                    ['--hover-accent']: p.hex,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = p.hex
                    e.currentTarget.style.boxShadow = `0 8px 24px -4px ${p.hex}33`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = ''
                    e.currentTarget.style.boxShadow = ''
                  }}
                >
                  <div
                    className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-soft"
                  >
                    <PlatformBrandIcon id={p.id} className="w-7 h-7" />
                  </div>
                  <p className="font-bold text-gray-900 text-sm mb-1">{p.label}</p>
                  <p className="text-xs text-gray-500">Up to 15 accounts</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 3: Why StreamSync ─── */}
      <section className="py-24 px-4 sm:px-8" style={{ background: '#F5F3FF' }}>
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 text-center mb-14 tracking-tight">
              Why StreamSync
            </h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6">
            {whyFeatures.map((f, i) => (
              <ScrollReveal key={f.title} delay={i * 100}>
                <div className="bg-white border border-brand-100/80 rounded-2xl p-8 h-full transition-all duration-200 hover:shadow-card-hover hover:-translate-y-1">
                  <div className="w-14 h-14 rounded-full bg-brand-600 text-white flex items-center justify-center mb-5 shadow-glow">
                    <f.icon size={26} strokeWidth={2} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 4: CTA banner ─── */}
      <section className="py-20 px-4 sm:px-8 bg-brand-600">
        <ScrollReveal>
          <div className="max-w-3xl mx-auto text-center py-6 sm:py-10">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 tracking-tight">
              Ready to go live everywhere?
            </h2>
            <p className="text-brand-100 text-lg mb-10 max-w-md mx-auto">
              Join 500+ creators streaming smarter
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold text-lg px-10 py-4 rounded-xl hover:scale-[1.02] transition-all duration-200 shadow-lg"
            >
              Start for free
              <ChevronRight size={20} />
            </Link>
          </div>
        </ScrollReveal>
      </section>

      <LandingFooter />
    </div>
  )
}
