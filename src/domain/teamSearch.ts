import type { RegistrationStatus, Team } from '@/types/domain'
import { normaliseMobile } from '@/validation/mobile'

export type StatusFilter = RegistrationStatus | 'all'

/** Search by registration ID, participant name or mobile number, plus status filter. */
export function matchesTeam(team: Team, search: string, status: StatusFilter = 'all'): boolean {
  if (status !== 'all' && team.status !== status) return false
  const q = search.trim().toLowerCase()
  if (!q) return true
  const digits = normaliseMobile(q)
  return (
    team.registrationNumber.toLowerCase().includes(q) ||
    team.members.some(
      (m) => m.fullName.toLowerCase().includes(q) || (digits.length >= 3 && m.mobileNumber.includes(digits)),
    )
  )
}
