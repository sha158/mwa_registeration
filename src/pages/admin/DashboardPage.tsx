import { ArrowRight, CircleCheck, ClipboardList, Lock, UsersRound, UserRoundCheck } from 'lucide-react'
import { Link, useLoaderData } from 'react-router'
import type { dashboardLoader } from '@/app/loaders'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Pill } from '@/components/ui/StatusBadge'
import { StateMessage } from '@/components/ui/States'
import { StatTile } from '@/features/admin/StatTile'
import { TeamCard } from '@/features/admin/TeamCard'

export default function DashboardPage() {
  const { stats, pendingTeams, registrationOpen } = useLoaderData<typeof dashboardLoader>()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-title font-semibold text-ink">Registration overview</h1>
        <Link to="/admin/settings" aria-label={`Registration is ${registrationOpen ? 'open' : 'closed'}. Change in settings`}>
          {registrationOpen ? (
            <Pill icon={<CircleCheck />} className="border-success-line bg-success-bg text-success">
              Registration open
            </Pill>
          ) : (
            <Pill icon={<Lock />} className="border-danger-line bg-danger-bg text-danger">
              Registration closed
            </Pill>
          )}
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatTile label="Teams registered" value={stats.registeredTeams} suffix={`/ ${stats.maximumTeams}`} icon={<UsersRound />}>
          <ProgressBar value={stats.registeredTeams} max={stats.maximumTeams} label="Teams registered" />
        </StatTile>
        <StatTile label="Participants" value={stats.participants} icon={<UserRoundCheck />} />
        <StatTile label="Slots remaining" value={stats.slotsRemaining} icon={<ClipboardList />} />
        <StatTile
          label="Pending verification"
          value={stats.pendingVerification}
          icon={<ClipboardList />}
          tone={stats.pendingVerification > 0 ? 'warning' : 'neutral'}
        />
      </div>

      <section aria-labelledby="pending" className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id="pending" className="text-heading font-semibold text-ink">
            Needs verification
          </h2>
          <Link
            to="/admin/teams"
            className="inline-flex min-h-11 items-center gap-1 text-label font-semibold text-brand hover:underline"
          >
            All teams
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>
        {pendingTeams.length === 0 ? (
          <div className="card">
            <StateMessage
              icon={<CircleCheck />}
              title="All caught up"
              description="There are no teams waiting for verification."
            />
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {pendingTeams.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
