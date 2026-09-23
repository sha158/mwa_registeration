import { deriveAvailability } from '@/domain/availability'
import { formatRegistrationNumber } from '@/domain/registrationNumber'
import type { MemberNumber, Team } from '@/types/domain'
import { normaliseMobile } from '@/validation/mobile'
import type { RegistrationService } from '../types'
import { activeTeams, db } from './db'
import { delay, getScenario } from './scenario'

export const mockRegistrationService: RegistrationService = {
  async getAvailability() {
    await delay()
    if (getScenario() === 'full') return deriveAvailability(db.settings, db.settings.maximumTeams)
    return deriveAvailability(db.settings, activeTeams().length)
  },

  async submitRegistration(payload) {
    await delay(1200)
    const scenario = getScenario()
    if (scenario === 'network' || !navigator.onLine) return { ok: false, error: 'NETWORK_ERROR' }

    // --- Everything below mirrors the future transactional RPC. ---
    if (!db.settings.registrationOpen) return { ok: false, error: 'REGISTRATION_CLOSED' }
    if (scenario === 'full' || activeTeams().length >= db.settings.maximumTeams) {
      return { ok: false, error: 'REGISTRATION_FULL' }
    }

    const registered = new Set(activeTeams().flatMap((t) => t.members.map((m) => normaliseMobile(m.mobileNumber))))
    const duplicates = payload.members
      .map((m, i) => (registered.has(normaliseMobile(m.mobileNumber)) ? ((i + 1) as MemberNumber) : null))
      .filter((n): n is MemberNumber => n !== null)
    if (scenario === 'duplicate') duplicates.push(2)
    if (duplicates.length > 0) return { ok: false, error: 'DUPLICATE_PARTICIPANT', memberNumbers: duplicates }

    db.sequence += 1
    const id = `team-${db.sequence}`
    const team: Team = {
      id,
      registrationNumber: formatRegistrationNumber(db.sequence),
      status: 'submitted',
      createdAt: new Date().toISOString(),
      members: payload.members.map((m, i) => ({
        ...m,
        id: `${id}-m${i + 1}`,
        teamId: id,
        memberNumber: (i + 1) as MemberNumber,
      })),
    }
    db.teams.push(team)
    return {
      ok: true,
      registrationNumber: team.registrationNumber,
      memberNames: team.members.map((m) => m.fullName),
      submittedAt: team.createdAt,
    }
  },
}
