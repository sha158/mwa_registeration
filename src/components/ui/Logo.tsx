import logoUrl from '@/assets/mwa-logo.webp'
import { cn } from '@/utils/cn'

export function Logo({ className, decorative = false }: { className?: string; decorative?: boolean }) {
  return (
    <img
      src={logoUrl}
      alt={decorative ? '' : 'MWA — Serving Humanity'}
      width={320}
      height={320}
      className={cn('rounded-control bg-white object-contain', className)}
    />
  )
}
