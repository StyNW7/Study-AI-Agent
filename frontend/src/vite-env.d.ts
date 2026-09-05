/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LANGFLOW_BASE_URL?: string
  readonly VITE_LANGFLOW_FLOW_ID?: string
  readonly VITE_LANGFLOW_API_KEY?: string
  readonly VITE_USE_MOCK_AI?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
