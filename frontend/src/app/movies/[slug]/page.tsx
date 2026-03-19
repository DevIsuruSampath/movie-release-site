'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api, { toAbsoluteUrl } from '@/lib/api'
import { Movie } from '@/types'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import Link from 'next/link'

export default function MovieDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [movie, setMovie] = useState<Movie | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.slug) {
      fetchMovie(Array.isArray(params.slug) ? params.slug[0] : params.slug)
    }
    window.scrollTo(0, 0)
  }, [params.slug])

  const fetchMovie = async (slug: string) => {
    setLoading(true)
    try {
      const response = await api.get<Movie>(`/api/v1/movies/${slug}`)
      setMovie(response.data)
    } catch (error) {
      console.error('Failed to fetch movie:', error)
      router.push('/movies')
    } finally {
      setLoading(false)
    }
  }

  const handleStream = () => {
    if (movie?.media_url) {
      window.open(movie.media_url, '_blank')
      return
    }
    if (movie?.stream_links && movie.stream_links.length > 0) {
      const primaryLink = movie.stream_links.find((link) => link.is_primary) || movie.stream_links[0]
      if (primaryLink && primaryLink.url) {
        window.open(primaryLink.url, '_blank')
      }
    }
  }

  const getTrailerEmbedUrl = (url?: string | null) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-[#e50914] border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400">Loading movie details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
            <h2 className="text-xl font-semibold text-white mb-2">Movie not found</h2>
            <Link href="/movies">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-full mt-4">
                Browse Movies
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
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

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />

      {/* Hero Backdrop - Account for fixed navbar with pt-16 md:pt-20 */}
      <div className="relative h-[60vh] md:h-[70vh] pt-16 md:pt-20 -mt-16 md:-mt-20 overflow-hidden">
        {heroImage && (
          <>
            <img
              src={toAbsoluteUrl(heroImage)}
              alt={movie.title}
              className="w-full h-full object-cover"
              loading="eager"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/90 to-[#0a0a0a]/50" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
          </>
        )}
      </div>

      {/* Content */}
      <div className="relative -mt-32 md:-mt-40 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid md:grid-cols-[300px_1fr] gap-8 lg:gap-12">
          {/* Poster */}
          <div className="relative animate-slide-up">
            {posterImage && (
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={toAbsoluteUrl(posterImage)}
                  alt={movie.title}
                  className="w-full aspect-[2/3] object-cover"
                  loading="eager"
                  decoding="async"
                />
                {movie.imdb_rating && (
                  <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1.5 bg-black/80 backdrop-blur-sm rounded-lg z-10">
                    <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-white font-semibold">{movie.imdb_rating}</span>
                  </div>
                )}
              </div>
            )}

            {/* Quick Actions Mobile */}
            <div className="md:hidden mt-4">
              {hasDirectMedia && (
                <Button onClick={handleStream} className="w-full bg-[#e50914] hover:bg-[#b20710] text-white btn-glow">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                  Watch / Download
                </Button>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            {/* Title Section */}
            <div>
              {movie.original_title && movie.original_title !== movie.title && (
                <p className="text-[#e50914] font-medium mb-2">{movie.original_title}</p>
              )}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
                {movie.title}
              </h1>

              {/* Meta Tags */}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                {movie.release_year && (
                  <span className="px-3 py-1 bg-white/10 text-white rounded-full">
                    {movie.release_year}
                  </span>
                )}
                {movie.duration_minutes && (
                  <span className="px-3 py-1 bg-white/10 text-white rounded-full">
                    {Math.floor(movie.duration_minutes / 60)}h {movie.duration_minutes % 60}m
                  </span>
                )}
                {movie.language && (
                  <span className="px-3 py-1 bg-white/10 text-white rounded-full">
                    {movie.language}
                  </span>
                )}
                {movie.quality && (
                  <span className="px-3 py-1 bg-[#e50914] text-white rounded-full font-semibold">
                    {movie.quality}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            {movie.description && (
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 text-lg leading-relaxed">{movie.description}</p>
              </div>
            )}

            {/* Action Buttons Desktop */}
            <div className="hidden md:flex flex-wrap gap-4">
              {hasDirectMedia && (
                <Button onClick={handleStream} size="lg" className="bg-[#e50914] hover:bg-[#b20710] text-white btn-glow px-8">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                  Watch / Download
                </Button>
              )}
            </div>

            {/* Categories */}
            {movie.categories && movie.categories.length > 0 && (
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
            )}

            {movie.trailer_url && (
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
            )}

            {/* Short Description */}
            {movie.short_description && (
              <div className="glass rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Info</h3>
                <p className="text-gray-300">{movie.short_description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-12">
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
