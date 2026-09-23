import type { ReactNode } from 'react'

/** Sticky bottom action bar on mobile; inline footer on larger screens. */
export function StepActions({ children, note }: { children: ReactNode; note?: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 shadow-float backdrop-blur pb-safe sm:static sm:border-0 sm:bg-transparent sm:shadow-none sm:backdrop-blur-none">
      <div className="mx-auto flex max-w-form flex-col gap-2 px-4 py-3 sm:px-0 sm:py-0">
        {note}
        <div className="flex gap-2 sm:justify-end">{children}</div>
      </div>
    </div>
  )
}
