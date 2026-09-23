import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export function StatTile({
  label,
  value,
  suffix,
  icon,
  tone = 'neutral',
  children,
}: {
  label: string
  value: number
  suffix?: string
  icon: ReactNode
  tone?: 'neutral' | 'warning'
  children?: ReactNode
}) {
  return (
    <div className="card flex flex-col gap-2 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className={cn('text-caption font-semibold', tone === 'warning' ? 'text-warning' : 'text-ink-muted')}>{label}</p>
        <span aria-hidden className={cn('[&>svg]:size-5', tone === 'warning' ? 'text-warning' : 'text-brand')}>
          {icon}
        </span>
      </div>
      <p className="flex items-baseline gap-1">
        <span className={cn('text-display font-bold tabular', tone === 'warning' ? 'text-warning' : 'text-ink')}>{value}</span>
        {suffix && <span className="text-body text-ink-muted tabular">{suffix}</span>}
      </p>
      {children}
    </div>
  )
}
