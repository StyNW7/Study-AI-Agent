import type { AgentError } from '@/types'

const BASE_URL = (import.meta.env.VITE_LANGFLOW_BASE_URL ?? 'http://localhost:7860').replace(/\/+$/, '')
const FLOW_ID = import.meta.env.VITE_LANGFLOW_FLOW_ID ?? ''
const API_KEY = import.meta.env.VITE_LANGFLOW_API_KEY ?? ''

/** Requests are cancelled after this long so the UI never hangs forever. */
const TIMEOUT_MS = 120_000

export const isMockMode = import.meta.env.VITE_USE_MOCK_AI === 'true'

export class StudyMateError extends Error implements AgentError {
  title: string
  detail?: string

  constructor(title: string, message: string, detail?: string) {
    super(message)
    this.name = 'StudyMateError'
    this.title = title
    this.detail = detail
  }
}

/**
 * A model provider key pasted into VITE_LANGFLOW_API_KEY is an easy mistake to make,
 * and it fails confusingly: Langflow tries to validate it as a Langflow key and
 * returns 403. Catch it here and say exactly what is wrong.
 */
function looksLikeProviderKey(value: string): string | null {
  if (value.startsWith('gsk_')) return 'Groq'
  if (value.startsWith('AIza')) return 'Google Gemini'
  if (value.startsWith('sk-ant-')) return 'Anthropic'
  if (value.startsWith('sk-')) return 'OpenAI'
  return null
}

/** Checked before the first request so misconfiguration is reported, not guessed at. */
export function getConfigProblem(): AgentError | null {
  if (isMockMode) return null

  if (!FLOW_ID) {
    return {
      title: 'StudyMate is not connected yet',
      message:
        'No Langflow flow ID is configured. Add VITE_LANGFLOW_FLOW_ID to your .env file and restart the dev server.',
    }
  }

  const provider = API_KEY ? looksLikeProviderKey(API_KEY.trim()) : null
  if (provider) {
    return {
      title: `That is a ${provider} key, not a Langflow key`,
      message:
        `VITE_LANGFLOW_API_KEY is for Langflow itself, not for ${provider}. Clear it in frontend/.env ` +
        `and put the ${provider} key in the .env file at the project root instead, then run ` +
        '"docker compose up -d". Provider keys must never go in a VITE_ variable — those are ' +
        'compiled into the browser bundle and are public.',
    }
  }

  return null
}

/**
 * Langflow nests the agent reply a few levels deep and the exact shape has moved
 * between releases, so every known location is tried before giving up.
 */
function extractReply(payload: unknown): string | null {
  const seen = new Set<unknown>()

  const walk = (node: unknown, depth: number): string | null => {
    if (node == null || depth > 8) return null
    if (typeof node === 'string') return node.trim() ? node : null
    if (typeof node !== 'object') return null
    if (seen.has(node)) return null
    seen.add(node)

    if (Array.isArray(node)) {
      for (const item of node) {
        const found = walk(item, depth + 1)
        if (found) return found
      }
      return null
    }

    const record = node as Record<string, unknown>

    // Most specific first: the text carried by a Message result.
    for (const key of ['text', 'message']) {
      const value = record[key]
      if (typeof value === 'string' && value.trim()) return value
    }

    for (const key of ['outputs', 'results', 'message', 'artifacts', 'messages', 'data', 'result']) {
      if (key in record) {
        const found = walk(record[key], depth + 1)
        if (found) return found
      }
    }

    return null
  }

  return walk(payload, 0)
}

function describeHttpError(status: number, body: string): StudyMateError {
  switch (status) {
    case 401:
    case 403:
      return new StudyMateError(
        'Langflow rejected the request',
        'Authentication failed. Check that VITE_LANGFLOW_API_KEY is empty (or holds a real Langflow ' +
          'API key — never a Groq or Gemini key), and that docker-compose.yml still sets ' +
          'LANGFLOW_AUTO_LOGIN and LANGFLOW_SKIP_AUTH_AUTO_LOGIN.',
        body,
      )
    case 404:
      return new StudyMateError(
        'Flow not found',
        'Langflow could not find that flow. Check VITE_LANGFLOW_FLOW_ID matches the flow ID in Langflow.',
        body,
      )
    case 429:
      return new StudyMateError(
        'Rate limit reached',
        'The model provider is rate limiting requests. Wait a few seconds and try again.',
        body,
      )
    default:
      if (status >= 500) {
        return new StudyMateError(
          'The AI service returned an error',
          'Langflow could not complete the run. Check the Langflow logs and that your model provider API key is valid.',
          body,
        )
      }
      return new StudyMateError(
        'Request failed',
        `Langflow responded with status ${status}.`,
        body,
      )
  }
}

/** Sends one message to the StudyMate agent and returns its reply text. */
export async function sendMessage(message: string, sessionId: string): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(`${BASE_URL}/api/v1/run/${FLOW_ID}?stream=false`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
      },
      body: JSON.stringify({
        input_value: message,
        input_type: 'chat',
        output_type: 'chat',
        session_id: sessionId,
      }),
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new StudyMateError(
        'That took too long',
        'StudyMate did not answer in time. The model may be busy — try again with a shorter question.',
      )
    }
    throw new StudyMateError(
      "StudyMate couldn't reach the AI service",
      `Make sure Langflow is running at ${BASE_URL} and try again.`,
      error instanceof Error ? error.message : String(error),
    )
  } finally {
    clearTimeout(timer)
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw describeHttpError(response.status, body)
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new StudyMateError(
      'Unexpected response',
      'Langflow returned something StudyMate could not read. Check the flow output component.',
    )
  }

  const reply = extractReply(payload)
  if (!reply) {
    if (import.meta.env.DEV) console.warn('[StudyMate] Unrecognised Langflow payload:', payload)
    throw new StudyMateError(
      'Empty answer',
      'The agent ran but returned no text. Make sure the flow ends in a Chat Output component.',
    )
  }

  return reply.trim()
}

/** Lightweight liveness probe used by the header status indicator. */
export async function checkHealth(): Promise<boolean> {
  if (isMockMode) return true
  try {
    const response = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(5000) })
    return response.ok
  } catch {
    return false
  }
}
