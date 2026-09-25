import { BookOpen, Check, CircleCheck, Clock, Copy, Download } from 'lucide-react'
import { useState } from 'react'
import { Link, useLoaderData } from 'react-router'
import type { successLoader } from '@/app/loaders'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { BOOK, CONTACTS, ENQUIRY_CONTACTS, EVENT } from '@/config/event'
import { downloadBlob, formatDateTime, formatLongDate } from '@/utils/format'

export default function SuccessPage() {
  const result = useLoaderData<typeof successLoader>()
  const [copied, setCopied] = useState(false)

  async function copyId() {
    try {
      await navigator.clipboard.writeText(result.registrationNumber)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  function saveReceipt() {
    const lines = [
      `${EVENT.name} — Registration receipt`,
      '',
      `Registration ID: ${result.registrationNumber}`,
      `Submitted: ${formatDateTime(result.submittedAt)}`,
      '',
      'Team members:',
      ...result.memberNames.map((name, i) => `  ${i + 1}. ${name}${i === 0 ? ' (Team Lead)' : ''}`),
      '',
      `Competition day: ${formatLongDate(EVENT.date)}, reporting at ${EVENT.reportingTime}`,
      `Venue: ${EVENT.venue}`,
      `Competition enquiries: ${ENQUIRY_CONTACTS.map((c) => c.display).join(' / ')}`,
      `Contact: ${CONTACTS.map((c) => c.display).join(' / ')}`,
      '',
      `${EVENT.organiser}, ${EVENT.location}`,
    ]
    downloadBlob(new Blob([lines.join('\n')], { type: 'text/plain' }), `${result.registrationNumber}-registration.txt`)
  }

  return (
    <div className="mx-auto flex max-w-form flex-col gap-4 px-4 pt-8 pb-12 sm:gap-6 sm:px-6">
      <section className="flex flex-col items-center text-center">
        <Logo className="size-16 p-1 shadow-card" />
        <span aria-hidden className="mt-5 grid size-14 place-items-center rounded-full bg-success-bg text-success">
          <CircleCheck className="size-8" />
        </span>
        <h1 className="mt-3 text-display font-bold text-ink">Registration Successful</h1>
        <p className="mt-1 text-body-lg text-ink-muted">3 participants registered successfully.</p>
      </section>

      <section aria-labelledby="reg-id" className="card flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-col gap-1 rounded-card bg-surface-low p-4 text-center">
          <h2 id="reg-id" className="text-caption font-bold tracking-wider text-ink-muted uppercase">
            Your team registration ID
          </h2>
          <p className="text-display font-bold tracking-wide text-brand tabular lg:text-display-lg">
            {result.registrationNumber}
          </p>
          <p className="text-small text-ink-subtle">Keep this ID for any queries with the organisers.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button size="lg" className="flex-1" icon={<Download aria-hidden className="size-5" />} onClick={saveReceipt}>
            Save Registration ID
          </Button>
          <Button
            variant="secondary"
            size="lg"
            icon={copied ? <Check aria-hidden className="size-5" /> : <Copy aria-hidden className="size-5" />}
            onClick={() => void copyId()}
          >
            {copied ? 'Copied' : 'Copy ID'}
          </Button>
        </div>
        <p role="status" className="sr-only">
          {copied ? 'Registration ID copied to clipboard' : ''}
        </p>
      </section>

      <section aria-labelledby="roster" className="card flex flex-col gap-3 p-5 sm:p-6">
        <h2 id="roster" className="text-heading font-semibold text-ink">
          Team members
        </h2>
        <ol className="flex flex-col gap-2">
          {result.memberNames.map((name, i) => (
            <li key={name} className="flex items-center gap-3 rounded-control bg-surface-low px-3 py-2.5">
              <span
                aria-hidden
                className={`grid size-7 shrink-0 place-items-center rounded-full text-caption font-bold ${i === 0 ? 'bg-brand text-white' : 'bg-surface-high text-ink-muted'}`}
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-label font-semibold text-ink">{name}</span>
              {i === 0 && <span className="text-caption font-semibold text-brand">Team Lead</span>}
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="next" className="card flex flex-col gap-3 p-5 sm:p-6">
        <h2 id="next" className="text-heading font-semibold text-ink">
          What happens next
        </h2>
        <ul className="flex flex-col gap-3 text-body text-ink">
          <li className="flex gap-3">
            <CircleCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-brand" />
            Organisers will verify each member's details and Aadhaar. The Team Lead may be contacted by phone.
          </li>
          <li className="flex gap-3">
            <BookOpen aria-hidden className="mt-0.5 size-5 shrink-0 text-brand" />
            <span>
              A printed copy of <strong>“{BOOK.title}”</strong> will be sent by post to the registered address. A PDF copy
              will also be provided.
            </span>
          </li>
          <li className="flex gap-3">
            <Clock aria-hidden className="mt-0.5 size-5 shrink-0 text-brand" />
            <span>
              Report at <strong>{EVENT.reportingTime}</strong> on {formatLongDate(EVENT.date)}. {EVENT.venue}.
            </span>
          </li>
        </ul>
      </section>

      <Link to="/" className="mx-auto inline-flex min-h-11 items-center text-label font-semibold text-brand hover:underline">
        Back to overview
      </Link>
    </div>
  )
}
