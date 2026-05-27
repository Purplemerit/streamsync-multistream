import { AlertCircle, RefreshCw } from 'lucide-react'

export default function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-5">
        <AlertCircle size={32} strokeWidth={1.5} />
      </div>
      <h3 className="text-heading text-gray-900 mb-2">Couldn&apos;t load data</h3>
      <p className="text-body text-gray-500 max-w-sm mb-6">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary text-sm gap-2">
          <RefreshCw size={16} /> Try again
        </button>
      )}
    </div>
  )
}
