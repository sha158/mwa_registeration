import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

type Tone = 'info' | 'success' | 'warning' | 'danger'

const tones: Record<Tone, { box: string; icon: ReactNode }> = {
  info: { box: 'bg-surface-low text-ink-muted border-line', icon: <Info className="text-gold" /> },
  success: { box: 'bg-success-bg text-success border-success-line', icon: <CircleCheck /> },
  warning: { box: 'bg-warning-bg text-warning border-warning-line', icon: <TriangleAlert /> },
  danger: { box: 'bg-danger-bg text-danger border-danger-line', icon: <CircleAlert /> },
}

interface AlertProps {
  tone?: Tone
  title?: ReactNode
  children?: ReactNode
  action?: ReactNode
  /** Announce to screen readers when it appears. */
  live?: boolean
  className?: string
}

export function Alert({ tone = 'info', title, children, action, live = false, className }: AlertProps) {
  const { box, icon } = tones[tone]
  return (
    <div
      role={live ? (tone === 'danger' || tone === 'warning' ? 'alert' : 'status') : undefined}
      className={cn('flex gap-3 rounded-control border p-3 text-small', live && 'motion-safe:animate-fade-in', box, className)}
    >
      <span aria-hidden className="mt-px shrink-0 [&>svg]:size-[18px]">
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {title && <p className="text-label font-semibold">{title}</p>}
        {children && <div className={title ? 'text-ink' : undefined}>{children}</div>}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  )
}
