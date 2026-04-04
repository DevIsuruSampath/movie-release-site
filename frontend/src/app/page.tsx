import api, { toAbsoluteUrl } from '@/lib/api'
import { Movie, MovieListResponse } from '@/types'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'

async function getFeaturedMovies() {
  try {
    const response = await api.get<MovieListResponse>('/api/v1/movies', {
      params: { is_published: true, featured: true, limit: 12 },
      auth: false,
      cacheMode: 'force-cache',
      revalidateSeconds: 180,
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
      params: { is_published: true, limit: 8, sort: 'latest' },
      auth: false,
      cacheMode: 'force-cache',
      revalidateSeconds: 180,
    })
    return response.data.items || []
  } catch (error) {
    console.error('Failed to fetch latest movies:', error)
    return []
  }
}

async function getWatchReadyMovies() {
  try {
    const response = await api.get<MovieListResponse>('/api/v1/movies', {
      params: { is_published: true, limit: 8, sort: 'recently_updated' },
      auth: false,
      cacheMode: 'force-cache',
      revalidateSeconds: 180,
    })
    return (response.data.items || []).filter((movie) => movie.media_url || movie.stream_links.length || movie.download_links.length)
  } catch (error) {
    console.error('Failed to fetch watch-ready movies:', error)
    return []
  }
}

function MovieCard({ movie, badgeLabel }: { movie: Movie; badgeLabel?: string }) {
  const poster = movie.poster_url || movie.thumbnail_url || movie.backdrop_url

  return (
    <Link href={`/movies/${movie.slug}`} className="group block focus:outline-none">
      <article className="card-hover overflow-hidden rounded-2xl border border-white/10 bg-[#141414] shadow-[0_12px_40px_rgba(0,0,0,0.22)] transition-all duration-300 hover:border-white/20 focus-within:border-[#e50914]/50">
        <div className="movie-poster relative">
          {poster ? (
            <img
              src={toAbsoluteUrl(poster)}
              alt={movie.title}
              className="card-image h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-white/5 px-4 text-center text-sm text-gray-400">
              Poster unavailable
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />

          {movie.quality ? <div className="quality-badge">{movie.quality}</div> : null}

          {movie.imdb_rating ? (
            <div className="rating-badge text-yellow-300 text-xs">
              <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {movie.imdb_rating}
            </div>
          ) : null}

          {badgeLabel ? (
            <div className="absolute bottom-2 left-2 rounded-full border border-white/10 bg-black/70 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
              {badgeLabel}
            </div>
          ) : null}

          <div className="play-overlay">
            <div className="play-button">
              <svg className="ml-0.5 h-3.5 w-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="space-y-3 p-4">
          <div className="space-y-2">
            <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-white transition-colors group-hover:text-[#ff7f86] sm:text-[15px]">
              {movie.title}
            </h3>
            <p className="line-clamp-2 min-h-[2.5rem] text-xs leading-5 text-gray-400 sm:text-sm">
              {movie.short_description || 'Discover release details, quality info, and availability at a glance.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-[11px] text-gray-300 sm:text-xs">
            {movie.release_year ? <span className="rounded-full bg-white/10 px-2.5 py-1">{movie.release_year}</span> : null}
            {movie.language ? <span className="rounded-full bg-white/10 px-2.5 py-1">{movie.language}</span> : null}
            {movie.categories[0] ? <span className="rounded-full bg-white/10 px-2.5 py-1">{movie.categories[0].name}</span> : null}
          </div>
        </div>
      </article>
    </Link>
  )
}

function SectionHeader({ title, description, linkHref, linkLabel }: { title: string; description: string; linkHref?: string; linkLabel?: string }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4 sm:mb-10">
      <div>
        <h2 className="section-title text-2xl font-bold text-white sm:text-3xl md:text-4xl">{title}</h2>
        <p className="mt-2 max-w-xl text-sm text-gray-400 sm:mt-3 sm:text-base">{description}</p>
      </div>
      {linkHref && linkLabel ? (
        <Link href={linkHref} className="hidden items-center gap-2 text-[#e50914] transition-colors hover:text-white sm:flex font-medium">
          {linkLabel}
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      ) : null}
    </div>
  )
}

export default async function HomePage() {
  const [featuredMovies, latestMovies, watchReadyMovies] = await Promise.all([
    getFeaturedMovies(),
    getLatestMovies(),
    getWatchReadyMovies(),
  ])

  const heroMovie = featuredMovies[0]
  const heroPoster = heroMovie ? heroMovie.poster_url || heroMovie.thumbnail_url || heroMovie.backdrop_url : null

  return (
    <div id="main-content" className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />

      <section className="relative flex min-h-[85vh] items-center overflow-hidden pt-20 md:min-h-[calc(100vh-5rem)] md:pt-24">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#141414] to-[#1a0a0a]" />
          <div className="absolute inset-0 opacity-30">
            <div className="absolute left-10 top-20 h-72 w-72 rounded-full bg-[#e50914] blur-[120px] animate-pulse" />
            <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-[#b20710] blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-20 lg:px-8">
          <div className="grid items-center gap-8 lg:grid-cols-2 md:gap-12">
            <div className="animate-slide-up space-y-6 text-white md:space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-md sm:px-4">
                <span className="status-dot"></span>
                <span className="text-xs font-medium tracking-wide text-gray-100 sm:text-sm">New drops, cleaner browsing, faster picks</span>
              </div>

              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-black leading-[1.02] tracking-[-0.04em] sm:text-5xl lg:text-7xl">
                  Discover the latest movies
                  <span className="block text-gradient">with a sharper, watch-ready experience</span>
                </h1>

                <p className="max-w-2xl text-base leading-7 text-gray-300 sm:text-lg md:text-xl">
                  Browse fresh releases, featured picks, and watch-ready titles in a layout built for faster scanning and better viewing decisions.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 sm:gap-4">
                <Link href="/movies">
                  <Button size="lg" className="btn-glow rounded-full bg-[#e50914] px-6 py-3 font-semibold text-white shadow-lg shadow-red-900/30 transition-all hover:scale-105 hover:bg-[#b20710] sm:px-8 sm:py-4">
                    <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                    </svg>
                    Browse Movies
                  </Button>
                </Link>
                <Link href="/categories">
                  <Button size="lg" variant="secondary" className="glass rounded-full border-white/30 px-6 py-3 font-semibold text-white transition-all hover:scale-105 hover:bg-white/10 sm:px-8 sm:py-4">
                    Explore Categories
                  </Button>
                </Link>
              </div>

              <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-sm sm:grid-cols-3 sm:gap-4 sm:p-5 md:pt-5">
                <div>
                  <div className="text-2xl font-bold text-gradient-gold sm:text-3xl md:text-4xl">{latestMovies.length || 0}</div>
                  <div className="text-xs uppercase tracking-[0.18em] text-gray-400 sm:text-sm">Latest tracked</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gradient-gold sm:text-3xl md:text-4xl">{featuredMovies.length || 0}</div>
                  <div className="text-xs uppercase tracking-[0.18em] text-gray-400 sm:text-sm">Featured picks</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gradient-gold sm:text-3xl md:text-4xl">{watchReadyMovies.length || 0}</div>
                  <div className="text-xs uppercase tracking-[0.18em] text-gray-400 sm:text-sm">Watch ready</div>
                </div>
              </div>
            </div>

            <div className="relative hidden animate-scale-in lg:block">
              <div className="relative">
                {heroMovie && heroPoster ? (
                  <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 shadow-2xl animate-float">
                    <img
                      src={toAbsoluteUrl(heroPoster)}
                      alt={heroMovie.title}
                      className="h-[500px] w-full object-cover"
                      loading="eager"
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-6">
                      <div className="mb-3 flex flex-wrap items-center gap-2.5">
                        {heroMovie.imdb_rating ? (
                          <span className="flex items-center gap-1 rounded-full bg-yellow-400/95 px-3 py-1 text-xs font-bold text-black">
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {heroMovie.imdb_rating}
                          </span>
                        ) : null}
                        {heroMovie.release_year ? <span className="glass rounded-full px-3 py-1 text-xs text-white">{heroMovie.release_year}</span> : null}
                        {heroMovie.language ? <span className="glass rounded-full px-3 py-1 text-xs text-white">{heroMovie.language}</span> : null}
                      </div>
                      <h3 className="mb-2 text-3xl font-bold text-white">{heroMovie.title}</h3>
                      <p className="max-w-lg text-sm leading-6 text-gray-200 line-clamp-3">
                        {heroMovie.short_description || 'Featured for a reason — strong presentation, easy scanning, and ready to explore.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-[500px] items-center justify-center rounded-[28px] border border-white/10 bg-white/5 text-gray-400 shadow-2xl">
                    Featured showcase loading
                  </div>
                )}

                {featuredMovies[1] && (featuredMovies[1].poster_url || featuredMovies[1].thumbnail_url || featuredMovies[1].backdrop_url) ? (
                  <div className="absolute -right-8 -top-8 w-40 overflow-hidden rounded-2xl border border-white/10 shadow-xl animate-float" style={{ animationDelay: '1s' }}>
                    <img
                      src={toAbsoluteUrl(featuredMovies[1].poster_url || featuredMovies[1].thumbnail_url || featuredMovies[1].backdrop_url)}
                      alt={featuredMovies[1].title}
                      className="h-56 w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                ) : null}

                {featuredMovies[2] && (featuredMovies[2].poster_url || featuredMovies[2].thumbnail_url || featuredMovies[2].backdrop_url) ? (
                  <div className="absolute -bottom-8 -left-8 w-40 overflow-hidden rounded-2xl border border-white/10 shadow-xl animate-float" style={{ animationDelay: '2s' }}>
                    <img
                      src={toAbsoluteUrl(featuredMovies[2].poster_url || featuredMovies[2].thumbnail_url || featuredMovies[2].backdrop_url)}
                      alt={featuredMovies[2].title}
                      className="h-56 w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3 lg:max-w-3xl">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
              <div className="mb-1 text-sm font-semibold text-white">Curated discovery</div>
              <p className="text-sm leading-6 text-gray-400">Skip clutter and jump straight to featured, recent, and watch-ready titles.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
              <div className="mb-1 text-sm font-semibold text-white">Fast visual scanning</div>
              <p className="text-sm leading-6 text-gray-400">Cleaner cards, stronger badges, and tighter hierarchy make choices easier.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
              <div className="mb-1 text-sm font-semibold text-white">Watch-ready browsing</div>
              <p className="text-sm leading-6 text-gray-400">Spot titles with playable or downloadable media without digging through results.</p>
            </div>
          </div>

          <div className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 animate-bounce sm:bottom-8 sm:block">
            <svg className="h-5 w-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mx-auto grid max-w-7xl gap-4 rounded-[28px] border border-white/10 bg-[#101010] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)] sm:grid-cols-2 lg:grid-cols-4 lg:p-6">
          {[
            { label: 'Fresh releases', value: 'Updated daily' },
            { label: 'Better browsing', value: 'Cleaner card hierarchy' },
            { label: 'Watch-ready picks', value: 'Easy to spot quickly' },
            { label: 'Built for movie fans', value: 'Fast, visual, practical' },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <div className="text-sm font-semibold text-white">{item.label}</div>
              <div className="mt-1 text-sm text-gray-400">{item.value}</div>
            </div>
          ))}
        </div>
      </section>

      {featuredMovies.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <SectionHeader
            title="Featured Movies"
            description="Premium picks surfaced first, with better metadata and cleaner visual scanning."
            linkHref="/movies"
            linkLabel="View All"
          />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 md:gap-6 lg:grid-cols-6">
            {featuredMovies.map((movie, index) => (
              <MovieCard key={movie.id} movie={movie} badgeLabel={index < 3 ? 'Featured pick' : undefined} />
            ))}
          </div>

          <div className="mt-6 text-center sm:hidden">
            <Link href="/movies">
              <Button variant="outline" className="rounded-full border-white/30 text-white hover:bg-white/10">
                View All Movies
              </Button>
            </Link>
          </div>
        </section>
      ) : null}

      {watchReadyMovies.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <SectionHeader
            title="Watch-Ready Picks"
            description="A faster lane for viewers who want titles with media ready to open without guesswork."
            linkHref="/movies"
            linkLabel="Explore Library"
          />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 md:gap-6 lg:grid-cols-6">
            {watchReadyMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} badgeLabel="Watch ready" />
            ))}
          </div>
        </section>
      ) : null}

      {latestMovies.length > 0 ? (
        <section className="bg-[#0f0f0f] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeader
              title="Latest Releases"
              description="A streamlined view of the newest releases with stronger card detail and cleaner browsing."
              linkHref="/movies"
              linkLabel="View All"
            />

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 md:gap-6 lg:grid-cols-6">
              {latestMovies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} badgeLabel="New release" />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="absolute inset-0 z-0">
          <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#e50914] opacity-20 blur-[200px] sm:h-[600px] sm:w-[600px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl rounded-[32px] border border-white/10 bg-white/[0.04] px-6 py-10 text-center shadow-[0_30px_90px_rgba(0,0,0,0.28)] backdrop-blur-md sm:px-10 sm:py-14">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-200 sm:text-sm">
            Better discovery starts here
          </div>
          <h2 className="mb-4 text-3xl font-bold text-white sm:mb-6 sm:text-4xl md:text-5xl">
            Ready to start <span className="text-gradient">watching smarter?</span>
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-base text-gray-300 sm:mb-10 sm:text-lg md:text-xl">
            Explore the newest movies, surface featured and watch-ready picks faster, and browse a cleaner release experience built to help you choose quickly.
          </p>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            <Link href="/movies">
              <Button size="lg" className="btn-glow rounded-full bg-[#e50914] px-8 py-3 font-semibold text-white shadow-lg shadow-red-900/30 transition-all hover:scale-105 hover:bg-[#b20710] sm:px-10 sm:py-4">
                Explore Library
              </Button>
            </Link>
            <Link href="/categories">
              <Button size="lg" variant="outline" className="rounded-full border-white/30 px-8 py-3 font-semibold text-white transition-all hover:scale-105 hover:bg-white/10 sm:px-10 sm:py-4">
                Browse by Genre
              </Button>
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-gray-400">
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">Fresh releases</span>
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">Watch-ready picks</span>
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">Fast visual browsing</span>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
