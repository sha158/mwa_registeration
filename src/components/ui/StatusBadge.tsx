import { Ban, CircleCheck, CircleX, Clock } from 'lucide-react'
import type { ReactNode } from 'react'
import type { RegistrationStatus } from '@/types/domain'
import { cn } from '@/utils/cn'

const STATUS: Record<RegistrationStatus, { label: string; icon: ReactNode; className: string }> = {
  submitted: { label: 'Pending verification', icon: <Clock />, className: 'bg-warning-bg text-warning border-warning-line' },
  verified: { label: 'Verified', icon: <CircleCheck />, className: 'bg-success-bg text-success border-success-line' },
  rejected: { label: 'Rejected', icon: <CircleX />, className: 'bg-danger-bg text-danger border-danger-line' },
  cancelled: { label: 'Cancelled', icon: <Ban />, className: 'bg-surface-mid text-ink-muted border-line' },
}

export function StatusBadge({ status, className }: { status: RegistrationStatus; className?: string }) {
  const s = STATUS[status]
  return <Pill className={cn(s.className, className)} icon={s.icon}>{s.label}</Pill>
}

export function Pill({ children, icon, className }: { children: ReactNode; icon?: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-caption font-semibold whitespace-nowrap [&>svg]:size-3.5',
        className,
      )}
    >
      {icon && <span aria-hidden className="contents">{icon}</span>}
      {children}
    </span>
  )
}
