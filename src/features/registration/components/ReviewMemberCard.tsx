import { Briefcase, CircleCheck, GraduationCap, MapPin, Pencil, Phone } from 'lucide-react'
import { Link } from 'react-router'
import { ageOn } from '@/domain/age'
import type { MemberInput, MemberNumber } from '@/types/domain'
import { formatDate, formatMobile } from '@/utils/format'

export function ReviewMemberCard({ member, memberNumber }: { member: MemberInput; memberNumber: MemberNumber }) {
  const age = ageOn(member.dateOfBirth)
  const student = member.participantStatus === 'student'
  const headingId = `review-member-${memberNumber}`

  return (
    <section aria-labelledby={headingId} className="card flex flex-col gap-3 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-caption font-bold tracking-wide text-ink-muted uppercase">
          <span aria-hidden className="size-2 rounded-full bg-brand" />
          Member {memberNumber}
          {memberNumber === 1 && ' · Team Lead'}
        </p>
        <Link
          to={`/register/member/${memberNumber}`}
          className="-mr-2 inline-flex min-h-11 items-center gap-1.5 rounded-control px-2 text-label font-semibold text-gold hover:bg-gold-soft"
          aria-label={`Edit member ${memberNumber}`}
        >
          <Pencil aria-hidden className="size-4" />
          Edit
        </Link>
      </div>
      <div>
        <h2 id={headingId} className="text-heading font-semibold text-ink">
          {member.fullName}
        </h2>
        <p className="text-small text-ink-muted">
          {age} years · born {formatDate(member.dateOfBirth)}
        </p>
      </div>
      <ul className="flex flex-col gap-2 text-body text-ink">
        <li className="flex items-center gap-2.5">
          <Phone aria-hidden className="size-4 shrink-0 text-ink-subtle" />
          <span className="tabular">{formatMobile(member.mobileNumber)}</span>
        </li>
        <li className="flex items-center gap-2.5">
          <MapPin aria-hidden className="size-4 shrink-0 text-ink-subtle" />
          {member.district}
        </li>
        <li className="flex items-start gap-2.5">
          {student ? (
            <GraduationCap aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-subtle" />
          ) : (
            <Briefcase aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-subtle" />
          )}
          <span className="min-w-0">
            {student ? 'Student' : 'Working'} — {student ? member.courseDetails : member.occupation}
            <span className="block text-small text-ink-muted">{student ? member.institution : member.employer}</span>
          </span>
        </li>
        <li className="flex items-center gap-2.5 font-semibold text-success">
          <CircleCheck aria-hidden className="size-4 shrink-0" />
          {member.aadhaar.kind === 'pdf' ? 'e-Aadhaar PDF uploaded' : 'Aadhaar front & back uploaded'}
        </li>
      </ul>
    </section>
  )
}
