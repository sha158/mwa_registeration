/**
 * Competition facts and limits. Single source of truth for copy and validation.
 *
 * TODO(organisers): replace placeholder values marked TODO before launch.
 */
export const EVENT = {
  name: 'MWA Quiz Masters',
  shortName: 'MWA Quiz Masters',
  tagline: 'Test Your Knowledge. Strengthen Your Faith.',
  level: 'District-Level Youth Quiz Competition',
  audience: 'Exclusively for Youth from Dakshina Kannada & Udupi Districts.',
  organiser: 'Mohammadiya Welfare Association',
  location: 'Moodbidri, Karnataka',
  region: 'Dakshina Kannada & Udupi',
  /** Competition day. Participant age is evaluated on this date. TODO: confirm. */
  date: '2026-11-15',
  reportingTime: '08:30 AM',
  /** TODO: confirm venue. */
  venue: 'Venue to be announced',
  /** Primary helpline (first of CONTACTS). Digits only, used for tel: links. */
  helpline: '+918550099332',
  helplineDisplay: '+91 85500 99332',
} as const

export interface Contact {
  /** Digits only, used for tel: links. */
  tel: string
  display: string
}

/** Organisation contact numbers, shown in the footer. */
export const CONTACTS: readonly Contact[] = [
  { tel: '+918550099332', display: '+91 85500 99332' },
  { tel: '+919986286747', display: '+91 99862 86747' },
]

/** Competition enquiry numbers ("For more details", rule 16). */
export const ENQUIRY_CONTACTS: readonly Contact[] = [
  { tel: '+919900874115', display: '+91 99008 74115' },
  { tel: '+917483684269', display: '+91 74836 84269' },
  { tel: '+918747043722', display: '+91 87470 43722' },
]

/** The prescribed book. The whole syllabus is based on it. */
export const BOOK = {
  title: 'Important Lessons for Every Muslim',
  author: 'Sheikh Abdul Aziz bin Abdullah Ibn Baz',
  /** "May Allah have mercy on him", shown after the author's name. */
  authorHonorific: 'رحمه الله',
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

/** Every Aadhaar file the backend accepts (mirrors the storage bucket limits). */
export const AADHAAR_FILE = {
  maxBytes: 2 * 1024 * 1024,
  mimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
  extensions: ['.jpg', '.jpeg', '.png', '.pdf'],
} as const

/**
 * What each upload slot accepts: front/back photos, or the official e-Aadhaar PDF
 * (which already shows both sides).
 */
export const AADHAAR_UPLOAD = {
  photo: { mimeTypes: ['image/jpeg', 'image/png'], extensions: ['.jpg', '.jpeg', '.png'], label: 'JPG or PNG' },
  pdf: { mimeTypes: ['application/pdf'], extensions: ['.pdf'], label: 'PDF' },
} as const

export const REGISTRATION_ID_PREFIX = 'MWA'
