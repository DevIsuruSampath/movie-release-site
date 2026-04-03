'use client'

import { useEffect, useState } from 'react'

import { AdminPageHeader, AdminPanel, AdminSectionHeader } from '@/components/admin/admin-shell'
import { CategoryForm } from '@/components/admin/category-form'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { EmptyState } from '@/components/admin/empty-state'
import { LoadingSpinner } from '@/components/admin/loading-spinner'
import { SearchFilterBar } from '@/components/admin/search-filter-bar'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import type { Category } from '@/types'

export default function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [editing, setEditing] = useState<Category | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Category | null>(null)

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search), 250)
    return () => window.clearTimeout(timeout)
  }, [search])

  const load = async () => {
    setLoading(true)
    try {
      const response = await api.listCategories({ page: 1, limit: 200, search: debouncedSearch })
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
        eyebrow="Taxonomy"
        title="Shape category browsing with better editorial structure"
        description="Manage genre lanes, imagery, and category copy with cleaner controls and a more consistent admin workflow."
        actions={
          <Button className="rounded-full px-5" onClick={() => setCreating(true)}>
            New Category
          </Button>
        }
      />

      <SearchFilterBar search={search} onSearchChange={setSearch} />

      {loading ? (
        <LoadingSpinner label="Loading categories..." />
      ) : items.length === 0 ? (
        <EmptyState title="No categories found" description="Create your first category to start shaping public browsing." />
      ) : (
        <AdminPanel>
          <AdminSectionHeader title="Category library" description="Review, edit, and remove categories with a cleaner overview." />

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
                  <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Category</th>
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
          <AdminSectionHeader title={editing ? 'Edit category' : 'Create category'} description="Keep naming, slugging, and visual metadata clean and consistent." />
          <div className="p-5">
            <CategoryForm
              initialValue={editing || undefined}
              onCancel={() => {
                setCreating(false)
                setEditing(null)
              }}
              onSubmit={async (value) => {
                if (editing) {
                  await api.updateCategory(editing.id, value)
                } else {
                  await api.createCategory(value)
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
        title="Delete category"
        description={`Delete "${deleting?.name}"?`}
        confirmLabel="Delete"
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return
          await api.deleteCategory(deleting.id)
          setDeleting(null)
          await load()
        }}
      />
    </div>
  )
}
