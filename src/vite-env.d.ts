/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Development-only mock backend scenario. See src/services/mock/scenario.ts. */
  readonly VITE_MOCK_SCENARIO?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
