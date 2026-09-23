import { ArrowLeft } from 'lucide-react'
import { Link, Outlet, useLoaderData } from 'react-router'
import type { availabilityLoader } from '@/app/loaders'
import { Pill } from '@/components/ui/StatusBadge'
import { canRegister } from '@/domain/availability'
import { RegistrationClosedCard } from '@/features/public/RegistrationClosedCard'
import { SiteHeader } from './SiteHeader'

export function RegistrationLayout() {
  const availability = useLoaderData<typeof availabilityLoader>()
  const open = canRegister(availability)

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader
        width="form"
        title="Team Registration"
        leading={
          <Link
            to="/"
            aria-label="Back to competition overview"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-low text-ink hover:bg-surface-mid"
          >
            <ArrowLeft aria-hidden className="size-5" />
          </Link>
        }
        trailing={
          open && (
            <Pill
              icon={<span className="size-2 rounded-full bg-gold-dot" />}
              className="border-transparent bg-gold-soft text-gold tabular"
            >
              {availability.slotsRemaining} {availability.slotsRemaining === 1 ? 'slot' : 'slots'} left
            </Pill>
          )
        }
      />
      <main id="main" className="mx-auto w-full max-w-form flex-1 px-4 pt-4 pb-40 sm:px-6 sm:pt-8 sm:pb-16">
        {open ? (
          <Outlet />
        ) : (
          <div className="flex flex-col gap-4 pt-6">
            <h1 className="sr-only">Registration closed</h1>
            <RegistrationClosedCard availability={availability} />
            <Link to="/" className="mx-auto inline-flex min-h-11 items-center text-label font-semibold text-brand hover:underline">
              Back to overview
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
