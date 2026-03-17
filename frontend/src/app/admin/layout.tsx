'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth'
import { useEffect } from 'react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { isAuthenticated, logout } = useAuthStore()

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && pathname !== '/admin/login') {
      window.location.href = '/admin/login'
    }
  }, [isAuthenticated, pathname])

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen bg-[#0a0a0a]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0f0f0f] border-r border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative w-8 h-8 flex items-center justify-center bg-[#e50914] rounded-lg">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-white">
              Movie<span className="text-[#e50914]">Hub</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <Link href="/admin">
            <Button
              variant={pathname === '/admin' ? 'secondary' : 'ghost'}
              className={`w-full justify-start ${
                pathname === '/admin'
                  ? 'bg-[#e50914]/20 text-[#e50914] hover:bg-[#e50914]/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </Button>
          </Link>

          <Link href="/admin/movies">
            <Button
              variant={pathname.startsWith('/admin/movies') ? 'secondary' : 'ghost'}
              className={`w-full justify-start ${
                pathname.startsWith('/admin/movies')
                  ? 'bg-[#e50914]/20 text-[#e50914] hover:bg-[#e50914]/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
              Movies
            </Button>
          </Link>

          <Link href="/categories">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-400 hover:text-white hover:bg-white/5"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Categories
            </Button>
          </Link>

          <Link href="/">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-400 hover:text-white hover:bg-white/5"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Site
            </Button>
          </Link>
        </nav>

        <div className="p-4 border-t border-white/10">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-400 hover:text-red-400 hover:bg-red-500/10"
            onClick={logout}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto custom-scrollbar">
        {children}
      </main>
    </div>
  )
}
