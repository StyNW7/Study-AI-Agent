import { useEffect, useState } from 'react'
import { GraduationCap, RotateCcw } from 'lucide-react'
import { checkHealth, isMockMode } from '@/services/langflow'

type Connection = 'checking' | 'online' | 'offline'

const STATUS_STYLE: Record<Connection, { dot: string; label: string; text: string }> = {
  checking: { dot: 'bg-slate-300', label: 'Connecting…', text: 'text-slate-500' },
  online: { dot: 'bg-emerald-500', label: 'AI Agent Online', text: 'text-slate-600' },
  offline: { dot: 'bg-amber-500', label: 'Agent Offline', text: 'text-slate-600' },
}

export function Header({ showReset, onReset }: { showReset: boolean; onReset: () => void }) {
  const [connection, setConnection] = useState<Connection>('checking')

  useEffect(() => {
    let active = true
    const probe = async () => {
      const healthy = await checkHealth()
      if (active) setConnection(healthy ? 'online' : 'offline')
    }
    void probe()
    const interval = setInterval(probe, 30_000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [])

  const status = STATUS_STYLE[connection]

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-workspace items-center justify-between gap-4 px-5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="leading-tight">
            <p className="text-[15px] font-semibold tracking-tight text-slate-900">StudyMate</p>
            <p className="hidden text-xs text-slate-500 sm:block">AI Study Assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span
            className={`flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium ${status.text}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} aria-hidden="true" />
            <span className="hidden sm:inline">{isMockMode ? 'Demo Mode' : status.label}</span>
            <span className="sm:hidden">{isMockMode ? 'Demo' : connection === 'online' ? 'Online' : '—'}</span>
          </span>

          {showReset ? (
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              New Session
            </button>
          ) : null}
        </div>
      </div>
    </header>
  )
}
