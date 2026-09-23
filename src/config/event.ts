/**
 * Competition facts and limits. Single source of truth for copy and validation.
 *
 * TODO(organisers): replace placeholder values marked TODO before launch.
 */
export const EVENT = {
  name: 'MWA Youth Quiz 2026',
  shortName: 'MWA Quiz 2026',
  organiser: 'MWA Education Committee',
  region: 'Dakshina Kannada & Udupi',
  /** Competition day. Participant age is evaluated on this date. TODO: confirm. */
  date: '2026-11-15',
  reportingTime: '08:30 AM',
  /** TODO: confirm venue. */
  venue: 'Venue to be announced',
  /** TODO: confirm prescribed book title. */
  prescribedBook: 'Prescribed book (title to be announced)',
  /** TODO: replace with the real helpline. Digits only, used for tel: links. */
  helpline: '+919000000000',
  helplineDisplay: '+91 90000 00000',
} as const

export const LIMITS = {
  maxTeams: 15,
  teamSize: 3,
  minAge: 19,
  maxAge: 26,
  /** Share of capacity at which availability is shown as "limited". */
  limitedThreshold: 0.8,
} as const

export const DISTRICTS = ['Dakshina Kannada', 'Udupi'] as const

export const AADHAAR_FILE = {
  maxBytes: 2 * 1024 * 1024,
  mimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
  extensions: ['.jpg', '.jpeg', '.png', '.pdf'],
} as const

export const REGISTRATION_ID_PREFIX = 'MWA'
