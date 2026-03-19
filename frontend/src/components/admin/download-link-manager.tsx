'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { DownloadLink } from '@/types'

export function DownloadLinkManager({
  items,
  onChange,
}: {
  items: DownloadLink[]
  onChange: (items: DownloadLink[]) => void
}) {
  const updateItem = (index: number, field: keyof DownloadLink, value: string | boolean | number) => {
    const next = [...items]
    next[index] = { ...next[index], [field]: value }
    onChange(next)
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={`${item.provider}-${index}`} className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-2">
          <Input value={item.provider} onChange={(event) => updateItem(index, 'provider', event.target.value)} placeholder="Provider" />
          <Input value={item.url} onChange={(event) => updateItem(index, 'url', event.target.value)} placeholder="https://..." />
          <Input value={item.quality || ''} onChange={(event) => updateItem(index, 'quality', event.target.value)} placeholder="4K" />
          <Input value={item.size || ''} onChange={(event) => updateItem(index, 'size', event.target.value)} placeholder="2.4 GB" />
          <Input value={item.language || ''} onChange={(event) => updateItem(index, 'language', event.target.value)} placeholder="English" />
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" checked={item.is_active} onChange={(event) => updateItem(index, 'is_active', event.target.checked)} />
            Active
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
            { provider: '', url: '', quality: '', size: '', language: '', is_active: true, sort_order: items.length },
          ])
        }
      >
        Add Download Link
      </Button>
    </div>
  )
}
