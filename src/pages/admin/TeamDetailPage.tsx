import { ArrowLeft } from 'lucide-react'
import { Link, useLoaderData } from 'react-router'
import type { teamDetailLoader } from '@/app/loaders'
import { Alert } from '@/components/ui/Alert'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { MemberDetailCard } from '@/features/admin/MemberDetailCard'
import { VerificationPanel } from '@/features/admin/VerificationPanel'
import { formatDateTime } from '@/utils/format'

export default function TeamDetailPage() {
  const team = useLoaderData<typeof teamDetailLoader>()

  return (
    <div className="flex flex-col gap-5">
      <Link to="/admin/teams" className="inline-flex min-h-11 w-fit items-center gap-1.5 text-label font-semibold text-brand hover:underline">
        <ArrowLeft aria-hidden className="size-4" />
        All teams
      </Link>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-4 lg:order-2 lg:sticky lg:top-24">
          <div className="card flex flex-col gap-4 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h1 className="text-title font-bold text-ink tabular">{team.registrationNumber}</h1>
              <StatusBadge status={team.status} />
            </div>
            <p className="-mt-2 text-small text-ink-muted">Submitted {formatDateTime(team.createdAt)}</p>
            {team.status === 'rejected' && team.adminNote && (
              <Alert tone="danger" title="Rejection note">
                {team.adminNote}
              </Alert>
            )}
            <VerificationPanel team={team} />
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:order-1">
          {team.members.map((member) => (
            <MemberDetailCard key={member.id} member={member} />
          ))}
        </div>
      </div>
    </div>
  )
}
