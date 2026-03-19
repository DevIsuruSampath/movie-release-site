'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { Badge } from '@/components/admin/badge'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { EmptyState } from '@/components/admin/empty-state'
import { LoadingSpinner } from '@/components/admin/loading-spinner'
import { Pagination } from '@/components/admin/pagination'
import { SearchFilterBar } from '@/components/admin/search-filter-bar'
import { Button } from '@/components/ui/button'
import api, { toAbsoluteUrl } from '@/lib/api'
import type { Category, Movie } from '@/types'

export default function MoviesPage() {
  const [items, setItems] = useState<Movie[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [category, setCategory] = useState('')
  const [movieToDelete, setMovieToDelete] = useState<Movie | null>(null)

  useEffect(() => {
    void api.listCategories({ page: 1, limit: 200 }).then((response) => setCategories(response.items))
  }, [])

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const response = await api.listMovies({
          page,
          limit: 12,
          search,
          category,
          status,
          admin_view: true,
        })
        setItems(response.items)
        setPages(response.pages)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [page, search, status, category])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Movies</h1>
          <p className="mt-1 text-sm text-gray-400">Search, edit, and publish your movie catalog.</p>
        </div>
        <Link href="/admin/movies/new">
          <Button>Add Movie</Button>
        </Link>
      </div>

      <SearchFilterBar search={search} onSearchChange={(value) => { setPage(1); setSearch(value) }}>
        <select
          value={status}
          onChange={(event) => {
            setPage(1)
            setStatus(event.target.value)
          }}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white"
        >
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <select
          value={category}
          onChange={(event) => {
            setPage(1)
            setCategory(event.target.value)
          }}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white"
        >
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item.id} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
      </SearchFilterBar>

      {loading ? (
        <LoadingSpinner label="Loading movies..." />
      ) : items.length === 0 ? (
        <EmptyState title="No movies found" description="Adjust the filters or create a new movie." />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-white/[0.03]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Movie</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Categories</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {items.map((movie) => (
                  <tr key={movie.id} className="align-top">
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-3">
                        {movie.poster_url ? <img src={toAbsoluteUrl(movie.poster_url)} alt={movie.title} className="h-16 w-12 rounded-lg object-cover" /> : null}
                        <div>
                          <div className="font-medium text-white">{movie.title}</div>
                          <div className="text-sm text-gray-500">{movie.release_year || 'No year'} • {movie.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={movie.is_published ? 'success' : 'warning'}>{movie.status}</Badge>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-300">
                      {movie.categories.map((item) => item.name).join(', ') || 'None'}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Link href={`/movies/${movie.slug}`} target="_blank">
                          <Button variant="ghost">View</Button>
                        </Link>
                        <Link href={`/admin/movies/${movie.id}/edit`}>
                          <Button variant="outline">Edit</Button>
                        </Link>
                        <Button variant="destructive" onClick={() => setMovieToDelete(movie)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination page={page} pages={pages} onChange={setPage} />
        </>
      )}

      <ConfirmDialog
        open={Boolean(movieToDelete)}
        title="Delete movie"
        description={`Delete "${movieToDelete?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        onCancel={() => setMovieToDelete(null)}
        onConfirm={async () => {
          if (!movieToDelete) return
          await api.deleteMovie(movieToDelete.id)
          setMovieToDelete(null)
          setItems((current) => current.filter((item) => item.id !== movieToDelete.id))
        }}
      />
    </div>
  )
}
