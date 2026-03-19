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

  useEffect(() => {
    async function load() {
      try {
        setMovie(await api.getMovieById(Number(params.id)))
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [params.id])

  if (loading) return <LoadingSpinner label="Loading movie..." />

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
