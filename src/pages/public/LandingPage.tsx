import {
  ArrowRight,
  BookOpen,
  CircleCheck,
  CircleX,
  Clock,
  Gift,
  ListChecks,
  ShieldCheck,
  Trophy,
  UserRoundPlus,
  UsersRound,
  Utensils,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useLoaderData } from 'react-router'
import { ButtonLink } from '@/components/ui/Button'
import { BOOK, EVENT, LIMITS } from '@/config/event'
import { canRegister } from '@/domain/availability'
import { BookAuthor } from '@/features/public/BookAuthor'
import { CapacityCard } from '@/features/public/CapacityCard'
import { BIRTH_RANGE_TEXT, ELIGIBLE, NOT_ELIGIBLE } from '@/features/public/content'
import { RegistrationClosedCard } from '@/features/public/RegistrationClosedCard'
import type { availabilityLoader } from '@/app/loaders'
import { cn } from '@/utils/cn'

export default function LandingPage() {
  const availability = useLoaderData<typeof availabilityLoader>()
  const open = canRegister(availability)

  return (
    <div className="mx-auto flex max-w-page flex-col gap-10 px-4 pt-6 pb-12 sm:px-6 lg:gap-14 lg:pt-12">
      {/* Hero */}
      <section className="mx-auto flex w-full max-w-xl flex-col items-center text-center">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-gold-soft px-3 py-1 text-overline font-bold tracking-wider text-gold uppercase">
          <span aria-hidden className="size-1.5 rounded-full bg-gold-dot" />
          {EVENT.level}
        </p>
        <h1 className="mt-4 flex items-center gap-2.5 text-display font-bold text-ink lg:text-display-lg">
          <Trophy aria-hidden className="size-8 shrink-0 text-gold-dot lg:size-10" />
          {EVENT.name}
        </h1>
        <p className="mt-2 text-body-lg font-semibold text-brand">{EVENT.tagline}</p>

        <div className="mt-5 flex w-full flex-col items-center gap-1 rounded-card border border-gold-dot/40 bg-gold-soft/50 px-4 py-4">
          <span className="text-overline font-bold tracking-wider text-gold uppercase">Based on</span>
          <p className="text-heading font-bold text-ink">“{BOOK.title}”</p>
          <p className="text-small text-ink-muted">
            By <BookAuthor />
          </p>
        </div>

        <p className="mt-4 text-body font-medium text-ink">{EVENT.audience}</p>
        <p className="text-body text-ink-muted">Register your {LIMITS.teamSize}-member team</p>

        <ul className="mt-5 grid w-full grid-cols-2 gap-2 sm:grid-cols-4" aria-label="At a glance">
          <Highlight>{LIMITS.maxTeams} teams only</Highlight>
          <Highlight>{LIMITS.teamSize} members per team</Highlight>
          <Highlight>
            Age {LIMITS.minAge}–{LIMITS.maxAge}
          </Highlight>
          <Highlight>Free registration</Highlight>
        </ul>

        <CapacityCard availability={availability} className="mt-5" />

        <div className="mt-5 flex w-full flex-col items-center gap-2">
          {open ? (
            <>
              <ButtonLink to="/register" size="lg" className="w-full" icon={<UserRoundPlus aria-hidden className="size-5" />}>
                Register Your Team
              </ButtonLink>
              <p className="text-small text-ink-subtle">Takes about 5 minutes · No account needed</p>
            </>
          ) : (
            <RegistrationClosedCard availability={availability} />
          )}
        </div>
      </section>

      {/* Eligibility */}
      <section aria-labelledby="eligibility" className="flex flex-col gap-3">
        <SectionTitle id="eligibility" aside="Checked for every member">
          Who can participate
        </SectionTitle>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="card flex flex-col gap-3 p-4 sm:p-5">
            <h3 className="flex items-center gap-2 text-label font-semibold text-brand">
              <CircleCheck aria-hidden className="size-5" />
              Eligible
            </h3>
            <BulletList items={ELIGIBLE} dot="bg-brand" />
            <p className="text-small text-ink-subtle">{BIRTH_RANGE_TEXT}</p>
          </div>
          <div className="card flex flex-col gap-3 p-4 sm:p-5">
            <h3 className="flex items-center gap-2 text-label font-semibold text-danger-strong">
              <CircleX aria-hidden className="size-5" />
              Not eligible
            </h3>
            <BulletList items={NOT_ELIGIBLE} dot="bg-danger-strong" />
          </div>
        </div>
      </section>

      {/* Syllabus */}
      <section aria-labelledby="syllabus" className="flex flex-col gap-3">
        <SectionTitle id="syllabus">Syllabus</SectionTitle>
        <div className="card flex items-start gap-4 p-4 sm:p-5">
          <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-control bg-brand text-white">
            <BookOpen className="size-6" />
          </span>
          <div className="flex flex-col gap-1">
            <span className="text-caption font-semibold text-ink-muted">Prescribed book</span>
            <p className="text-heading font-bold text-ink">“{BOOK.title}”</p>
            <p className="text-small text-ink-muted">
              By <BookAuthor />
            </p>
            <p className="mt-1 text-body text-ink">All questions are based exclusively on this book.</p>
          </div>
        </div>
      </section>

      {/* Key facts */}
      <section aria-labelledby="facts" className="flex flex-col gap-3">
        <SectionTitle id="facts">Competition day</SectionTitle>
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Fact icon={<Clock />} label="Reporting time" value={EVENT.reportingTime} />
          <Fact icon={<BookOpen />} label="Syllabus" value={BOOK.title} />
          <Fact icon={<Utensils />} label="Food" value="Breakfast & lunch" />
          <Fact icon={<Gift />} label="For every participant" value="Memento" />
        </ul>
      </section>

      <div className={cn('grid gap-6', open && 'lg:grid-cols-2')}>
        {/* What you need */}
        {open && (
          <section aria-labelledby="need" className="card flex flex-col gap-4 p-4 sm:p-6">
            <h2 id="need" className="flex items-center gap-2 text-heading font-semibold text-ink">
              <ListChecks aria-hidden className="size-5 text-gold" />
              Before you start
            </h2>
            <ol className="flex flex-col gap-4">
              <Step n={1} title={`Details of all ${LIMITS.teamSize} members`}>
                Name, mobile number, date of birth, address and college or work details.
              </Step>
              <Step n={2} title="Aadhaar card of each member">
                Clear photos of the front and back (JPG or PNG), or the e-Aadhaar PDF — up to 2 MB each. Name, date of
                birth and address must be readable.
              </Step>
              <Step n={3} title="About 5 minutes">
                Slots are confirmed only when you submit, so finish in one go.
              </Step>
            </ol>
            <p className="flex items-center gap-2.5 rounded-control bg-surface-low p-3 text-small text-ink-muted">
              <ShieldCheck aria-hidden className="size-[18px] shrink-0 text-brand" />
              Aadhaar copies are stored privately and used only to verify age, identity and address.
            </p>
          </section>
        )}

        {/* Final CTA */}
        <section aria-labelledby="ready" className="card flex flex-col items-center justify-center gap-3 p-6 text-center">
          <span aria-hidden className="grid size-12 place-items-center rounded-full bg-gold-soft text-gold">
            <UsersRound className="size-6" />
          </span>
          <h2 id="ready" className="text-heading font-semibold text-ink">
            {open ? 'Ready to compete?' : 'Competition rules'}
          </h2>
          <p className="max-w-xs text-body text-ink-muted">
            {open
              ? `${availability.slotsRemaining} of ${availability.maximumTeams} team slots are still available.`
              : 'Read the full rules and eligibility criteria.'}
          </p>
          {open && (
            <ButtonLink to="/register" className="w-full max-w-xs" iconRight={<ArrowRight aria-hidden className="size-5" />}>
              Register {LIMITS.teamSize}-Member Team
            </ButtonLink>
          )}
          <Link to="/rules" className="inline-flex min-h-11 items-center text-label font-semibold text-brand hover:underline">
            Read full rules
          </Link>
        </section>
      </div>
    </div>
  )
}

function Highlight({ children }: { children: ReactNode }) {
  return (
    <li className="rounded-control border border-line bg-surface px-2 py-2 text-caption font-semibold text-ink">{children}</li>
  )
}

function SectionTitle({ id, aside, children }: { id: string; aside?: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 id={id} className="text-heading font-semibold text-ink">
        {children}
      </h2>
      {aside && <span className="text-caption font-semibold text-ink-subtle">{aside}</span>}
    </div>
  )
}

function BulletList({ items, dot }: { items: string[]; dot: string }) {
  return (
    <ul className="flex flex-col gap-2 text-body text-ink">
      {items.map((item) => (
        <li key={item} className="flex items-center gap-2.5">
          <span aria-hidden className={cn('size-1.5 shrink-0 rounded-full', dot)} />
          {item}
        </li>
      ))}
    </ul>
  )
}

function Fact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <li className="flex flex-col items-start gap-1 rounded-card bg-surface-low p-4">
      <span aria-hidden className="mb-1 grid size-9 place-items-center rounded-control bg-surface-high text-brand [&>svg]:size-5">
        {icon}
      </span>
      <span className="text-caption font-semibold text-ink-muted">{label}</span>
      <span className="text-label font-bold text-ink">{value}</span>
    </li>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full bg-brand text-caption font-bold text-white">
        {n}
      </span>
      <div className="flex flex-col">
        <span className="text-label font-semibold text-ink">{title}</span>
        <span className="text-small text-ink-muted">{children}</span>
      </div>
    </li>
  )
}
