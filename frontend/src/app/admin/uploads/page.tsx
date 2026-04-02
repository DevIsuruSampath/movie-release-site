'use client'

import { useEffect, useState } from 'react'

import { Badge } from '@/components/admin/badge'
import { EmptyState } from '@/components/admin/empty-state'
import { LoadingSpinner } from '@/components/admin/loading-spinner'
import api, { toAbsoluteUrl } from '@/lib/api'
import type { UploadItem, UploadOrphanReport } from '@/types'

function formatUpdatedAt(value?: number | string) {
  if (value === undefined || value === null) return 'Unknown'
  const date = typeof value === 'number' ? new Date(value * 1000) : new Date(value)
  return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleString()
}

function formatSize(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function UploadSection({ title, items }: { title: string; items: UploadItem[] }) {
  if (items.length === 0) {
    return <EmptyState title={`No ${title.toLowerCase()}`} description={`No ${title.toLowerCase()} were found.`} />
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="border-b border-white/10 px-5 py-4">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      <div className="divide-y divide-white/10">
        {items.map((item) => (
          <div key={`${item.storage_source || 'unknown'}:${item.relative_path || item.filename}`} className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="truncate text-sm font-medium text-white">{item.filename}</div>
                {item.storage_source ? (
                  <Badge variant={item.storage_source === 'supabase' ? 'success' : 'default'}>
                    {item.storage_source}
                  </Badge>
                ) : null}
              </div>
              <div className="mt-1 truncate text-xs text-gray-500">{item.relative_path || item.file_url}</div>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-400">
                <span>{formatSize(item.size)}</span>
                <span>{formatUpdatedAt(item.updated_at)}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a href={toAbsoluteUrl(item.file_url)} target="_blank" rel="noreferrer" className="text-sm text-[#ff676f] hover:text-white">
                Open
              </a>
              {item.file_url.match(/\.(png|jpe?g|webp|gif)$/i) ? (
                <img src={toAbsoluteUrl(item.file_url)} alt={item.filename} className="h-14 w-14 rounded-lg object-cover" />
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function UploadsPage() {
  const [images, setImages] = useState<UploadItem[]>([])
  const [subtitles, setSubtitles] = useState<UploadItem[]>([])
  const [orphans, setOrphans] = useState<UploadOrphanReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [imageItems, subtitleItems, orphanReport] = await Promise.all([
          api.listReferencedUploads('images'),
          api.listReferencedUploads('subtitles'),
          api.getUploadOrphans(),
        ])
        setImages(imageItems)
        setSubtitles(subtitleItems)
        setOrphans(orphanReport)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  if (loading) return <LoadingSpinner label="Loading uploads..." />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-white">Uploads</h1>
        <p className="mt-1 text-sm text-gray-400">Inspect database-tracked images and subtitles, including whether each file points to local storage or Supabase.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="text-sm text-gray-400">Images</div>
          <div className="mt-3 text-3xl font-semibold text-white">{images.length}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="text-sm text-gray-400">Subtitles</div>
          <div className="mt-3 text-3xl font-semibold text-white">{subtitles.length}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="text-sm text-gray-400">Orphaned Files</div>
          <div className="mt-3 text-3xl font-semibold text-white">{orphans?.orphaned_files.length || 0}</div>
        </div>
      </div>

      <UploadSection title="Images" items={images} />
      <UploadSection title="Subtitles" items={subtitles} />

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-semibold text-white">Orphaned Uploads</h2>
        </div>
        <div className="p-5">
          {!orphans || orphans.orphaned_files.length === 0 ? (
          <EmptyState title="No orphaned uploads" description="No physical upload files are currently unreferenced." />
          ) : (
            <div className="space-y-3">
              {orphans.orphaned_files.map((item) => (
                <div key={item.relative_path} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-white">{item.relative_path}</div>
                      <div className="mt-1 text-xs text-gray-500">{formatSize(item.size)}</div>
                    </div>
                    <a href={toAbsoluteUrl(item.file_url)} target="_blank" rel="noreferrer" className="text-sm text-[#ff676f] hover:text-white">
                      Open
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
