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
import type { AdminSettings, Category, Movie, MoviePayload, Tag } from '@/types'

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

function isSimpleMediaUrlMovie(movie: Movie): boolean {
  if (movie.stream_links.length === 0 && movie.download_links.length === 0) return true
  if (movie.stream_links.length !== 1 || movie.download_links.length !== 1) return false

  const [streamLink] = movie.stream_links
  const [downloadLink] = movie.download_links
  return streamLink.url === downloadLink.url
}

function toEditorMediaUrl(mediaUrl: string | null | undefined, mediaBaseUrl: string | null | undefined): string {
  const normalizedUrl = (mediaUrl || '').trim()
  if (!normalizedUrl) return ''

  const normalizedBase = (mediaBaseUrl || '').trim().replace(/\/+$/, '')
  if (!normalizedBase) return normalizedUrl

  const baseWithProtocol = normalizedBase.startsWith('http://') || normalizedBase.startsWith('https://') ? normalizedBase : `https://${normalizedBase}`

  if (!normalizedUrl.startsWith(baseWithProtocol)) return normalizedUrl

  const relativePath = normalizedUrl.slice(baseWithProtocol.length)
  if (!relativePath.startsWith('/')) return normalizedUrl

  return relativePath || normalizedUrl
}

function toPayload(movie?: Movie | null, mediaBaseUrl?: string | null): MoviePayload {
  if (!movie) return initialPayload
  const useSimpleMediaUrl = isSimpleMediaUrlMovie(movie)

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
    media_url: useSimpleMediaUrl ? toEditorMediaUrl(movie.media_url, mediaBaseUrl) : undefined,
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
    stream_links: movie.stream_links.map(({ created_at, updated_at, movie_id, ...streamLink }) => streamLink),
    download_links: movie.download_links.map(({ created_at, updated_at, movie_id, ...downloadLink }) => downloadLink),
  }
}

function SectionCard({
  title,
  description,
  expanded,
  onToggle,
  children,
}: {
  title: string
  description: string
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] shadow-[0_18px_50px_rgba(0,0,0,0.16)]">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between px-5 py-5 text-left sm:px-6">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{expanded ? 'Hide' : 'Show'}</span>
      </button>
      {expanded ? <div className="border-t border-white/10 p-5 sm:p-6">{children}</div> : null}
    </section>
  )
}

export function MovieForm({
  movie,
  submitLabel,
}: {
  movie?: Movie | null
  submitLabel: string
}) {
  const router = useRouter()
  const [mediaBaseUrl, setMediaBaseUrl] = useState<string>('')
  const [form, setForm] = useState<MoviePayload>(toPayload(movie))
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    details: true,
    media: true,
    relations: true,
    subtitles: false,
    publishing: true,
    seo: false,
  })

  useEffect(() => {
    setForm(toPayload(movie, mediaBaseUrl))
  }, [movie, mediaBaseUrl])

  useEffect(() => {
    async function loadOptions() {
      try {
        const [categoryResponse, tagResponse, settingsResponse] = await Promise.all([
          api.listCategories({ page: 1, limit: 200 }),
          api.listTags({ page: 1, limit: 200 }),
          api.getAdminSettings().catch(() => ({ storage_backend: 'local', media_base_url: '' } as AdminSettings)),
        ])
        setCategories(categoryResponse.items)
        setTags(tagResponse.items)
        setMediaBaseUrl(settingsResponse.media_base_url || '')
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load category and tag options')
      }
    }
    void loadOptions()
  }, [])

  const persistMediaRemoval = async (field: 'poster_url' | 'backdrop_url' | 'thumbnail_url' | 'open_graph_image') => {
    if (!movie?.id) return
    await api.updateMovie(movie.id, { [field]: '' })
  }

  const toggleSection = (section: string) => {
    setExpandedSections((current) => ({ ...current, [section]: !current[section] }))
  }

  const submit = async (overridePublished?: boolean) => {
    setSubmitting(true)
    setError('')
    try {
      const payload = overridePublished === undefined ? form : { ...form, is_published: overridePublished }
      if (movie?.id) {
        await api.updateMovie(movie.id, payload)
      } else {
        await api.createMovie(payload)
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]">
        <div className="space-y-6">
          <SectionCard title="Details" description="Core metadata, timing, and editorial movie information." expanded={expandedSections.details} onToggle={() => toggleSection('details')}>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Title" hint="Public movie title used across listings." value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
              <Input label="Slug" hint="URL-safe identifier for the movie page." value={form.slug || ''} onChange={(event) => setForm({ ...form, slug: event.target.value })} />
              <Input label="Original title" value={form.original_title || ''} onChange={(event) => setForm({ ...form, original_title: event.target.value })} />
              <Input label="Release date" type="date" value={form.release_date || ''} onChange={(event) => setForm({ ...form, release_date: event.target.value })} />
              <Input label="Release year" type="number" value={form.release_year ?? ''} onChange={(event) => setForm({ ...form, release_year: Number(event.target.value) || undefined })} />
              <Input label="Duration (minutes)" type="number" value={form.duration_minutes ?? ''} onChange={(event) => setForm({ ...form, duration_minutes: Number(event.target.value) || undefined })} />
              <Input label="Country" value={form.country || ''} onChange={(event) => setForm({ ...form, country: event.target.value })} />
              <Input label="Language" value={form.language || ''} onChange={(event) => setForm({ ...form, language: event.target.value })} />
              <Input label="IMDb rating" type="number" step="0.1" value={form.imdb_rating ?? ''} onChange={(event) => setForm({ ...form, imdb_rating: Number(event.target.value) || undefined })} />
              <Input label="Quality" hint="Example: WEB-DL, BluRay, 1080p." value={form.quality || ''} onChange={(event) => setForm({ ...form, quality: event.target.value })} />
              <div className="md:col-span-2">
                <Input
                  label="Media URL"
                  hint="Paste a full URL or a relative path like /folder/nKjlObikMY."
                  value={form.media_url || ''}
                  onChange={(event) => setForm({ ...form, media_url: event.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  label="Trailer URL"
                  hint="Supports YouTube or Vimeo trailer links."
                  value={form.trailer_url || ''}
                  onChange={(event) => setForm({ ...form, trailer_url: event.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Textarea label="Short description" hint="Used in cards, hero previews, and fast scanning contexts." value={form.short_description || ''} onChange={(event) => setForm({ ...form, short_description: event.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Textarea label="Full description" hint="The primary detail-page synopsis and editorial copy." value={form.description || ''} onChange={(event) => setForm({ ...form, description: event.target.value })} className="min-h-[220px]" />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Media" description="Upload and manage poster, backdrop, thumbnail, and social preview artwork." expanded={expandedSections.media} onToggle={() => toggleSection('media')}>
            <div className="grid gap-5 md:grid-cols-2">
              <UploadField label="Poster" value={form.poster_url || ''} onChange={(poster_url) => setForm({ ...form, poster_url })} mediaRole="poster" movieId={movie?.id} onRemove={() => persistMediaRemoval('poster_url')} />
              <UploadField label="Backdrop" value={form.backdrop_url || ''} onChange={(backdrop_url) => setForm({ ...form, backdrop_url })} mediaRole="backdrop" movieId={movie?.id} onRemove={() => persistMediaRemoval('backdrop_url')} />
              <UploadField label="Thumbnail" value={form.thumbnail_url || ''} onChange={(thumbnail_url) => setForm({ ...form, thumbnail_url })} mediaRole="thumbnail" movieId={movie?.id} onRemove={() => persistMediaRemoval('thumbnail_url')} />
              <UploadField label="Open Graph Image" value={form.open_graph_image || ''} onChange={(open_graph_image) => setForm({ ...form, open_graph_image })} mediaRole="other" movieId={movie?.id} onRemove={() => persistMediaRemoval('open_graph_image')} />
            </div>
          </SectionCard>

          <SectionCard title="Relations" description="Attach categories and tags so the movie appears in the right curated lanes." expanded={expandedSections.relations} onToggle={() => toggleSection('relations')}>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">Categories</label>
                <select
                  multiple
                  value={form.category_ids.map(String)}
                  onChange={(event) => setForm({ ...form, category_ids: Array.from(event.target.selectedOptions).map((option) => Number(option.value)) })}
                  className="min-h-[190px] w-full rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] px-3 py-3 text-sm text-white focus:border-[#ff676f]/70 focus:outline-none"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-slate-500">Hold Ctrl/Cmd to select multiple categories.</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">Tags</label>
                <select
                  multiple
                  value={form.tag_ids.map(String)}
                  onChange={(event) => setForm({ ...form, tag_ids: Array.from(event.target.selectedOptions).map((option) => Number(option.value)) })}
                  className="min-h-[190px] w-full rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] px-3 py-3 text-sm text-white focus:border-[#ff676f]/70 focus:outline-none"
                >
                  {tags.map((tag) => (
                    <option key={tag.id} value={tag.id}>{tag.name}</option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-slate-500">Tags help search, recommendations, and internal organization.</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Subtitles" description="Manage subtitle assets that power subtitle-ready discovery and playback support." expanded={expandedSections.subtitles} onToggle={() => toggleSection('subtitles')}>
            <SubtitleManager items={form.subtitles} movieId={movie?.id} onChange={(subtitles) => setForm({ ...form, subtitles })} />
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Publishing" description="Control visibility and homepage promotion status." expanded={expandedSections.publishing} onToggle={() => toggleSection('publishing')}>
            <div className="space-y-4">
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-slate-200">
                <input type="checkbox" checked={form.is_published || false} onChange={(event) => setForm({ ...form, is_published: event.target.checked })} />
                Published and visible on the public site
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-slate-200">
                <input type="checkbox" checked={form.featured || false} onChange={(event) => setForm({ ...form, featured: event.target.checked })} />
                Featured in premium homepage/editorial lanes
              </label>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-slate-400">
                Streaming and download availability are inferred from the media configuration and subtitle/link data above.
              </div>
            </div>
          </SectionCard>

          <SectionCard title="SEO" description="Fine-tune metadata, canonical behavior, and schema markup for discoverability." expanded={expandedSections.seo} onToggle={() => toggleSection('seo')}>
            <SeoFields value={form} onChange={(next) => setForm({ ...form, ...next })} />
          </SectionCard>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#111111]/95 p-3 backdrop-blur">
        <div className="grid gap-3 md:grid-cols-3">
          <Button variant="ghost" className="h-12 rounded-2xl text-base" onClick={() => router.push('/admin/movies')}>
            Cancel
          </Button>
          <Button variant="outline" className="h-12 rounded-2xl text-base font-semibold" disabled={submitting} onClick={() => submit(true)}>
            {submitting ? 'Saving...' : 'Save & Publish'}
          </Button>
          <Button className="h-12 rounded-2xl text-base font-semibold" disabled={submitting} onClick={() => submit()}>
            {submitting ? 'Saving...' : submitLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
