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
        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
        variant === 'default' && 'bg-white/10 text-white',
        variant === 'success' && 'bg-emerald-500/15 text-emerald-300',
        variant === 'warning' && 'bg-amber-500/15 text-amber-300',
        variant === 'danger' && 'bg-red-500/15 text-red-300'
      )}
    >
      {children}
    </span>
  )
}
