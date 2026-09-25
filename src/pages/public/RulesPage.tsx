import { ArrowLeft, Phone, UserRoundPlus } from 'lucide-react'
import { Link } from 'react-router'
import { ButtonLink } from '@/components/ui/Button'
import { EVENT } from '@/config/event'
import { RULES, type Rule } from '@/features/public/content'

export default function RulesPage() {
  return (
    <div className="mx-auto flex max-w-form flex-col gap-6 px-4 pt-6 pb-12 sm:px-6">
      <Link to="/" className="inline-flex min-h-11 w-fit items-center gap-1.5 text-label font-semibold text-brand hover:underline">
        <ArrowLeft aria-hidden className="size-4" />
        Back to overview
      </Link>
      <div>
        <h1 className="text-display font-bold text-ink">Rules & Regulations</h1>
        <p className="mt-1 text-body text-ink-muted">
          {EVENT.name} · {EVENT.region}
        </p>
      </div>

      <ol className="card flex flex-col divide-y divide-line">
        {RULES.map((rule, i) => (
          <RuleItem key={rule.title} n={i + 1} rule={rule} />
        ))}
      </ol>

      <ButtonLink to="/register" size="lg" className="w-full sm:w-auto sm:self-center" icon={<UserRoundPlus aria-hidden className="size-5" />}>
        Register Your Team
      </ButtonLink>
    </div>
  )
}

function RuleItem({ n, rule }: { n: number; rule: Rule }) {
  return (
    <li className="flex items-start gap-3 px-4 py-4 sm:gap-4 sm:px-5">
      <span
        aria-hidden
        className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-caption font-bold text-white tabular"
      >
        {n}
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="text-label font-bold text-ink">{rule.title}</h2>
        {rule.text && <p className="text-body text-ink">{rule.text}</p>}
        {rule.items && (
          <ul className="mt-1 flex flex-col gap-1.5 text-body text-ink">
            {rule.items.map((item) => (
              <li key={item} className="flex gap-2.5">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-gold-dot" />
                {item}
              </li>
            ))}
          </ul>
        )}
        {rule.contacts && (
          <ul className="flex flex-col">
            {rule.contacts.map((c) => (
              <li key={c.tel}>
                <a
                  href={`tel:${c.tel}`}
                  className="inline-flex min-h-11 items-center gap-2 text-label font-semibold text-brand tabular hover:underline"
                >
                  <Phone aria-hidden className="size-4" />
                  {c.display}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  )
}
