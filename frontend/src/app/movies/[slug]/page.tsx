'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Movie } from '@/types'
import { Button } from '@/components/ui/button'

export default function MovieDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [movie, setMovie] = useState<Movie | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.slug) {
      fetchMovie(Array.isArray(params.slug) ? params.slug[0] : params.slug)
    }
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
    if (movie?.stream_links && movie.stream_links.length > 0) {
      const primaryLink = movie.stream_links.find((link) => link.is_primary) || movie.stream_links[0]
      if (primaryLink && primaryLink.url) {
        window.open(primaryLink.url, '_blank')
      }
    }
  }

  const handleDownload = (link: any) => {
    if (link.url) {
      window.open(link.url, '_blank')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!movie) {
    return <div className="flex items-center justify-center min-h-screen">Movie not found</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Backdrop */}
      {movie.backdrop_url && (
        <div className="relative h-96 w-full">
          <img
            src={movie.backdrop_url}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 -mt-48">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="md:flex">
            {/* Poster */}
            {movie.poster_url && (
              <div className="md:w-1/3">
                <img
                  src={movie.poster_url}
                  alt={movie.title}
                  className="w-full h-auto object-cover"
                />
              </div>
            )}

            {/* Details */}
            <div className="p-8 md:w-2/3 md:pl-8">
              <h1 className="text-4xl font-bold mb-2">{movie.title}</h1>
              
              {movie.original_title && (
                <p className="text-muted-foreground text-lg mb-4">{movie.original_title}</p>
              )}

              <div className="flex flex-wrap gap-4 mb-6 text-sm">
                {movie.release_year && (
                  <span className="px-3 py-1 bg-gray-100 rounded-full">
                    {movie.release_year}
                  </span>
                )}
                {movie.duration_minutes && (
                  <span className="px-3 py-1 bg-gray-100 rounded-full">
                    {Math.floor(movie.duration_minutes / 60)}h {movie.duration_minutes % 60}m
                  </span>
                )}
                {movie.language && (
                  <span className="px-3 py-1 bg-gray-100 rounded-full">
                    {movie.language}
                  </span>
                )}
                {movie.imdb_rating && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                    ★ {movie.imdb_rating}
                  </span>
                )}
              </div>

              {movie.description && (
                <p className="text-gray-700 mb-6">{movie.description}</p>
              )}

              {/* Stream Button */}
              {movie.stream_enabled && movie.stream_links && movie.stream_links.length > 0 && (
                <div className="mb-6">
                  <Button size="lg" className="w-full" onClick={handleStream}>
                    ▶ Stream Now
                  </Button>
                </div>
              )}

              {/* Download Links */}
              {movie.download_enabled && movie.download_links && movie.download_links.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Download Options</h3>
                  <div className="space-y-3">
                    {movie.download_links.map((link) => (
                      <Button
                        key={link.id}
                        variant="secondary"
                        className="w-full justify-between"
                        onClick={() => handleDownload(link)}
                      >
                        <span>{link.title}</span>
                        <span className="text-sm text-muted-foreground">
                          {link.quality} {link.file_size && `(${link.file_size})`}
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Categories */}
              {movie.categories && movie.categories.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {movie.categories.map((cat) => (
                      <span
                        key={cat.id}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        {cat.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
