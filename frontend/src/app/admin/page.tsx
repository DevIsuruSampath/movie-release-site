'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { AdminInfoPill, AdminPageHeader, AdminPanel, AdminSectionHeader } from '@/components/admin/admin-shell'
import { Badge } from '@/components/admin/badge'
import { EmptyState } from '@/components/admin/empty-state'
import { LoadingSpinner } from '@/components/admin/loading-spinner'
import { StatCard } from '@/components/admin/stat-card'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import type { DashboardStats } from '@/types'

export default function DashboardPage() {
  const [data, setData] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        setData(await api.getDashboard())
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  if (loading) return <LoadingSpinner label="Loading dashboard..." />
  if (!data) return <EmptyState title="Dashboard unavailable" description="The dashboard data could not be loaded." />

  const quickStats = [
    { label: 'Movies', value: data.total_movies, accent: 'rose' as const },
    { label: 'Published', value: data.total_published_movies, accent: 'emerald' as const },
    { label: 'Featured', value: data.total_featured_movies, accent: 'amber' as const },
    { label: 'Media Ready', value: data.total_media_ready_movies, accent: 'sky' as const },
    { label: 'Trailers', value: data.total_trailer_movies, accent: 'violet' as const },
    { label: 'Categories', value: data.total_categories, accent: 'slate' as const },
    { label: 'Tags', value: data.total_tags, accent: 'slate' as const },
    { label: 'Subtitles', value: data.total_subtitles, accent: 'sky' as const },
  ]

  return (
    <div className="space-y-6 sm:space-y-7">
      <AdminPageHeader
        eyebrow="Admin overview"
        title="Control the catalog with a cleaner publishing command center"
        description="Track movie inventory, storage health, and publishing flow from a dashboard designed to feel more premium, readable, and workflow-friendly on both desktop and mobile."
        actions={
          <>
            <Link href="/admin/movies/new">
              <Button className="rounded-full px-5">Add Movie</Button>
            </Link>
            <Link href="/admin/storage">
              <Button variant="outline" className="rounded-full border-white/15 bg-white/[0.03] px-5 text-white hover:bg-white/10">
                Storage
              </Button>
            </Link>
            <Link href="/admin/settings">
              <Button variant="outline" className="rounded-full border-white/15 bg-white/[0.03] px-5 text-white hover:bg-white/10">
                Settings
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminInfoPill label="Configured backend" value={data.upload_summary?.configured_backend || 'unknown'} />
        <AdminInfoPill label="Storage sources" value={(data.upload_summary?.storage_sources || []).join(', ') || 'Not configured'} />
        <AdminInfoPill label="Recent activity" value={`${data.recent_activity.length} items`} />
        <AdminInfoPill label="Publishing mode" value={`${data.total_published_movies}/${data.total_movies} published`} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quickStats.map((item) => (
          <StatCard key={item.label} label={item.label} value={item.value} accent={item.accent} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <AdminPanel>
          <AdminSectionHeader
            title="Storage health"
            description="A cleaner snapshot of what’s available in your media backend right now."
            actions={
              <Link href="/admin/storage">
                <Button variant="outline" size="sm" className="rounded-full border-white/15 bg-white/[0.03] text-white hover:bg-white/10">
                  Open storage
                </Button>
              </Link>
            }
          />
          <div className="grid gap-4 p-5 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Images</div>
              <div className="mt-3 text-3xl font-semibold text-white">{data.upload_summary?.images_count || 0}</div>
              <div className="mt-2 text-sm text-slate-400">Poster, backdrop, and thumbnail assets in storage.</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Subtitles</div>
              <div className="mt-3 text-3xl font-semibold text-white">{data.upload_summary?.subtitles_count || 0}</div>
              <div className="mt-2 text-sm text-slate-400">Subtitle assets available for subtitle-ready discovery flows.</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Total files</div>
              <div className="mt-3 text-3xl font-semibold text-white">{data.upload_summary?.total_count || 0}</div>
              <div className="mt-2 text-sm text-slate-400">All tracked uploads across configured storage sources.</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 px-5 pb-5">
            {(data.upload_summary?.storage_sources || []).map((source) => (
              <Badge key={source} variant={source === 'supabase' ? 'success' : 'default'}>
                {source}
              </Badge>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel>
          <AdminSectionHeader title="Workflow status" description="Quick operational signals for publishing and catalog maintenance." />
          <div className="grid gap-4 p-5">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-white">Published catalog</div>
                  <div className="mt-1 text-sm text-slate-400">Movies currently visible in the public experience.</div>
                </div>
                <Badge variant="success">Live</Badge>
              </div>
              <div className="mt-4 h-2 rounded-full bg-white/5">
                <div
                  className="h-2 rounded-full bg-[linear-gradient(90deg,#ff5a5f,#ff8a65)]"
                  style={{ width: `${data.total_movies ? Math.min(100, Math.round((data.total_published_movies / data.total_movies) * 100)) : 0}%` }}
                />
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-white">Featured lane</div>
                  <div className="mt-1 text-sm text-slate-400">Premium spotlight titles surfaced on the homepage.</div>
                </div>
                <Badge variant={data.total_featured_movies > 0 ? 'success' : 'warning'}>
                  {data.total_featured_movies > 0 ? 'Configured' : 'Needs curation'}
                </Badge>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-white">Subtitle-ready titles</div>
                  <div className="mt-1 text-sm text-slate-400">Movies with subtitle support available in the catalog.</div>
                </div>
                <Badge variant={data.total_subtitles > 0 ? 'default' : 'warning'}>{data.total_subtitles} assets</Badge>
              </div>
            </div>
          </div>
        </AdminPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminPanel>
          <AdminSectionHeader
            title="Recent movies"
            description="Latest catalog items with clearer publication status."
            actions={
              <Link href="/admin/movies" className="text-sm font-medium text-[#ff7f86] transition hover:text-white">
                View all
              </Link>
            }
          />
          <div className="space-y-3 p-5">
            {data.recent_movies.length === 0 ? (
              <EmptyState title="No movies yet" description="Create the first movie to populate the dashboard." />
            ) : (
              data.recent_movies.map((movie) => (
                <div key={movie.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-medium text-white">{movie.title}</div>
                    <div className="mt-1 text-sm text-slate-500">/{movie.slug}</div>
                  </div>
                  <Badge variant={movie.is_published ? 'success' : 'warning'}>{movie.status}</Badge>
                </div>
              ))
            )}
          </div>
        </AdminPanel>

        <AdminPanel>
          <AdminSectionHeader
            title="Recent activity"
            description="A cleaner timeline of recent admin actions."
            actions={
              <Link href="/admin/activity" className="text-sm font-medium text-[#ff7f86] transition hover:text-white">
                View all
              </Link>
            }
          />
          <div className="space-y-3 p-5">
            {data.recent_activity.length === 0 ? (
              <EmptyState title="No activity yet" description="Actions will appear here as the admin panel is used." />
            ) : (
              data.recent_activity.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-medium text-white">{item.description || `${item.action} ${item.entity_type}`}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {item.actor_email || 'System'} • {new Date(item.created_at).toLocaleString()}
                      </div>
                    </div>
                    <Badge>{item.action}</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </AdminPanel>
      </div>
    </div>
  )
}
