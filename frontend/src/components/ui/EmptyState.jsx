import { Link } from 'react-router-dom'

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-5">
          <Icon size={32} strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-heading text-gray-900 mb-2">{title}</h3>
      <p className="text-body text-gray-500 max-w-sm mb-6">{description}</p>
      {actionLabel && (actionTo ? (
        <Link to={actionTo} className="btn-primary text-sm">{actionLabel}</Link>
      ) : onAction ? (
        <button type="button" onClick={onAction} className="btn-primary text-sm">{actionLabel}</button>
      ) : null)}
    </div>
  )
}
