import { ServiceError } from '../types'

interface SupabaseLikeError {
  code?: string
  status?: number
  message?: string
}

/**
 * Supabase client errors without a Postgres/HTTP code are transport failures
 * (offline, DNS, CORS). Everything else is reported as UNKNOWN — raw messages never reach the UI.
 */
export function toServiceError(error: SupabaseLikeError | null | undefined): ServiceError {
  if (!error) return new ServiceError('UNKNOWN')
  const transport = !error.code && !error.status
  if (transport || (typeof navigator !== 'undefined' && !navigator.onLine)) return new ServiceError('NETWORK_ERROR')
  if (error.code === '42501' || error.status === 401 || error.status === 403) return new ServiceError('FORBIDDEN')
  return new ServiceError('UNKNOWN')
}

/** Admin RPCs return { ok: false, error } for expected failures. */
export function throwIfRpcFailed(value: unknown): void {
  if (value && typeof value === 'object' && 'ok' in value && value.ok === false) {
    const code = 'error' in value ? value.error : undefined
    if (code === 'FORBIDDEN' || code === 'NOT_FOUND' || code === 'REGISTRATION_FULL') throw new ServiceError(code)
    throw new ServiceError('UNKNOWN')
  }
}
