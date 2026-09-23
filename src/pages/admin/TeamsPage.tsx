import { ChevronRight, Search, SearchX, UsersRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useLoaderData, useSearchParams } from 'react-router'
import type { teamsLoader } from '@/app/loaders'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { StateMessage } from '@/components/ui/States'
import { matchesTeam, type StatusFilter } from '@/domain/teamSearch'
import { ExportActions } from '@/features/admin/ExportActions'
import { TeamCard } from '@/features/admin/TeamCard'
import { cn } from '@/utils/cn'
import { formatDate, formatMobile } from '@/utils/format'

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'verified', label: 'Verified' },
  { value: 'rejected', label: 'Rejected' },
]

const isFilter = (v: string | null): v is StatusFilter => FILTERS.some((f) => f.value === v)

export default function TeamsPage() {
  const teams = useLoaderData<typeof teamsLoader>()
  // Status lives in the URL (shareable, back-button friendly); the search text does not,
  // because it may contain names or mobile numbers.
  const [params, setParams] = useSearchParams()
  const statusParam = params.get('status')
  const status: StatusFilter = isFilter(statusParam) ? statusParam : 'all'
  const [search, setSearch] = useState('')

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = { all: teams.length, submitted: 0, verified: 0, rejected: 0, cancelled: 0 }
    for (const t of teams) c[t.status] += 1
    return c
  }, [teams])

  const visible = teams.filter((t) => matchesTeam(t, search, status))

  const setStatus = (value: StatusFilter) =>
    setParams(value === 'all' ? {} : { status: value }, { replace: true, preventScrollReset: true })

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-title font-semibold text-ink">Teams</h1>
          <p className="text-small text-ink-muted">{teams.length} registrations</p>
        </div>
        <ExportActions />
      </div>

      <div className="card flex flex-col gap-3 p-3 sm:p-4">
        <div className="relative">
          <label htmlFor="team-search" className="sr-only">
            Search teams
          </label>
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-ink-subtle" />
          <Input
            id="team-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, participant name or mobile"
            className="pl-11"
            autoComplete="off"
          />
        </div>
        <div role="group" aria-label="Filter by status" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5">
          {FILTERS.map((f) => {
            const active = status === f.value
            return (
              <button
                key={f.value}
                type="button"
                aria-pressed={active}
                onClick={() => setStatus(f.value)}
                className={cn(
                  'inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-label font-semibold transition-colors',
                  active ? 'border-brand bg-brand text-white' : 'border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink',
                )}
              >
                {f.label}
                <span className={cn('tabular', active ? 'text-white/80' : 'text-ink-subtle')}>{counts[f.value]}</span>
              </button>
            )
          })}
        </div>
      </div>

      <p role="status" className="sr-only">
        {visible.length} {visible.length === 1 ? 'team' : 'teams'} shown
      </p>

      {teams.length === 0 ? (
        <div className="card">
          <StateMessage icon={<UsersRound />} title="No teams yet" description="Registered teams will appear here." />
        </div>
      ) : visible.length === 0 ? (
        <div className="card">
          <StateMessage
            icon={<SearchX />}
            title="No matching teams"
            description="Try a different registration ID, name or mobile number."
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearch('')
                  setStatus('all')
                }}
              >
                Clear search
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <ul className="flex flex-col gap-3 lg:hidden">
            {visible.map((team) => (
              <li key={team.id}>
                <TeamCard team={team} />
              </li>
            ))}
          </ul>
          <div className="card hidden overflow-hidden lg:block">
            <table className="w-full text-left text-body">
              <thead className="bg-surface-low text-caption font-bold tracking-wide text-ink-muted uppercase">
                <tr>
                  <th scope="col" className="px-5 py-3">Registration ID</th>
                  <th scope="col" className="px-5 py-3">Primary contact</th>
                  <th scope="col" className="px-5 py-3">Members</th>
                  <th scope="col" className="px-5 py-3">Submitted</th>
                  <th scope="col" className="px-5 py-3">Status</th>
                  <th scope="col" className="px-5 py-3"><span className="sr-only">Action</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((team) => {
                  const lead = team.members[0]
                  return (
                    <tr key={team.id} className="hover:bg-surface-low/50">
                      <td className="px-5 py-4 font-bold text-ink tabular">{team.registrationNumber}</td>
                      <td className="px-5 py-4">
                        <span className="block font-semibold text-ink">{lead?.fullName}</span>
                        <span className="text-small text-ink-muted tabular">{lead && formatMobile(lead.mobileNumber)}</span>
                      </td>
                      <td className="px-5 py-4 text-ink-muted">{team.members.length}</td>
                      <td className="px-5 py-4 text-ink-muted">{formatDate(team.createdAt)}</td>
                      <td className="px-5 py-4">
                        <StatusBadge status={team.status} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          to={`/admin/teams/${team.id}`}
                          className="inline-flex min-h-10 items-center gap-1 rounded-control px-3 text-label font-semibold text-brand hover:bg-surface-low"
                          aria-label={`View team ${team.registrationNumber}`}
                        >
                          View
                          <ChevronRight aria-hidden className="size-4" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
