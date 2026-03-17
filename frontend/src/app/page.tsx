import api from '@/lib/api'
import { Movie, MovieListResponse } from '@/types'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'

async function getFeaturedMovies() {
  try {
    const response = await api.get<MovieListResponse>('/api/v1/movies', {
      params: { is_published: true, featured: true, limit: 12 },
    })
    return response.data.items || []
  } catch (error) {
    console.error('Failed to fetch featured movies:', error)
    return []
  }
}

async function getLatestMovies() {
  try {
    const response = await api.get<MovieListResponse>('/api/v1/movies', {
      params: { is_published: true, limit: 8 },
    })
    return response.data.items || []
  } catch (error) {
    console.error('Failed to fetch latest movies:', error)
    return []
  }
}

export default async function HomePage() {
  const featuredMovies = await getFeaturedMovies()
  const latestMovies = await getLatestMovies()

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen md:min-h-[calc(100vh-5rem)] flex items-center overflow-hidden pt-20 md:pt-24">
        {/* Animated background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#141414] to-[#1a0a0a]" />
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-20 left-10 w-72 h-72 bg-[#e50914] rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#b20710] rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white space-y-8 animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/20">
                <span className="status-dot"></span>
                <span className="text-sm font-medium">Now Streaming</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                Latest Movie
                <span className="text-gradient"> Releases</span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-300 max-w-xl leading-relaxed">
                Discover and stream the latest movies in stunning quality. Your ultimate destination for premium entertainment.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/movies">
                  <Button size="lg" className="bg-[#e50914] hover:bg-[#b20710] text-white px-8 py-4 rounded-full font-semibold btn-glow shadow-lg shadow-red-900/30 transition-all hover:scale-105">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                    </svg>
                    Browse Movies
                  </Button>
                </Link>
                <Link href="/categories">
                  <Button size="lg" variant="secondary" className="glass text-white px-8 py-4 rounded-full font-semibold hover:bg-white/10 transition-all hover:scale-105 border-white/30">
                    Explore Categories
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 pt-8">
                <div>
                  <div className="text-3xl sm:text-4xl font-bold text-gradient-gold">1000+</div>
                  <div className="text-sm text-gray-400">Movies</div>
                </div>
                <div>
                  <div className="text-3xl sm:text-4xl font-bold text-gradient-gold">50+</div>
                  <div className="text-sm text-gray-400">Categories</div>
                </div>
                <div>
                  <div className="text-3xl sm:text-4xl font-bold text-gradient-gold">4K</div>
                  <div className="text-sm text-gray-400">Quality</div>
                </div>
              </div>
            </div>

            {/* Hero Image/Showcase */}
            <div className="relative animate-scale-in hidden lg:block">
              <div className="relative">
                {/* Main featured card */}
                {featuredMovies[0] && (
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl animate-float">
                    <img
                      src={featuredMovies[0].poster_url}
                      alt={featuredMovies[0].title}
                      className="w-full h-[500px] object-cover"
                      loading="eager"
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <div className="flex items-center gap-3 mb-2">
                        {featuredMovies[0].imdb_rating && (
                          <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/90 rounded-md text-xs font-bold text-black">
                            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {featuredMovies[0].imdb_rating}
                          </span>
                        )}
                        {featuredMovies[0].release_year && (
                          <span className="px-2 py-1 glass rounded-md text-xs">{featuredMovies[0].release_year}</span>
                        )}
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-1">{featuredMovies[0].title}</h3>
                      <p className="text-gray-300 text-sm line-clamp-2">{featuredMovies[0].short_description}</p>
                    </div>
                  </div>
                )}

                {/* Floating secondary cards */}
                {featuredMovies[1] && (
                  <div className="absolute -top-8 -right-8 w-40 rounded-xl overflow-hidden shadow-xl animate-float" style={{ animationDelay: '1s' }}>
                    <img src={featuredMovies[1].poster_url} alt={featuredMovies[1].title} className="w-full h-56 object-cover" loading="lazy" decoding="async" />
                  </div>
                )}
                {featuredMovies[2] && (
                  <div className="absolute -bottom-8 -left-8 w-40 rounded-xl overflow-hidden shadow-xl animate-float" style={{ animationDelay: '2s' }}>
                    <img src={featuredMovies[2].poster_url} alt={featuredMovies[2].title} className="w-full h-56 object-cover" loading="lazy" decoding="async" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* Featured Movies Section */}
      {featuredMovies.length > 0 && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white section-title">
                Featured Movies
              </h2>
              <p className="text-gray-400 mt-3">Hand-picked selections for you</p>
            </div>
            <Link href="/movies" className="hidden sm:flex items-center gap-2 text-[#e50914] hover:text-white transition-colors font-medium">
              View All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
            {featuredMovies.map((movie, index) => (
              <Link
                key={movie.id}
                href={`/movies/${movie.slug}`}
                className="group"
              >
                <div className="card-hover bg-[#141414] rounded-xl overflow-hidden">
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

          <div className="mt-8 text-center sm:hidden">
            <Link href="/movies">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-full">
                View All Movies
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* Latest Movies Section */}
      {latestMovies.length > 0 && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0f0f0f]">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white section-title">
                  Latest Releases
                </h2>
                <p className="text-gray-400 mt-3">Fresh from studio</p>
              </div>
              <Link href="/movies" className="hidden sm:flex items-center gap-2 text-[#e50914] hover:text-white transition-colors font-medium">
                View All
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
              {latestMovies.map((movie) => (
                <Link
                  key={movie.id}
                  href={`/movies/${movie.slug}`}
                  className="group"
                >
                  <div className="card-hover bg-[#141414] rounded-xl overflow-hidden">
                    <div className="movie-poster relative">
                      <img
                        src={movie.poster_url}
                        alt={movie.title}
                        className="card-image w-full h-full object-cover"
                      />
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
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#e50914] rounded-full blur-[200px] opacity-20" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to Start <span className="text-gradient">Watching?</span>
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Join thousands of viewers enjoying the latest movies in stunning quality. No subscription required.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/movies">
              <Button size="lg" className="bg-[#e50914] hover:bg-[#b20710] text-white px-10 py-4 rounded-full font-semibold btn-glow shadow-lg shadow-red-900/30 transition-all hover:scale-105">
                Explore Library
              </Button>
            </Link>
            <Link href="/categories">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-10 py-4 rounded-full font-semibold transition-all hover:scale-105">
                Browse by Genre
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
