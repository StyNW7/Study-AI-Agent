import { useCallback, useMemo, useRef, useState } from 'react'
import { getConfigProblem, isMockMode, sendMessage, StudyMateError } from '@/services/langflow'
import { sendMockMessage } from '@/services/mockAgent'
import type { AgentError, ChatMessage, MessageKind, SessionStatus } from '@/types'

const SESSION_KEY = 'studymate.session-id'

function createSessionId(): string {
  // randomUUID needs a secure context; fall back when the app is opened over plain HTTP on a LAN.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `sm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function readSessionId(): string {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY)
    if (stored) return stored
    const created = createSessionId()
    sessionStorage.setItem(SESSION_KEY, created)
    return created
  } catch {
    // Private browsing or storage disabled: an in-memory id still works for one visit.
    return createSessionId()
  }
}

/**
 * Labels an agent reply for the small badge shown above it. Deliberately shallow —
 * an unrecognised reply simply renders as normal Markdown.
 */
function detectKind(content: string): MessageKind | undefined {
  const text = content.toLowerCase()
  if (/\b(learning plan|study plan)\b/.test(text)) return 'plan'
  if (/\b(evaluation|score:|your score|correct answer)\b/.test(text)) return 'evaluation'
  if (/\b(quiz|question 1)\b/.test(text)) return 'quiz'
  if (/^#{1,3}\s|\bexample\b/m.test(content)) return 'lesson'
  return undefined
}

function toAgentError(error: unknown): AgentError {
  if (error instanceof StudyMateError) {
    return { title: error.title, message: error.message, detail: error.detail }
  }
  return {
    title: 'Something went wrong',
    message: 'StudyMate could not complete that request. Please try again.',
    detail: error instanceof Error ? error.message : String(error),
  }
}

export function useStudySession() {
  const [sessionId, setSessionId] = useState(readSessionId)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [status, setStatus] = useState<SessionStatus>('idle')
  const [error, setError] = useState<AgentError | null>(null)
  const lastPrompt = useRef<string | null>(null)

  const topic = useMemo(() => messages.find((m) => m.role === 'user')?.content, [messages])
  const hasStarted = messages.length > 0

  const ask = useCallback(
    async (prompt: string, options?: { replay?: boolean }) => {
      const text = prompt.trim()
      if (!text || status === 'thinking') return

      const configProblem = getConfigProblem()
      if (configProblem) {
        setError(configProblem)
        setStatus('error')
        return
      }

      lastPrompt.current = text
      setError(null)
      setStatus('thinking')

      // On a retry the user message is already in the list, so it is not counted again.
      const askedSoFar = messages.filter((m) => m.role === 'user').length
      const turn = options?.replay ? Math.max(askedSoFar - 1, 0) : askedSoFar

      if (!options?.replay) {
        setMessages((previous) => [
          ...previous,
          { id: createSessionId(), role: 'user', content: text, createdAt: new Date() },
        ])
      }

      try {
        const reply = isMockMode
          ? await sendMockMessage(text, turn)
          : await sendMessage(text, sessionId)

        setMessages((previous) => [
          ...previous,
          {
            id: createSessionId(),
            role: 'assistant',
            content: reply,
            kind: detectKind(reply),
            createdAt: new Date(),
          },
        ])
        setStatus('idle')
      } catch (caught) {
        if (import.meta.env.DEV) console.error('[StudyMate]', caught)
        setError(toAgentError(caught))
        setStatus('error')
      }
    },
    [messages, sessionId, status],
  )

  const retry = useCallback(() => {
    if (lastPrompt.current) void ask(lastPrompt.current, { replay: true })
  }, [ask])

  const dismissError = useCallback(() => {
    setError(null)
    setStatus('idle')
  }, [])

  const reset = useCallback(() => {
    const created = createSessionId()
    try {
      sessionStorage.setItem(SESSION_KEY, created)
    } catch {
      // Nothing to persist to; the new id lives in state for this visit.
    }
    setSessionId(created)
    setMessages([])
    setError(null)
    setStatus('idle')
    lastPrompt.current = null
  }, [])

  return { messages, status, error, topic, hasStarted, ask, retry, reset, dismissError }
}
