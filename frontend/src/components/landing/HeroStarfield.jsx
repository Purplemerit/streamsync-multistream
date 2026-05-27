import { PlatformBrandIcon } from './platformBrandIcons'

/** Brand colors for drop-shadow glow */
const BRAND_GLOW = {
  youtube: '#FF0000',
  twitch: '#9146FF',
  facebook: '#1877F2',
  kick: '#53FC18',
  rumble: '#85C742',
  telegram: '#229ED9',
  x: '#0f1419',
  instagram: '#E1306C',
  tiktok: '#FE2C55',
  bigo: '#f59e0b',
}

/** All 10 platforms — 64–80px, full viewport spread */
const ICON_PLACEMENTS = [
  { id: 'youtube', size: 80, left: 6, top: 10, drift: 1, duration: 14, delay: 0 },
  { id: 'twitch', size: 68, left: 92, top: 8, drift: 2, duration: 8, delay: 1.2 },
  { id: 'facebook', size: 72, left: 88, top: 42, drift: 3, duration: 11, delay: 0.5 },
  { id: 'kick', size: 64, left: 5, top: 48, drift: 4, duration: 6, delay: 3 },
  { id: 'rumble', size: 76, left: 10, top: 82, drift: 5, duration: 13, delay: 2 },
  { id: 'telegram', size: 66, left: 93, top: 75, drift: 6, duration: 9, delay: 4.2 },
  { id: 'x', size: 70, left: 78, top: 88, drift: 1, duration: 10, delay: 1.8 },
  { id: 'instagram', size: 64, left: 22, top: 18, drift: 2, duration: 7, delay: 0.3 },
  { id: 'tiktok', size: 78, left: 50, top: 6, drift: 3, duration: 12, delay: 3.5 },
  { id: 'bigo', size: 68, left: 48, top: 90, drift: 4, duration: 8.5, delay: 5 },
]

const DRIFT_CSS = `
  @keyframes hero-drift-1 {
    0%, 100% { transform: translate(0, 0); }
    25% { transform: translate(18px, -22px); }
    50% { transform: translate(-14px, 16px); }
    75% { transform: translate(10px, 20px); }
  }
  @keyframes hero-drift-2 {
    0%, 100% { transform: translate(0, 0); }
    33% { transform: translate(-20px, 14px); }
    66% { transform: translate(16px, -18px); }
  }
  @keyframes hero-drift-3 {
    0%, 100% { transform: translate(0, 0); }
    20% { transform: translate(12px, 10px); }
    40% { transform: translate(-18px, -8px); }
    60% { transform: translate(8px, -20px); }
    80% { transform: translate(-10px, 18px); }
  }
  @keyframes hero-drift-4 {
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(22px, 10px); }
  }
  @keyframes hero-drift-5 {
    0%, 100% { transform: translate(0, 0); }
    25% { transform: translate(-14px, -20px); }
    75% { transform: translate(20px, 12px); }
  }
  @keyframes hero-drift-6 {
    0%, 100% { transform: translate(0, 0); }
    30% { transform: translate(10px, 22px); }
    70% { transform: translate(-22px, -10px); }
  }
  .hero-drift-1 { animation: hero-drift-1 var(--hero-drift-dur) ease-in-out infinite; animation-delay: var(--hero-drift-delay); }
  .hero-drift-2 { animation: hero-drift-2 var(--hero-drift-dur) ease-in-out infinite; animation-delay: var(--hero-drift-delay); }
  .hero-drift-3 { animation: hero-drift-3 var(--hero-drift-dur) ease-in-out infinite; animation-delay: var(--hero-drift-delay); }
  .hero-drift-4 { animation: hero-drift-4 var(--hero-drift-dur) ease-in-out infinite; animation-delay: var(--hero-drift-delay); }
  .hero-drift-5 { animation: hero-drift-5 var(--hero-drift-dur) ease-in-out infinite; animation-delay: var(--hero-drift-delay); }
  .hero-drift-6 { animation: hero-drift-6 var(--hero-drift-dur) ease-in-out infinite; animation-delay: var(--hero-drift-delay); }
`

const ICON_SIZE = 48

function PlatformIcon({ placement }) {
  const { id, left, top, drift, duration, delay } = placement
  const brandColor = BRAND_GLOW[id] || '#7C3AED'

  return (
    <div
      className={`hero-drift-${drift} absolute flex items-center justify-center`}
      style={{
        left: `${left}%`,
        top: `${top}%`,
        width: ICON_SIZE,
        height: ICON_SIZE,
        marginLeft: -ICON_SIZE / 2,
        marginTop: -ICON_SIZE / 2,
        opacity: 1,
        zIndex: 5,
        ['--hero-drift-dur']: `${duration}s`,
        ['--hero-drift-delay']: `${delay}s`,
      }}
    >
      <div
        className="relative w-full h-full flex items-center justify-center bg-white"
        style={{
          borderRadius: 18,
          boxShadow: '0 8px 32px rgba(124, 58, 237, 0.18)',
          filter: `drop-shadow(0 0 12px ${brandColor})`,
        }}
      >
        <PlatformBrandIcon id={id} className="w-[26px] h-[26px]" />
      </div>
    </div>
  )
}

/** Floating platform icons layer (z-index 5) — mesh canvas is separate */
export default function HeroStarfield() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[5]" aria-hidden>
      <style>{DRIFT_CSS}</style>
      {ICON_PLACEMENTS.map((p) => (
        <PlatformIcon key={p.id} placement={p} />
      ))}
    </div>
  )
}
