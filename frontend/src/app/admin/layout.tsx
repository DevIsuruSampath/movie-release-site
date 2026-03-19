'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import AdminNavbar from '@/components/admin-navbar'
import { LoadingSpinner } from '@/components/admin/loading-spinner'
import { useAuthStore } from '@/stores/auth'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const hydrated = useAuthStore((state) => state.hydrated)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isAdmin = useAuthStore((state) => state.isAdmin)
  const fetchCurrentUser = useAuthStore((state) => state.fetchCurrentUser)

  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    if (!hydrated) return
    if (!isAuthenticated && !isLoginPage) {
      router.replace('/admin/login')
      return
    }
    if (isAuthenticated && !isAdmin && !isLoginPage) {
      router.replace('/admin/login')
      return
    }
    if (isAuthenticated && isAdmin) {
      void fetchCurrentUser()
    }
    if (isAuthenticated && isAdmin && isLoginPage) {
      router.replace('/admin')
    }
  }, [fetchCurrentUser, hydrated, isAdmin, isAuthenticated, isLoginPage, router])

  if (isLoginPage) return <>{children}</>

  if (!hydrated || !isAuthenticated || !isAdmin) {
    return <LoadingSpinner label="Loading admin..." />
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden lg:block">
        <AdminNavbar />
      </aside>
      <div className="min-h-screen">
        <div className="border-b border-white/10 bg-[#111111] px-4 py-4 lg:hidden">
          <AdminNavbar />
        </div>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
