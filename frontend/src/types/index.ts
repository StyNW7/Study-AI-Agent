export type MessageRole = 'user' | 'assistant'

/** A recognisable section of an agent reply, used only for a small visual badge. */
export type MessageKind = 'plan' | 'lesson' | 'quiz' | 'evaluation' | 'answer'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  kind?: MessageKind
  createdAt: Date
}

export type SessionStatus = 'idle' | 'thinking' | 'error'

export interface StudySession {
  id: string
  topic?: string
  messages: ChatMessage[]
}

/** Error surfaced to the user, with a developer-friendly detail kept for the console. */
export interface AgentError {
  title: string
  message: string
  detail?: string
}
