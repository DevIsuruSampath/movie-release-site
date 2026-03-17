'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Movie, MovieListResponse, Category } from '@/types'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import AdminNavbar from '@/components/admin-navbar'

export default function DashboardPage() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    categories: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      const [moviesRes, categoriesRes] = await Promise.all([
        api.get<MovieListResponse>('/api/v1/movies'),
        api.get<Category[]>('/api/v1/categories'),
      ])

      setMovies(moviesRes.data.items || [])
      setStats({
        total: moviesRes.data.total || 0,
        published: moviesRes.data.items?.filter((m: Movie) => m.is_published).length || 0,
        draft: moviesRes.data.items?.filter((m: Movie) => !m.is_published).length || 0,
        categories: categoriesRes.data.length || 0,
      })
    } catch (error) {
      console.error('Failed to fetch dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <AdminNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-2">Overview of your movie collection</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-[#e50914] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass rounded-2xl p-6 animate-slide-up">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-gray-400 text-sm font-medium">Total Movies</h3>
                    <p className="text-3xl font-bold text-white mt-2">{stats.total}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-[#e50914]/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#e50914]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="glass rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-gray-400 text-sm font-medium">Published</h3>
                    <p className="text-3xl font-bold text-green-400 mt-2">{stats.published}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="glass rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-gray-400 text-sm font-medium">Drafts</h3>
                    <p className="text-3xl font-bold text-yellow-400 mt-2">{stats.draft}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="glass rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-gray-400 text-sm font-medium">Categories</h3>
                    <p className="text-3xl font-bold text-blue-400 mt-2">{stats.categories}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Movies */}
            {movies.length > 0 && (
              <div className="glass rounded-2xl overflow-hidden animate-slide-up" style={{ animationDelay: '0.4s' }}>
                <div className="p-6 border-b border-white/10">
                  <h2 className="text-xl font-bold text-white">Recent Movies</h2>
                </div>
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
                      {movies.slice(0, 5).map((movie) => (
                        <tr key={movie.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {movie.poster_url && (
                                <img
                                  src={movie.poster_url}
                                  alt={movie.title}
                                  className="w-10 h-14 object-cover rounded"
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
                            <Link href={`/admin/movies/${movie.id}`}>
                              <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white hover:bg-white/10">
                                Edit
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Link href="/admin/movies">
                <Button className="bg-[#e50914] hover:bg-[#b20710] text-white btn-glow">
                  View All Movies
                </Button>
              </Link>
              <Link href="/admin/movies/new">
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  Add New Movie
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
