import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { Team } from '@/types/domain'
import { formatDate, formatMobile } from '@/utils/format'

/** Compact team summary: ID, status, primary contact, size and date. Details live on the team page. */
export function TeamCard({ team }: { team: Team }) {
  const lead = team.members[0]
  return (
    <Link
      to={`/admin/teams/${team.id}`}
      className="card flex items-center gap-3 p-4 transition-colors hover:border-brand/40 hover:bg-surface-low/40"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-control bg-surface-low px-2 py-0.5 text-label font-bold text-ink tabular">
            {team.registrationNumber}
          </span>
          <StatusBadge status={team.status} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-label font-semibold text-ink">{lead?.fullName ?? '—'}</p>
          <p className="text-small text-ink-muted">
            <span className="tabular">{lead ? formatMobile(lead.mobileNumber) : ''}</span> · {team.members.length} members ·{' '}
            {formatDate(team.createdAt)}
          </p>
        </div>
      </div>
      <ChevronRight aria-hidden className="size-5 shrink-0 text-ink-subtle" />
    </Link>
  )
}
