'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-400">Operational overview for the admin system.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/movies/new">
            <Button>Add Movie</Button>
          </Link>
          <Link href="/admin/uploads">
            <Button variant="outline">Uploads</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Movies" value={data.total_movies} />
        <StatCard label="Categories" value={data.total_categories} />
        <StatCard label="Tags" value={data.total_tags} />
        <StatCard label="Subtitles" value={data.total_subtitles} />
        <StatCard label="Stream Links" value={data.total_stream_links} />
        <StatCard label="Download Links" value={data.total_download_links} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent Movies</h2>
            <Link href="/admin/movies" className="text-sm text-[#ff676f]">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {data.recent_movies.length === 0 ? (
              <EmptyState title="No movies yet" description="Create the first movie to populate the dashboard." />
            ) : (
              data.recent_movies.map((movie) => (
                <div key={movie.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                  <div>
                    <div className="font-medium text-white">{movie.title}</div>
                    <div className="text-sm text-gray-500">{movie.slug}</div>
                  </div>
                  <Badge variant={movie.is_published ? 'success' : 'warning'}>{movie.status}</Badge>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
            <Link href="/admin/activity" className="text-sm text-[#ff676f]">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {data.recent_activity.length === 0 ? (
              <EmptyState title="No activity yet" description="Actions will appear here as the admin panel is used." />
            ) : (
              data.recent_activity.map((item) => (
                <div key={item.id} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-sm font-medium text-white">{item.description || `${item.action} ${item.entity_type}`}</div>
                    <Badge>{item.action}</Badge>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {item.actor_email || 'System'} • {new Date(item.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
