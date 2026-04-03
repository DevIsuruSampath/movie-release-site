'use client'

import { useEffect, useMemo, useState } from 'react'

import { Badge } from '@/components/admin/badge'
import { EmptyState } from '@/components/admin/empty-state'
import { LoadingSpinner } from '@/components/admin/loading-spinner'
import api, { toAbsoluteUrl } from '@/lib/api'
import { Button } from '@/components/ui/button'
import type { DashboardStats, StorageCleanupResult, UploadItem, UploadMigrationResult, UploadOrphanReport } from '@/types'

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

function StoragePreview({ item }: { item: UploadItem }) {
  const [failed, setFailed] = useState(false)

  if (!item.file_url.match(/\.(png|jpe?g|webp|gif)$/i)) return null
  if (item.storage_source === 'local' && item.file_exists === false) {
    return <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-white/10 bg-black/20 text-[10px] text-gray-500">Missing</div>
  }
  if (failed) {
    return <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-white/10 bg-black/20 text-[10px] text-gray-500">No preview</div>
  }

  return (
    <img
      src={toAbsoluteUrl(item.file_url)}
      alt={item.filename}
      className="h-14 w-14 rounded-lg object-cover"
      onError={() => setFailed(true)}
    />
  )
}

function StorageSection({ title, items }: { title: string; items: UploadItem[] }) {
  if (items.length === 0) {
    return <EmptyState title={`No ${title.toLowerCase()}`} description={`No ${title.toLowerCase()} were found.`} />
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="border-b border-white/10 px-5 py-4">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      <div className="space-y-3 p-4 md:hidden">
        {items.map((item) => (
          <div key={`${item.storage_source || 'unknown'}:${item.relative_path || item.filename}:mobile`} className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="truncate text-sm font-medium text-white">{item.filename}</div>
                  {item.storage_source ? <Badge variant={item.storage_source === 'supabase' ? 'success' : 'default'}>{item.storage_source}</Badge> : null}
                </div>
                <div className="mt-1 truncate text-xs text-gray-500">{item.relative_path || item.file_url}</div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                  <span>{formatSize(item.size)}</span>
                  <span>{formatUpdatedAt(item.updated_at)}</span>
                  {item.storage_source === 'local' && item.file_exists === false ? <span className="text-amber-400">Missing local file</span> : null}
                </div>
              </div>
              <StoragePreview item={item} />
            </div>
            {!(item.storage_source === 'local' && item.file_exists === false) ? (
              <div className="mt-4">
                <a href={toAbsoluteUrl(item.file_url)} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-[#ff676f] hover:text-white">
                  Open
                </a>
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <div className="hidden divide-y divide-white/10 md:block">
        {items.map((item) => (
          <div key={`${item.storage_source || 'unknown'}:${item.relative_path || item.filename}`} className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="truncate text-sm font-medium text-white">{item.filename}</div>
                {item.storage_source ? <Badge variant={item.storage_source === 'supabase' ? 'success' : 'default'}>{item.storage_source}</Badge> : null}
              </div>
              <div className="mt-1 truncate text-xs text-gray-500">{item.relative_path || item.file_url}</div>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-400">
                <span>{formatSize(item.size)}</span>
                <span>{formatUpdatedAt(item.updated_at)}</span>
                {item.storage_source === 'local' && item.file_exists === false ? <span className="text-amber-400">Missing local file</span> : null}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {!(item.storage_source === 'local' && item.file_exists === false) ? <a href={toAbsoluteUrl(item.file_url)} target="_blank" rel="noreferrer" className="text-sm text-[#ff676f] hover:text-white">Open</a> : null}
              <StoragePreview item={item} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function StoragePage() {
  const [images, setImages] = useState<UploadItem[]>([])
  const [subtitles, setSubtitles] = useState<UploadItem[]>([])
  const [orphans, setOrphans] = useState<UploadOrphanReport | null>(null)
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [migrating, setMigrating] = useState(false)
  const [cleaningOrphans, setCleaningOrphans] = useState(false)
  const [cleaningBroken, setCleaningBroken] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const [imageItems, subtitleItems, orphanReport, dashboardData] = await Promise.all([
        api.listReferencedUploads('images'),
        api.listReferencedUploads('subtitles'),
        api.getUploadOrphans(),
        api.getDashboard(),
      ])
      setImages(imageItems)
      setSubtitles(subtitleItems)
      setOrphans(orphanReport)
      setDashboard(dashboardData)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const localReferenceCount = useMemo(() => [...images, ...subtitles].filter((item) => item.storage_source === 'local').length, [images, subtitles])
  const brokenReferenceCount = useMemo(() => [...images, ...subtitles].filter((item) => item.storage_source === 'local' && item.file_exists === false).length, [images, subtitles])
  const orphanCount = orphans?.orphaned_files.length || 0

  if (loading) return <LoadingSpinner label="Loading storage..." />

  async function handleMigration() {
    setMigrating(true)
    setMessage(null)
    try {
      const result: UploadMigrationResult = await api.migrateLocalUploads()
      const firstFailure = result.items.find((item) => item.status === 'failed') as { detail?: string } | undefined
      setMessage(result.migrated > 0 ? `Migrated ${result.migrated} file${result.migrated === 1 ? '' : 's'} to Supabase.` : firstFailure?.detail || 'No files were migrated.')
      await load()
    } finally {
      setMigrating(false)
    }
  }

  async function handleOrphanCleanup() {
    setCleaningOrphans(true)
    setMessage(null)
    try {
      const result: StorageCleanupResult = await api.cleanupOrphanedStorage()
      setMessage(result.deleted ? `Deleted ${result.deleted} orphaned file${result.deleted === 1 ? '' : 's'}.` : 'No orphaned files were deleted.')
      await load()
    } finally {
      setCleaningOrphans(false)
    }
  }

  async function handleBrokenCleanup() {
    setCleaningBroken(true)
    setMessage(null)
    try {
      const result: StorageCleanupResult = await api.cleanupMissingStorageReferences()
      setMessage(result.cleared ? `Cleared ${result.cleared} broken reference${result.cleared === 1 ? '' : 's'}.` : 'No broken references were cleared.')
      await load()
    } finally {
      setCleaningBroken(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <h1 className="text-3xl font-semibold text-white">Storage</h1>
        <div className="max-w-3xl space-y-3">
          <p className="mt-1 text-sm text-gray-400">Inspect database-tracked media, see whether files live locally or in Supabase, and clean up broken or unneeded storage.</p>
          {dashboard?.upload_summary?.configured_backend === 'supabase' && localReferenceCount > 0 ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="text-sm text-amber-100">{localReferenceCount} referenced file{localReferenceCount === 1 ? '' : 's'} still point to local storage because earlier Supabase uploads fell back locally.</p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Button type="button" variant="outline" className="h-12 rounded-2xl px-5 text-base font-semibold" disabled={migrating} onClick={() => void handleMigration()}>
                  {migrating ? 'Migrating...' : 'Migrate local files to Supabase'}
                </Button>
              </div>
            </div>
          ) : null}
          {message ? <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-gray-200">{message}</div> : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="text-sm text-gray-400">Images</div>
          <div className="mt-3 text-3xl font-semibold text-white">{images.length}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="text-sm text-gray-400">Subtitles</div>
          <div className="mt-3 text-3xl font-semibold text-white">{subtitles.length}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="text-sm text-gray-400">Broken references</div>
          <div className="mt-3 text-3xl font-semibold text-white">{brokenReferenceCount}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="text-sm text-gray-400">Orphaned files</div>
          <div className="mt-3 text-3xl font-semibold text-white">{orphanCount}</div>
        </div>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Maintenance</h2>
            <p className="mt-1 text-sm text-gray-400">Clean broken database references and remove physical files that are no longer used.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" className="h-12 rounded-2xl px-5 text-base" disabled={cleaningBroken || brokenReferenceCount === 0} onClick={() => void handleBrokenCleanup()}>
              {cleaningBroken ? 'Cleaning...' : 'Clear Broken References'}
            </Button>
            <Button type="button" variant="outline" className="h-12 rounded-2xl px-5 text-base" disabled={cleaningOrphans || orphanCount === 0} onClick={() => void handleOrphanCleanup()}>
              {cleaningOrphans ? 'Deleting...' : 'Delete Orphaned Files'}
            </Button>
          </div>
        </div>
      </section>

      <StorageSection title="Images" items={images} />
      <StorageSection title="Subtitles" items={subtitles} />

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-semibold text-white">Unused Physical Files</h2>
        </div>
        <div className="p-5">
          {!orphans || orphans.orphaned_files.length === 0 ? (
            <EmptyState title="No orphaned files" description="Every physical storage file is still referenced by a movie, category, subtitle, or gallery item." />
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
