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
    <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.16)]">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <Input
          placeholder="Search by title, slug, or keyword..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="h-12 rounded-2xl text-base"
        />
        {children ? <div className="flex flex-wrap gap-3">{children}</div> : null}
      </div>
    </div>
  )
}
