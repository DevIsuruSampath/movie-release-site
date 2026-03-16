'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Movie } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

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
      const response = await api.get('/api/v1/movies', {
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Movies</h1>
        <p className="text-muted-foreground mt-2">Manage your movie collection</p>
      </div>

      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Search movies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-md border border-gray-300 bg-white px-3"
        >
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        
        <Link href="/admin/movies/new">
          <Button>Add Movie</Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
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
              {filtered.map((movie) => (
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
                    <div className="flex gap-2 justify-end">
                      <Link href={`/admin/movies/${movie.id}`}>
                        <Button size="sm" variant="ghost">
                          Edit
                        </Button>
                      </Link>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(movie.id)}>
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

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="ghost"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="px-4 py-2">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="ghost"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
