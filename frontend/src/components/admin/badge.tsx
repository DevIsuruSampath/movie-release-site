import { cn } from '@/lib/utils'

export function Badge({
  children,
  variant = 'default',
}: {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger'
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]',
        variant === 'default' && 'border-white/10 bg-white/[0.05] text-white',
        variant === 'success' && 'border-emerald-400/20 bg-emerald-500/12 text-emerald-200',
        variant === 'warning' && 'border-amber-400/20 bg-amber-500/12 text-amber-200',
        variant === 'danger' && 'border-red-400/20 bg-red-500/12 text-red-200'
      )}
    >
      {children}
    </span>
  )
}
