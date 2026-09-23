import { z } from 'zod'
import { DISTRICTS } from '@/config/event'
import { AGE_MESSAGE, checkAge } from '@/domain/age'
import { ELIGIBILITY_MESSAGES } from '@/domain/eligibility'
import type { DocumentRef, MemberInput } from '@/types/domain'
import { isValidMobile, normaliseMobile } from './mobile'

const required = (label: string) => z.string().trim().min(1, `Please enter ${label}.`)
const yesNo = (message: string) =>
  z.enum(['yes', 'no', ''], { error: message }).refine((v) => v !== '', message)

const documentRef = z.custom<DocumentRef>(
  (v) => typeof v === 'object' && v !== null && 'uploadId' in v,
  'Please upload the Aadhaar card.',
)

/**
 * Form-level schema for one team member. Student and working fields both live in the form
 * so switching status does not discard typed values; only the active set is validated.
 */
export function createMemberSchema(options: { otherMobiles?: string[] } = {}) {
  const otherMobiles = new Set((options.otherMobiles ?? []).map(normaliseMobile))

  return z
    .object({
      fullName: required('the full name')
        .min(3, 'Please enter the full name as on Aadhaar.')
        .max(80, 'Name is too long.')
        .regex(/^[\p{L} .'-]+$/u, 'Name can only contain letters, spaces and dots.'),
      mobileNumber: z
        .string()
        .trim()
        .min(1, 'Please enter a mobile number.')
        .refine(isValidMobile, 'Please enter a valid 10-digit mobile number.')
        .refine((v) => !otherMobiles.has(normaliseMobile(v)), 'Each member needs a different mobile number.'),
      dateOfBirth: z
        .string()
        .min(1, 'Please enter the date of birth.')
        .superRefine((v, ctx) => {
          const result = checkAge(v)
          if (result.status === 'invalid') ctx.addIssue({ code: 'custom', message: 'Please enter a valid date.' })
          else if (result.status !== 'eligible') ctx.addIssue({ code: 'custom', message: AGE_MESSAGE })
        }),
      residentialAddress: required('the residential address')
        .min(10, 'Please enter the complete address.')
        .max(300, 'Address is too long.'),
      district: z.enum(['', ...DISTRICTS]).refine((v) => v !== '', 'Please select a district.'),
      participantStatus: z
        .enum(['', 'student', 'working'])
        .refine((v) => v !== '', 'Please choose Student or Working.'),
      courseDetails: z.string().trim().max(120),
      institution: z.string().trim().max(120),
      occupation: z.string().trim().max(120),
      employer: z.string().trim().max(120),
      studyingInMadrasa: yesNo('Please answer this question.').refine(
        (v) => v !== 'yes',
        ELIGIBILITY_MESSAGES.madrasa,
      ),
      isAalim: yesNo('Please answer this question.').refine((v) => v !== 'yes', ELIGIBILITY_MESSAGES.aalim),
      aadhaar: documentRef.nullable().refine((v) => v !== null, 'Please upload the Aadhaar card.'),
    })
    .superRefine((v, ctx) => {
      const need = (field: 'courseDetails' | 'institution' | 'occupation' | 'employer', message: string) => {
        if (!v[field]) ctx.addIssue({ code: 'custom', path: [field], message })
      }
      if (v.participantStatus === 'student') {
        need('courseDetails', 'Please enter the course or study details.')
        need('institution', 'Please enter the institution name.')
      } else if (v.participantStatus === 'working') {
        need('occupation', 'Please enter the occupation.')
        need('employer', 'Please enter the employer or company.')
      }
    })
}

export type MemberFormValues = z.input<ReturnType<typeof createMemberSchema>>

export const emptyMemberForm: MemberFormValues = {
  fullName: '',
  mobileNumber: '',
  dateOfBirth: '',
  residentialAddress: '',
  district: '',
  participantStatus: '',
  courseDetails: '',
  institution: '',
  occupation: '',
  employer: '',
  studyingInMadrasa: '',
  isAalim: '',
  aadhaar: null,
}

/** Converts a fully validated form into the domain shape sent to the service layer. */
export function toMemberInput(values: MemberFormValues): MemberInput | null {
  const parsed = createMemberSchema().safeParse(values)
  if (!parsed.success) return null
  const v = parsed.data
  if (v.aadhaar === null) return null
  const base = {
    fullName: v.fullName,
    mobileNumber: normaliseMobile(v.mobileNumber),
    dateOfBirth: v.dateOfBirth,
    residentialAddress: v.residentialAddress,
    district: v.district,
    studyingInMadrasa: false,
    isAalim: false,
    aadhaar: v.aadhaar,
  }
  return v.participantStatus === 'student'
    ? { ...base, participantStatus: 'student', courseDetails: v.courseDetails, institution: v.institution }
    : { ...base, participantStatus: 'working', occupation: v.occupation, employer: v.employer }
}
