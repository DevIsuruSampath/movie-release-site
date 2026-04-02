'use client'

import { useEffect, useState } from 'react'

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
      <div>
        <h1 className="text-3xl font-semibold text-white">Activity</h1>
        <p className="mt-1 text-base text-gray-400">Recent admin activity and audit trail.</p>
      </div>

      <div className="space-y-3">
        {data.items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-base font-medium text-white">{item.description || `${item.action} ${item.entity_type}`}</div>
                <div className="mt-2 text-sm text-gray-500">
                  {item.actor_email || 'System'} • {item.entity_type} #{item.entity_id ?? '-'} • {new Date(item.created_at).toLocaleString()}
                </div>
              </div>
              <Badge>{item.action}</Badge>
            </div>
          </div>
        ))}
      </div>

      <Pagination page={data.page} pages={data.pages} onChange={setPage} />
    </div>
  )
}
