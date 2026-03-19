'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Subtitle } from '@/types'

export function SubtitleManager({
  items,
  onChange,
}: {
  items: Subtitle[]
  onChange: (items: Subtitle[]) => void
}) {
  const updateItem = (index: number, field: keyof Subtitle, value: string | boolean | number) => {
    const next = [...items]
    next[index] = { ...next[index], [field]: value }
    onChange(next)
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-2">
          <Input value={item.language} onChange={(event) => updateItem(index, 'language', event.target.value)} placeholder="Language" />
          <Input value={item.label} onChange={(event) => updateItem(index, 'label', event.target.value)} placeholder="Label" />
          <Input value={item.file_url} onChange={(event) => updateItem(index, 'file_url', event.target.value)} placeholder="/uploads/subtitle.srt" />
          <Input value={item.format} onChange={(event) => updateItem(index, 'format', event.target.value)} placeholder="srt" />
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" checked={item.is_default} onChange={(event) => updateItem(index, 'is_default', event.target.checked)} />
            Default
          </label>
          <div className="flex justify-end">
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
            { language: '', label: '', file_url: '', format: 'srt', is_default: false, sort_order: items.length },
          ])
        }
      >
        Add Subtitle
      </Button>
    </div>
  )
}
