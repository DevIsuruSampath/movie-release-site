'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Movie, MovieListResponse } from '@/types'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import AdminNavbar from '@/components/admin-navbar'

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [filtered, setFiltered] = useState<Movie[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)

  useEffect(() => {
    fetchMovies()
  }, [page])

  useEffect(() => {
    let filtered = movies
    if (search) {
      filtered = filtered.filter((m: Movie) =>
        m.title.toLowerCase().includes(search.toLowerCase())
      )
    }
    if (statusFilter) {
      filtered = filtered.filter((m: Movie) =>
        (statusFilter === 'published' && m.is_published) ||
        (statusFilter === 'draft' && !m.is_published)
      )
    }
    setFiltered(filtered)
  }, [search, statusFilter, movies])

  const fetchMovies = async () => {
    setLoading(true)
    try {
      const response = await api.get<MovieListResponse>('/api/v1/movies', {
        params: { skip: (page - 1) * 20, limit: 20 },
      })
      setMovies(response.data.items || [])
      setTotalPages(response.data.pages || 0)
    } catch (error) {
      console.error('Failed to fetch movies:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this movie?')) return

    try {
      await api.delete(`/api/v1/movies/${id}`)
      setMovies(movies.filter((m: Movie) => m.id !== id))
    } catch (error) {
      console.error('Failed to delete movie:', error)
      alert('Failed to delete movie')
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <AdminNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Movies</h1>
            <p className="text-gray-400 mt-2">Manage your movie collection</p>
          </div>
          <Link href="/admin/movies/new">
            <Button className="bg-[#e50914] hover:bg-[#b20710] text-white btn-glow">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Movie
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4.5 h-4.5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search movies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e50914]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#e50914]"
          >
            <option value="">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        {/* Movies Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-[#e50914] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="glass rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Title</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Year</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Status</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filtered.map((movie) => (
                      <tr key={movie.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {movie.poster_url && (
                              <img
                                src={movie.poster_url}
                                alt={movie.title}
                                className="w-12 h-16 object-cover rounded"
                              />
                            )}
                            <span className="text-white font-medium">{movie.title}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-400">{movie.release_year || '-'}</td>
                        <td className="px-6 py-4">
                          {movie.is_published ? (
                            <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-400">
                              Published
                            </span>
                          ) : (
                            <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-yellow-500/20 text-yellow-400">
                              Draft
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <Link href={`/admin/movies/${movie.id}`}>
                              <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white hover:bg-white/10">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(movie.id)}
                              className="text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="ghost"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </Button>
                <span className="px-4 py-2 text-gray-400">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="ghost"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
                >
                  Next
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
