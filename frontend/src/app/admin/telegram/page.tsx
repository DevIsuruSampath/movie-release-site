'use client'

import { useEffect, useState } from 'react'

import { Badge } from '@/components/admin/badge'
import { LoadingSpinner } from '@/components/admin/loading-spinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import api from '@/lib/api'
import type { TelegramMediaCache, TelegramPostLog, TelegramSettingsPayload } from '@/types'

const initialForm: TelegramSettingsPayload = {
  is_enabled: false,
  api_id: '',
  api_hash: '',
  bot_token: '',
  private_channel_id: '',
  private_channel_username: '',
  private_channel_title: '',
  private_channel_invite_link: '',
  auto_post_on_publish: false,
  auto_post_on_update: false,
  enable_telegram_storage: false,
  telegram_storage_mode: 'local_only',
  caption_template: '<b>{{ title }}</b>\n{{ year }}\n{{ language }}\n{{ quality }}\n\n{{ short_description }}\n\nCategories: {{ categories }}\nTags: {{ tags }}\n{{ default_hashtags }}',
  button_text: 'Watch movie',
  default_hashtags: '',
  send_poster_mode: 'photo',
  parse_mode: 'HTML',
  disable_web_page_preview: false,
}

function statusVariant(status?: string | null): 'default' | 'success' | 'warning' | 'danger' {
  if (status === 'sent' || status === 'success') return 'success'
  if (status === 'failed') return 'danger'
  if (status === 'pending') return 'warning'
  return 'default'
}

function formatSize(size?: number | null) {
  if (!size) return 'Unknown'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export default function TelegramAdminPage() {
  const [form, setForm] = useState<TelegramSettingsPayload>(initialForm)
  const [maskedApiId, setMaskedApiId] = useState<string | null>(null)
  const [maskedApiHash, setMaskedApiHash] = useState<string | null>(null)
  const [maskedToken, setMaskedToken] = useState<string | null>(null)
  const [botUsername, setBotUsername] = useState<string | null>(null)
  const [channelTitle, setChannelTitle] = useState<string | null>(null)
  const [testStatus, setTestStatus] = useState<string | null>(null)
  const [logs, setLogs] = useState<TelegramPostLog[]>([])
  const [media, setMedia] = useState<TelegramMediaCache[]>([])
  const [mediaStats, setMediaStats] = useState<Record<string, number>>({})
  const [logsLoading, setLogsLoading] = useState(true)
  const [mediaLoading, setMediaLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [validating, setValidating] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadSettings = async () => {
    const settings = await api.getTelegramSettings()
    setForm({
      is_enabled: settings.is_enabled,
      api_id: '',
      api_hash: '',
      bot_token: '',
      private_channel_id: settings.private_channel_id || '',
      private_channel_username: settings.private_channel_username || '',
      private_channel_title: settings.private_channel_title || '',
      private_channel_invite_link: settings.private_channel_invite_link || '',
      auto_post_on_publish: settings.auto_post_on_publish,
      auto_post_on_update: settings.auto_post_on_update,
      enable_telegram_storage: settings.enable_telegram_storage,
      telegram_storage_mode: settings.telegram_storage_mode,
      caption_template: settings.caption_template || initialForm.caption_template,
      button_text: settings.button_text || '',
      default_hashtags: settings.default_hashtags || '',
      send_poster_mode: settings.send_poster_mode,
      parse_mode: settings.parse_mode || 'None',
      disable_web_page_preview: settings.disable_web_page_preview,
    })
    setMaskedApiId(settings.api_id_masked || null)
    setMaskedApiHash(settings.api_hash_masked || null)
    setMaskedToken(settings.bot_token_masked || null)
    setBotUsername(settings.bot_username || null)
    setChannelTitle(settings.private_channel_title || null)
    setTestStatus(settings.test_status || null)
    setMediaStats(settings.storage_stats || {})
  }

  const loadLogs = async () => {
    setLogsLoading(true)
    try {
      const response = await api.getTelegramLogs({ page: 1, limit: 20, status: statusFilter || undefined })
      setLogs(response.items)
    } finally {
      setLogsLoading(false)
    }
  }

  const loadMedia = async () => {
    setMediaLoading(true)
    try {
      const response = await api.getTelegramStorageMedia({ page: 1, limit: 12 })
      setMedia(response.items)
      setMediaStats(response.stats)
    } finally {
      setMediaLoading(false)
    }
  }

  useEffect(() => {
    async function load() {
      try {
        await Promise.all([loadSettings(), loadLogs(), loadMedia()])
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load Telegram settings')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  useEffect(() => {
    void loadLogs()
  }, [statusFilter])

  if (loading) return <LoadingSpinner label="Loading Telegram settings..." />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-white">Telegram</h1>
        <p className="mt-1 text-sm text-gray-400">Manage API credentials, validate the private channel, control hybrid media storage, and inspect delivery logs.</p>
      </div>

      {message ? <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{message}</div> : null}
      {error ? <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,0.7fr)]">
        <section className="space-y-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-3 text-sm text-gray-300">
              <input type="checkbox" checked={form.is_enabled} onChange={(event) => setForm({ ...form, is_enabled: event.target.checked })} />
              Enable Telegram posting
            </label>
            <label className="flex items-center gap-3 text-sm text-gray-300">
              <input type="checkbox" checked={form.enable_telegram_storage} onChange={(event) => setForm({ ...form, enable_telegram_storage: event.target.checked })} />
              Enable Telegram storage vault
            </label>
            <label className="flex items-center gap-3 text-sm text-gray-300">
              <input type="checkbox" checked={form.auto_post_on_publish} onChange={(event) => setForm({ ...form, auto_post_on_publish: event.target.checked })} />
              Auto-post on publish
            </label>
            <label className="flex items-center gap-3 text-sm text-gray-300">
              <input type="checkbox" checked={form.auto_post_on_update} onChange={(event) => setForm({ ...form, auto_post_on_update: event.target.checked })} />
              Auto-post on update
            </label>
            <label className="flex items-center gap-3 text-sm text-gray-300">
              <input type="checkbox" checked={form.disable_web_page_preview} onChange={(event) => setForm({ ...form, disable_web_page_preview: event.target.checked })} />
              Disable web page preview
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Telegram API ID" value={form.api_id || ''} onChange={(event) => setForm({ ...form, api_id: event.target.value })} placeholder="1234567" />
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Saved API ID</label>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300">{maskedApiId || 'Not saved'}</div>
            </div>
            <Input label="Telegram API Hash" type="password" value={form.api_hash || ''} onChange={(event) => setForm({ ...form, api_hash: event.target.value })} placeholder="API hash" />
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Saved API Hash</label>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300">{maskedApiHash || 'Not saved'}</div>
            </div>
            <Input label="Bot token" type="password" value={form.bot_token || ''} onChange={(event) => setForm({ ...form, bot_token: event.target.value })} placeholder="123456:ABCDEF..." />
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Saved bot token</label>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300">{maskedToken || 'Not saved'}</div>
            </div>
            <Input label="Private channel ID" value={form.private_channel_id || ''} onChange={(event) => setForm({ ...form, private_channel_id: event.target.value })} placeholder="-1001234567890" />
            <Input label="Private channel username" value={form.private_channel_username || ''} onChange={(event) => setForm({ ...form, private_channel_username: event.target.value })} placeholder="@channel_username" />
            <Input label="Private channel title" value={form.private_channel_title || ''} onChange={(event) => setForm({ ...form, private_channel_title: event.target.value })} />
            <Input label="Invite link" value={form.private_channel_invite_link || ''} onChange={(event) => setForm({ ...form, private_channel_invite_link: event.target.value })} placeholder="https://t.me/+" />
            <Input label="Button text" value={form.button_text || ''} onChange={(event) => setForm({ ...form, button_text: event.target.value })} />
            <Input label="Default hashtags" value={form.default_hashtags || ''} onChange={(event) => setForm({ ...form, default_hashtags: event.target.value })} placeholder="#movie #release" />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Storage mode</label>
              <select
                value={form.telegram_storage_mode}
                onChange={(event) => setForm({ ...form, telegram_storage_mode: event.target.value as TelegramSettingsPayload['telegram_storage_mode'] })}
                className="h-10.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white"
              >
                <option value="local_only">Local only</option>
                <option value="telegram_only">Telegram only</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Poster send mode</label>
              <select
                value={form.send_poster_mode}
                onChange={(event) => setForm({ ...form, send_poster_mode: event.target.value as TelegramSettingsPayload['send_poster_mode'] })}
                className="h-10.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white"
              >
                <option value="photo">Photo</option>
                <option value="document">Document</option>
                <option value="text_only">Text only</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Parse mode</label>
              <select
                value={form.parse_mode}
                onChange={(event) => setForm({ ...form, parse_mode: event.target.value as TelegramSettingsPayload['parse_mode'] })}
                className="h-10.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white"
              >
                <option value="HTML">HTML</option>
                <option value="MarkdownV2">MarkdownV2</option>
                <option value="None">None</option>
              </select>
            </div>
          </div>

          <Textarea
            label="Caption template"
            value={form.caption_template || ''}
            onChange={(event) => setForm({ ...form, caption_template: event.target.value })}
            className="min-h-[220px]"
          />

          <div className="flex flex-wrap gap-3">
            <Button
              disabled={saving}
              onClick={async () => {
                setSaving(true)
                setMessage('')
                setError('')
                try {
                  const next = await api.updateTelegramSettings(form)
                  setMaskedApiId(next.api_id_masked || null)
                  setMaskedApiHash(next.api_hash_masked || null)
                  setMaskedToken(next.bot_token_masked || null)
                  setBotUsername(next.bot_username || null)
                  setChannelTitle(next.private_channel_title || null)
                  setTestStatus(next.test_status || null)
                  setMediaStats(next.storage_stats || {})
                  setForm((current) => ({ ...current, api_id: '', api_hash: '', bot_token: '' }))
                  setMessage('Telegram settings saved.')
                } catch (saveError) {
                  setError(saveError instanceof Error ? saveError.message : 'Failed to save Telegram settings')
                } finally {
                  setSaving(false)
                }
              }}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
            <Button
              variant="outline"
              disabled={testing}
              onClick={async () => {
                setTesting(true)
                setMessage('')
                setError('')
                try {
                  const response = await api.testTelegramSettings()
                  setBotUsername(response.bot_username || null)
                  setChannelTitle(response.private_channel_title || null)
                  setMessage(response.message)
                  setTestStatus('success')
                  await Promise.all([loadLogs(), loadMedia()])
                } catch (testError) {
                  setTestStatus('failed')
                  setError(testError instanceof Error ? testError.message : 'Telegram test failed')
                } finally {
                  setTesting(false)
                }
              }}
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </Button>
            <Button
              variant="outline"
              disabled={validating}
              onClick={async () => {
                setValidating(true)
                setMessage('')
                setError('')
                try {
                  const response = await api.validateTelegramChannel()
                  setBotUsername(response.bot_username || null)
                  setChannelTitle(response.private_channel_title || null)
                  setMessage(response.message)
                } catch (validateError) {
                  setError(validateError instanceof Error ? validateError.message : 'Channel validation failed')
                } finally {
                  setValidating(false)
                }
              }}
            >
              {validating ? 'Validating...' : 'Validate Channel'}
            </Button>
          </div>
        </section>

        <section className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div>
            <h2 className="text-lg font-semibold text-white">Status</h2>
            <p className="mt-1 text-sm text-gray-400">Credentials remain backend-only; the UI only receives masked state.</p>
          </div>
          <div className="grid gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">Bot Username</div>
              <div className="mt-2 text-sm text-white">{botUsername || 'Unknown'}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">Private Channel</div>
              <div className="mt-2 text-sm text-white">{channelTitle || form.private_channel_id || 'Unknown'}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">Last Test</div>
              <div className="mt-2"><Badge variant={statusVariant(testStatus)}>{testStatus || 'not tested'}</Badge></div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">Storage Stats</div>
              <div className="mt-3 grid gap-2 text-sm text-gray-300">
                <div>Total: {mediaStats.total || 0}</div>
                <div>Telegram only: {mediaStats.telegram || 0}</div>
                <div>Hybrid: {mediaStats.hybrid || 0}</div>
                <div>Local tracked: {mediaStats.local || 0}</div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-gray-300">
              <div className="text-xs uppercase tracking-wide text-gray-500">Template Variables</div>
              <div className="mt-2 grid gap-1">
                <span>{'{{ title }}'}</span>
                <span>{'{{ year }}'}</span>
                <span>{'{{ language }}'}</span>
                <span>{'{{ quality }}'}</span>
                <span>{'{{ short_description }}'}</span>
                <span>{'{{ categories }}'}</span>
                <span>{'{{ tags }}'}</span>
                <span>{'{{ movie_url }}'}</span>
                <span>{'{{ channel_invite_link }}'}</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Recent Delivery Logs</h2>
            <p className="mt-1 text-sm text-gray-400">Inspect send mode, cached-media reuse, and retry failed deliveries.</p>
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-10.5 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white"
          >
            <option value="">All statuses</option>
            <option value="sent">Sent</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {logsLoading ? (
          <LoadingSpinner label="Loading Telegram logs..." />
        ) : logs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-6 py-10 text-center text-sm text-gray-400">No Telegram delivery logs yet.</div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-white/[0.03]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Movie</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Mode</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Details</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {logs.map((log) => (
                  <tr key={log.id} className="align-top">
                    <td className="px-4 py-4">
                      <div className="font-medium text-white">{log.movie_title || `Movie #${log.movie_id}`}</div>
                      <div className="text-sm text-gray-500">Log #{log.id}</div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={statusVariant(log.status)}>{log.status}</Badge>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-300">
                      <div>{log.send_mode}</div>
                      <div className="text-gray-500">{log.used_cached_media ? 'Used cached media' : 'Fresh media/path'}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-300">
                      <div>{log.sent_at ? new Date(log.sent_at).toLocaleString() : 'Not sent yet'}</div>
                      {log.error_message ? <div className="mt-1 text-red-300">{log.error_message}</div> : null}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {log.status === 'failed' ? (
                        <Button
                          variant="outline"
                          onClick={async () => {
                            setMessage('')
                            setError('')
                            try {
                              await api.retryTelegramLog(log.id)
                              setMessage(`Retried Telegram log #${log.id}.`)
                              await loadLogs()
                            } catch (retryError) {
                              setError(retryError instanceof Error ? retryError.message : 'Retry failed')
                            }
                          }}
                        >
                          Retry
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div>
          <h2 className="text-lg font-semibold text-white">Stored Telegram Media</h2>
          <p className="mt-1 text-sm text-gray-400">Recent assets uploaded to the private channel vault.</p>
        </div>
        {mediaLoading ? (
          <LoadingSpinner label="Loading stored media..." />
        ) : media.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-6 py-10 text-center text-sm text-gray-400">No Telegram-stored media yet.</div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {media.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-white">{item.original_filename || `Media #${item.id}`}</div>
                  <Badge variant={item.storage_source === 'telegram' ? 'warning' : item.storage_source === 'hybrid' ? 'success' : 'default'}>
                    {item.storage_source}
                  </Badge>
                </div>
                <div className="mt-3 space-y-1 text-sm text-gray-400">
                  <div>Role: {item.media_role}</div>
                  <div>Size: {formatSize(item.file_size)}</div>
                  <div>Type: {item.telegram_media_type || item.mime_type || 'Unknown'}</div>
                  <div>Movie: {item.movie_id || 'Unassigned'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
