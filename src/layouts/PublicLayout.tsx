import { Lock, MapPin, Phone } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'
import { Logo } from '@/components/ui/Logo'
import { CONTACTS, EVENT } from '@/config/event'
import { HelplineLink, OrganiserBrand, SiteHeader } from './SiteHeader'

export function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader
        leading={<OrganiserBrand />}
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
    <footer className="border-t border-line/70 bg-surface px-4 py-10">
      <div className="mx-auto flex max-w-page flex-col items-center gap-4 text-center">
        <Logo className="size-16 border border-line p-1" />
        <div className="flex flex-col items-center gap-1">
          <p className="text-heading font-bold text-ink">{EVENT.organiser}</p>
          <p className="flex items-center gap-1 text-label font-semibold text-gold">
            <MapPin aria-hidden className="size-4" />
            {EVENT.location}
          </p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-caption font-bold tracking-wider text-ink-muted uppercase">Contact</p>
          <ul className="flex flex-col items-center sm:flex-row sm:gap-4">
            {CONTACTS.map((c) => (
              <li key={c.tel}>
                <a
                  href={`tel:${c.tel}`}
                  className="inline-flex min-h-11 items-center gap-1.5 text-label font-semibold text-brand tabular hover:underline"
                >
                  <Phone aria-hidden className="size-4" />
                  {c.display}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <p className="flex items-center gap-1.5 text-small text-ink-subtle">
          <Lock aria-hidden className="size-3.5" />
          Secure registration · {EVENT.name}
        </p>
      </div>
    </footer>
  )
}
