import { useEffect, useRef, type KeyboardEvent } from 'react'
import { ArrowUp, Loader2 } from 'lucide-react'

interface PromptInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
  busy?: boolean
  placeholder?: string
  submitLabel?: string
  size?: 'hero' | 'composer'
  autoFocus?: boolean
}

export function PromptInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  busy = false,
  placeholder = 'Ask a question or continue learning…',
  submitLabel = 'Send message',
  size = 'composer',
  autoFocus = false,
}: PromptInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isHero = size === 'hero'
  const canSubmit = value.trim().length > 0 && !disabled && !busy

  // Grow with the content, up to a comfortable ceiling.
  useEffect(() => {
    const element = textareaRef.current
    if (!element) return
    element.style.height = 'auto'
    element.style.height = `${Math.min(element.scrollHeight, isHero ? 200 : 160)}px`
  }, [value, isHero])

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus()
  }, [autoFocus])

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      if (canSubmit) onSubmit()
    }
  }

  return (
    <div
      className={`flex items-end gap-2 rounded-2xl border border-slate-200 bg-white shadow-sm transition focus-within:border-indigo-300 focus-within:shadow-md ${
        isHero ? 'p-2.5' : 'p-2'
      }`}
    >
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={isHero ? 'What would you like to learn?' : 'Message StudyMate'}
        className={`scroll-area max-h-52 w-full resize-none border-0 bg-transparent px-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 disabled:opacity-60 ${
          isHero ? 'py-2.5 text-base' : 'py-2 text-[15px]'
        }`}
      />
      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit}
        aria-label={submitLabel}
        className={`flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 ${
          isHero ? 'h-11 px-5 text-sm' : 'h-10 w-10'
        }`}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <ArrowUp className="h-4 w-4" aria-hidden="true" />
        )}
        {isHero ? <span>Start Learning</span> : null}
      </button>
    </div>
  )
}
