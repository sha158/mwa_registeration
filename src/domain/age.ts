import { EVENT, LIMITS } from '@/config/event'

/** Parses yyyy-mm-dd as a calendar date (no timezone shift). */
export function parseIsoDate(value: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])]
  const date = new Date(Date.UTC(y, m - 1, d))
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null
  return { y, m, d }
}

/** Age in completed years on `onDate` (defaults to competition day). */
export function ageOn(dateOfBirth: string, onDate: string = EVENT.date): number | null {
  const dob = parseIsoDate(dateOfBirth)
  const ref = parseIsoDate(onDate)
  if (!dob || !ref) return null
  let age = ref.y - dob.y
  if (ref.m < dob.m || (ref.m === dob.m && ref.d < dob.d)) age -= 1
  return age
}

export type AgeCheck =
  | { status: 'invalid' }
  | { status: 'eligible'; age: number }
  | { status: 'too-young' | 'too-old'; age: number }

export function checkAge(dateOfBirth: string, onDate: string = EVENT.date): AgeCheck {
  const age = ageOn(dateOfBirth, onDate)
  if (age === null || age < 0 || age > 120) return { status: 'invalid' }
  if (age < LIMITS.minAge) return { status: 'too-young', age }
  if (age > LIMITS.maxAge) return { status: 'too-old', age }
  return { status: 'eligible', age }
}

/** Earliest and latest eligible birth dates (inclusive), for date input bounds and copy. */
export function eligibleBirthRange(onDate: string = EVENT.date): { earliest: string; latest: string } {
  const ref = parseIsoDate(onDate)
  if (!ref) throw new Error('Invalid reference date')
  const iso = (y: number, m: number, d: number) => {
    const date = new Date(Date.UTC(y, m - 1, d))
    return date.toISOString().slice(0, 10)
  }
  // Oldest eligible: turns maxAge+1 the day after the event.
  const earliest = iso(ref.y - LIMITS.maxAge - 1, ref.m, ref.d + 1)
  // Youngest eligible: turns minAge on the event day.
  const latest = iso(ref.y - LIMITS.minAge, ref.m, ref.d)
  return { earliest, latest }
}

export const AGE_MESSAGE = `You must be between ${LIMITS.minAge} and ${LIMITS.maxAge} years old to participate.`
