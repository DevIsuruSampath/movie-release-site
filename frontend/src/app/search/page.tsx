'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import { Movie, MovieListResponse } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

function SearchPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [results, setResults] = useState<Movie[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (query) {
      performSearch(query)
    }
  }, [query])

  const performSearch = async (searchQuery: string, newPage: number = 1) => {
    setLoading(true)
    try {
      const response = await api.get<MovieListResponse>('/api/v1/movies', {
        params: {
          search: searchQuery,
          skip: (newPage - 1) * 20,
          limit: 20,
        },
      })
      setResults(response.data.items || [])
      setPage(newPage)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      performSearch(query)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div>
          <h1 className="text-4xl font-bold mb-4">Search Movies</h1>
          <p className="text-xl text-gray-600 mb-8">
            Find your favorite movies
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-4 max-w-2xl">
            <Input
              placeholder="Search movies by title..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </form>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 border-4 border-t-4 border-gray-300 rounded-full animate-spin" />
            <p className="mt-4 text-gray-600">Searching movies...</p>
          </div>
        ) : results.length > 0 ? (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Found {results.length} movies
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((movie) => (
                <Link
                  key={movie.id}
                  href={`/movies/${movie.slug}`}
                  className="group"
                >
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                    {movie.poster_url && (
                      <div className="aspect-[2/3] overflow-hidden bg-gray-200">
                        <img
                          src={movie.poster_url}
                          alt={movie.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    )}

                    <div className="p-4">
                      <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                        {movie.title}
                      </h3>

                      <div className="flex flex-wrap gap-2 mb-2 text-sm">
                        {movie.release_year && (
                          <span className="px-2 py-1 bg-gray-100 rounded-full">
                            {movie.release_year}
                          </span>
                        )}
                        {movie.language && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                            {movie.language}
                          </span>
                        )}
                      </div>

                      {movie.short_description && (
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {movie.short_description}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="ghost"
                disabled={page === 1}
                onClick={() => {
                  if (query) performSearch(query, page - 1)
                }}
              >
                Previous
              </Button>
              <Button
                variant="ghost"
                disabled={results.length < 20}
                onClick={() => {
                  if (query) performSearch(query, page + 1)
                }}
              >
                Next
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">
              {query ? `No results found for "${query}"` : 'Enter a search term above'}
            </p>
            <Link href="/">
              <Button variant="secondary">Browse All Movies</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <SearchPageContent />
    </Suspense>
  )
}
