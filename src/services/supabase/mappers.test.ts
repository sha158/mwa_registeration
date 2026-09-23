import { describe, expect, it } from 'vitest'
import { AGE_MESSAGE } from '@/domain/age'
import { memberToRpc, submitResultFromRpc, teamFromRow } from './mappers'

describe('register_team result mapping', () => {
  it('maps success', () => {
    expect(
      submitResultFromRpc({ ok: true, registration_number: 'MWA-009', member_names: ['A', 'B', 'C'], submitted_at: '2026-09-23T10:00:00Z' }),
    ).toEqual({ ok: true, registrationNumber: 'MWA-009', memberNames: ['A', 'B', 'C'], submittedAt: '2026-09-23T10:00:00Z' })
  })

  it('keeps full / closed / duplicate as distinct UI states', () => {
    expect(submitResultFromRpc({ ok: false, error: 'REGISTRATION_FULL' })).toEqual({ ok: false, error: 'REGISTRATION_FULL' })
    expect(submitResultFromRpc({ ok: false, error: 'REGISTRATION_CLOSED' })).toEqual({ ok: false, error: 'REGISTRATION_CLOSED' })
    expect(submitResultFromRpc({ ok: false, error: 'DUPLICATE_PARTICIPANT', member_numbers: [2, 3] })).toEqual({
      ok: false,
      error: 'DUPLICATE_PARTICIPANT',
      memberNumbers: [2, 3],
    })
  })

  it('turns eligibility and document failures into readable per-member messages', () => {
    expect(submitResultFromRpc({ ok: false, error: 'INVALID_ELIGIBILITY', member_number: 2, field: 'date_of_birth' })).toEqual({
      ok: false,
      error: 'VALIDATION_FAILED',
      memberNumber: 2,
      message: `Member 2: ${AGE_MESSAGE}`,
    })
    expect(submitResultFromRpc({ ok: false, error: 'INVALID_DOCUMENT', member_number: 3 })).toMatchObject({
      error: 'VALIDATION_FAILED',
      memberNumber: 3,
    })
  })

  it('never leaks unknown backend responses', () => {
    expect(submitResultFromRpc({ message: 'relation "x" does not exist' })).toEqual({ ok: false, error: 'UNKNOWN' })
    expect(submitResultFromRpc(null)).toEqual({ ok: false, error: 'UNKNOWN' })
  })
})

describe('row mapping', () => {
  const member = {
    aadhaar_file_name: 'a.pdf',
    aadhaar_mime_type: 'application/pdf',
    aadhaar_size_bytes: 1000,
    aadhaar_storage_path: 'submissions/x/member-2/y.pdf',
    course_details: null,
    created_at: '',
    date_of_birth: '2001-01-01',
    district: 'Udupi',
    employer: 'Bank',
    full_name: 'Zaid Ahmed',
    id: 'm2',
    institution: null,
    is_aalim: false,
    member_number: 2,
    mobile_number: '9876543210',
    occupation: 'Clerk',
    participant_status: 'working' as const,
    residential_address: 'Main Road, Kapu',
    studying_in_madrasa: false,
    team_id: 't1',
    updated_at: '',
  }

  it('maps a team with members sorted and storage path as the opaque document id', () => {
    const team = teamFromRow({
      id: 't1',
      registration_number: 'MWA-001',
      status: 'submitted',
      admin_note: null,
      consented_at: '',
      created_at: '2026-09-23T10:00:00Z',
      submission_id: 's',
      updated_at: '',
      team_members: [member, { ...member, id: 'm1', member_number: 1 }],
    })
    expect(team.members.map((m) => m.memberNumber)).toEqual([1, 2])
    expect(team.members[1]).toMatchObject({ participantStatus: 'working', occupation: 'Clerk', aadhaar: { uploadId: member.aadhaar_storage_path, mimeType: 'application/pdf' } })
    expect(team.adminNote).toBeUndefined()
  })

  it('sends only the active status fields to register_team', () => {
    const rpc = memberToRpc(
      {
        fullName: 'A B C',
        mobileNumber: '9876543210',
        dateOfBirth: '2001-01-01',
        residentialAddress: 'Main Road, Kapu',
        district: 'Udupi',
        studyingInMadrasa: false,
        isAalim: false,
        participantStatus: 'student',
        courseDetails: 'B.Com',
        institution: 'MGM',
        aadhaar: { uploadId: 'p', fileName: 'f.pdf', sizeBytes: 1 },
      },
      1,
    )
    expect(rpc).toMatchObject({ member_number: 1, course_details: 'B.Com', occupation: null, employer: null, aadhaar_storage_path: 'p' })
  })
})
