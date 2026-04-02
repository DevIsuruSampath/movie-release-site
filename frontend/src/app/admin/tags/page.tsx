'use client'

import { useEffect, useState } from 'react'

import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { EmptyState } from '@/components/admin/empty-state'
import { LoadingSpinner } from '@/components/admin/loading-spinner'
import { SearchFilterBar } from '@/components/admin/search-filter-bar'
import { TagForm } from '@/components/admin/tag-form'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import type { Tag } from '@/types'

export default function TagsPage() {
  const [items, setItems] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Tag | null>(null)
  const [deleting, setDeleting] = useState<Tag | null>(null)

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search), 250)
    return () => window.clearTimeout(timeout)
  }, [search])

  const load = async () => {
    setLoading(true)
    try {
      const response = await api.listTags({ page: 1, limit: 200, search: debouncedSearch })
      setItems(response.items)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [debouncedSearch])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Tags</h1>
          <p className="mt-1 text-sm text-gray-400">Manage keyword tags used across movies.</p>
        </div>
        <Button onClick={() => setCreating(true)}>New Tag</Button>
      </div>

      <SearchFilterBar search={search} onSearchChange={setSearch} />

      {loading ? (
        <LoadingSpinner label="Loading tags..." />
      ) : items.length === 0 ? (
        <EmptyState title="No tags found" description="Create your first tag." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-white/[0.03]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Slug</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-4 text-white">{item.name}</td>
                  <td className="px-4 py-4 text-sm text-gray-400">{item.slug}</td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setEditing(item)}>
                        Edit
                      </Button>
                      <Button variant="destructive" onClick={() => setDeleting(item)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(creating || editing) && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="mb-4 text-lg font-semibold text-white">{editing ? 'Edit Tag' : 'Create Tag'}</h2>
          <TagForm
            initialValue={editing || undefined}
            onCancel={() => {
              setCreating(false)
              setEditing(null)
            }}
            onSubmit={async (value) => {
              if (editing) {
                await api.updateTag(editing.id, value)
              } else {
                await api.createTag(value)
              }
              setCreating(false)
              setEditing(null)
              await load()
            }}
          />
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete tag"
        description={`Delete "${deleting?.name}"?`}
        confirmLabel="Delete"
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return
          await api.deleteTag(deleting.id)
          setDeleting(null)
          await load()
        }}
      />
    </div>
  )
}
