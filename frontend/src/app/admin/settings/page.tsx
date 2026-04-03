'use client'

import { useEffect, useMemo, useState } from 'react'

import { EmptyState } from '@/components/admin/empty-state'
import { LoadingSpinner } from '@/components/admin/loading-spinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import api from '@/lib/api'
import type { AdminSettings } from '@/types'

const initialSettings: AdminSettings = {
  storage_backend: 'local',
  media_base_url: '',
}

export default function AdminSettingsPage() {
  const [form, setForm] = useState<AdminSettings>(initialSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const settings = await api.getAdminSettings()
        setForm({
          storage_backend: settings.storage_backend,
          media_base_url: settings.media_base_url || '',
        })
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load admin settings')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const exampleResolvedUrl = useMemo(() => {
    const normalizedBase = (form.media_base_url || '').trim().replace(/\/+$/, '')
    if (!normalizedBase) return '/folder/nKjlObikMY'
    const baseWithProtocol = normalizedBase.startsWith('http://') || normalizedBase.startsWith('https://') ? normalizedBase : `https://${normalizedBase}`
    return `${baseWithProtocol}/folder/nKjlObikMY`
  }, [form.media_base_url])

  if (loading) return <LoadingSpinner label="Loading settings..." />
  if (error && !form.storage_backend) return <EmptyState title="Settings unavailable" description={error} />

  return (
    <div className="space-y-6">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-semibold text-white">Settings</h1>
        <p className="mt-2 text-sm leading-6 text-gray-400">
          Control how media is stored and how relative movie media URLs are expanded into full public links.
        </p>
      </div>

      {error ? <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div> : null}
      {success ? <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{success}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Media storage</h2>
              <p className="mt-1 text-sm text-gray-400">Choose whether new media files should target local storage or Supabase first.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {(['local', 'supabase'] as const).map((backend) => {
                const active = form.storage_backend === backend
                return (
                  <button
                    key={backend}
                    type="button"
                    onClick={() => {
                      setSuccess('')
                      setForm((current) => ({ ...current, storage_backend: backend }))
                    }}
                    className={`rounded-2xl border px-4 py-4 text-left transition-colors ${
                      active
                        ? 'border-[#e50914]/60 bg-[#e50914]/10 text-white'
                        : 'border-white/10 bg-black/20 text-gray-300 hover:border-white/20 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="text-base font-semibold capitalize">{backend}</div>
                    <div className="mt-1 text-sm text-gray-400">
                      {backend === 'supabase' ? 'Use Supabase Storage for new image and subtitle files.' : 'Store new media files on the local storage volume.'}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="space-y-3">
              <Input
                label="Media base URL"
                placeholder="quickfilesstream.indevs.in"
                value={form.media_base_url || ''}
                onChange={(event) => {
                  setSuccess('')
                  setForm((current) => ({ ...current, media_base_url: event.target.value }))
                }}
              />
              <p className="text-sm leading-6 text-gray-400">
                When editors save a movie media URL like
                {' '}
                <span className="text-gray-300">/folder/nKjlObikMY</span>
                , the backend will turn it into:
              </p>
              <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-[#ffb0b4] break-all">
                {exampleResolvedUrl}
              </div>
              <p className="text-xs leading-5 text-gray-500">
                Leave this blank if you want to store full media URLs manually. If you enter only a hostname, the backend will save it as HTTPS automatically.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Behavior preview</h2>
              <p className="mt-1 text-sm text-gray-400">This is how the current settings affect future content edits.</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-gray-500">Storage target</div>
              <div className="mt-2 text-2xl font-semibold capitalize text-white">{form.storage_backend}</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-gray-500">Relative input</div>
              <div className="mt-2 text-sm text-gray-300">/folder/nKjlObikMY</div>
              <div className="mt-4 text-xs uppercase tracking-[0.2em] text-gray-500">Resolved URL</div>
              <div className="mt-2 break-all text-sm text-white">{exampleResolvedUrl}</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-gray-400">
              Existing movie and storage URLs are not rewritten automatically. These settings affect new uploads and future movie media URL saves.
            </div>
          </div>
        </section>
      </div>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <div className="flex w-full max-w-xl items-center justify-end gap-3 rounded-2xl border border-white/10 bg-[#0f0f10]/95 px-4 py-3 shadow-2xl shadow-black/40 backdrop-blur">
          <Button
            type="button"
            variant="outline"
            className="h-12 rounded-2xl px-5 text-base"
            disabled={saving}
            onClick={() => {
              setError('')
              setSuccess('')
              setForm(initialSettings)
              setLoading(true)
              void (async () => {
                try {
                  const settings = await api.getAdminSettings()
                  setForm({
                    storage_backend: settings.storage_backend,
                    media_base_url: settings.media_base_url || '',
                  })
                } catch (loadError) {
                  setError(loadError instanceof Error ? loadError.message : 'Failed to reload admin settings')
                } finally {
                  setLoading(false)
                }
              })()
            }}
          >
            Reset
          </Button>
          <Button
            type="button"
            className="h-12 min-w-[140px] rounded-2xl px-5 text-base font-semibold"
            disabled={saving}
            onClick={async () => {
              setSaving(true)
              setError('')
              setSuccess('')
              try {
                const saved = await api.updateAdminSettings({
                  storage_backend: form.storage_backend,
                  media_base_url: form.media_base_url || '',
                })
                setForm({
                  storage_backend: saved.storage_backend,
                  media_base_url: saved.media_base_url || '',
                })
                setSuccess('Settings updated.')
              } catch (saveError) {
                setError(saveError instanceof Error ? saveError.message : 'Failed to save settings')
              } finally {
                setSaving(false)
              }
            }}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  )
}
