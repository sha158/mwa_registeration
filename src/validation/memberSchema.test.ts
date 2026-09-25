import { describe, expect, it } from 'vitest'
import { EVENT } from '@/config/event'
import { eligibleBirthRange } from '@/domain/age'
import { createMemberSchema, emptyMemberForm, toMemberInput, type MemberFormValues } from './memberSchema'

const valid: MemberFormValues = {
  ...emptyMemberForm,
  fullName: 'Mohammed Farhan',
  mobileNumber: '98451 28940',
  dateOfBirth: eligibleBirthRange(EVENT.date).latest,
  residentialAddress: 'Door 4-82/1, Deralakatte, Mangaluru 575018',
  district: 'Dakshina Kannada',
  participantStatus: 'student',
  courseDetails: 'B.Com (Final Year)',
  institution: 'St. Aloysius College',
  studyingInMadrasa: 'no',
  isAalim: 'no',
  aadhaar: {
    mode: 'photos',
    front: { uploadId: 'front', fileName: 'front.jpg', sizeBytes: 1000 },
    back: { uploadId: 'back', fileName: 'back.jpg', sizeBytes: 1000 },
    pdf: null,
  },
}

const pdfOnly: MemberFormValues['aadhaar'] = {
  mode: 'pdf',
  front: null,
  back: null,
  pdf: { uploadId: 'pdf', fileName: 'e-aadhaar.pdf', sizeBytes: 1000 },
}

const errorPaths = (values: MemberFormValues, otherMobiles?: string[]) => {
  const result = createMemberSchema({ otherMobiles }).safeParse(values)
  return result.success ? [] : result.error.issues.map((i) => i.path.join('.'))
}

describe('member schema', () => {
  it('accepts a complete eligible student', () => {
    expect(errorPaths(valid)).toEqual([])
    expect(toMemberInput(valid)).toMatchObject({ mobileNumber: '9845128940', participantStatus: 'student' })
  })

  it('requires only the fields for the selected status', () => {
    expect(errorPaths({ ...valid, participantStatus: 'working' })).toEqual(['occupation', 'employer'])
  })

  it('blocks ineligible answers and ages', () => {
    expect(errorPaths({ ...valid, studyingInMadrasa: 'yes' })).toEqual(['studyingInMadrasa'])
    expect(errorPaths({ ...valid, isAalim: 'yes' })).toEqual(['isAalim'])
    expect(errorPaths({ ...valid, dateOfBirth: '2012-01-01' })).toEqual(['dateOfBirth'])
  })

  it('requires both sides for card photos', () => {
    expect(errorPaths({ ...valid, aadhaar: { ...valid.aadhaar, back: null } })).toEqual(['aadhaar.back'])
    expect(errorPaths({ ...valid, aadhaar: { ...valid.aadhaar, front: null, back: null } })).toEqual([
      'aadhaar.front',
      'aadhaar.back',
    ])
    expect(toMemberInput(valid)?.aadhaar).toEqual({ kind: 'photos', front: valid.aadhaar.front, back: valid.aadhaar.back })
  })

  it('accepts the e-Aadhaar PDF alone, and validates only the selected mode', () => {
    expect(errorPaths({ ...valid, aadhaar: pdfOnly })).toEqual([])
    expect(toMemberInput({ ...valid, aadhaar: pdfOnly })?.aadhaar).toEqual({ kind: 'pdf', file: pdfOnly.pdf })
    // Photos uploaded earlier are kept but ignored once the PDF mode is chosen, and vice versa.
    expect(toMemberInput({ ...valid, aadhaar: { ...valid.aadhaar, mode: 'pdf', pdf: pdfOnly.pdf } })?.aadhaar.kind).toBe('pdf')
    expect(errorPaths({ ...valid, aadhaar: { ...pdfOnly, pdf: null } })).toEqual(['aadhaar.pdf'])
  })

  it('validates mobile numbers and duplicates within a team', () => {
    expect(errorPaths({ ...valid, mobileNumber: '12345' })).toEqual(['mobileNumber'])
    expect(errorPaths(valid, ['+91 98451 28940'])).toEqual(['mobileNumber'])
  })
})
