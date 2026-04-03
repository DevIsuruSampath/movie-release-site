import { cn } from '@/lib/utils'

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <section className="admin-hero-panel overflow-hidden rounded-[32px] px-5 py-6 sm:px-7 sm:py-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          {eyebrow ? <p className="admin-eyebrow">{eyebrow}</p> : null}
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">{title}</h1>
          {description ? <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-[15px]">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </section>
  )
}

export function AdminPanel({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <section className={cn('admin-panel', className)}>{children}</section>
}

export function AdminSectionHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  )
}

export function AdminInfoPill({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 backdrop-blur-sm">
      <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{label}</div>
      <div className="mt-2 text-sm font-medium text-white">{value}</div>
    </div>
  )
}
