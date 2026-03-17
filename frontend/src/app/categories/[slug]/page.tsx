import api from '@/lib/api'
import { Movie, MovieListResponse, Category } from '@/types'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'

async function getCategoryMovies(slug: string) {
  try {
    const response = await api.get<MovieListResponse>('/api/v1/movies', {
      params: { category: slug },
    })
    return response.data.items || []
  } catch (error) {
    console.error('Failed to fetch category movies:', error)
    return []
  }
}

async function getCategoryDetails(slug: string): Promise<Category | null> {
  try {
    const response = await api.get<Category[]>('/api/v1/categories')
    const category = response.data?.find((c) => c.slug === slug)
    return category || null
  } catch (error) {
    console.error('Failed to fetch category:', error)
    return null
  }
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const movies = await getCategoryMovies(params.slug)
  const category = await getCategoryDetails(params.slug)
  const categoryName = category?.name || params.slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

  const categoryGradients: Record<string, string> = {
    'action': 'from-red-500 to-orange-600',
    'comedy': 'from-yellow-500 to-amber-600',
    'drama': 'from-blue-500 to-indigo-600',
    'horror': 'from-gray-800 to-red-900',
    'thriller': 'from-purple-600 to-red-800',
    'romance': 'from-pink-500 to-rose-600',
    'sci-fi': 'from-cyan-500 to-blue-600',
    'animation': 'from-green-500 to-emerald-600',
    'documentary': 'from-slate-500 to-gray-700',
    'fantasy': 'from-violet-500 to-purple-600',
  }

  const gradientClass = categoryGradients[params.slug.toLowerCase()] || 'from-[#e50914] to-[#b20710]'

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />

      {/* Hero Section */}
      <section className={`relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-br ${gradientClass}`}>
        <div className="absolute inset-0 bg-black/30" />

        <div className="relative max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-6 animate-slide-up">
            <Link href="/" className="text-white/70 hover:text-white transition-colors text-sm">
              Home
            </Link>
            <svg className="w-3.5 h-3.5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <Link href="/categories" className="text-white/70 hover:text-white transition-colors text-sm">
              Categories
            </Link>
            <svg className="w-3.5 h-3.5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-white text-sm font-medium">{categoryName}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {categoryName}
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mb-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            {category?.description || `Browse all ${movies.length} ${categoryName.toLowerCase()} movies`}
          </p>

          <div className="flex items-center gap-6 mt-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-2 text-white/70">
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
              <span className="text-white font-semibold">{movies.length} Movies</span>
            </div>
            <Link href="/search">
              <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/10 rounded-full text-sm">
                <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Movies Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {movies.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
              <svg className="w-9 h-9 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No movies found</h3>
            <p className="text-gray-400 mb-6">No movies in this category yet</p>
            <Link href="/categories">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-full">
                Browse All Categories
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
            {movies.map((movie, index) => (
              <Link
                key={movie.id}
                href={`/movies/${movie.slug}`}
                className="group"
              >
                <div className="card-hover bg-[#141414] rounded-xl overflow-hidden animate-slide-up" style={{ animationDelay: `${(index % 6 + 1) * 0.05}s` }}>
                  <div className="movie-poster relative">
                    <img
                      src={movie.poster_url}
                      alt={movie.title}
                      className="card-image w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />

                    {/* Quality Badge */}
                    {movie.quality && (
                      <div className="quality-badge">{movie.quality}</div>
                    )}

                    {/* Rating Badge */}
                    {movie.imdb_rating && (
                      <div className="rating-badge text-yellow-400 text-xs">
                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {movie.imdb_rating}
                      </div>
                    )}

                    {/* Play Button Overlay */}
                    <div className="play-overlay">
                      <div className="play-button">
                        <svg className="w-3.5 h-3.5 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2 group-hover:text-[#e50914] transition-colors">
                      {movie.title}
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      {movie.release_year && (
                        <span className="px-2 py-0.5 bg-white/10 rounded-full">
                          {movie.release_year}
                        </span>
                      )}
                      {movie.language && (
                        <span className="px-2 py-0.5 bg-white/10 rounded-full">
                          {movie.language}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  )
}
