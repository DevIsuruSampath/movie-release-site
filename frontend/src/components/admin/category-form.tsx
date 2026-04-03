'use client'

import { useEffect, useState } from 'react'

import { UploadField } from '@/components/admin/upload-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import api from '@/lib/api'
import type { Category } from '@/types'

export function CategoryForm({
  initialValue,
  onSubmit,
  onCancel,
}: {
  initialValue?: Partial<Category>
  onSubmit: (value: Partial<Category>) => Promise<void>
  onCancel?: () => void
}) {
  const [value, setValue] = useState<Partial<Category>>({
    name: initialValue?.name || '',
    slug: initialValue?.slug || '',
    description: initialValue?.description || '',
    image_url: initialValue?.image_url || '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setValue({
      name: initialValue?.name || '',
      slug: initialValue?.slug || '',
      description: initialValue?.description || '',
      image_url: initialValue?.image_url || '',
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
        <Input label="Name" hint="Public label shown in browse views." value={value.name || ''} onChange={(event) => setValue({ ...value, name: event.target.value })} />
        <Input label="Slug" hint="URL-friendly identifier, e.g. action-movies." value={value.slug || ''} onChange={(event) => setValue({ ...value, slug: event.target.value })} />
      </div>
      <Textarea
        label="Description"
        hint="Short editorial summary used in category cards and detail views."
        value={value.description || ''}
        onChange={(event) => setValue({ ...value, description: event.target.value })}
      />
      <UploadField
        label="Category image"
        value={value.image_url || ''}
        onChange={(image_url) => setValue({ ...value, image_url })}
        onRemove={async () => {
          if (!initialValue?.id) return
          await api.updateCategory(initialValue.id, { image_url: '' })
        }}
      />
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#111111]/95 p-3 backdrop-blur sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button type="button" variant="ghost" className="h-12 rounded-2xl px-5 text-base" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" className="h-12 rounded-2xl px-5 text-base font-semibold" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save Category'}
        </Button>
      </div>
    </form>
  )
}
