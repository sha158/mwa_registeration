import { ENQUIRY_CONTACTS, EVENT, LIMITS, type Contact } from '@/config/event'
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

export interface Rule {
  title: string
  text?: string
  items?: string[]
  contacts?: readonly Contact[]
}

/**
 * The organisers' official Rules & Regulations, in their order and wording. Do not shorten or
 * reword. Numbers come from config so the rules can never disagree with what registration enforces.
 */
export const RULES: Rule[] = [
  { title: 'Age Criteria', text: `Participants must be between ${LIMITS.minAge} and ${LIMITS.maxAge} years of age.` },
  { title: 'Eligibility', text: 'The competition is open to Boys only.' },
  {
    title: 'District Eligibility',
    text: 'Participation is restricted to residents of Dakshina Kannada & Udupi Districts.',
  },
  {
    title: 'Aalim/Madrasa Students',
    text: 'Aalims and students currently studying in Madrasas are not eligible to participate.',
  },
  {
    title: 'Team Composition',
    text: `Each team must consist of exactly ${LIMITS.teamSize} members. Participation of all ${LIMITS.teamSize} members is mandatory.`,
  },
  {
    title: 'Number of Teams',
    text: `Only the first ${LIMITS.maxTeams} teams to complete registration will be accepted.`,
  },
  {
    title: 'Book Distribution',
    text: 'After successful registration, a hard copy of the prescribed book will be sent by post to the registered address. A soft copy (PDF) will also be provided.',
  },
  { title: 'Quiz Syllabus', text: 'All quiz questions will be based exclusively on the prescribed book.' },
  {
    title: 'Aadhaar Card',
    text: 'A valid Aadhaar Card of each participant must be uploaded during online registration.',
  },
  {
    title: 'Registration Details',
    text: `The following details are required for all ${LIMITS.teamSize} team members:`,
    items: [
      'Name',
      'Mobile Number',
      'Address',
      'Aadhaar Card',
      'Student / Working Status',
      'If Student: Course / Study Details',
      'If Working: Occupation / Employment Details',
    ],
  },
  { title: 'Registration Fee', text: 'No Entry Fee – Participation is completely FREE.' },
  { title: 'Food Arrangements', text: 'Breakfast and Lunch will be provided to all registered participants.' },
  { title: 'Reporting Time', text: `All participants must report at the venue sharp at ${EVENT.reportingTime}.` },
  {
    title: 'Final Decision',
    text: 'The decision of the Organisers shall be final and binding in all matters related to the competition.',
  },
  { title: 'Participant Memento', text: 'A memento will be presented to all participants.' },
  { title: 'For More Details', contacts: ENQUIRY_CONTACTS },
]
