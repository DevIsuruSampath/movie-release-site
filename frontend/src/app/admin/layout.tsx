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
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold">Movie Admin</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin">
            <Button variant={pathname === '/admin' ? 'secondary' : 'ghost'} className="w-full justify-start">
              Dashboard
            </Button>
          </Link>
          
          <Link href="/admin/movies">
            <Button variant={pathname.startsWith('/admin/movies') ? 'secondary' : 'ghost'} className="w-full justify-start">
              Movies
            </Button>
          </Link>
          
          <Link href="/admin/categories">
            <Button variant={pathname === '/admin/categories' ? 'secondary' : 'ghost'} className="w-full justify-start">
              Categories
            </Button>
          </Link>
          
          <Link href="/admin/media">
            <Button variant={pathname === '/admin/media' ? 'secondary' : 'ghost'} className="w-full justify-start">
              Media Library
            </Button>
          </Link>
          
          <Link href="/admin/settings">
            <Button variant={pathname === '/admin/settings' ? 'secondary' : 'ghost'} className="w-full justify-start">
              Settings
            </Button>
          </Link>
        </nav>
        
        <div className="p-4 border-t border-gray-200">
          <Button variant="ghost" className="w-full justify-start" onClick={logout}>
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
