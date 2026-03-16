'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Movie, MovieListResponse, Category } from '@/types'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Overview of your movie collection</p>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold">Total Movies</h3>
            <p className="text-3xl font-bold mt-2">{stats.total}</p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold">Published</h3>
            <p className="text-3xl font-bold mt-2 text-green-600">{stats.published}</p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold">Drafts</h3>
            <p className="text-3xl font-bold mt-2 text-yellow-600">{stats.draft}</p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold">Categories</h3>
            <p className="text-3xl font-bold mt-2 text-blue-600">{stats.categories}</p>
          </div>
        </div>
      )}

      {!loading && movies.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Recent Movies</h2>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Title</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Year</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {movies.slice(0, 5).map((movie) => (
                  <tr key={movie.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{movie.title}</td>
                    <td className="px-6 py-4">{movie.release_year || '-'}</td>
                    <td className="px-6 py-4">
                      {movie.is_published ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/admin/movies/${movie.id}`}>
                        <Button size="sm" variant="ghost">
                          Edit
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4">
            <Link href="/admin/movies">
              <Button>View All Movies</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
