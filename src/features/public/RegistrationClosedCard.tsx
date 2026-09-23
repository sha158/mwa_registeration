import { Lock } from 'lucide-react'
import { Pill } from '@/components/ui/StatusBadge'
import { EVENT } from '@/config/event'
import type { Availability } from '@/types/domain'

/** Replaces the Register CTA when registration is full or manually closed. */
export function RegistrationClosedCard({ availability }: { availability: Availability }) {
  const full = availability.state === 'full'
  return (
    <div className="card flex w-full flex-col items-center gap-3 p-6 text-center">
      <Pill icon={<Lock />} className="border-danger-line bg-danger-bg text-danger uppercase">
        {full ? 'Capacity reached' : 'Registration closed'}
      </Pill>
      <h2 className="text-title font-semibold text-ink">Registration Closed</h2>
      <p className="max-w-sm text-body text-ink-muted">
        {full
          ? 'All available team slots have been filled.'
          : 'Registration has been closed by the organisers.'}
      </p>
      <p className="text-small text-ink-subtle">
        Questions?{' '}
        <a href={`tel:${EVENT.helpline}`} className="font-semibold text-brand underline-offset-2 hover:underline">
          Call {EVENT.helplineDisplay}
        </a>
      </p>
    </div>
  )
}
