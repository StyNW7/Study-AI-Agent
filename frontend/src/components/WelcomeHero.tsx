import { ClipboardList, MessageSquareQuote, Sparkles, Target } from 'lucide-react'
import { PromptInput } from './PromptInput'

const SUGGESTIONS = [
  'Teach me SQL JOIN',
  'Explain machine learning basics',
  'Help me learn Java OOP',
  'Teach me database normalization',
  'Learn Python functions',
]

const STEPS = [
  { icon: ClipboardList, title: 'Plan', text: 'A short learning path for your topic' },
  { icon: Sparkles, title: 'Teach', text: 'Clear explanations with real examples' },
  { icon: MessageSquareQuote, title: 'Quiz', text: 'Three questions to check yourself' },
  { icon: Target, title: 'Evaluate', text: 'Honest feedback and a next step' },
]

interface WelcomeHeroProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onSuggestion: (prompt: string) => void
  busy: boolean
}

export function WelcomeHero({ value, onChange, onSubmit, onSuggestion, busy }: WelcomeHeroProps) {
  return (
    <div className="mx-auto w-full max-w-3xl animate-fade-up px-5 py-12 sm:py-20">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Powered by an AI learning agent
        </span>

        <h1 className="mt-6 text-[32px] font-semibold leading-[1.15] tracking-tight text-slate-900 sm:text-[42px]">
          Study smarter with your
          <br className="hidden sm:block" /> AI learning companion.
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-slate-500 sm:text-base">
          Tell StudyMate what you want to learn and get a personalized learning plan, explanations,
          quizzes, and instant feedback.
        </p>
      </div>

      <div className="mt-9">
        <PromptInput
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          busy={busy}
          size="hero"
          autoFocus
          placeholder="What would you like to learn today?"
          submitLabel="Start learning"
        />

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onSuggestion(suggestion)}
              disabled={busy}
              className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[13px] text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-7 border-t border-slate-200 pt-9 sm:grid-cols-4">
        {STEPS.map(({ icon: Icon, title, text }) => (
          <div key={title}>
            <Icon className="h-5 w-5 text-indigo-600" aria-hidden="true" />
            <p className="mt-2.5 text-sm font-semibold text-slate-900">{title}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
