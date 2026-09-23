import { CircleCheck, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { checkAge } from '@/domain/age'
import type { TeamMember } from '@/types/domain'
import { formatDate, formatMobile } from '@/utils/format'
import { DocumentViewer } from './DocumentViewer'

export function MemberDetailCard({ member }: { member: TeamMember }) {
  const age = checkAge(member.dateOfBirth)
  const student = member.participantStatus === 'student'
  const headingId = `member-${member.id}`

  return (
    <section aria-labelledby={headingId} className="card flex flex-col gap-4 p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-caption font-bold text-white">
          {member.memberNumber}
        </span>
        <div className="min-w-0">
          <h2 id={headingId} className="truncate text-heading font-semibold text-ink">
            {member.fullName}
          </h2>
          <p className="text-caption text-ink-muted">Member {member.memberNumber}{member.memberNumber === 1 && ' · Team Lead'}</p>
        </div>
      </div>

      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        <Item label="Mobile">
          <a href={`tel:+91${member.mobileNumber}`} className="font-semibold text-brand tabular hover:underline">
            {formatMobile(member.mobileNumber)}
          </a>
        </Item>
        <Item label="Date of birth · age on event day">
          {formatDate(member.dateOfBirth)} · {'age' in age ? `${age.age} yrs` : '—'}
          {age.status !== 'eligible' && (
            <span className="mt-1 flex items-center gap-1 text-small font-semibold text-danger">
              <TriangleAlert aria-hidden className="size-4" /> Outside 19–26
            </span>
          )}
        </Item>
        <Item label="District">{member.district}</Item>
        <Item label={student ? 'Student' : 'Working'}>
          {student ? member.courseDetails : member.occupation}
          <span className="block text-small text-ink-muted">{student ? member.institution : member.employer}</span>
        </Item>
        <Item label="Residential address" wide>
          {member.residentialAddress}
        </Item>
        <Item label="Madrasa student · Aalim">
          {member.studyingInMadrasa ? 'Yes' : 'No'} · {member.isAalim ? 'Yes' : 'No'}
        </Item>
      </dl>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-control bg-surface-low p-3">
        <p className="flex items-center gap-2 text-label font-semibold text-success">
          <CircleCheck aria-hidden className="size-4" />
          Aadhaar uploaded
        </p>
        <DocumentViewer document={member.aadhaar} memberName={member.fullName} />
      </div>
    </section>
  )
}

function Item({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'sm:col-span-2' : undefined}>
      <dt className="text-caption font-semibold text-ink-subtle">{label}</dt>
      <dd className="text-body text-ink">{children}</dd>
    </div>
  )
}
