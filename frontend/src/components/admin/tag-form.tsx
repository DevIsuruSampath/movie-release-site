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
      <div className="flex justify-end gap-3">
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save Tag'}
        </Button>
      </div>
    </form>
  )
}
