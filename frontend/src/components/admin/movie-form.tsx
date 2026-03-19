'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { SeoFields } from '@/components/admin/seo-fields'
import { SubtitleManager } from '@/components/admin/subtitle-manager'
import { UploadField } from '@/components/admin/upload-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import api from '@/lib/api'
import type { Category, Movie, MoviePayload, Tag } from '@/types'

const initialPayload: MoviePayload = {
  title: '',
  slug: '',
  original_title: '',
  description: '',
  short_description: '',
  release_year: undefined,
  release_date: '',
  duration_minutes: undefined,
  language: '',
  country: '',
  imdb_rating: undefined,
  quality: '',
  media_url: '',
  trailer_url: '',
  poster_url: '',
  backdrop_url: '',
  thumbnail_url: '',
  age_rating: '',
  content_warning: '',
  visibility: 'public',
  featured: false,
  stream_enabled: true,
  download_enabled: true,
  is_published: false,
  meta_title: '',
  meta_description: '',
  meta_keywords: '',
  canonical_url: '',
  open_graph_image: '',
  robots: 'index,follow',
  schema_markup: '',
  category_ids: [],
  tag_ids: [],
  subtitles: [],
  stream_links: [],
  download_links: [],
}

function toPayload(movie?: Movie | null): MoviePayload {
  if (!movie) return initialPayload
  return {
    title: movie.title,
    slug: movie.slug,
    original_title: movie.original_title || '',
    description: movie.description || '',
    short_description: movie.short_description || '',
    release_year: movie.release_year || undefined,
    release_date: movie.release_date || '',
    duration_minutes: movie.duration_minutes || undefined,
    language: movie.language || '',
    country: movie.country || '',
    imdb_rating: movie.imdb_rating || undefined,
    quality: movie.quality || '',
    media_url: movie.media_url || '',
    trailer_url: movie.trailer_url || '',
    poster_url: movie.poster_url || '',
    backdrop_url: movie.backdrop_url || '',
    thumbnail_url: movie.thumbnail_url || '',
    age_rating: movie.age_rating || '',
    content_warning: movie.content_warning || '',
    visibility: movie.visibility,
    featured: movie.featured,
    stream_enabled: movie.stream_enabled,
    download_enabled: movie.download_enabled,
    is_published: movie.is_published,
    meta_title: movie.meta_title || '',
    meta_description: movie.meta_description || '',
    meta_keywords: movie.meta_keywords || '',
    canonical_url: movie.canonical_url || '',
    open_graph_image: movie.open_graph_image || '',
    robots: movie.robots || 'index,follow',
    schema_markup: movie.schema_markup || '',
    category_ids: movie.categories.map((category) => category.id),
    tag_ids: movie.tags.map((tag) => tag.id),
    subtitles: movie.subtitles.map(({ created_at, updated_at, movie_id, ...subtitle }) => subtitle),
    stream_links: [],
    download_links: [],
  }
}

export function MovieForm({
  movie,
  submitLabel,
}: {
  movie?: Movie | null
  submitLabel: string
}) {
  const router = useRouter()
  const [form, setForm] = useState<MoviePayload>(toPayload(movie))
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setForm(toPayload(movie))
  }, [movie])

  useEffect(() => {
    async function loadOptions() {
      const [categoryResponse, tagResponse] = await Promise.all([
        api.listCategories({ page: 1, limit: 200 }),
        api.listTags({ page: 1, limit: 200 }),
      ])
      setCategories(categoryResponse.items)
      setTags(tagResponse.items)
    }
    void loadOptions()
  }, [])

  const submit = async () => {
    setSubmitting(true)
    setError('')
    try {
      if (movie?.id) {
        await api.updateMovie(movie.id, form)
      } else {
        await api.createMovie(form)
      }
      router.push('/admin/movies')
      router.refresh()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to save movie')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {error ? <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="mb-4 text-lg font-semibold text-white">Movie Details</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
              <Input label="Slug" value={form.slug || ''} onChange={(event) => setForm({ ...form, slug: event.target.value })} />
              <Input label="Original title" value={form.original_title || ''} onChange={(event) => setForm({ ...form, original_title: event.target.value })} />
              <Input label="Release date" type="date" value={form.release_date || ''} onChange={(event) => setForm({ ...form, release_date: event.target.value })} />
              <Input label="Release year" type="number" value={form.release_year ?? ''} onChange={(event) => setForm({ ...form, release_year: Number(event.target.value) || undefined })} />
              <Input label="Duration (minutes)" type="number" value={form.duration_minutes ?? ''} onChange={(event) => setForm({ ...form, duration_minutes: Number(event.target.value) || undefined })} />
              <Input label="Country" value={form.country || ''} onChange={(event) => setForm({ ...form, country: event.target.value })} />
              <Input label="Language" value={form.language || ''} onChange={(event) => setForm({ ...form, language: event.target.value })} />
              <Input label="IMDb rating" type="number" step="0.1" value={form.imdb_rating ?? ''} onChange={(event) => setForm({ ...form, imdb_rating: Number(event.target.value) || undefined })} />
              <Input label="Quality" value={form.quality || ''} onChange={(event) => setForm({ ...form, quality: event.target.value })} />
              <Input label="Media URL" value={form.media_url || ''} onChange={(event) => setForm({ ...form, media_url: event.target.value })} className="md:col-span-2" />
              <Input label="Trailer URL" value={form.trailer_url || ''} onChange={(event) => setForm({ ...form, trailer_url: event.target.value })} className="md:col-span-2" />
              <div className="md:col-span-2">
                <Textarea label="Short description" value={form.short_description || ''} onChange={(event) => setForm({ ...form, short_description: event.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Textarea label="Full description" value={form.description || ''} onChange={(event) => setForm({ ...form, description: event.target.value })} className="min-h-[200px]" />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="mb-4 text-lg font-semibold text-white">Media</h2>
            <div className="grid gap-5 md:grid-cols-2">
              <UploadField label="Poster" value={form.poster_url || ''} onChange={(poster_url) => setForm({ ...form, poster_url })} />
              <UploadField label="Backdrop" value={form.backdrop_url || ''} onChange={(backdrop_url) => setForm({ ...form, backdrop_url })} />
              <UploadField label="Thumbnail" value={form.thumbnail_url || ''} onChange={(thumbnail_url) => setForm({ ...form, thumbnail_url })} />
              <UploadField label="Open Graph Image" value={form.open_graph_image || ''} onChange={(open_graph_image) => setForm({ ...form, open_graph_image })} />
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="mb-4 text-lg font-semibold text-white">Relations</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Categories</label>
                <select
                  multiple
                  value={form.category_ids.map(String)}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      category_ids: Array.from(event.target.selectedOptions).map((option) => Number(option.value)),
                    })
                  }
                  className="min-h-[180px] w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white focus:border-[#e50914] focus:outline-none"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Tags</label>
                <select
                  multiple
                  value={form.tag_ids.map(String)}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      tag_ids: Array.from(event.target.selectedOptions).map((option) => Number(option.value)),
                    })
                  }
                  className="min-h-[180px] w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white focus:border-[#e50914] focus:outline-none"
                >
                  {tags.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="mb-4 text-lg font-semibold text-white">Subtitles</h2>
            <SubtitleManager items={form.subtitles} onChange={(subtitles) => setForm({ ...form, subtitles })} />
          </section>

        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="mb-4 text-lg font-semibold text-white">Publishing</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 text-sm text-gray-300">
                <input type="checkbox" checked={form.is_published || false} onChange={(event) => setForm({ ...form, is_published: event.target.checked })} />
                Published
              </label>
              <label className="flex items-center gap-3 text-sm text-gray-300">
                <input type="checkbox" checked={form.featured || false} onChange={(event) => setForm({ ...form, featured: event.target.checked })} />
                Featured
              </label>
              <label className="flex items-center gap-3 text-sm text-gray-300">
                <input type="checkbox" checked={form.stream_enabled || false} onChange={(event) => setForm({ ...form, stream_enabled: event.target.checked })} />
                Streaming enabled
              </label>
              <label className="flex items-center gap-3 text-sm text-gray-300">
                <input type="checkbox" checked={form.download_enabled || false} onChange={(event) => setForm({ ...form, download_enabled: event.target.checked })} />
                Downloads enabled
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="mb-4 text-lg font-semibold text-white">SEO</h2>
            <SeoFields value={form} onChange={(next) => setForm({ ...form, ...next })} />
          </section>

          <div className="flex flex-col gap-3">
            <Button disabled={submitting} onClick={submit}>
              {submitting ? 'Saving...' : submitLabel}
            </Button>
            <Button variant="ghost" onClick={() => router.push('/admin/movies')}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
