import { cn } from '@/utils/cn'

export function ProgressBar({
  value,
  max,
  label,
  className,
  barClassName,
}: {
  value: number
  max: number
  label: string
  className?: string
  barClassName?: string
}) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-surface-high', className)}
    >
      <div className={cn('h-full rounded-full bg-brand transition-[width] duration-500', barClassName)} style={{ width: `${pct}%` }} />
    </div>
  )
}
