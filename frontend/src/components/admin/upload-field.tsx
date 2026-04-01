'use client'

import { useEffect, useState } from 'react'

import { Badge } from '@/components/admin/badge'
import api, { toAbsoluteUrl } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function UploadField({
  label,
  value,
  onChange,
  mediaRole,
  movieId,
  storageSource,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  mediaRole?: string
  movieId?: number
  storageSource?: string | null
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [currentStorageSource, setCurrentStorageSource] = useState(storageSource || '')

  useEffect(() => {
    setCurrentStorageSource(storageSource || '')
  }, [storageSource])

  return (
    <div className="space-y-3">
      <Input label={label} value={value} onChange={(event) => onChange(event.target.value)} placeholder="/uploads/file.webp" />
      {currentStorageSource ? (
        <div>
          <Badge variant={currentStorageSource === 'supabase' ? 'success' : 'default'}>
            {currentStorageSource.replace('_', ' ')}
          </Badge>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0]
              if (!file) return
              setUploading(true)
              setError('')
              try {
                const response = await api.uploadImage(file, { media_role: mediaRole, movie_id: movieId })
                onChange(response.file_url)
                setCurrentStorageSource(response.storage_source || '')
              } catch (uploadError) {
                setError(uploadError instanceof Error ? uploadError.message : 'Upload failed')
              } finally {
                setUploading(false)
              }
            }}
          />
          {uploading ? 'Uploading...' : 'Upload image'}
        </label>
        {value ? (
          <a href={toAbsoluteUrl(value)} target="_blank" className="text-sm text-[#ff676f]" rel="noreferrer">
            Open preview
          </a>
        ) : null}
      </div>
      {value ? (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
          <img src={toAbsoluteUrl(value)} alt={label} className="h-48 w-full object-cover" />
        </div>
      ) : null}
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  )
}
