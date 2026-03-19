'use client'

import { useEffect, useState } from 'react'

import { EmptyState } from '@/components/admin/empty-state'
import { LoadingSpinner } from '@/components/admin/loading-spinner'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import type { UploadItem, UploadOrphanReport } from '@/types'

function formatSize(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export default function UploadsPage() {
  const [images, setImages] = useState<UploadItem[]>([])
  const [subtitles, setSubtitles] = useState<UploadItem[]>([])
  const [orphanReport, setOrphanReport] = useState<UploadOrphanReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [scanLoading, setScanLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [imageItems, subtitleItems] = await Promise.all([api.listImages(), api.listSubtitleUploads()])
        setImages(imageItems)
        setSubtitles(subtitleItems)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load uploads')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  if (loading) return <LoadingSpinner label="Loading uploads..." />

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Uploads</h1>
          <p className="mt-1 text-sm text-gray-400">Review local image and subtitle files, then detect orphaned uploads without deleting anything.</p>
        </div>
        <Button
          variant="outline"
          disabled={scanLoading}
          onClick={async () => {
            setScanLoading(true)
            setError('')
            try {
              setOrphanReport(await api.getUploadOrphans())
            } catch (scanError) {
              setError(scanError instanceof Error ? scanError.message : 'Orphan scan failed')
            } finally {
              setScanLoading(false)
            }
          }}
        >
          {scanLoading ? 'Scanning...' : 'Scan For Orphans'}
        </Button>
      </div>

      {error ? <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="mb-4 text-lg font-semibold text-white">Images</h2>
          {images.length === 0 ? (
            <EmptyState title="No images" description="Uploaded poster and gallery images will appear here." />
          ) : (
            <div className="space-y-3">
              {images.slice(0, 20).map((item) => (
                <div key={item.file_url} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="truncate text-white">{item.filename}</div>
                    <div className="text-gray-500">{item.file_url}</div>
                  </div>
                  <div className="text-gray-400">{formatSize(item.size)}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="mb-4 text-lg font-semibold text-white">Subtitles</h2>
          {subtitles.length === 0 ? (
            <EmptyState title="No subtitle files" description="Uploaded subtitle files will appear here." />
          ) : (
            <div className="space-y-3">
              {subtitles.slice(0, 20).map((item) => (
                <div key={item.file_url} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="truncate text-white">{item.filename}</div>
                    <div className="text-gray-500">{item.file_url}</div>
                  </div>
                  <div className="text-gray-400">{formatSize(item.size)}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="mb-4 text-lg font-semibold text-white">Orphan Report</h2>
        {!orphanReport ? (
          <p className="text-sm text-gray-400">Run a scan to compare local uploads against database references. No files are deleted automatically.</p>
        ) : orphanReport.orphaned_files.length === 0 ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">No orphaned files were found.</div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-gray-400">{orphanReport.orphaned_files.length} orphaned files out of {orphanReport.total_files} total uploads.</div>
            {orphanReport.orphaned_files.map((item) => (
              <div key={item.relative_path} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                <div className="text-white">{item.relative_path}</div>
                <div className="text-gray-500">{formatSize(item.size)}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
