'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { AdminPageHeader, AdminPanel, AdminSectionHeader } from '@/components/admin/admin-shell'
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
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState('')
  const [category, setCategory] = useState('')
  const [movieToDelete, setMovieToDelete] = useState<Movie | null>(null)

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search), 250)
    return () => window.clearTimeout(timeout)
  }, [search])

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
          search: debouncedSearch,
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
  }, [page, debouncedSearch, status, category])

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Catalog management"
        title="Search, review, and publish your movie library with more clarity"
        description="Manage the core movie catalog with stronger visual status cues, cleaner filters, and a layout that works better on both touch devices and larger screens."
        actions={
          <Link href="/admin/movies/new" className="w-full md:w-auto">
            <Button className="h-12 w-full rounded-full px-5 text-base font-semibold md:w-auto">Add Movie</Button>
          </Link>
        }
      />

      <SearchFilterBar search={search} onSearchChange={(value) => { setPage(1); setSearch(value) }}>
        <select
          value={status}
          onChange={(event) => {
            setPage(1)
            setStatus(event.target.value)
          }}
          className="min-h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white"
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
          className="min-h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white"
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
        <EmptyState title="No movies found" description="Adjust filters or create a new movie to populate the catalog." />
      ) : (
        <>
          <AdminPanel>
            <AdminSectionHeader title="Movie catalog" description="Review publication state, categories, and actions from one cleaner view." />

            <div className="space-y-3 p-4 md:hidden">
              {items.map((movie) => (
                <div key={movie.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start gap-3">
                    {movie.poster_url || movie.thumbnail_url || movie.backdrop_url ? (
                      <img
                        src={toAbsoluteUrl(movie.poster_url || movie.thumbnail_url || movie.backdrop_url)}
                        alt={movie.title}
                        className="h-20 w-14 rounded-xl object-cover"
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <div className="text-base font-semibold text-white">{movie.title}</div>
                      <div className="mt-1 text-sm text-slate-500">{movie.release_year || 'No year'} • /{movie.slug}</div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Badge variant={movie.is_published ? 'success' : 'warning'}>{movie.status}</Badge>
                        {movie.featured ? <Badge>featured</Badge> : null}
                      </div>
                      {movie.categories.length ? <div className="mt-2 text-xs text-slate-400">{movie.categories.map((item) => item.name).join(', ')}</div> : null}
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <Link href={`/movies/${movie.slug}`} target="_blank">
                      <Button variant="ghost" className="h-11 w-full rounded-2xl text-sm">View</Button>
                    </Link>
                    <Link href={`/admin/movies/${movie.id}/edit`}>
                      <Button variant="outline" className="h-11 w-full rounded-2xl text-sm">Edit</Button>
                    </Link>
                    <Button variant="destructive" className="h-11 w-full rounded-2xl text-sm" onClick={() => setMovieToDelete(movie)}>
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
                    <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Movie</th>
                    <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Status</th>
                    <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Categories</th>
                    <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {items.map((movie) => (
                    <tr key={movie.id} className="align-top">
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          {movie.poster_url || movie.thumbnail_url || movie.backdrop_url ? (
                            <img
                              src={toAbsoluteUrl(movie.poster_url || movie.thumbnail_url || movie.backdrop_url)}
                              alt={movie.title}
                              className="h-16 w-12 rounded-lg object-cover"
                            />
                          ) : null}
                          <div>
                            <div className="font-medium text-white">{movie.title}</div>
                            <div className="mt-1 text-sm text-slate-500">{movie.release_year || 'No year'} • /{movie.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={movie.is_published ? 'success' : 'warning'}>{movie.status}</Badge>
                          {movie.featured ? <Badge>featured</Badge> : null}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-300">
                        {movie.categories.map((item) => item.name).join(', ') || 'None'}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Link href={`/movies/${movie.slug}`} target="_blank">
                            <Button variant="ghost" className="h-10 rounded-xl px-4">View</Button>
                          </Link>
                          <Link href={`/admin/movies/${movie.id}/edit`}>
                            <Button variant="outline" className="h-10 rounded-xl px-4">Edit</Button>
                          </Link>
                          <Button variant="destructive" className="h-10 rounded-xl px-4" onClick={() => setMovieToDelete(movie)}>
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
