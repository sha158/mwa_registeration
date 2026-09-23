import { LIMITS } from '@/config/event'
import { createSeedTeams } from '@/mocks/seedTeams'
import type { RegistrationSettings, Team } from '@/types/domain'

/**
 * In-memory stand-in for the Supabase tables (teams, team_members, settings).
 * Resets on page reload by design — nothing is written to browser storage.
 */
const settings: RegistrationSettings = { registrationOpen: true, maximumTeams: LIMITS.maxTeams }

export const db = {
  teams: createSeedTeams(),
  settings,
  /** Monotonic sequence behind registration numbers (mirrors a Postgres sequence). */
  sequence: 8,
}

/** Teams that occupy a slot. Rejected or cancelled teams release their slot. */
export function activeTeams(): Team[] {
  return db.teams.filter((t) => t.status === 'submitted' || t.status === 'verified')
}

export const clone = <T>(value: T): T => structuredClone(value)
