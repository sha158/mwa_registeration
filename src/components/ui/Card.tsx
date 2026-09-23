import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/utils/cn'

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('card p-4 sm:p-6', className)} {...props} />
}

/** Card with the Stitch icon-bubble section header. */
export function SectionCard({
  icon,
  title,
  aside,
  children,
  className,
  titleId,
}: {
  icon: ReactNode
  title: ReactNode
  aside?: ReactNode
  children: ReactNode
  className?: string
  titleId?: string
}) {
  return (
    <section aria-labelledby={titleId} className={cn('card flex flex-col gap-5 p-4 sm:p-6', className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-tint text-brand [&>svg]:size-[18px]">
            {icon}
          </span>
          <h2 id={titleId} className="text-heading font-semibold text-ink">
            {title}
          </h2>
        </div>
        {aside}
      </div>
      {children}
    </section>
  )
}
