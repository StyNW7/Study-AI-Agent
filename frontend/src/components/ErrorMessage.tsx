import { AlertTriangle, RefreshCw, X } from 'lucide-react'
import type { AgentError } from '@/types'

interface ErrorMessageProps {
  error: AgentError
  onRetry?: () => void
  onDismiss: () => void
}

export function ErrorMessage({ error, onRetry, onDismiss }: ErrorMessageProps) {
  return (
    <div
      role="alert"
      className="flex animate-fade-up gap-3 rounded-2xl border border-red-100 bg-red-50/60 px-4 py-4 sm:px-5"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900">{error.title}</p>
        <p className="mt-1 text-[14px] leading-relaxed text-slate-600">{error.message}</p>

        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-[13px] font-medium text-red-700 transition hover:bg-red-50"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Try again
          </button>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss error"
        className="h-7 w-7 shrink-0 rounded-lg text-slate-400 transition hover:bg-white hover:text-slate-600"
      >
        <X className="mx-auto h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  )
}
