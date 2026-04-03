'use client'

import { useEffect, useMemo, useState } from 'react'

import { AdminInfoPill, AdminPageHeader, AdminPanel, AdminSectionHeader } from '@/components/admin/admin-shell'
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
      <AdminPageHeader
        eyebrow="Configuration"
        title="Tune storage behavior and media URL handling with clearer guardrails"
        description="Control where files are uploaded, preview how relative URLs resolve, and keep future editor behavior predictable."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminInfoPill label="Storage backend" value={form.storage_backend} />
        <AdminInfoPill label="Media base URL" value={form.media_base_url || 'Manual full URLs'} />
        <AdminInfoPill label="Resolved preview" value={exampleResolvedUrl} />
        <AdminInfoPill label="Mode" value="Future saves only" />
      </div>

      {error ? <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div> : null}
      {success ? <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{success}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
        <AdminPanel>
          <AdminSectionHeader title="Media storage" description="Choose where future uploads go and how movie media URLs are resolved." />
          <div className="space-y-6 p-5 sm:p-6">
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
                    className={`rounded-[24px] border px-4 py-4 text-left transition-colors ${
                      active
                        ? 'border-[#ff676f]/55 bg-[#e50914]/10 text-white'
                        : 'border-white/10 bg-black/20 text-gray-300 hover:border-white/20 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="text-base font-semibold capitalize">{backend}</div>
                    <div className="mt-1 text-sm leading-6 text-slate-400">
                      {backend === 'supabase' ? 'Use Supabase Storage for new image and subtitle uploads.' : 'Store newly uploaded media on the local storage volume.'}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="space-y-3">
              <Input
                label="Media base URL"
                hint="Example: quickfilesstream.indevs.in or https://quickfilesstream.indevs.in"
                placeholder="quickfilesstream.indevs.in"
                value={form.media_base_url || ''}
                onChange={(event) => {
                  setSuccess('')
                  setForm((current) => ({ ...current, media_base_url: event.target.value }))
                }}
              />
              <p className="text-sm leading-6 text-slate-400">
                When editors save a movie media URL like <span className="text-slate-200">/folder/nKjlObikMY</span>, the backend will turn it into:
              </p>
              <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm break-all text-[#ffb0b4]">
                {exampleResolvedUrl}
              </div>
              <p className="text-xs leading-5 text-slate-500">
                Leave this blank if you want editors to always paste full media URLs manually.
              </p>
            </div>
          </div>
        </AdminPanel>

        <AdminPanel>
          <AdminSectionHeader title="Behavior preview" description="Quickly understand how the current settings affect future content edits." />
          <div className="space-y-4 p-5 sm:p-6">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Storage target</div>
              <div className="mt-2 text-2xl font-semibold capitalize text-white">{form.storage_backend}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Relative input</div>
              <div className="mt-2 text-sm text-slate-300">/folder/nKjlObikMY</div>
              <div className="mt-4 text-[11px] uppercase tracking-[0.24em] text-slate-500">Resolved URL</div>
              <div className="mt-2 break-all text-sm text-white">{exampleResolvedUrl}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-slate-400">
              Existing content is not rewritten automatically. These settings apply to new uploads and future saved media URLs.
            </div>
          </div>
        </AdminPanel>
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
            className="h-12 min-w-[150px] rounded-2xl px-5 text-base font-semibold"
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
