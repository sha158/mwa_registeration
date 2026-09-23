import { CircleAlert } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface FieldControlProps {
  id: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
  'aria-required'?: boolean
}

interface FieldProps {
  label: ReactNode
  /** Right-aligned auxiliary text in the label row (e.g. "Age 19–26"). */
  aside?: ReactNode
  hint?: ReactNode
  error?: string
  required?: boolean
  className?: string
  children: (control: FieldControlProps) => ReactNode
}

/** Visible label + hint + adjacent error, wired to the control for assistive tech. */
export function Field({ label, aside, hint, error, required, className, children }: FieldProps) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-label font-semibold text-ink">
          {label}
          {required && (
            <span aria-hidden className="ml-0.5 text-danger-strong">
              *
            </span>
          )}
        </label>
        {aside && <span className="shrink-0 text-caption font-semibold text-ink-subtle">{aside}</span>}
      </div>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined, 'aria-required': required || undefined })}
      <FieldError id={errorId} message={error} />
      {hint && (
        <p id={hintId} className="text-small text-ink-subtle">
          {hint}
        </p>
      )}
    </div>
  )
}

export function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="flex items-start gap-1.5 text-small font-medium text-danger-strong">
      <CircleAlert aria-hidden className="mt-px size-4 shrink-0" />
      <span>{message}</span>
    </p>
  )
}
