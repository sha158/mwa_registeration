import type { ComponentProps, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import { cn } from '@/utils/cn'
import { Spinner } from './Spinner'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-control font-semibold text-label transition-colors select-none disabled:cursor-not-allowed disabled:opacity-55 aria-disabled:cursor-not-allowed aria-disabled:opacity-55 active:translate-y-px'

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white shadow-sm hover:bg-brand-strong',
  secondary: 'border-[1.5px] border-line-strong bg-surface text-ink hover:border-brand hover:bg-surface-low',
  ghost: 'text-brand hover:bg-surface-low',
  subtle: 'bg-surface-mid text-brand hover:bg-surface-high',
  danger: 'bg-danger-strong text-white hover:bg-danger',
}

const sizes: Record<Size, string> = {
  sm: 'min-h-10 px-3',
  md: 'min-h-12 px-5',
  lg: 'min-h-13 px-6 text-body-lg',
}

function buttonClasses(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(base, variants[variant], sizes[size], className)
}

interface CommonProps {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  iconRight?: ReactNode
}

export function Button({
  variant,
  size,
  icon,
  iconRight,
  loading = false,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: ComponentProps<'button'> & CommonProps & { loading?: boolean }) {
  return (
    <button
      type={type}
      className={buttonClasses(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner /> : icon}
      {children}
      {!loading && iconRight}
    </button>
  )
}

/** Plain anchor styled as a button, for non-route hrefs such as file downloads. */
export function ButtonAnchor({ variant, size, icon, className, children, ...props }: ComponentProps<'a'> & CommonProps) {
  return (
    <a className={buttonClasses(variant, size, className)} {...props}>
      {icon}
      {children}
    </a>
  )
}

export function ButtonLink({ variant, size, icon, iconRight, className, children, ...props }: LinkProps & CommonProps) {
  return (
    <Link className={buttonClasses(variant, size, className)} {...props}>
      {icon}
      {children}
      {iconRight}
    </Link>
  )
}
