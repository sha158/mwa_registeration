import { EVENT, LIMITS } from '@/config/event'
import { eligibleBirthRange } from '@/domain/age'
import { formatDate } from '@/utils/format'

const range = eligibleBirthRange()

export const ELIGIBLE = [
  'Boys only',
  `Age ${LIMITS.minAge}–${LIMITS.maxAge} on competition day`,
  'Residents of Dakshina Kannada or Udupi',
  `Teams of exactly ${LIMITS.teamSize} members`,
]

export const NOT_ELIGIBLE = ['Aalims', 'Students currently studying in Madrasas']

export const BIRTH_RANGE_TEXT = `Born between ${formatDate(range.earliest)} and ${formatDate(range.latest)}`

export const RULE_SECTIONS: { title: string; items: string[] }[] = [
  {
    title: 'Eligibility',
    items: [
      'Only boys may participate.',
      `Participants must be ${LIMITS.minAge} to ${LIMITS.maxAge} years old on the competition day (${BIRTH_RANGE_TEXT.toLowerCase()}).`,
      'Participants must be residents of Dakshina Kannada or Udupi district.',
      'Aalims are not eligible.',
      'Students currently studying in Madrasas are not eligible.',
    ],
  },
  {
    title: 'Teams & registration',
    items: [
      `Each team has exactly ${LIMITS.teamSize} members. One person registers the whole team.`,
      `Only ${LIMITS.maxTeams} teams can take part. Slots are allotted first-come, first-served.`,
      'Registration is free.',
      'An Aadhaar card copy (JPG, PNG or PDF, up to 2 MB) is required for every member.',
      'Organisers verify every registration. Teams that do not meet the rules may be rejected.',
    ],
  },
  {
    title: 'Syllabus',
    items: [`Questions are based exclusively on the prescribed book: ${EVENT.prescribedBook}.`],
  },
  {
    title: 'Competition day',
    items: [
      `Reporting time is ${EVENT.reportingTime}.`,
      'Breakfast and lunch are provided.',
      'Every participant receives a memento.',
    ],
  },
]
