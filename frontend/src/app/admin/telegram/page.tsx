'use client'

import { useEffect, useState } from 'react'

import { Badge } from '@/components/admin/badge'
import { LoadingSpinner } from '@/components/admin/loading-spinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import api from '@/lib/api'
import type { TelegramPostLog, TelegramSettingsPayload } from '@/types'

const initialForm: TelegramSettingsPayload = {
  is_enabled: false,
  bot_token: '',
  channel_id: '',
  channel_username: '',
  channel_title: '',
  channel_invite_link: '',
  auto_post_on_publish: false,
  auto_post_on_update: false,
  caption_template: '<b>{title}</b>\n{year}\n{language}\n{quality}\n\n{short_description}\n\nCategories: {categories}\nTags: {tags}\n{default_hashtags}',
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

export default function TelegramAdminPage() {
  const [form, setForm] = useState<TelegramSettingsPayload>(initialForm)
  const [maskedToken, setMaskedToken] = useState<string | null>(null)
  const [botUsername, setBotUsername] = useState<string | null>(null)
  const [testStatus, setTestStatus] = useState<string | null>(null)
  const [logs, setLogs] = useState<TelegramPostLog[]>([])
  const [logsLoading, setLogsLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadSettings = async () => {
    const settings = await api.getTelegramSettings()
    setForm({
      is_enabled: settings.is_enabled,
      bot_token: '',
      channel_id: settings.channel_id || '',
      channel_username: settings.channel_username || '',
      channel_title: settings.channel_title || '',
      channel_invite_link: settings.channel_invite_link || '',
      auto_post_on_publish: settings.auto_post_on_publish,
      auto_post_on_update: settings.auto_post_on_update,
      caption_template: settings.caption_template || initialForm.caption_template,
      button_text: settings.button_text || '',
      default_hashtags: settings.default_hashtags || '',
      send_poster_mode: settings.send_poster_mode,
      parse_mode: settings.parse_mode || 'None',
      disable_web_page_preview: settings.disable_web_page_preview,
    })
    setMaskedToken(settings.bot_token_masked || null)
    setBotUsername(settings.bot_username || null)
    setTestStatus(settings.test_status || null)
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

  useEffect(() => {
    async function load() {
      try {
        await Promise.all([loadSettings(), loadLogs()])
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
        <p className="mt-1 text-sm text-gray-400">Manage the bot, private channel delivery, auto-posting, and post history.</p>
      </div>

      {message ? <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{message}</div> : null}
      {error ? <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
        <section className="space-y-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-3 text-sm text-gray-300">
              <input type="checkbox" checked={form.is_enabled} onChange={(event) => setForm({ ...form, is_enabled: event.target.checked })} />
              Enable Telegram integration
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
            <Input label="Bot token" type="password" value={form.bot_token || ''} onChange={(event) => setForm({ ...form, bot_token: event.target.value })} placeholder="123456:ABCDEF..." />
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Saved token</label>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300">{maskedToken || 'No token saved'}</div>
            </div>
            <Input label="Channel ID" value={form.channel_id} onChange={(event) => setForm({ ...form, channel_id: event.target.value })} placeholder="-1001234567890" />
            <Input label="Channel username" value={form.channel_username || ''} onChange={(event) => setForm({ ...form, channel_username: event.target.value })} placeholder="@my_private_channel" />
            <Input label="Display title" value={form.channel_title || ''} onChange={(event) => setForm({ ...form, channel_title: event.target.value })} />
            <Input label="Invite link" value={form.channel_invite_link || ''} onChange={(event) => setForm({ ...form, channel_invite_link: event.target.value })} placeholder="https://t.me/+" />
            <Input label="Button text" value={form.button_text || ''} onChange={(event) => setForm({ ...form, button_text: event.target.value })} />
            <Input label="Default hashtags" value={form.default_hashtags || ''} onChange={(event) => setForm({ ...form, default_hashtags: event.target.value })} placeholder="#movie #newrelease" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
                  setMaskedToken(next.bot_token_masked || null)
                  setBotUsername(next.bot_username || null)
                  setTestStatus(next.test_status || null)
                  setForm((current) => ({ ...current, bot_token: '' }))
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
                  setMessage(response.message)
                  setTestStatus('success')
                  await loadLogs()
                } catch (testError) {
                  setTestStatus('failed')
                  setError(testError instanceof Error ? testError.message : 'Telegram test failed')
                } finally {
                  setTesting(false)
                }
              }}
            >
              {testing ? 'Testing...' : 'Send Test'}
            </Button>
          </div>
        </section>

        <section className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div>
            <h2 className="text-lg font-semibold text-white">Status</h2>
            <p className="mt-1 text-sm text-gray-400">Stored token is masked and never returned in full.</p>
          </div>
          <div className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">Bot Username</div>
              <div className="mt-2 text-sm text-white">{botUsername || 'Unknown'}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">Test Status</div>
              <div className="mt-2"><Badge variant={statusVariant(testStatus)}>{testStatus || 'not tested'}</Badge></div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-gray-300">
              <div className="text-xs uppercase tracking-wide text-gray-500">Template Placeholders</div>
              <div className="mt-2 grid gap-1 text-sm text-gray-300">
                <span>{'{title}'}</span>
                <span>{'{year}'}</span>
                <span>{'{language}'}</span>
                <span>{'{quality}'}</span>
                <span>{'{short_description}'}</span>
                <span>{'{categories}'}</span>
                <span>{'{tags}'}</span>
                <span>{'{movie_url}'}</span>
                <span>{'{channel_invite_link}'}</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Recent Delivery Logs</h2>
            <p className="mt-1 text-sm text-gray-400">Retry failures or inspect the last Telegram responses.</p>
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
    </div>
  )
}
