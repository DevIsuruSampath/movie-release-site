import { cache } from 'react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import Footer from '@/components/footer'
import Navbar from '@/components/navbar'
import { CinematicMovieCard, CinematicSectionHeader } from '@/components/public-cinema'
import { Button } from '@/components/ui/button'
import api, { toAbsoluteUrl } from '@/lib/api'
import type { Movie } from '@/types'
import { cn } from '@/lib/utils'

type MoviePageProps = {
  params: Promise<{ slug: string }>
}

function getRenderableImageSrc(path?: string | null): string {
  if (!path) return ''
  if (path.startsWith('/')) return path
  return toAbsoluteUrl(path)
}

function isLocalImage(path?: string | null): boolean {
  return Boolean(path && path.startsWith('/'))
}

function getTrailerEmbedUrl(url?: string | null): string | null {
  if (!url) return null

  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes('youtube.com')) {
      const videoId = parsed.searchParams.get('v')
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null
    }
    if (parsed.hostname.includes('youtu.be')) {
      const videoId = parsed.pathname.replace('/', '')
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null
    }
    if (parsed.hostname.includes('vimeo.com')) {
      const videoId = parsed.pathname.split('/').filter(Boolean).pop()
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null
    }
  } catch {}

  return null
}

function parseRobots(robots?: string | null): Metadata['robots'] | undefined {
  if (!robots) return undefined

  const lowered = robots.toLowerCase()
  return {
    index: lowered.includes('noindex') ? false : lowered.includes('index'),
    follow: lowered.includes('nofollow') ? false : lowered.includes('follow'),
  }
}

function normalizeSchemaMarkup(schemaMarkup?: string | null): string | null {
  const normalized = schemaMarkup?.trim()
  if (!normalized) return null

  try {
    return JSON.stringify(JSON.parse(normalized))
  } catch {
    return null
  }
}

const getMovie = cache(async (slug: string): Promise<Movie | null> => {
  try {
    return await api.get<Movie>(`/api/v1/movies/${slug}`).then((response) => response.data)
  } catch {
    return null
  }
})

async function getRelatedMovies(slug: string): Promise<Movie[]> {
  try {
    return await api
      .get<Movie[]>(`/api/v1/movies/${slug}/related`, {
        auth: false,
        cacheMode: 'force-cache',
        revalidateSeconds: 180,
      })
      .then((response) => response.data || [])
  } catch {
    return []
  }
}

function buildMetadata(movie: Movie): Metadata {
  const title = movie.meta_title || movie.title
  const description = movie.meta_description || movie.short_description || movie.description || `Watch ${movie.title}`
  const canonical = movie.canonical_url || `/movies/${movie.slug}`
  const image = movie.open_graph_image || movie.backdrop_url || movie.poster_url || movie.thumbnail_url
  const imageUrl = image ? toAbsoluteUrl(image) : undefined

  return {
    title,
    description,
    keywords: movie.meta_keywords || undefined,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: toAbsoluteUrl(canonical),
      images: imageUrl ? [{ url: imageUrl, alt: movie.title }] : undefined,
    },
    twitter: {
      card: imageUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
    robots: parseRobots(movie.robots),
  }
}

export async function generateMetadata({ params }: MoviePageProps): Promise<Metadata> {
  const { slug } = await params
  const movie = await getMovie(slug)

  if (!movie) {
    return { title: 'Movie not found' }
  }

  return buildMetadata(movie)
}

function HeroImage({ src, alt }: { src: string; alt: string }) {
  if (isLocalImage(src)) {
    return <Image src={src} alt={alt} fill priority sizes="100vw" className="object-cover" />
  }

  return <img src={src} alt={alt} className="h-full w-full object-cover" loading="eager" decoding="async" fetchPriority="high" />
}

function PosterImage({ src, alt }: { src: string; alt: string }) {
  if (isLocalImage(src)) {
    return <Image src={src} alt={alt} width={600} height={900} priority sizes="(max-width: 768px) 100vw, 320px" className="w-full aspect-[2/3] object-cover" />
  }

  return <img src={src} alt={alt} className="w-full aspect-[2/3] object-cover" loading="eager" decoding="async" fetchPriority="high" />
}

export default async function MovieDetailsPage({ params }: MoviePageProps) {
  const { slug } = await params
  const [movie, relatedMovies] = await Promise.all([getMovie(slug), getRelatedMovies(slug)])

  if (!movie) notFound()

  const mediaUrl = movie.media_url || movie.stream_links.find((link) => link.is_primary)?.url || movie.stream_links[0]?.url || movie.download_links[0]?.url || ''
  const hasDirectMedia = Boolean(mediaUrl)
  const trailerEmbedUrl = getTrailerEmbedUrl(movie.trailer_url)
  const heroImage = movie.backdrop_url || movie.poster_url || movie.thumbnail_url
  const posterImage = movie.poster_url || movie.thumbnail_url || movie.backdrop_url
  const heroSrc = getRenderableImageSrc(heroImage)
  const posterSrc = getRenderableImageSrc(posterImage)
  const schemaMarkup = normalizeSchemaMarkup(movie.schema_markup)
  const mediaButtonClassName = cn(
    'inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-all duration-200',
    'bg-[#e50914] text-white shadow-[0_18px_44px_rgba(229,9,20,0.32)] hover:bg-[#b20710]'
  )

  return (
    <div id="main-content" className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />

      {schemaMarkup ? <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: schemaMarkup }} /> : null}

      <section className="relative min-h-[72vh] overflow-hidden pt-16 md:pt-20">
        <div className="absolute inset-0">
          {heroSrc ? <HeroImage src={heroSrc} alt={movie.title} /> : null}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,8,13,0.95)_0%,rgba(7,8,13,0.88)_32%,rgba(7,8,13,0.5)_70%,rgba(7,8,13,0.9)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,8,13,0.18),rgba(7,8,13,0.94))]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid items-end gap-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-12">
            <div className="mx-auto w-full max-w-[320px] lg:mx-0">
              {posterSrc ? (
                <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/5 shadow-[0_30px_90px_rgba(0,0,0,0.34)]">
                  <PosterImage src={posterSrc} alt={movie.title} />
                </div>
              ) : null}
            </div>

            <div className="space-y-7">
              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.22em] text-slate-400">
                <Link href="/movies" className="hover:text-white">Movies</Link>
                {movie.categories[0] ? (
                  <>
                    <span>•</span>
                    <Link href={`/categories/${movie.categories[0].slug}`} className="hover:text-white">{movie.categories[0].name}</Link>
                  </>
                ) : null}
              </div>

              <div>
                {movie.original_title && movie.original_title !== movie.title ? <p className="mb-3 text-sm font-medium uppercase tracking-[0.22em] text-[#ff7f86]">{movie.original_title}</p> : null}
                <h1 className="max-w-4xl text-4xl font-semibold leading-[0.95] tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">{movie.title}</h1>
                {movie.short_description ? <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">{movie.short_description}</p> : null}
              </div>

              <div className="flex flex-wrap gap-2.5 text-sm">
                {movie.release_year ? <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-white">{movie.release_year}</span> : null}
                {movie.duration_minutes ? <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-white">{Math.floor(movie.duration_minutes / 60)}h {movie.duration_minutes % 60}m</span> : null}
                {movie.language ? <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-white">{movie.language}</span> : null}
                {movie.quality ? <span className="rounded-full border border-[#ff676f]/35 bg-[#e50914]/16 px-3 py-1.5 font-semibold text-[#ff7f86]">{movie.quality}</span> : null}
                {movie.imdb_rating ? <span className="rounded-full border border-amber-300/20 bg-amber-400/12 px-3 py-1.5 text-amber-200">IMDb {movie.imdb_rating}</span> : null}
              </div>

              <div className="flex flex-wrap gap-3">
                {hasDirectMedia ? (
                  <a href={mediaUrl} target="_blank" rel="noreferrer" className={mediaButtonClassName}>
                    Watch / Download
                  </a>
                ) : null}
                {movie.trailer_url ? (
                  <a href={movie.trailer_url} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                    Open Trailer
                  </a>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Categories</div>
                  <div className="mt-2 text-sm font-medium text-white">{movie.categories.length ? movie.categories.map((item) => item.name).join(', ') : 'Uncategorized'}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Quality</div>
                  <div className="mt-2 text-sm font-medium text-white">{movie.quality || 'Not specified'}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Availability</div>
                  <div className="mt-2 text-sm font-medium text-white">{hasDirectMedia ? 'Ready to watch' : 'Metadata only'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.9fr)]">
          <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)] sm:p-8">
            <CinematicSectionHeader title="Story and details" description="A richer detail view with cleaner reading rhythm and metadata grouping." />
            {movie.description ? <p className="mt-2 text-base leading-8 text-slate-300">{movie.description}</p> : <p className="mt-2 text-base leading-8 text-slate-400">No description available for this title yet.</p>}

            {movie.categories.length > 0 ? (
              <div className="mt-8">
                <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Browse by category</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {movie.categories.map((cat) => (
                    <Link key={cat.id} href={`/categories/${cat.slug}`} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-sm text-white transition hover:bg-[#e50914]/18 hover:text-[#ff7f86]">
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-6">
            {movie.trailer_url ? (
              <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
                <h3 className="text-lg font-semibold text-white">Trailer</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">Preview the title directly when supported, or open the original trailer source.</p>
                <div className="mt-4">
                  {trailerEmbedUrl ? (
                    <div className="overflow-hidden rounded-2xl border border-white/10">
                      <iframe
                        src={trailerEmbedUrl}
                        title={`${movie.title} trailer`}
                        className="aspect-video w-full"
                        loading="lazy"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">Inline trailer preview is supported for YouTube and Vimeo links.</p>
                  )}
                </div>
              </div>
            ) : null}

            {movie.short_description ? (
              <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
                <h3 className="text-lg font-semibold text-white">Quick take</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">{movie.short_description}</p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {relatedMovies.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <CinematicSectionHeader title="Related titles" description="More picks surfaced from shared categories, language, quality, and nearby content signals." action={{ href: '/movies', label: 'Browse all' }} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 md:gap-5 xl:grid-cols-5 2xl:grid-cols-6">
            {relatedMovies.map((relatedMovie, index) => (
              <div key={relatedMovie.id} className="animate-slide-up" style={{ animationDelay: `${(index % 8) * 0.04}s` }}>
                <CinematicMovieCard movie={relatedMovie} badge="Related" />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <Footer />
    </div>
  )
}
