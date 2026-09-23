import { Lock, Phone } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'
import { EVENT } from '@/config/event'
import { HelplineLink, SiteHeader } from './SiteHeader'

export function PublicLayout({ title = 'Team Registration' }: { title?: string }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader
        title={title}
        trailing={
          <>
            <NavLink
              to="/rules"
              className="hidden min-h-11 items-center rounded-control px-3 text-label font-semibold text-ink-muted hover:bg-surface-low hover:text-brand aria-[current=page]:text-brand sm:flex"
            >
              Rules
            </NavLink>
            <HelplineLink />
          </>
        }
      />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line/70 px-4 py-8 text-center">
      <p className="flex items-center justify-center gap-1.5 text-caption font-semibold text-ink">
        <Lock aria-hidden className="size-3.5" />
        {EVENT.organiser} · Secure registration
      </p>
      <p className="mt-1 text-small text-ink-subtle">Serving humanity through education & enlightenment</p>
      <a
        href={`tel:${EVENT.helpline}`}
        className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-small font-semibold text-brand hover:underline"
      >
        <Phone aria-hidden className="size-4" />
        Need help? {EVENT.helplineDisplay}
      </a>
    </footer>
  )
}
