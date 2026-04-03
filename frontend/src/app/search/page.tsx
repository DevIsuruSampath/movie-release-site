'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import api, { toAbsoluteUrl } from '@/lib/api'
import { Movie, MovieListResponse } from '@/types'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'

function SearchPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [sort, setSort] = useState(searchParams.get('sort') || 'latest')
  const [results, setResults] = useState<Movie[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    const nextQuery = searchParams.get('q') || ''
    const nextSort = searchParams.get('sort') || 'latest'
    setQuery(nextQuery)
    setSort(nextSort)
    if (nextQuery.trim()) {
      void performSearch(nextQuery, nextSort)
    } else {
      setResults([])
      setHasSearched(false)
    }
  }, [searchParams])

  const performSearch = async (searchQuery: string, searchSort = sort) => {
    const normalizedQuery = searchQuery.trim()
    if (!normalizedQuery) {
      setResults([])
      setHasSearched(false)
      setLoading(false)
      return
    }
    setLoading(true)
    setHasSearched(true)
    try {
      const response = await api.get<MovieListResponse>('/api/v1/movies', {
        params: {
          search: normalizedQuery,
          limit: 50,
          sort: searchSort,
        },
      })
      setResults(response.data.items || [])
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const normalizedQuery = query.trim()
    if (normalizedQuery) {
      router.push(`/search?q=${encodeURIComponent(normalizedQuery)}&sort=${encodeURIComponent(sort)}`)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />

      <section className="relative overflow-hidden px-4 pb-12 pt-28 sm:px-6 md:pb-16 md:pt-36 lg:px-8">
        <div className="absolute inset-0 z-0">
          <div className="absolute right-20 top-20 h-96 w-96 rounded-full bg-[#e50914] opacity-10 blur-[200px]" />
          <div className="absolute bottom-20 left-20 h-72 w-72 rounded-full bg-[#b20710] opacity-10 blur-[150px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <h1 className="mb-4 animate-slide-up text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Find Your Next <span className="text-gradient">Favorite Movie</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-base text-gray-400 sm:mb-10 sm:text-lg">
            Search through the collection by title, keyword, or vibe.
          </p>

          <form onSubmit={handleSubmit} className="mx-auto max-w-3xl animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <div className="group relative flex-1">
                <svg
                  className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-[#e50914] sm:h-6 sm:w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search movies by title..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="search-input h-12 w-full rounded-full border border-white/20 bg-white/10 py-3.5 pl-12 pr-4 text-base text-white placeholder-gray-400 focus:outline-none sm:h-auto sm:pl-14 sm:pr-40 sm:py-4 sm:text-lg"
                />
                <div className="absolute right-2 top-1/2 hidden -translate-y-1/2 sm:block">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="btn-glow z-10 rounded-full bg-[#e50914] px-6 py-2 text-white transition-all hover:scale-105 hover:bg-[#b20710] sm:px-8"
                  >
                    {loading ? (
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <span>Search</span>
                    )}
                  </Button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="btn-glow min-h-[48px] w-full rounded-full bg-[#e50914] py-3 text-white transition-all active:scale-95 hover:bg-[#b20710] sm:hidden"
              >
                {loading ? (
                  <svg className="mx-auto h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  'Search'
                )}
              </Button>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <span>Sort</span>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                  className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white"
                >
                  <option value="latest">Latest</option>
                  <option value="recently_updated">Recently updated</option>
                  <option value="rating">Top rated</option>
                  <option value="year">Newest year</option>
                  <option value="title">Title A-Z</option>
                </select>
              </label>
            </div>
          </form>

          {!hasSearched && (
            <div className="mt-8 flex animate-slide-up flex-wrap justify-center gap-2 sm:mt-12 sm:gap-3" style={{ animationDelay: '0.2s' }}>
              <span className="self-center text-xs text-gray-500 sm:text-sm">Popular:</span>
              {['Action', 'Drama', 'Comedy', 'Horror', 'Thriller'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setQuery(tag)
                    router.push(`/search?q=${encodeURIComponent(tag)}&sort=${encodeURIComponent(sort)}`)
                  }}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-gray-300 transition-all hover:scale-105 hover:border-[#e50914] hover:bg-[#e50914] hover:text-white active:scale-95 sm:px-5 sm:py-2.5 sm:text-sm"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {hasSearched && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          {loading ? (
            <div className="flex items-center justify-center py-16 sm:py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#e50914] border-t-transparent sm:h-16 sm:w-16" />
                <p className="text-sm text-gray-400 sm:text-base">Searching movies...</p>
              </div>
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white sm:text-2xl">Search Results</h2>
                  <p className="mt-1 text-sm text-gray-400 sm:text-base">
                    Found {results.length} movies for "{query}"
                  </p>
                </div>
                <Link href="/movies">
                  <Button variant="ghost" className="rounded-full text-gray-400 hover:bg-white/5 hover:text-white">
                    Browse All
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 md:gap-6 lg:grid-cols-5 xl:grid-cols-6">
                {results.map((movie) => (
                  <Link
                    key={movie.id}
                    href={`/movies/${movie.slug}`}
                    className="group"
                  >
                    <div className="card-hover overflow-hidden rounded-xl bg-[#141414]">
                      <div className="movie-poster relative">
                        {movie.poster_url || movie.thumbnail_url || movie.backdrop_url ? (
                          <img
                            src={toAbsoluteUrl(movie.poster_url || movie.thumbnail_url || movie.backdrop_url)}
                            alt={movie.title}
                            className="card-image h-full w-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-white/5 text-sm text-gray-500">
                            No poster
                          </div>
                        )}

                        {movie.imdb_rating && (
                          <div className="rating-badge text-yellow-400 text-xs">
                            <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {movie.imdb_rating}
                          </div>
                        )}

                        <div className="play-overlay">
                          <div className="play-button">
                            <svg className="ml-0.5 h-3.5 w-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 sm:p-4">
                        <h3 className="mb-2 line-clamp-2 text-xs font-semibold text-white transition-colors group-hover:text-[#e50914] sm:text-sm">
                          {movie.title}
                        </h3>

                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          {movie.release_year && (
                            <span className="rounded-full bg-white/10 px-2 py-0.5">
                              {movie.release_year}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="animate-slide-up px-4 py-16 text-center sm:py-20">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 sm:mb-6 sm:h-24 sm:w-24">
                <svg className="h-10 w-10 text-gray-500 sm:h-12 sm:w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white sm:text-xl">
                No results found for "{query}"
              </h3>
              <p className="mx-auto mb-6 max-w-md text-sm text-gray-400 sm:text-base">Try a different search term or browse all movies</p>
              <Link href="/movies">
                <Button variant="outline" className="rounded-full border-white/30 text-white hover:bg-white/10">
                  Browse All Movies
                </Button>
              </Link>
            </div>
          )}
        </section>
      )}

      <Footer />
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a]">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#e50914] border-t-transparent sm:h-16 sm:w-16" />
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  )
}
