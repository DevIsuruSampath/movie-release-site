import { cache } from 'react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import Footer from '@/components/footer'
import Navbar from '@/components/navbar'
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
    return {
      title: 'Movie not found',
    }
  }

  return buildMetadata(movie)
}

function HeroImage({ src, alt }: { src: string; alt: string }) {
  if (isLocalImage(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      loading="eager"
      decoding="async"
      fetchPriority="high"
    />
  )
}

function PosterImage({ src, alt }: { src: string; alt: string }) {
  if (isLocalImage(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        width={600}
        height={900}
        priority
        sizes="(max-width: 768px) 100vw, 300px"
        className="w-full aspect-[2/3] object-cover"
      />
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className="w-full aspect-[2/3] object-cover"
      loading="eager"
      decoding="async"
      fetchPriority="high"
    />
  )
}

export default async function MovieDetailsPage({ params }: MoviePageProps) {
  const { slug } = await params
  const [movie, relatedMovies] = await Promise.all([getMovie(slug), getRelatedMovies(slug)])

  if (!movie) {
    notFound()
  }

  const mediaUrl =
    movie.media_url ||
    movie.stream_links.find((link) => link.is_primary)?.url ||
    movie.stream_links[0]?.url ||
    movie.download_links[0]?.url ||
    ''
  const hasDirectMedia = Boolean(mediaUrl)
  const trailerEmbedUrl = getTrailerEmbedUrl(movie.trailer_url)
  const heroImage = movie.backdrop_url || movie.poster_url || movie.thumbnail_url
  const posterImage = movie.poster_url || movie.thumbnail_url || movie.backdrop_url
  const heroSrc = getRenderableImageSrc(heroImage)
  const posterSrc = getRenderableImageSrc(posterImage)
  const schemaMarkup = normalizeSchemaMarkup(movie.schema_markup)
  const mediaButtonClassName = cn(
    'inline-flex h-10.5 items-center justify-center rounded-xl px-4.5 text-base font-medium transition-all duration-200',
    'bg-[#e50914] text-white shadow-lg shadow-red-900/20 hover:bg-[#b20710]'
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />

      {schemaMarkup ? (
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: schemaMarkup }}
        />
      ) : null}

      <div className="relative h-[60vh] md:h-[70vh] pt-16 md:pt-20 -mt-16 md:-mt-20 overflow-hidden">
        {heroSrc ? (
          <>
            <HeroImage src={heroSrc} alt={movie.title} />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/90 to-[#0a0a0a]/50" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
          </>
        ) : null}
      </div>

      <div className="relative -mt-32 md:-mt-40 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid md:grid-cols-[300px_1fr] gap-8 lg:gap-12">
          <div className="relative animate-slide-up">
            {posterSrc ? (
              <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-white/5">
                <PosterImage src={posterSrc} alt={movie.title} />
                {movie.imdb_rating ? (
                  <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1.5 bg-black/80 backdrop-blur-sm rounded-lg z-10">
                    <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-white font-semibold">{movie.imdb_rating}</span>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="md:hidden mt-4">
              {hasDirectMedia ? (
                <a href={mediaUrl} target="_blank" rel="noreferrer" className={cn(mediaButtonClassName, 'w-full btn-glow')}>
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                  Watch / Download
                </a>
              ) : null}
            </div>
          </div>

          <div className="space-y-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div>
              {movie.original_title && movie.original_title !== movie.title ? (
                <p className="text-[#e50914] font-medium mb-2">{movie.original_title}</p>
              ) : null}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">{movie.title}</h1>

              <div className="flex flex-wrap items-center gap-3 text-sm">
                {movie.release_year ? <span className="px-3 py-1 bg-white/10 text-white rounded-full">{movie.release_year}</span> : null}
                {movie.duration_minutes ? (
                  <span className="px-3 py-1 bg-white/10 text-white rounded-full">
                    {Math.floor(movie.duration_minutes / 60)}h {movie.duration_minutes % 60}m
                  </span>
                ) : null}
                {movie.language ? <span className="px-3 py-1 bg-white/10 text-white rounded-full">{movie.language}</span> : null}
                {movie.quality ? <span className="px-3 py-1 bg-[#e50914] text-white rounded-full font-semibold">{movie.quality}</span> : null}
              </div>
            </div>

            {movie.description ? (
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 text-lg leading-relaxed">{movie.description}</p>
              </div>
            ) : null}

            <div className="hidden md:flex flex-wrap gap-4">
              {hasDirectMedia ? (
                <a href={mediaUrl} target="_blank" rel="noreferrer" className={cn(mediaButtonClassName, 'h-12 px-8 btn-glow')}>
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                  Watch / Download
                </a>
              ) : null}
            </div>

            {movie.categories && movie.categories.length > 0 ? (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {movie.categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/categories/${cat.slug}`}
                      className="tag bg-white/10 text-white hover:bg-[#e50914]/80 hover:text-white"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            {movie.trailer_url ? (
              <div className="bg-[#141414] rounded-2xl p-6">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h3 className="text-xl font-semibold text-white">Trailer</h3>
                  <a href={movie.trailer_url} target="_blank" rel="noreferrer" className="text-sm font-medium text-[#e50914] hover:text-white">
                    Open trailer
                  </a>
                </div>
                {trailerEmbedUrl ? (
                  <div className="overflow-hidden rounded-xl border border-white/10">
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
                  <p className="text-sm text-gray-400">
                    Inline trailer preview is supported for YouTube and Vimeo links. Use the trailer button to open other providers.
                  </p>
                )}
              </div>
            ) : null}

            {movie.short_description ? (
              <div className="glass rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Info</h3>
                <p className="text-gray-300">{movie.short_description}</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-12">
          {relatedMovies.length > 0 ? (
            <section className="mb-10">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">Related Titles</h2>
                  <p className="text-sm text-gray-400">More picks based on shared categories, tags, language, and quality</p>
                </div>
                <Link href="/movies" className="text-sm font-medium text-[#e50914] hover:text-white">
                  Browse all
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {relatedMovies.map((relatedMovie) => {
                  const relatedPoster = relatedMovie.poster_url || relatedMovie.thumbnail_url || relatedMovie.backdrop_url
                  return (
                    <Link key={relatedMovie.id} href={`/movies/${relatedMovie.slug}`} className="group">
                      <div className="overflow-hidden rounded-xl bg-[#141414]">
                        {relatedPoster ? (
                          <img
                            src={toAbsoluteUrl(relatedPoster)}
                            alt={relatedMovie.title}
                            className="aspect-[2/3] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="flex aspect-[2/3] w-full items-center justify-center bg-white/5 text-sm text-gray-500">
                            No poster
                          </div>
                        )}
                        <div className="p-3">
                          <h3 className="line-clamp-2 text-sm font-semibold text-white group-hover:text-[#e50914]">
                            {relatedMovie.title}
                          </h3>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          ) : null}
          <Link href="/movies">
            <Button variant="ghost" className="text-gray-400 hover:text-white hover:bg-white/5 rounded-full">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Movies
            </Button>
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  )
}
