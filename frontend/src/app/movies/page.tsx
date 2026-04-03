import { fetchAllPaginated } from '@/lib/api'
import { Movie } from '@/types'
import Link from 'next/link'

import Footer from '@/components/footer'
import Navbar from '@/components/navbar'
import {
  CinematicEmptyState,
  CinematicMovieCard,
  CinematicPageHero,
  CinematicSectionHeader,
} from '@/components/public-cinema'

async function getMovies() {
  try {
    return await fetchAllPaginated<Movie>('/api/v1/movies', { is_published: true }, 100, {
      auth: false,
      cacheMode: 'force-cache',
      revalidateSeconds: 180,
    })
  } catch (error) {
    console.error('Failed to fetch movies:', error)
    return []
  }
}

export default async function MoviesPage() {
  const movies = await getMovies()
  const featuredMovie = movies.find((movie) => movie.featured) || movies[0]
  const latestMovie = movies[0]
  const subtitleMovie = movies.find((movie) => movie.subtitles && movie.subtitles.length > 0)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />

      <CinematicPageHero
        eyebrow="Complete movie library"
        title="Browse the full collection with a cleaner, more cinematic flow"
        description="Explore the full catalog with richer cards, faster scanning, and premium presentation that makes picking your next watch easier on both mobile and desktop."
        stats={[
          { label: 'Titles', value: `${movies.length}` },
          { label: 'Featured', value: `${movies.filter((movie) => movie.featured).length}` },
          { label: 'Subtitles', value: `${movies.filter((movie) => movie.subtitles && movie.subtitles.length > 0).length}` },
        ]}
        primaryAction={{ href: '/search', label: 'Search movies' }}
        secondaryAction={{ href: '/categories', label: 'Browse categories' }}
        artwork={
          featuredMovie ? (
            <div className="relative h-full min-h-[480px] overflow-hidden rounded-[28px] border border-white/10 bg-white/5 shadow-[0_30px_90px_rgba(0,0,0,0.32)]">
              <CinematicMovieCard movie={featuredMovie} badge="Featured spotlight" />
            </div>
          ) : null
        }
      />

      <section className="px-4 pb-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 rounded-[30px] border border-white/10 bg-[#101114] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.24)] sm:grid-cols-3 lg:p-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Latest arrival</div>
            <div className="mt-2 text-lg font-semibold text-white">{latestMovie?.title || 'Updating soon'}</div>
            <div className="mt-2 text-sm leading-6 text-slate-400">Freshly surfaced releases appear first for quick discovery.</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Subtitle lane</div>
            <div className="mt-2 text-lg font-semibold text-white">{subtitleMovie?.title || 'Curated subtitle picks'}</div>
            <div className="mt-2 text-sm leading-6 text-slate-400">Use subtitle-ready picks to reduce browsing friction when language support matters.</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Browse mode</div>
            <div className="mt-2 text-lg font-semibold text-white">Editorial card layout</div>
            <div className="mt-2 text-sm leading-6 text-slate-400">Cleaner metadata, better spacing, and stronger hover/focus states across the grid.</div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <CinematicSectionHeader
          title="All Movies"
          description="A premium overview of every published title, arranged for faster scanning and a more polished movie-browsing experience."
          action={{ href: '/', label: 'Back home' }}
        />

        {movies.length === 0 ? (
          <CinematicEmptyState
            title="No movies available yet"
            description="The library is currently empty. Check back later for fresh releases and curated picks."
            action={{ href: '/', label: 'Return home' }}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 md:gap-5 xl:grid-cols-5 2xl:grid-cols-6">
            {movies.map((movie, index) => (
              <div key={movie.id} className="animate-slide-up" style={{ animationDelay: `${(index % 8) * 0.04}s` }}>
                <CinematicMovieCard
                  movie={movie}
                  badge={movie.featured ? 'Featured' : movie.subtitles && movie.subtitles.length > 0 ? 'Subtitles ready' : 'Now browsing'}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] px-6 py-8 shadow-[0_30px_90px_rgba(0,0,0,0.24)] sm:px-8 lg:flex lg:items-center lg:justify-between lg:gap-8">
          <div className="max-w-2xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#ff7f86]">Keep exploring</div>
            <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">Want a faster path to your next pick?</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400 sm:text-base">
              Jump into categories for mood-based browsing or use search when you already know what you want.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 lg:mt-0">
            <Link href="/categories" className="cinema-chip">View categories</Link>
            <Link href="/search" className="cinema-chip">Open search</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
