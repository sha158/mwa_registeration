/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  /** Publishable (public) key only. Never a secret / service-role key. */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
  /** Development only: "true" runs against the in-memory mock services instead of Supabase. */
  readonly VITE_USE_MOCKS?: string
  /** Development-only mock backend scenario. See src/services/mock/scenario.ts. */
  readonly VITE_MOCK_SCENARIO?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
