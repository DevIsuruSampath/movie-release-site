import api, { fetchAllPaginated } from '@/lib/api'
import { Category, Movie } from '@/types'

import Footer from '@/components/footer'
import Navbar from '@/components/navbar'
import {
  CinematicEmptyState,
  CinematicMovieCard,
  CinematicPageHero,
  CinematicSectionHeader,
} from '@/components/public-cinema'

async function getCategoryMovies(slug: string) {
  try {
    return await fetchAllPaginated<Movie>('/api/v1/movies', { category: slug }, 100, {
      auth: false,
      cacheMode: 'force-cache',
      revalidateSeconds: 180,
    })
  } catch (error) {
    console.error('Failed to fetch category movies:', error)
    return []
  }
}

async function getCategoryDetails(slug: string): Promise<Category | null> {
  try {
    const response = await api.get<Category>(`/api/v1/categories/slug/${slug}`, {
      auth: false,
      cacheMode: 'force-cache',
      revalidateSeconds: 300,
    })
    return response.data || null
  } catch (error) {
    console.error('Failed to fetch category:', error)
    return null
  }
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [movies, category] = await Promise.all([getCategoryMovies(slug), getCategoryDetails(slug)])
  const categoryName = category?.name || slug.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
  const featuredMovie = movies.find((movie) => movie.featured) || movies[0]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />

      <CinematicPageHero
        eyebrow="Category spotlight"
        title={`${categoryName} movies with richer editorial presentation`}
        description={category?.description || `Browse ${movies.length} ${categoryName.toLowerCase()} titles in a cleaner category experience designed for faster discovery.`}
        stats={[
          { label: 'Movies', value: `${movies.length}` },
          { label: 'Featured', value: `${movies.filter((movie) => movie.featured).length}` },
          { label: 'Browse mode', value: 'Cinematic' },
        ]}
        primaryAction={{ href: '/movies', label: 'Browse all movies' }}
        secondaryAction={{ href: '/categories', label: 'All categories' }}
        artwork={featuredMovie ? <CinematicMovieCard movie={featuredMovie} badge={`${categoryName} pick`} /> : null}
      />

      <section className="px-4 pb-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 rounded-[30px] border border-white/10 bg-[#101114] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.24)] sm:grid-cols-3 lg:p-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Category tone</div>
            <div className="mt-2 text-lg font-semibold text-white">{categoryName}</div>
            <div className="mt-2 text-sm leading-6 text-slate-400">A stronger category surface with better hierarchy, spacing, and visual scanning.</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Featured titles</div>
            <div className="mt-2 text-lg font-semibold text-white">{movies.filter((movie) => movie.featured).length}</div>
            <div className="mt-2 text-sm leading-6 text-slate-400">Premium picks from this lane can surface immediately with richer presentation.</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Better discovery</div>
            <div className="mt-2 text-lg font-semibold text-white">Touch + desktop</div>
            <div className="mt-2 text-sm leading-6 text-slate-400">Improved readability and card density across mobile, tablet, and large screens.</div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <CinematicSectionHeader
          title={`${categoryName} collection`}
          description="This lane groups related titles into a cleaner editorial browsing flow, making it easier to keep exploring without losing context."
        />

        {movies.length === 0 ? (
          <CinematicEmptyState
            title="No movies found"
            description="No titles are currently assigned to this category. Check back later or browse the full library instead."
            action={{ href: '/categories', label: 'Browse all categories' }}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 md:gap-5 xl:grid-cols-5 2xl:grid-cols-6">
            {movies.map((movie, index) => (
              <div key={movie.id} className="animate-slide-up" style={{ animationDelay: `${(index % 8) * 0.04}s` }}>
                <CinematicMovieCard movie={movie} badge={movie.featured ? 'Featured' : categoryName} />
              </div>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  )
}
