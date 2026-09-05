import { useEffect, useState } from 'react'
import { GraduationCap } from 'lucide-react'

const PHASES = [
  'StudyMate is thinking',
  'Working through your topic',
  'Putting the explanation together',
]

export function LoadingMessage() {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setPhase((current) => (current + 1) % PHASES.length), 3200)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex animate-fade-in gap-3 sm:gap-4" role="status" aria-live="polite">
      <span
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-indigo-600"
        aria-hidden="true"
      >
        <GraduationCap className="h-4 w-4" />
      </span>

      <div className="flex items-center gap-2.5 rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-3">
        <span className="text-sm text-slate-500">{PHASES[phase]}</span>
        <span className="flex gap-1" aria-hidden="true">
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              className="h-1.5 w-1.5 animate-blink rounded-full bg-indigo-400"
              style={{ animationDelay: `${dot * 0.16}s` }}
            />
          ))}
        </span>
      </div>
    </div>
  )
}
