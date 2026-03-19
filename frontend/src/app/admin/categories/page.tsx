'use client'

import { useEffect, useState } from 'react'

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
  const [editing, setEditing] = useState<Category | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Category | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const response = await api.listCategories({ page: 1, limit: 100, search })
      setItems(response.items)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [search])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Categories</h1>
          <p className="mt-1 text-sm text-gray-400">Manage category taxonomy and images.</p>
        </div>
        <Button onClick={() => setCreating(true)}>New Category</Button>
      </div>

      <SearchFilterBar search={search} onSearchChange={setSearch} />

      {loading ? (
        <LoadingSpinner label="Loading categories..." />
      ) : items.length === 0 ? (
        <EmptyState title="No categories found" description="Create your first category." />
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
          <h2 className="mb-4 text-lg font-semibold text-white">{editing ? 'Edit Category' : 'Create Category'}</h2>
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
      )}

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
