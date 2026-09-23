import { ageOn } from '@/domain/age'
import type { Team } from '@/types/domain'
import { toCsv } from '@/utils/csv'
import { formatDateTime } from '@/utils/format'

/**
 * CSV builders shared by every ExportService implementation.
 * Exports never include Aadhaar storage paths, file names or document URLs.
 */
const csvBlob = (text: string) => new Blob(['﻿', text], { type: 'text/csv;charset=utf-8' })

export function teamsCsv(teams: Team[]): Blob {
  const rows = teams.map((t) => {
    const lead = t.members.find((m) => m.memberNumber === 1)
    return [t.registrationNumber, t.status, formatDateTime(t.createdAt), lead?.fullName ?? '', lead?.mobileNumber ?? '', t.adminNote ?? '']
  })
  return csvBlob(toCsv(['Registration ID', 'Status', 'Submitted', 'Primary contact', 'Mobile', 'Admin note'], rows))
}

export function participantsCsv(teams: Team[]): Blob {
  const rows = teams.flatMap((t) =>
    t.members.map((m) => [
      t.registrationNumber,
      t.status,
      m.memberNumber,
      m.fullName,
      m.mobileNumber,
      m.dateOfBirth,
      ageOn(m.dateOfBirth) ?? '',
      m.district,
      m.residentialAddress,
      m.participantStatus === 'student' ? 'Student' : 'Working',
      m.participantStatus === 'student' ? m.courseDetails : m.occupation,
      m.participantStatus === 'student' ? m.institution : m.employer,
    ]),
  )
  return csvBlob(
    toCsv(
      ['Registration ID', 'Team status', 'Member', 'Full name', 'Mobile', 'Date of birth', 'Age on event day', 'District', 'Address', 'Status', 'Course / Occupation', 'Institution / Employer'],
      rows,
    ),
  )
}
