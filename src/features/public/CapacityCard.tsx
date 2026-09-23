import { Timer } from 'lucide-react'
import { ProgressBar } from '@/components/ui/ProgressBar'
import type { Availability } from '@/types/domain'
import { cn } from '@/utils/cn'

const TONE = {
  open: { dot: 'bg-gold-dot', text: 'text-gold', bar: 'bg-brand' },
  limited: { dot: 'bg-warning', text: 'text-warning', bar: 'bg-warning' },
  full: { dot: 'bg-danger-strong', text: 'text-danger', bar: 'bg-danger-strong' },
  closed: { dot: 'bg-ink-subtle', text: 'text-ink-muted', bar: 'bg-ink-subtle' },
} as const

export function CapacityCard({ availability, className }: { availability: Availability; className?: string }) {
  const { state, registeredTeams, maximumTeams, slotsRemaining } = availability
  const tone = TONE[state]
  const remaining =
    state === 'closed'
      ? 'Registration closed'
      : state === 'full'
        ? 'No slots remaining'
        : `${slotsRemaining} ${slotsRemaining === 1 ? 'slot' : 'slots'} remaining`

  return (
    <div className={cn('flex w-full flex-col gap-2.5 rounded-card bg-surface-low p-4 text-left', className)}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <p className="flex items-center gap-2 text-label font-semibold text-ink">
          <span aria-hidden className={cn('size-2.5 rounded-full', tone.dot)} />
          <span className="tabular">
            {registeredTeams} / {maximumTeams}
          </span>{' '}
          teams registered
        </p>
        <p className={cn('text-caption font-bold tabular', tone.text)}>{remaining}</p>
      </div>
      <ProgressBar value={registeredTeams} max={maximumTeams} label="Teams registered" barClassName={tone.bar} />
      {(state === 'open' || state === 'limited') && (
        <p className="flex items-center justify-center gap-1.5 text-small text-ink-muted">
          <Timer aria-hidden className="size-4 text-gold" />
          First-come, first-served
        </p>
      )}
    </div>
  )
}
