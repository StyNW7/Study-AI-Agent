import { useEffect, useRef, useState } from 'react'
import { ChatMessage } from '@/components/ChatMessage'
import { ErrorMessage } from '@/components/ErrorMessage'
import { Header } from '@/components/Header'
import { LoadingMessage } from '@/components/LoadingMessage'
import { PromptInput } from '@/components/PromptInput'
import { WelcomeHero } from '@/components/WelcomeHero'
import { useStudySession } from '@/hooks/useStudySession'

const QUICK_ACTIONS = [
  'Explain that with an example',
  'Give me a 3-question quiz',
  'What should I learn next?',
]

export default function App() {
  const { messages, status, error, hasStarted, ask, retry, reset, dismissError } = useStudySession()
  const [draft, setDraft] = useState('')
  const endOfMessagesRef = useRef<HTMLDivElement>(null)

  const busy = status === 'thinking'

  useEffect(() => {
    if (hasStarted) endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, status, hasStarted])

  const submit = (prompt?: string) => {
    const text = prompt ?? draft
    if (!text.trim() || busy) return
    setDraft('')
    void ask(text)
  }

  const startNewSession = () => {
    reset()
    setDraft('')
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Header showReset={hasStarted} onReset={startNewSession} />

      {!hasStarted ? (
        <main className="flex flex-1 items-center">
          <WelcomeHero
            value={draft}
            onChange={setDraft}
            onSubmit={() => submit()}
            onSuggestion={(prompt) => submit(prompt)}
            busy={busy}
          />
        </main>
      ) : (
        <>
          <main className="flex-1">
            <div className="mx-auto w-full max-w-workspace space-y-6 px-5 py-8">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}

              {busy ? <LoadingMessage /> : null}

              {error ? (
                <ErrorMessage error={error} onRetry={retry} onDismiss={dismissError} />
              ) : null}

              <div ref={endOfMessagesRef} />
            </div>
          </main>

          <div className="sticky bottom-0 border-t border-slate-200 bg-slate-50/90 backdrop-blur">
            <div className="mx-auto w-full max-w-workspace px-5 py-3.5">
              {!busy ? (
                <div className="mb-2.5 flex flex-wrap gap-2">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action}
                      type="button"
                      onClick={() => submit(action)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[12.5px] text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              ) : null}

              <PromptInput
                value={draft}
                onChange={setDraft}
                onSubmit={() => submit()}
                busy={busy}
                disabled={busy}
              />

              <p className="mt-2 text-center text-[11.5px] text-slate-400">
                StudyMate can make mistakes. Verify important details.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
