import AppLayout from '../../components/common/AppLayout'

const MONETIZATION = [
  { platform: 'YouTube', color: '#FF0000', bg: 'rgba(255,0,0,0.08)', border: 'rgba(255,0,0,0.2)', methods: ['Ad revenue share', 'Channel memberships', 'Super Chat & Super Thanks'], type: 'Ad Based' },
  { platform: 'Twitch', color: '#9146FF', bg: 'rgba(145,70,255,0.08)', border: 'rgba(145,70,255,0.2)', methods: ['Subscriptions', 'Bits (virtual currency)', 'Ad revenue share'], type: 'Subscription Based' },
  { platform: 'Facebook', color: '#1877F2', bg: 'rgba(24,119,242,0.08)', border: 'rgba(24,119,242,0.2)', methods: ['Stars (virtual gifts)', 'Fan subscriptions', 'Ad breaks'], type: 'Ad Based' },
  { platform: 'Kick', color: '#53FC18', bg: 'rgba(83,252,24,0.08)', border: 'rgba(83,252,24,0.2)', methods: ['Subscriptions (95% to creator!)', 'Donations (external)', 'Ad revenue share'], type: 'Subscription Based' },
  { platform: 'Rumble', color: '#85C742', bg: 'rgba(133,199,66,0.08)', border: 'rgba(133,199,66,0.2)', methods: ['Ad revenue share', 'Rants (fan tips)', 'Subscriptions'], type: 'Ad Based' },
  { platform: 'Telegram', color: '#229ED9', bg: 'rgba(34,158,217,0.08)', border: 'rgba(34,158,217,0.2)', methods: ['Channel subscriptions', 'Paid content', 'Donations via bots'], type: 'Subscription Based' },
  { platform: 'X (Twitter)', color: '#64748b', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.2)', methods: ['Ad revenue share (Premium)', 'Tips', 'Subscriptions'], type: 'Ad Based' },
  { platform: 'Instagram', color: '#E1306C', bg: 'rgba(225,48,108,0.08)', border: 'rgba(225,48,108,0.2)', methods: ['Badges (virtual gifts)', 'Brand partnerships', 'Shopping'], type: 'Gift Based' },
]

const typeConfig = {
  'Ad Based':           { icon: '📺', color: '#3b82f6' },
  'Subscription Based': { icon: '⭐', color: '#7c3aed' },
  'Gift Based':         { icon: '🎁', color: '#f59e0b' },
}

export default function MonetizationPage() {
  return (
    <AppLayout
      title="How Each Platform Pays You"
      subtitle="Understanding monetization helps you choose the right platforms for your content."
    >
      <div className="flex flex-wrap gap-3 mb-8">
        {Object.entries(typeConfig).map(([type, { icon, color }]) => (
          <div
            key={type}
            style={{ background: `${color}12`, border: `1px solid ${color}30` }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
          >
            <span>{icon}</span>
            <span style={{ color }}>{type}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MONETIZATION.map(p => {
          const { icon } = typeConfig[p.type]
          return (
            <div
              key={p.platform}
              style={{ background: p.bg, border: `1px solid ${p.border}` }}
              className="rounded-2xl p-5 hover:scale-[1.01] transition-transform"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    style={{
                      background: p.color,
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      boxShadow: `0 0 6px ${p.color}`,
                      flexShrink: 0,
                    }}
                  />
                  <span className="font-semibold text-slate-900">{p.platform}</span>
                </div>
                <span
                  style={{
                    color: p.color,
                    background: `${p.color}15`,
                    border: `1px solid ${p.color}30`,
                  }}
                  className="text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1"
                >
                  {icon} {p.type}
                </span>
              </div>

              <ul className="space-y-1.5">
                {p.methods.map((m, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-slate-400 mt-0.5">•</span>
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </AppLayout>
  )
}
