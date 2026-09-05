import { useState } from 'react'
import { Check, ClipboardList, Copy, GraduationCap, ListChecks, Sparkles, Target } from 'lucide-react'
import { Markdown } from './Markdown'
import type { ChatMessage as ChatMessageType, MessageKind } from '@/types'

const KIND_BADGE: Record<MessageKind, { label: string; icon: typeof Sparkles; className: string }> = {
  plan: { label: 'Learning Plan', icon: ClipboardList, className: 'bg-indigo-50 text-indigo-700' },
  lesson: { label: 'Lesson', icon: Sparkles, className: 'bg-slate-100 text-slate-600' },
  quiz: { label: 'Quiz', icon: ListChecks, className: 'bg-amber-50 text-amber-700' },
  evaluation: { label: 'Evaluation', icon: Target, className: 'bg-emerald-50 text-emerald-700' },
  answer: { label: 'Answer', icon: Sparkles, className: 'bg-slate-100 text-slate-600' },
}

function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard unavailable (insecure context) — nothing useful to show the user.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? 'Copied' : 'Copy message'}
      className="rounded-lg p-1.5 text-slate-400 opacity-0 transition hover:bg-slate-100 hover:text-slate-600 focus-visible:opacity-100 group-hover:opacity-100"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
      ) : (
        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
      )}
    </button>
  )
}

export function ChatMessage({ message }: { message: ChatMessageType }) {
  if (message.role === 'user') {
    return (
      <div className="flex animate-fade-up justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-indigo-50 px-4 py-3 text-[15px] leading-relaxed text-slate-800 sm:max-w-[75%]">
          {message.content}
        </div>
      </div>
    )
  }

  const badge = message.kind ? KIND_BADGE[message.kind] : null

  return (
    <article className="group flex animate-fade-up gap-3 sm:gap-4">
      <span
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-indigo-600"
        aria-hidden="true"
      >
        <GraduationCap className="h-4 w-4" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-[13px] font-semibold text-slate-900">StudyMate</span>
          {badge ? (
            <span
              className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${badge.className}`}
            >
              <badge.icon className="h-3 w-3" aria-hidden="true" />
              {badge.label}
            </span>
          ) : null}
          <CopyButton content={message.content} />
        </div>

        <div className="rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:px-5">
          <Markdown content={message.content} />
        </div>
      </div>
    </article>
  )
}
