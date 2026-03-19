'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { UploadField } from '@/components/admin/upload-field'
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

  return (
    <form
      className="space-y-4"
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
      <Input label="Name" value={value.name || ''} onChange={(event) => setValue({ ...value, name: event.target.value })} />
      <Input label="Slug" value={value.slug || ''} onChange={(event) => setValue({ ...value, slug: event.target.value })} />
      <Textarea label="Description" value={value.description || ''} onChange={(event) => setValue({ ...value, description: event.target.value })} />
      <UploadField label="Image" value={value.image_url || ''} onChange={(image_url) => setValue({ ...value, image_url })} />
      <div className="flex justify-end gap-3">
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save Category'}
        </Button>
      </div>
    </form>
  )
}
