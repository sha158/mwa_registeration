import { Headset } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Logo } from '@/components/ui/Logo'
import { EVENT } from '@/config/event'
import { cn } from '@/utils/cn'

/** Sticky translucent header from the Stitch screens. */
export function SiteHeader({
  title,
  leading,
  trailing,
  width = 'page',
}: {
  title: ReactNode
  leading?: ReactNode
  trailing?: ReactNode
  width?: 'form' | 'page' | 'admin'
}) {
  return (
    <header className="sticky top-0 z-40 bg-canvas/85 shadow-header backdrop-blur-xl">
      <div
        className={cn(
          'mx-auto flex h-16 items-center justify-between gap-3 px-4 sm:px-6',
          width === 'form' ? 'max-w-form' : width === 'admin' ? 'max-w-admin' : 'max-w-page',
        )}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          {leading ?? (
            <Link to="/" className="shrink-0 rounded-control" aria-label={`${EVENT.name} home`}>
              <Logo decorative className="size-10 border border-line p-0.5" />
            </Link>
          )}
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-overline font-bold tracking-wider text-gold uppercase">{EVENT.shortName}</span>
            <span className="truncate text-heading leading-tight font-semibold text-ink">{title}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">{trailing}</div>
      </div>
    </header>
  )
}

export function HelplineLink() {
  return (
    <a
      href={`tel:${EVENT.helpline}`}
      aria-label={`Call helpline ${EVENT.helplineDisplay}`}
      className="grid size-11 place-items-center rounded-full text-ink-muted transition-colors hover:bg-surface-low hover:text-brand"
    >
      <Headset aria-hidden className="size-[22px]" />
    </a>
  )
}
