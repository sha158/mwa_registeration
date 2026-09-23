import { ArrowLeft, ChevronDown } from 'lucide-react'
import { Link } from 'react-router'
import { EVENT } from '@/config/event'
import { RULE_SECTIONS } from '@/features/public/content'

export default function RulesPage() {
  return (
    <div className="mx-auto flex max-w-form flex-col gap-6 px-4 pt-6 pb-12 sm:px-6">
      <Link to="/" className="inline-flex min-h-11 w-fit items-center gap-1.5 text-label font-semibold text-brand hover:underline">
        <ArrowLeft aria-hidden className="size-4" />
        Back to overview
      </Link>
      <div>
        <h1 className="text-display font-bold text-ink">Rules & eligibility</h1>
        <p className="mt-1 text-body text-ink-muted">{EVENT.name} · {EVENT.region}</p>
      </div>
      <div className="flex flex-col gap-3">
        {RULE_SECTIONS.map((section, i) => (
          <details key={section.title} open={i === 0} className="card group overflow-hidden">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 text-label font-semibold text-ink sm:px-5 [&::-webkit-details-marker]:hidden">
              {section.title}
              <ChevronDown aria-hidden className="size-5 text-ink-subtle transition-transform group-open:rotate-180" />
            </summary>
            <ul className="flex flex-col gap-2.5 border-t border-line px-4 py-4 text-body text-ink sm:px-5">
              {section.items.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
                  {item}
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </div>
  )
}
