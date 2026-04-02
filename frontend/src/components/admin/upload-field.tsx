'use client'

import { useEffect, useState } from 'react'

import api, { toAbsoluteUrl } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function UploadField({
  label,
  value,
  onChange,
  mediaRole,
  movieId,
  onRemove,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  mediaRole?: string
  movieId?: number
  onRemove?: () => Promise<void> | void
}) {
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState('')
  const [manualMode, setManualMode] = useState(false)

  useEffect(() => {
    if (!value) {
      setManualMode(false)
    }
  }, [value])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-gray-200">{label}</div>
          <div className="text-xs text-gray-500">
            {value ? 'Image attached' : 'Upload an image or paste a manual URL'}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setManualMode((current) => !current)}
          className="text-xs font-medium text-gray-400 hover:text-white"
        >
          {manualMode ? 'Hide URL' : 'Edit URL'}
        </button>
      </div>
      {manualMode ? (
        <Input label={`${label} URL`} value={value} onChange={(event) => onChange(event.target.value)} placeholder="/uploads/file.webp" />
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
                    setManualMode(false)
                  } catch (uploadError) {
                    setError(uploadError instanceof Error ? uploadError.message : 'Upload failed')
                  } finally {
                    event.target.value = ''
                    setUploading(false)
                  }
                }}
              />
          {uploading ? 'Uploading...' : 'Upload image'}
        </label>
        {value ? (
          <Button
            type="button"
            variant="ghost"
            disabled={removing}
            onClick={async () => {
              const previousValue = value
              setError('')
              setRemoving(true)
              onChange('')
              try {
                await onRemove?.()
              } catch (removeError) {
                onChange(previousValue)
                setError(removeError instanceof Error ? removeError.message : 'Failed to remove image')
              } finally {
                setRemoving(false)
              }
            }}
          >
            {removing ? 'Removing...' : 'Remove image'}
          </Button>
        ) : null}
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
