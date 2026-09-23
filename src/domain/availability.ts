import { LIMITS } from '@/config/event'
import type { Availability, RegistrationSettings } from '@/types/domain'

export function deriveAvailability(settings: RegistrationSettings, registeredTeams: number): Availability {
  const { maximumTeams } = settings
  const slotsRemaining = Math.max(0, maximumTeams - registeredTeams)
  const state = !settings.registrationOpen
    ? 'closed'
    : slotsRemaining === 0
      ? 'full'
      : registeredTeams / maximumTeams >= LIMITS.limitedThreshold
        ? 'limited'
        : 'open'
  return { state, registeredTeams, maximumTeams, slotsRemaining }
}

export function canRegister(availability: Availability): boolean {
  return availability.state === 'open' || availability.state === 'limited'
}
