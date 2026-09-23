import { REGISTRATION_ID_PREFIX } from '@/config/event'

export function formatRegistrationNumber(sequence: number): string {
  return `${REGISTRATION_ID_PREFIX}-${String(sequence).padStart(3, '0')}`
}
