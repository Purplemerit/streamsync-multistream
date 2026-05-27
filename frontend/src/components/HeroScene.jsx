import { useEffect, useState } from 'react'

/* ── Platform SVG icons (match reference card branding) ─────────── */
const IconYouTube = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="#FF0000" aria-hidden>
    <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .6 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.3.6 9.3.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
  </svg>
)
const IconTwitch = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="#9146FF" aria-hidden>
    <path d="M11.64 5.13 9.84 2.96H2v17.04h5.5V12h3.25l2.5 3.04h3.75l-3.36-4.91zm6.86 9.87h-2.5l-3-3.65V17h-3.25V7.96h6.75v7.04z" />
  </svg>
)
const IconFacebook = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="#1877F2" aria-hidden>
    <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07c0 6.02 4.39 11.02 10.13 11.93v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.89v2.27h3.32l-.53 3.49h-2.79v8.44C19.61 23.09 24 18.09 24 12.07z" />
  </svg>
)
const IconKick = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="#53FC18" aria-hidden>
    <path d="M4 3v18h4.5V14h3L16 21h5l-5.5-8L21 3h-5l-4.5 7V3H4z" />
  </svg>
)
const IconTelegram = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="#26A5E4" aria-hidden>
    <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.57 8.16-1.98 9.33c-.15.67-.55.84-1.11.52l-3.07-2.26-1.48 1.43c-.16.16-.3.3-.61.3l.22-3.12 5.68-5.13c.25-.22-.05-.34-.38-.12l-7.02 4.43-3.03-.95c-.66-.2-.68-.66.14-1l11.82-4.56c.55-.2 1.03.13.86 1.05z" />
  </svg>
)
const IconX = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
    <rect width="24" height="24" rx="5" fill="#0f1419" />
    <path
      fill="#fff"
      d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      transform="translate(3.2, 3.2) scale(0.72)"
    />
  </svg>
)

const ICONS = {
  youtube: IconYouTube,
  facebook: IconFacebook,
  telegram: IconTelegram,
  twitch: IconTwitch,
  kick: IconKick,
  x: IconX,
}

const LEFT_CARDS = [
  { id: 'youtube', name: 'YouTube', viewers: '8,742 watching', float: 'ref-float-1' },
  { id: 'facebook', name: 'Facebook', viewers: '1,209 watching', float: 'ref-float-2' },
  { id: 'telegram', name: 'Telegram', viewers: '542 watching', float: 'ref-float-3' },
]

const RIGHT_CARDS = [
  { id: 'twitch', name: 'Twitch', viewers: '3,421 watching', float: 'ref-float-4' },
  { id: 'kick', name: 'Kick', viewers: '963 watching', float: 'ref-float-5' },
  { id: 'x', name: 'X (Twitter)', viewers: '721 watching', float: 'ref-float-6' },
]

const CHAT_MESSAGES = [
  { user: 'priya_k', text: 'amazing! ❤️' },
  { user: 'raj_dev', text: 'first time here' },
  { user: 'sam_v', text: 'love this stream' },
  { user: 'fan_live', text: 'multistream! 🔥' },
]

const PLATFORM_ROWS = [
  { name: 'YouTube', color: '#FF0000', w: 72, count: '8.7k' },
  { name: 'Twitch', color: '#9146FF', w: 48, count: '3.4k' },
  { name: 'Facebook', color: '#1877F2', w: 32, count: '1.2k' },
  { name: 'Kick', color: '#53FC18', w: 22, count: '963' },
  { name: 'Telegram', color: '#26A5E4', w: 14, count: '542' },
]

const DECK_COLORS = ['#FF0000', '#9146FF', '#1877F2', '#53FC18', '#26A5E4', '#E1306C', '#f59e0b', '#7C3AED']

const START_SECONDS = 125

function formatTimerMMSS(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function LiveBadge({ size = 'md' }) {
  const small = size === 'sm'
  return (
    <span
      className="inline-flex items-center gap-1 font-bold uppercase text-red-500"
      style={{
        fontSize: small ? 7 : 8,
        letterSpacing: '0.06em',
        padding: small ? '2px 6px' : '3px 8px',
        background: 'rgba(239,68,68,0.14)',
        borderRadius: 5,
        border: '1px solid rgba(239,68,68,0.28)',
      }}
    >
      <span className="ref-live-dot rounded-full bg-red-500 shrink-0" style={{ width: small ? 5 : 6, height: small ? 5 : 6 }} />
      Live
    </span>
  )
}

function NotifyCard({ card, visible, side, index }) {
  const Icon = ICONS[card.id]
  const tops = [12, 102, 192]
  const edge = side === 'left' ? { left: -58 } : { right: -58 }

  return (
    <div
      className={`absolute z-40 w-[178px] ${visible ? `ref-spring-pop ${card.float}` : ''}`}
      style={{
        ...edge,
        top: tops[index],
        opacity: visible ? 1 : 0,
        pointerEvents: 'none',
      }}
    >
      <div
        className="bg-white rounded-2xl px-3.5 py-3"
        style={{
          boxShadow: '0 16px 48px rgba(124, 58, 237, 0.18), 0 6px 18px rgba(15, 23, 42, 0.08)',
          border: '1px solid rgba(237, 233, 254, 0.9)',
        }}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon />}
          <span className="font-bold text-gray-900 text-[13px]">{card.name}</span>
          <LiveBadge size="sm" />
        </div>
        <p className="text-[11px] text-gray-500 font-medium mt-1.5 ml-[28px]">{card.viewers}</p>
      </div>
    </div>
  )
}

export default function HeroScene() {
  const [seconds, setSeconds] = useState(START_SECONDS)
  const [cardCount, setCardCount] = useState(0)
  const [chatCount, setChatCount] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (cardCount >= 6) return
    const t = setTimeout(() => setCardCount((c) => c + 1), 400)
    return () => clearTimeout(t)
  }, [cardCount])

  useEffect(() => {
    if (chatCount >= CHAT_MESSAGES.length) return
    const t = setTimeout(() => setChatCount((c) => c + 1), 680)
    return () => clearTimeout(t)
  }, [chatCount])

  return (
    <div
      className="relative select-none"
      style={{ width: 560, maxWidth: '100%', margin: '0 auto' }}
      aria-hidden
    >
      <style>{`
        @keyframes ref-spring-pop {
          0% { opacity: 0; transform: scale(0.5) translateY(20px); }
          70% { transform: scale(1.04) translateY(-5px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .ref-spring-pop { animation: ref-spring-pop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }

        @keyframes ref-float-1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes ref-float-2 { 0%,100%{transform:translateY(-6px)} 50%{transform:translateY(8px)} }
        @keyframes ref-float-3 { 0%,100%{transform:translateY(7px)} 50%{transform:translateY(-9px)} }
        @keyframes ref-float-4 { 0%,100%{transform:translateY(-8px)} 50%{transform:translateY(9px)} }
        @keyframes ref-float-5 { 0%,100%{transform:translateY(6px)} 50%{transform:translateY(-8px)} }
        @keyframes ref-float-6 { 0%,100%{transform:translateY(-7px)} 50%{transform:translateY(7px)} }
        .ref-float-1 { animation: ref-float-1 4.5s ease-in-out infinite; }
        .ref-float-2 { animation: ref-float-2 5s ease-in-out infinite 0.2s; }
        .ref-float-3 { animation: ref-float-3 4.8s ease-in-out infinite 0.45s; }
        .ref-float-4 { animation: ref-float-4 4.6s ease-in-out infinite 0.1s; }
        .ref-float-5 { animation: ref-float-5 5.2s ease-in-out infinite 0.35s; }
        .ref-float-6 { animation: ref-float-6 4.9s ease-in-out infinite 0.6s; }

        @keyframes ref-live-blink {
          0%,100% { opacity: 1; box-shadow: 0 0 8px #ef4444; }
          50% { opacity: 0.3; box-shadow: none; }
        }
        .ref-live-dot { animation: ref-live-blink 1.1s ease-in-out infinite; }

        @keyframes ref-glow-pulse {
          0%,100% { opacity: 0.5; transform: translateX(-50%) scale(1); }
          50% { opacity: 0.95; transform: translateX(-50%) scale(1.06); }
        }
        .ref-monitor-glow { animation: ref-glow-pulse 3s ease-in-out infinite; }

        @keyframes ref-deck-pulse {
          0%,100% { filter: brightness(1); box-shadow: 0 0 0 transparent; }
          50% { filter: brightness(1.3); box-shadow: 0 0 12px currentColor; }
        }
        .ref-deck-key { animation: ref-deck-pulse 2s ease-in-out infinite; }

        @keyframes ref-chat-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ref-chat-in { animation: ref-chat-in 0.4s ease-out forwards; }

        @keyframes ref-arm-l {
          0%,100% { transform: rotate(-14deg) translateY(0); }
          50% { transform: rotate(-18deg) translateY(3px); }
        }
        @keyframes ref-arm-r {
          0%,100% { transform: rotate(14deg) translateY(0); }
          50% { transform: rotate(18deg) translateY(3px); }
        }
        .ref-arm-l { animation: ref-arm-l 0.45s ease-in-out infinite; }
        .ref-arm-r { animation: ref-arm-r 0.45s ease-in-out infinite 0.1s; }

        @keyframes ref-scroll-bounce {
          0%,100% { transform: translateY(0); opacity: 0.85; }
          50% { transform: translateY(4px); opacity: 1; }
        }
        .ref-scroll-hint { animation: ref-scroll-bounce 2s ease-in-out infinite; }

        @media (max-width: 900px) {
          .ref-notify-outside { display: none !important; }
        }
      `}</style>

      {/* Floating platform cards — outside scene, like reference */}
      <div className="ref-notify-outside">
        {LEFT_CARDS.map((c, i) => (
          <NotifyCard key={c.id} card={c} visible={cardCount > i} side="left" index={i} />
        ))}
        {RIGHT_CARDS.map((c, i) => (
          <NotifyCard key={c.id} card={c} visible={cardCount > i + 3} side="right" index={i} />
        ))}
      </div>

      {/* 560 × 400 scene card */}
      <div
        className="relative mx-auto overflow-hidden"
        style={{
          width: '100%',
          height: 400,
          borderRadius: 28,
          background: 'linear-gradient(180deg, #f3f0ff 0%, #ede9fe 46%, #ddd6fe 100%)',
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.65), 0 28px 60px -16px rgba(124, 58, 237, 0.32), 0 12px 28px rgba(15, 23, 42, 0.07)',
        }}
      >
        <div
          className="ref-monitor-glow absolute pointer-events-none"
          style={{
            left: '50%',
            top: 58,
            width: 300,
            height: 175,
            background:
              'radial-gradient(ellipse at center, rgba(167,139,250,0.6) 0%, rgba(124,58,237,0.2) 50%, transparent 72%)',
          }}
        />

        {/* Monitors row */}
        <div
          className="absolute left-0 right-0 flex items-end justify-center"
          style={{ bottom: 162, gap: 8, padding: '0 18px', zIndex: 22 }}
        >
          {/* Left — Live Chat */}
          <div className="flex flex-col items-center shrink-0" style={{ width: 128 }}>
            <div
              className="w-full rounded-[10px] overflow-hidden"
              style={{
                background: '#12102a',
                border: '2px solid #4c4589',
                boxShadow: '0 10px 28px rgba(0,0,0,0.28)',
                minHeight: 100,
              }}
            >
              <div className="px-2.5 py-1.5 border-b border-[#3b3568]" style={{ background: '#1a1735' }}>
                <span style={{ fontSize: 10, color: '#c4b5fd', fontWeight: 700 }}>Live Chat</span>
              </div>
              <div className="px-2 py-1.5 overflow-hidden" style={{ height: 88 }}>
                {CHAT_MESSAGES.slice(0, chatCount).map((msg) => (
                  <div key={msg.user} className="ref-chat-in mb-1.5">
                    <p style={{ fontSize: 9, color: '#a78bfa', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
                      {msg.user}:
                    </p>
                    <p style={{ fontSize: 9, color: '#e2e8f0', margin: 0, lineHeight: 1.3 }}>{msg.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ width: 42, height: 5, background: '#5b5694', marginTop: 2 }} />
            <div style={{ width: 60, height: 4, background: '#2e2b52', borderRadius: '0 0 3px 3px' }} />
          </div>

          {/* Center — StreamSync */}
          <div className="flex flex-col items-center shrink-0 relative" style={{ width: 244 }}>
            <div
              className="w-full rounded-[10px] overflow-hidden relative"
              style={{
                background: '#0c0a1a',
                border: '2px solid #7c3aed',
                boxShadow: '0 0 40px rgba(124, 58, 237, 0.65), 0 14px 32px rgba(0,0,0,0.35)',
                minHeight: 138,
              }}
            >
              <div
                className="flex items-center justify-between px-3 py-2 border-b border-[#5b21b6]/60"
                style={{ background: '#16132e' }}
              >
                <div className="flex items-center gap-1.5">
                  <span style={{ fontSize: 15, lineHeight: 1 }}>⚡</span>
                  <span style={{ fontSize: 12, color: '#fff', fontWeight: 800, letterSpacing: '-0.03em' }}>
                    StreamSync
                  </span>
                </div>
                <LiveBadge />
              </div>
              <div className="px-3 py-2">
                <p
                  className="text-center font-mono font-bold text-white"
                  style={{
                    fontSize: 40,
                    lineHeight: 1,
                    letterSpacing: 4,
                    textShadow: '0 0 32px rgba(196,181,253,1), 0 0 64px rgba(124,58,237,0.45)',
                  }}
                >
                  {formatTimerMMSS(seconds)}
                </p>
                <div className="mt-2.5 space-y-1">
                  {PLATFORM_ROWS.map((row) => (
                    <div key={row.name} className="flex items-center gap-1.5">
                      <span style={{ fontSize: 8, color: '#94a3b8', width: 46, flexShrink: 0 }}>{row.name}</span>
                      <div className="flex-1 h-[7px] rounded-full overflow-hidden" style={{ background: '#1a1735' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${row.w}%`,
                            backgroundColor: row.color,
                            boxShadow: `0 0 10px ${row.color}99`,
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 8, color: '#e2e8f0', width: 26, textAlign: 'right', flexShrink: 0 }}>
                        {row.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ width: 76, height: 6, background: '#7c3aed', marginTop: 2 }} />
            <div style={{ width: 92, height: 5, background: '#2e2b52', borderRadius: '0 0 4px 4px' }} />
          </div>

          {/* Right — Total Viewers */}
          <div className="flex flex-col items-center shrink-0" style={{ width: 128 }}>
            <div
              className="w-full rounded-[10px] overflow-hidden"
              style={{
                background: '#12102a',
                border: '2px solid #4c4589',
                boxShadow: '0 10px 28px rgba(0,0,0,0.28)',
                minHeight: 100,
              }}
            >
              <div className="px-2.5 py-1.5 border-b border-[#3b3568]" style={{ background: '#1a1735' }}>
                <span style={{ fontSize: 10, color: '#c4b5fd', fontWeight: 700 }}>📊 Total Viewers</span>
              </div>
              <div className="px-2.5 py-2 flex flex-col" style={{ height: 88 }}>
                <p style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1 }}>14.3k</p>
                <p style={{ fontSize: 8, color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>across 6 platforms</p>
                <p style={{ fontSize: 9, color: '#34d399', fontWeight: 700, marginTop: 3 }}>▲ +12.5% last 5 min</p>
                <div className="flex items-end gap-0.5 mt-auto" style={{ height: 28 }}>
                  {[28, 48, 36, 62, 42, 74, 52, 68, 44].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-sm"
                      style={{
                        height: `${h}%`,
                        background: 'linear-gradient(to top, #6d28d9, #c4b5fd)',
                        minHeight: 3,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div style={{ width: 42, height: 5, background: '#5b5694', marginTop: 2 }} />
            <div style={{ width: 60, height: 4, background: '#2e2b52', borderRadius: '0 0 3px 3px' }} />
          </div>
        </div>

        {/* Stream deck — desk, left of center monitor */}
        <div
          className="absolute z-25"
          style={{
            left: 108,
            bottom: 168,
            background: '#0c0a1a',
            borderRadius: 9,
            padding: 6,
            border: '1.5px solid #4c4589',
            boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5 }}>
            {DECK_COLORS.map((c, i) => (
              <div
                key={i}
                className="ref-deck-key"
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 4,
                  backgroundColor: c,
                  color: c,
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Mic — between center and right monitor */}
        <div className="absolute z-25 flex flex-col items-center" style={{ left: 398, bottom: 172 }}>
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: 'linear-gradient(145deg, #6b7280, #374151)',
              border: '2px solid #9ca3af',
              boxShadow: 'inset 0 -3px 5px rgba(0,0,0,0.35)',
            }}
          />
          <div
            style={{
              width: 5,
              height: 24,
              background: 'linear-gradient(180deg, #9ca3af, #4b5563)',
              marginTop: -3,
              borderRadius: 2,
            }}
          />
          <div style={{ width: 26, height: 5, background: '#6b7280', borderRadius: 3, marginTop: -1 }} />
        </div>

        {/* Person + gaming chair (back view) */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{ bottom: 44, width: 172, height: 178, zIndex: 14 }}
        >
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2" style={{ width: 108, height: 22 }}>
            <div style={{ position: 'absolute', left: 2, bottom: 0, width: 12, height: 12, borderRadius: '50%', background: '#232045' }} />
            <div style={{ position: 'absolute', right: 2, bottom: 0, width: 12, height: 12, borderRadius: '50%', background: '#232045' }} />
            <div
              style={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                bottom: 0,
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: '#232045',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                bottom: 11,
                width: 7,
                height: 24,
                background: '#312e5e',
                borderRadius: 3,
              }}
            />
          </div>

          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              bottom: 20,
              width: 124,
              height: 22,
              background: 'linear-gradient(180deg, #32305c 0%, #1f1d3a 100%)',
              borderRadius: '12px 12px 6px 6px',
            }}
          />

          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              bottom: 38,
              width: 104,
              height: 92,
              background: 'linear-gradient(180deg, #434078 0%, #262347 100%)',
              borderRadius: '16px 16px 10px 10px',
              boxShadow: 'inset 0 -10px 24px rgba(0,0,0,0.4)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -14,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 68,
                height: 18,
                background: '#434078',
                borderRadius: '12px 12px 4px 4px',
              }}
            />
          </div>

          <div style={{ position: 'absolute', bottom: 50, left: 4, width: 14, height: 34, background: '#2d2a52', borderRadius: 6 }} />
          <div style={{ position: 'absolute', bottom: 50, right: 4, width: 14, height: 34, background: '#2d2a52', borderRadius: 6 }} />

          <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: 56, width: 86 }}>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 72,
                height: 8,
                background: '#15132a',
                borderRadius: 8,
                zIndex: 6,
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 4,
                left: -2,
                width: 14,
                height: 22,
                background: '#15132a',
                borderRadius: '10px 0 0 10px',
                border: '2px solid #3d3a6b',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 4,
                right: -2,
                width: 14,
                height: 22,
                background: '#15132a',
                borderRadius: '0 10px 10px 0',
                border: '2px solid #3d3a6b',
              }}
            />
            <div
              style={{
                width: 36,
                height: 36,
                margin: '8px auto 0',
                borderRadius: '50%',
                background: 'linear-gradient(165deg, #7a5230 0%, #4a3018 100%)',
                border: '2px solid #3d3528',
                position: 'relative',
                zIndex: 5,
              }}
            />
            <div
              style={{
                width: 76,
                height: 48,
                margin: '-3px auto 0',
                background: 'linear-gradient(180deg, #2f3d72 0%, #1a2248 100%)',
                borderRadius: '24px 24px 12px 12px',
                boxShadow: '0 6px 14px rgba(0,0,0,0.25)',
              }}
            />
            <div
              className="ref-arm-l"
              style={{
                position: 'absolute',
                bottom: 4,
                left: -8,
                width: 28,
                height: 10,
                background: '#1a2248',
                borderRadius: 6,
              }}
            />
            <div
              className="ref-arm-r"
              style={{
                position: 'absolute',
                bottom: 4,
                right: -8,
                width: 28,
                height: 10,
                background: '#1a2248',
                borderRadius: 6,
              }}
            />
          </div>
        </div>

        {/* Desk */}
        <div className="absolute bottom-0 left-0 right-0 z-30" style={{ height: 54 }}>
          <div style={{ position: 'absolute', bottom: 0, left: 48, width: 10, height: 42, background: '#8b5cf6', borderRadius: '0 0 5px 5px' }} />
          <div style={{ position: 'absolute', bottom: 0, right: 48, width: 10, height: 42, background: '#8b5cf6', borderRadius: '0 0 5px 5px' }} />
          <div
            style={{
              position: 'absolute',
              bottom: 38,
              left: 20,
              right: 20,
              height: 14,
              background: 'linear-gradient(180deg, #ddd6fe 0%, #c4b5fd 45%, #a78bfa 100%)',
              borderRadius: '8px 8px 0 0',
              boxShadow: '0 -6px 20px rgba(124, 58, 237, 0.3)',
            }}
          />
          <div className="absolute flex flex-col items-center" style={{ right: 28, bottom: 42 }}>
            <div
              style={{
                width: 26,
                height: 16,
                background: '#22c55e',
                borderRadius: '50% 50% 42% 42%',
                boxShadow: '0 3px 8px rgba(34,197,94,0.45)',
              }}
            />
            <div
              style={{
                width: 16,
                height: 14,
                background: 'linear-gradient(180deg, #8b5cf6, #6d28d9)',
                borderRadius: '0 0 5px 5px',
                marginTop: -3,
              }}
            />
          </div>
        </div>

        {/* Scroll hint — bottom center per reference */}
        <div
          className="ref-scroll-hint absolute left-1/2 -translate-x-1/2 z-40 flex items-center justify-center"
          style={{
            bottom: 6,
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(30, 27, 75, 0.88)',
            boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>
    </div>
  )
}
