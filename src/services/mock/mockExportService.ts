import { ageOn } from '@/domain/age'
import { toCsv } from '@/utils/csv'
import { formatDateTime } from '@/utils/format'
import type { ExportService } from '../types'
import { db } from './db'
import { delay } from './scenario'

const csvBlob = (text: string) => new Blob(['﻿', text], { type: 'text/csv;charset=utf-8' })

/** Exports never include document references or file names. */
export const mockExportService: ExportService = {
  async teamsCsv() {
    await delay()
    const rows = db.teams.map((t) => {
      const lead = t.members[0]
      return [t.registrationNumber, t.status, formatDateTime(t.createdAt), lead?.fullName ?? '', lead?.mobileNumber ?? '', t.adminNote ?? '']
    })
    return csvBlob(toCsv(['Registration ID', 'Status', 'Submitted', 'Primary contact', 'Mobile', 'Admin note'], rows))
  },

  async participantsCsv() {
    await delay()
    const rows = db.teams.flatMap((t) =>
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
  },
}
