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
  const [telegramAction, setTelegramAction] = useState<Record<number, string>>({})
  const [actionError, setActionError] = useState('')

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
      {actionError ? <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{actionError}</div> : null}
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
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Telegram</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Categories</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {items.map((movie) => (
                  <tr key={movie.id} className="align-top">
                    <td className="px-4 py-4">
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
                          <div className="text-sm text-gray-500">{movie.release_year || 'No year'} • {movie.slug}</div>
                          {movie.media_storage_summary?.poster?.storage_source ? (
                            <div className="mt-2">
                              <Badge variant={movie.media_storage_summary.poster.storage_source === 'telegram' ? 'warning' : movie.media_storage_summary.poster.storage_source === 'hybrid' ? 'success' : 'default'}>
                                {movie.media_storage_summary.poster.storage_source}
                              </Badge>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={movie.is_published ? 'success' : 'warning'}>{movie.status}</Badge>
                    </td>
                    <td className="px-4 py-4">
                      {movie.telegram_last_post_status ? (
                        <div className="space-y-2">
                          <Badge
                            variant={
                              movie.telegram_last_post_status === 'sent'
                                ? 'success'
                                : movie.telegram_last_post_status === 'failed'
                                  ? 'danger'
                                  : 'warning'
                            }
                          >
                            {movie.telegram_last_post_status}
                          </Badge>
                          {movie.telegram_last_error_message ? (
                            <p className="max-w-[240px] text-xs text-red-300">{movie.telegram_last_error_message}</p>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">No posts</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-300">
                      {movie.categories.map((item) => item.name).join(', ') || 'None'}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          onClick={async () => {
                            setActionError('')
                            setTelegramAction((current) => ({ ...current, [movie.id]: 'send' }))
                            try {
                              await api.sendMovieToTelegram(movie.id)
                              setItems((current) =>
                                current.map((item) =>
                                  item.id === movie.id
                                    ? { ...item, telegram_last_post_status: 'sent', telegram_last_error_message: null }
                                    : item
                                )
                              )
                            } catch (sendError) {
                              const message = sendError instanceof Error ? sendError.message : 'Telegram send failed'
                              setActionError(message)
                              setItems((current) =>
                                current.map((item) =>
                                  item.id === movie.id
                                    ? { ...item, telegram_last_post_status: 'failed', telegram_last_error_message: message }
                                    : item
                                )
                              )
                            } finally {
                              setTelegramAction((current) => ({ ...current, [movie.id]: '' }))
                            }
                          }}
                        >
                          {telegramAction[movie.id] === 'send' ? 'Sending...' : 'Send Telegram'}
                        </Button>
                        {movie.telegram_last_post_status === 'failed' ? (
                          <Button
                            variant="outline"
                            onClick={async () => {
                              setActionError('')
                              setTelegramAction((current) => ({ ...current, [movie.id]: 'force' }))
                              try {
                                await api.sendMovieToTelegram(movie.id, true)
                              } catch (sendError) {
                                setActionError(sendError instanceof Error ? sendError.message : 'Telegram resend failed')
                              } finally {
                                setTelegramAction((current) => ({ ...current, [movie.id]: '' }))
                              }
                            }}
                          >
                            {telegramAction[movie.id] === 'force' ? 'Re-sending...' : 'Force Re-send'}
                          </Button>
                        ) : null}
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
