import { useCountUp } from '../../hooks/useCountUp'
import { TrendingUp } from 'lucide-react'

export default function StatCard({
  label,
  value,
  icon: Icon,
  suffix = '',
  trend,
  animate = true,
  accent = 'brand',
}) {
  const numeric = typeof value === 'number' ? value : parseInt(String(value).replace(/\D/g, ''), 10) || 0
  const display = useCountUp(numeric, { enabled: animate && typeof value === 'number' })
  const shown = typeof value === 'number' && animate ? display : value

  const accents = {
    brand: 'bg-brand-50 border-brand-100 text-brand-700',
    blue: 'bg-blue-50 border-blue-100 text-blue-700',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    red: 'bg-red-50 border-red-100 text-red-700',
    amber: 'bg-amber-50 border-amber-100 text-amber-700',
  }

  return (
    <div className={`card-interactive p-5 border ${accents[accent] || accents.brand}`}>
      {Icon && <Icon size={20} className="mb-3 opacity-80" />}
      <p className="text-3xl font-bold text-gray-900 tracking-tight">
        {shown}{suffix}
      </p>
      <div className="flex items-center justify-between mt-1">
        <p className="text-caption text-gray-500">{label}</p>
        {trend && (
          <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-600">
            <TrendingUp size={12} /> {trend}
          </span>
        )}
      </div>
    </div>
  )
}
