import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

const STEPS = ['Member 1', 'Member 2', 'Member 3', 'Review'] as const

/** Stitch step card: "Step n of 4", title, % pill, segmented bar and step labels. */
export function StepperCard({ step, title, children }: { step: 1 | 2 | 3 | 4; title: string; children?: ReactNode }) {
  return (
    <div className="card flex flex-col gap-3 p-4 sm:p-6">
      <div>
        <p className="text-overline font-bold tracking-wider text-gold uppercase">
          Step {step} of {STEPS.length}
        </p>
        <h1 className="text-title font-semibold text-brand">{title}</h1>
      </div>
      <ol className="grid grid-cols-4 gap-1.5" aria-label="Registration progress">
        {STEPS.map((label, i) => {
          const n = i + 1
          const state = n < step ? 'done' : n === step ? 'current' : 'upcoming'
          return (
            <li key={label} aria-current={state === 'current' ? 'step' : undefined} className="flex flex-col gap-2">
              <span aria-hidden className={cn('h-1.5 rounded-full', state === 'upcoming' ? 'bg-surface-high' : 'bg-brand')} />
              <span
                className={cn(
                  'flex items-center gap-1 text-caption',
                  state === 'upcoming' ? 'text-ink-subtle' : 'font-semibold text-brand',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'grid size-4 shrink-0 place-items-center rounded-full text-[10px] font-bold',
                    state === 'done' && 'bg-brand text-white',
                    state === 'current' && 'bg-brand text-white ring-2 ring-ring/60',
                    state === 'upcoming' && 'bg-surface-mid text-ink-muted',
                  )}
                >
                  {state === 'done' ? <Check className="size-3" strokeWidth={3} /> : n}
                </span>
                <span className="truncate">
                  <span className="sm:hidden">{i < 3 ? `M${n}` : label}</span>
                  <span className="hidden sm:inline">{label}</span>
                </span>
                <span className="sr-only">{state === 'done' ? ' (completed)' : state === 'current' ? ' (current)' : ''}</span>
              </span>
            </li>
          )
        })}
      </ol>
      {children}
    </div>
  )
}
