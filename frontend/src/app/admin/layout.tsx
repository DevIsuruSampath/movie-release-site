'use client'

import { useEffect, useRef, useState } from 'react'
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
  const accessToken = useAuthStore((state) => state.accessToken)
  const fetchCurrentUser = useAuthStore((state) => state.fetchCurrentUser)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const fetchedAccessTokenRef = useRef<string | null>(null)

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
    const authFetchKey = accessToken || '__cookie_refresh__'
    if (isAuthenticated && isAdmin && fetchedAccessTokenRef.current !== authFetchKey) {
      fetchedAccessTokenRef.current = authFetchKey
      void fetchCurrentUser()
    }
    if (isAuthenticated && isAdmin && isLoginPage) {
      router.replace('/admin')
    }
    if (!isAuthenticated) {
      fetchedAccessTokenRef.current = null
    }
  }, [accessToken, fetchCurrentUser, hydrated, isAdmin, isAuthenticated, isLoginPage, router])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  if (isLoginPage) return <>{children}</>

  if (!hydrated || !isAuthenticated || !isAdmin) {
    return <LoadingSpinner label="Loading admin..." />
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="hidden lg:sticky lg:top-0 lg:block lg:h-screen">
        <AdminNavbar />
      </aside>
      <div className="min-h-screen">
        <div className="sticky top-0 z-40 border-b border-white/10 bg-[#111111]/95 px-4 py-4 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-lg font-semibold leading-tight text-white">MovieHub Admin</div>
              <div className="mt-1 text-sm text-gray-400">Manage movies, media, and publishing</div>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((current) => !current)}
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white active:scale-[0.98]"
              aria-label="Toggle admin menu"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
              </svg>
            </button>
          </div>
        </div>
        {mobileMenuOpen ? (
          <div className="fixed inset-0 z-50 bg-black/70 lg:hidden" onClick={() => setMobileMenuOpen(false)}>
            <div className="h-full w-[300px] max-w-[85vw]" onClick={(event) => event.stopPropagation()}>
              <AdminNavbar mobile onNavigate={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        ) : null}
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  )
}
