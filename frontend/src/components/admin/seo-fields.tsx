'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { MoviePayload, SeoMetadata } from '@/types'

export function SeoFields({
  value,
  onChange,
}: {
  value: SeoMetadata
  onChange: (next: SeoMetadata) => void
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Input
        label="Meta title"
        value={value.meta_title || ''}
        onChange={(event) => onChange({ ...value, meta_title: event.target.value })}
      />
      <Input
        label="Canonical URL"
        value={value.canonical_url || ''}
        onChange={(event) => onChange({ ...value, canonical_url: event.target.value })}
      />
      <Input
        label="Meta keywords"
        value={value.meta_keywords || ''}
        onChange={(event) => onChange({ ...value, meta_keywords: event.target.value })}
      />
      <Input
        label="Robots"
        value={value.robots || ''}
        onChange={(event) => onChange({ ...value, robots: event.target.value })}
      />
      <div className="md:col-span-2">
        <Textarea
          label="Meta description"
          value={value.meta_description || ''}
          onChange={(event) => onChange({ ...value, meta_description: event.target.value })}
        />
      </div>
      <div className="md:col-span-2">
        <Textarea
          label="Schema markup"
          value={value.schema_markup || ''}
          onChange={(event) => onChange({ ...value, schema_markup: event.target.value })}
        />
      </div>
    </div>
  )
}
