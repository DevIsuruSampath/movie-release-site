'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

import { Badge } from '@/components/admin/badge'
import { LoadingSpinner } from '@/components/admin/loading-spinner'
import { MovieForm } from '@/components/admin/movie-form'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import type { Movie } from '@/types'

function telegramVariant(status?: string | null): 'default' | 'success' | 'warning' | 'danger' {
  if (status === 'sent') return 'success'
  if (status === 'failed') return 'danger'
  if (status === 'pending') return 'warning'
  return 'default'
}

export default function EditMoviePage() {
  const params = useParams<{ id: string }>()
  const [movie, setMovie] = useState<Movie | null>(null)
  const [loading, setLoading] = useState(true)
  const [telegramLoading, setTelegramLoading] = useState<'send' | 'force' | ''>('')
  const [telegramMessage, setTelegramMessage] = useState('')
  const [telegramError, setTelegramError] = useState('')

  const loadMovie = async () => {
    try {
      setMovie(await api.getMovieById(Number(params.id)))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadMovie()
  }, [params.id])

  if (loading) return <LoadingSpinner label="Loading movie..." />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-white">Edit Movie</h1>
        <p className="mt-1 text-sm text-gray-400">Update metadata, assets, publishing, and related links.</p>
      </div>

      {movie ? (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-white">Telegram Delivery</h2>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant={telegramVariant(movie.telegram_last_post_status)}>
                  {movie.telegram_last_post_status || 'never sent'}
                </Badge>
                {movie.telegram_last_sent_at ? <span className="text-sm text-gray-400">Last sent {new Date(movie.telegram_last_sent_at).toLocaleString()}</span> : null}
              </div>
              {movie.telegram_last_error_message ? <p className="text-sm text-red-300">{movie.telegram_last_error_message}</p> : null}
              {telegramMessage ? <p className="text-sm text-emerald-300">{telegramMessage}</p> : null}
              {telegramError ? <p className="text-sm text-red-300">{telegramError}</p> : null}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                disabled={telegramLoading !== ''}
                onClick={async () => {
                  setTelegramLoading('send')
                  setTelegramMessage('')
                  setTelegramError('')
                  try {
                    await api.sendMovieToTelegram(movie.id)
                    setTelegramMessage('Movie sent to Telegram.')
                    await loadMovie()
                  } catch (error) {
                    setTelegramError(error instanceof Error ? error.message : 'Telegram send failed')
                  } finally {
                    setTelegramLoading('')
                  }
                }}
              >
                {telegramLoading === 'send' ? 'Sending...' : 'Send To Telegram'}
              </Button>
              <Button
                variant="outline"
                disabled={telegramLoading !== ''}
                onClick={async () => {
                  setTelegramLoading('force')
                  setTelegramMessage('')
                  setTelegramError('')
                  try {
                    await api.sendMovieToTelegram(movie.id, true)
                    setTelegramMessage('Movie force re-sent to Telegram.')
                    await loadMovie()
                  } catch (error) {
                    setTelegramError(error instanceof Error ? error.message : 'Telegram resend failed')
                  } finally {
                    setTelegramLoading('')
                  }
                }}
              >
                {telegramLoading === 'force' ? 'Re-sending...' : 'Force Re-send'}
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <MovieForm movie={movie} submitLabel="Save Changes" />
    </div>
  )
}
