import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface StateProps {
  icon: ReactNode
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  tone?: 'neutral' | 'danger' | 'warning'
  className?: string
}

const iconTone = {
  neutral: 'bg-surface-mid text-brand',
  danger: 'bg-danger-bg text-danger',
  warning: 'bg-warning-bg text-warning',
}

/** Shared layout for empty, error, not-found and blocked states. */
export function StateMessage({ icon, title, description, action, tone = 'neutral', className }: StateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3 px-4 py-10 text-center', className)}>
      <span aria-hidden className={cn('grid size-14 place-items-center rounded-full [&>svg]:size-7', iconTone[tone])}>
        {icon}
      </span>
      <h2 className="text-heading font-semibold text-ink">{title}</h2>
      {description && <p className="max-w-sm text-body text-ink-muted">{description}</p>}
      {action && <div className="mt-2 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  )
}
