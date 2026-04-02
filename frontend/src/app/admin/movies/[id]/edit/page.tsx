'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

import { LoadingSpinner } from '@/components/admin/loading-spinner'
import { MovieForm } from '@/components/admin/movie-form'
import api from '@/lib/api'
import type { Movie } from '@/types'

export default function EditMoviePage() {
  const params = useParams<{ id: string }>()
  const [movie, setMovie] = useState<Movie | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadMovie = async () => {
    const movieId = Number(params.id)
    if (!Number.isInteger(movieId) || movieId <= 0) {
      setError('Invalid movie id')
      setLoading(false)
      return
    }
    try {
      setMovie(await api.getMovieById(movieId))
      setError('')
    } catch (loadError) {
      setMovie(null)
      setError(loadError instanceof Error ? loadError.message : 'Failed to load movie')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadMovie()
  }, [params.id])

  if (loading) return <LoadingSpinner label="Loading movie..." />
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-white">Edit Movie</h1>
          <p className="mt-1 text-sm text-gray-400">Update metadata, assets, publishing, and related links.</p>
        </div>
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
      </div>
    )
  }
  if (!movie) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-white">Edit Movie</h1>
          <p className="mt-1 text-sm text-gray-400">Update metadata, assets, publishing, and related links.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-gray-300">Movie not found.</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-white">Edit Movie</h1>
        <p className="mt-1 text-sm text-gray-400">Update metadata, assets, publishing, and related links.</p>
      </div>
      <MovieForm movie={movie} submitLabel="Save Changes" />
    </div>
  )
}
