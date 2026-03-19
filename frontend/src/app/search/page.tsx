'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import { Movie, MovieListResponse } from '@/types'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'

function SearchPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [results, setResults] = useState<Movie[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    if (query) {
      performSearch(query)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const performSearch = async (searchQuery: string) => {
    setLoading(true)
    setHasSearched(true)
    try {
      const response = await api.get<MovieListResponse>('/api/v1/movies', {
        params: {
          search: searchQuery,
          limit: 50,
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
    if (query.trim()) {
      performSearch(query)
      router.push(`/search?q=${encodeURIComponent(query)}`)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />

      {/* Hero Search Section */}
      <section className="relative pt-28 md:pt-36 pb-12 md:pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-20 right-20 w-96 h-96 bg-[#e50914] rounded-full blur-[200px] opacity-10" />
          <div className="absolute bottom-20 left-20 w-72 h-72 bg-[#b20710] rounded-full blur-[150px] opacity-10" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 animate-slide-up">
            Find Your Next <span className="text-gradient">Favorite Movie</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-400 mb-8 sm:mb-10 max-w-2xl mx-auto">
            Search through our extensive collection of movies
          </p>

          {/* Search Form */}
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {/* Mobile: Stacked layout */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1 group">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-gray-400 group-focus-within:text-[#e50914] transition-colors pointer-events-none z-10"
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
                  className="search-input w-full pl-12 sm:pl-14 pr-4 sm:pr-40 py-3.5 sm:py-4 bg-white/10 border border-white/20 rounded-full text-white placeholder-gray-400 focus:outline-none text-base sm:text-lg h-12 sm:h-auto"
                />
                {/* Desktop button overlay */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:block">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-[#e50914] hover:bg-[#b20710] text-white px-6 sm:px-8 py-2 rounded-full font-medium btn-glow transition-all hover:scale-105 z-10"
                  >
                    {loading ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <span>Search</span>
                    )}
                  </Button>
                </div>
              </div>
              {/* Mobile button - full width */}
              <Button
                type="submit"
                disabled={loading}
                className="sm:hidden w-full bg-[#e50914] hover:bg-[#b20710] text-white py-3 rounded-full font-medium btn-glow transition-all active:scale-95 min-h-[48px]"
              >
                {loading ? (
                  <svg className="w-5 h-5 animate-spin mx-auto" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  'Search'
                )}
              </Button>
            </div>
          </form>

          {/* Quick Search Tags */}
          {!hasSearched && (
            <div className="mt-8 sm:mt-12 flex flex-wrap justify-center gap-2 sm:gap-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <span className="text-gray-500 text-xs sm:text-sm self-center">Popular:</span>
              {['Action', 'Drama', 'Comedy', 'Horror', 'Thriller'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setQuery(tag)
                    performSearch(tag)
                  }}
                  className="px-4 sm:px-5 py-2 sm:py-2.5 bg-white/5 hover:bg-[#e50914] border border-white/10 hover:border-[#e50914] rounded-full text-xs sm:text-sm text-gray-300 hover:text-white transition-all hover:scale-105 active:scale-95"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Results Section */}
      {hasSearched && (
        <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 sm:py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-[#e50914] border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-400 text-sm sm:text-base">Searching movies...</p>
              </div>
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    Search Results
                  </h2>
                  <p className="text-gray-400 mt-1 text-sm sm:text-base">
                    Found {results.length} movies for "{query}"
                  </p>
                </div>
                <Link href="/movies">
                  <Button variant="ghost" className="text-gray-400 hover:text-white hover:bg-white/5 rounded-full">
                    Browse All
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
                {results.map((movie) => (
                  <Link
                    key={movie.id}
                    href={`/movies/${movie.slug}`}
                    className="group"
                  >
                    <div className="card-hover bg-[#141414] rounded-xl overflow-hidden">
                      <div className="movie-poster relative">
                        {movie.poster_url ? (
                          <img
                            src={movie.poster_url}
                            alt={movie.title}
                            className="card-image w-full h-full object-cover"
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
                            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {movie.imdb_rating}
                          </div>
                        )}

                        <div className="play-overlay">
                          <div className="play-button">
                            <svg className="w-3.5 h-3.5 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 sm:p-4">
                        <h3 className="text-white font-semibold text-xs sm:text-sm mb-2 line-clamp-2 group-hover:text-[#e50914] transition-colors">
                          {movie.title}
                        </h3>

                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          {movie.release_year && (
                            <span className="px-2 py-0.5 bg-white/10 rounded-full">
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
            <div className="text-center py-16 sm:py-20 px-4 animate-slide-up">
              <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-full bg-white/5 flex items-center justify-center">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                No results found for "{query}"
              </h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto text-sm sm:text-base">Try a different search term or browse all movies</p>
              <Link href="/movies">
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-full">
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
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-[#e50914] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  )
}
