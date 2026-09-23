import { Check } from 'lucide-react'
import { useId, type ComponentProps, type ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { FieldError } from './Field'

export function Checkbox({
  label,
  error,
  className,
  ...props
}: Omit<ComponentProps<'input'>, 'type'> & { label: ReactNode; error?: string }) {
  const id = useId()
  const errorId = error ? `${id}-error` : undefined
  return (
    <div className={className}>
      <label htmlFor={id} className="flex min-h-12 cursor-pointer items-start gap-3 py-2">
        <span className="relative mt-0.5 grid size-5 shrink-0 place-items-center">
          <input
            id={id}
            type="checkbox"
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId}
            className="peer size-5 cursor-pointer appearance-none rounded border-2 border-line-strong bg-surface transition-colors checked:border-brand checked:bg-brand aria-invalid:border-danger-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            {...props}
          />
          <Check aria-hidden strokeWidth={3} className="pointer-events-none absolute size-3.5 text-white opacity-0 peer-checked:opacity-100" />
        </span>
        <span className="text-body text-ink">{label}</span>
      </label>
      <div className={cn(error && 'pl-8')}>
        <FieldError id={errorId} message={error} />
      </div>
    </div>
  )
}
