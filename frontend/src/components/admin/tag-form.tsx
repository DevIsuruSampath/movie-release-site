'use client'

import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Tag } from '@/types'

export function TagForm({
  initialValue,
  onSubmit,
  onCancel,
}: {
  initialValue?: Partial<Tag>
  onSubmit: (value: Partial<Tag>) => Promise<void>
  onCancel?: () => void
}) {
  const [value, setValue] = useState<Partial<Tag>>({
    name: initialValue?.name || '',
    slug: initialValue?.slug || '',
    description: initialValue?.description || '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setValue({
      name: initialValue?.name || '',
      slug: initialValue?.slug || '',
      description: initialValue?.description || '',
    })
  }, [initialValue])

  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault()
        setSubmitting(true)
        try {
          await onSubmit(value)
        } finally {
          setSubmitting(false)
        }
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Name" hint="Keyword label shown to editors and public filters." value={value.name || ''} onChange={(event) => setValue({ ...value, name: event.target.value })} />
        <Input label="Slug" hint="URL-safe identifier for API and internal lookups." value={value.slug || ''} onChange={(event) => setValue({ ...value, slug: event.target.value })} />
      </div>
      <Textarea
        label="Description"
        hint="Optional context for editors about when this tag should be used."
        value={value.description || ''}
        onChange={(event) => setValue({ ...value, description: event.target.value })}
      />
      <div className="sticky bottom-3 z-10 flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#111111]/95 p-3 backdrop-blur sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button type="button" variant="ghost" className="h-12 rounded-2xl px-5 text-base" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" className="h-12 rounded-2xl px-5 text-base font-semibold" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save Tag'}
        </Button>
      </div>
    </form>
  )
}
