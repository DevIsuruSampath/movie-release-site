'use client'

import { useEffect, useState } from 'react'

import { AdminPageHeader, AdminPanel, AdminSectionHeader } from '@/components/admin/admin-shell'
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
      <AdminPageHeader
        eyebrow="Metadata"
        title="Keep tag structure clean, reusable, and editor-friendly"
        description="Manage the keyword system that powers related content, discovery, and internal organization across the catalog."
        actions={
          <Button className="rounded-full px-5" onClick={() => setCreating(true)}>
            New Tag
          </Button>
        }
      />

      <SearchFilterBar search={search} onSearchChange={setSearch} />

      {loading ? (
        <LoadingSpinner label="Loading tags..." />
      ) : items.length === 0 ? (
        <EmptyState title="No tags found" description="Create your first tag to organize movie metadata more effectively." />
      ) : (
        <AdminPanel>
          <AdminSectionHeader title="Tag library" description="Review and maintain your shared metadata vocabulary." />

          <div className="space-y-3 p-4 md:hidden">
            {items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-base font-semibold text-white">{item.name}</div>
                <div className="mt-1 text-sm text-slate-500">/{item.slug}</div>
                {item.description ? <div className="mt-2 text-sm leading-6 text-slate-400">{item.description}</div> : null}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button variant="outline" className="h-11 rounded-2xl text-sm" onClick={() => setEditing(item)}>
                    Edit
                  </Button>
                  <Button variant="destructive" className="h-11 rounded-2xl text-sm" onClick={() => setDeleting(item)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-white/[0.03]">
                <tr>
                  <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Tag</th>
                  <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Description</th>
                  <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {items.map((item) => (
                  <tr key={item.id} className="align-top">
                    <td className="px-5 py-4">
                      <div className="font-medium text-white">{item.name}</div>
                      <div className="mt-1 text-sm text-slate-500">/{item.slug}</div>
                    </td>
                    <td className="px-5 py-4 text-sm leading-6 text-slate-400">{item.description || 'No description added yet.'}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" className="h-10 rounded-xl px-4" onClick={() => setEditing(item)}>
                          Edit
                        </Button>
                        <Button variant="destructive" className="h-10 rounded-xl px-4" onClick={() => setDeleting(item)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminPanel>
      )}

      {(creating || editing) ? (
        <AdminPanel>
          <AdminSectionHeader title={editing ? 'Edit tag' : 'Create tag'} description="Define clear, reusable metadata labels for your content library." />
          <div className="p-5">
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
        </AdminPanel>
      ) : null}

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
