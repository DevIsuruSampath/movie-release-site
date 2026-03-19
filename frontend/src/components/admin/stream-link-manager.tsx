'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { StreamLink } from '@/types'

export function StreamLinkManager({
  items,
  onChange,
}: {
  items: StreamLink[]
  onChange: (items: StreamLink[]) => void
}) {
  const updateItem = (index: number, field: keyof StreamLink, value: string | boolean | number) => {
    const next = [...items]
    next[index] = { ...next[index], [field]: value }
    onChange(next)
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={`${item.server_name}-${index}`} className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-2">
          <Input value={item.server_name} onChange={(event) => updateItem(index, 'server_name', event.target.value)} placeholder="Server name" />
          <Input value={item.url} onChange={(event) => updateItem(index, 'url', event.target.value)} placeholder="https://..." />
          <Input value={item.quality || ''} onChange={(event) => updateItem(index, 'quality', event.target.value)} placeholder="1080p" />
          <Input value={item.language || ''} onChange={(event) => updateItem(index, 'language', event.target.value)} placeholder="English" />
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" checked={item.is_active} onChange={(event) => updateItem(index, 'is_active', event.target.checked)} />
            Active
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" checked={item.is_primary} onChange={(event) => updateItem(index, 'is_primary', event.target.checked)} />
            Primary
          </label>
          <div className="md:col-span-2 flex justify-end">
            <Button variant="destructive" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}>
              Remove
            </Button>
          </div>
        </div>
      ))}
      <Button
        variant="outline"
        onClick={() =>
          onChange([
            ...items,
            { server_name: '', url: '', quality: '', language: '', is_active: true, is_primary: false, sort_order: items.length },
          ])
        }
      >
        Add Stream Link
      </Button>
    </div>
  )
}
