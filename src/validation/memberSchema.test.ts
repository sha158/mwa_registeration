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
  aadhaar: { uploadId: 'u1', fileName: 'a.pdf', sizeBytes: 1000 },
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

  it('validates mobile numbers and duplicates within a team', () => {
    expect(errorPaths({ ...valid, mobileNumber: '12345' })).toEqual(['mobileNumber'])
    expect(errorPaths(valid, ['+91 98451 28940'])).toEqual(['mobileNumber'])
  })
})
