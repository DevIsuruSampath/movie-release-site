'use client'

import { Input } from '@/components/ui/input'

export function SearchFilterBar({
  search,
  onSearchChange,
  children,
}: {
  search: string
  onSearchChange: (value: string) => void
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 lg:flex-row lg:items-center">
      <div className="flex-1">
        <Input placeholder="Search..." value={search} onChange={(event) => onSearchChange(event.target.value)} className="h-12 rounded-2xl text-base" />
      </div>
      {children ? <div className="flex flex-wrap gap-3">{children}</div> : null}
    </div>
  )
}
