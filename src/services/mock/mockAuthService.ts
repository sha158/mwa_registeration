import type { AdminSession } from '@/types/domain'
import { ServiceError, type AuthService } from '../types'
import { delay } from './scenario'

/**
 * Mock admin auth. Development credentials: admin@mwa.test / mwa-admin
 * The session (email + display name only) is kept in sessionStorage so a refresh keeps you signed in.
 */
const MOCK_ADMIN = { email: 'admin@mwa.test', password: 'mwa-admin', displayName: 'Organiser' }
const SESSION_KEY = 'mwa.mockAdminSession'

function readSession(): AdminSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as AdminSession) : null
  } catch {
    return null
  }
}

export const mockAuthService: AuthService = {
  async getSession() {
    return readSession()
  },

  async signIn(email, password) {
    await delay(700)
    if (email.trim().toLowerCase() !== MOCK_ADMIN.email || password !== MOCK_ADMIN.password) {
      throw new ServiceError('INVALID_CREDENTIALS')
    }
    const session: AdminSession = { email: MOCK_ADMIN.email, displayName: MOCK_ADMIN.displayName }
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
    } catch {
      // Storage unavailable: session lasts until reload.
    }
    return session
  },

  async signOut() {
    try {
      sessionStorage.removeItem(SESSION_KEY)
    } catch {
      // ignore
    }
  },
}
