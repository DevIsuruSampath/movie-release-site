'use client'

import { useEffect, useState } from 'react'

import { AdminPageHeader, AdminPanel, AdminSectionHeader } from '@/components/admin/admin-shell'
import { Badge } from '@/components/admin/badge'
import { EmptyState } from '@/components/admin/empty-state'
import { LoadingSpinner } from '@/components/admin/loading-spinner'
import { Pagination } from '@/components/admin/pagination'
import api from '@/lib/api'
import type { AuditLog, PaginatedResponse } from '@/types'

export default function ActivityPage() {
  const [data, setData] = useState<PaginatedResponse<AuditLog> | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        setData(await api.getActivity({ page, limit: 20 }))
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [page])

  if (loading) return <LoadingSpinner label="Loading activity..." />
  if (!data || data.items.length === 0) return <EmptyState title="No activity found" description="Admin actions will appear here." />

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Audit trail"
        title="Review the latest admin actions with a clearer timeline"
        description="Track content updates, operational changes, and publishing activity in a cleaner audit view designed for faster scanning."
      />

      <AdminPanel>
        <AdminSectionHeader title="Recent activity" description="A paginated timeline of actions performed across the admin panel." />
        <div className="space-y-3 p-5">
          {data.items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-base font-medium text-white">{item.description || `${item.action} ${item.entity_type}`}</div>
                  <div className="mt-2 text-sm text-slate-500">
                    {item.actor_email || 'System'} • {item.entity_type} #{item.entity_id ?? '-'} • {new Date(item.created_at).toLocaleString()}
                  </div>
                </div>
                <Badge>{item.action}</Badge>
              </div>
            </div>
          ))}
        </div>
      </AdminPanel>

      <Pagination page={data.page} pages={data.pages} onChange={setPage} />
    </div>
  )
}
