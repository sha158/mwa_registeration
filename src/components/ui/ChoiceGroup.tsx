import { useId, type ComponentProps, type ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { FieldError } from './Field'

export interface ChoiceOption {
  value: string
  label: string
  icon?: ReactNode
}

type InputProps = Omit<ComponentProps<'input'>, 'type' | 'value' | 'id'>

interface ChoiceGroupProps {
  legend: ReactNode
  options: ChoiceOption[]
  /** Spread of react-hook-form `register(name)` (or equivalent uncontrolled radio props). */
  inputProps: InputProps
  error?: string
  required?: boolean
  /** "segmented" = Stitch Student/Working toggle; "pills" = Yes/No answers. */
  appearance?: 'segmented' | 'pills'
  className?: string
}

/**
 * Radio group rendered as a segmented control or pill choices. Uses native radios,
 * so keyboard arrows, form state and screen readers work without extra code.
 */
export function ChoiceGroup({
  legend,
  options,
  inputProps,
  error,
  required,
  appearance = 'pills',
  className,
}: ChoiceGroupProps) {
  const id = useId()
  const errorId = error ? `${id}-error` : undefined
  const segmented = appearance === 'segmented'

  return (
    <fieldset className={cn('flex min-w-0 flex-col gap-2', className)} aria-describedby={errorId}>
      <legend className="mb-2 text-label font-semibold text-ink">
        {legend}
        {required && (
          <span aria-hidden className="ml-0.5 text-danger-strong">
            *
          </span>
        )}
      </legend>
      <div
        className={cn(
          'grid gap-1',
          segmented ? 'grid-cols-2 rounded-card bg-surface-low p-1' : 'grid-cols-2 gap-2 sm:max-w-80',
        )}
      >
        {options.map((option) => (
          <label key={option.value} className="relative flex cursor-pointer">
            <input
              type="radio"
              value={option.value}
              className="peer sr-only"
              {...inputProps}
            />
            <span
              className={cn(
                'flex min-h-12 w-full items-center justify-center gap-2 rounded-control px-3 text-label font-semibold transition-colors',
                'peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/60',
                segmented
                  ? 'text-ink-muted hover:text-ink peer-checked:bg-brand peer-checked:text-white peer-checked:shadow-sm'
                  : error
                    ? 'border-[1.5px] border-line bg-surface text-ink hover:border-line-strong peer-checked:border-danger-strong peer-checked:bg-danger-bg peer-checked:text-danger'
                    : 'border-[1.5px] border-line bg-surface text-ink hover:border-line-strong peer-checked:border-brand peer-checked:bg-brand-tint peer-checked:text-brand',
              )}
            >
              {!segmented && (
                <span
                  aria-hidden
                  className="grid size-5 place-items-center rounded-full border-2 border-line-strong bg-surface [label:has(:checked)_&]:border-brand"
                >
                  <span className="size-2.5 scale-0 rounded-full bg-brand transition-transform [label:has(:checked)_&]:scale-100" />
                </span>
              )}
              {option.icon}
              {option.label}
            </span>
          </label>
        ))}
      </div>
      <FieldError id={errorId} message={error} />
    </fieldset>
  )
}
