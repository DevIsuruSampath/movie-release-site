'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth'

const links = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/movies', label: 'Movies' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/tags', label: 'Tags' },
  { href: '/admin/telegram', label: 'Telegram' },
  { href: '/admin/uploads', label: 'Uploads' },
  { href: '/admin/activity', label: 'Activity' },
]

export default function AdminNavbar({
  mobile = false,
  onNavigate,
}: {
  mobile?: boolean
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const logout = useAuthStore((state) => state.logout)

  return (
    <div className={cn('flex h-full flex-col bg-[#111111]', mobile ? '' : 'border-r border-white/10')}>
      <div className="border-b border-white/10 px-5 py-5">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e50914] text-white">
            <span className="text-lg font-bold">M</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-white">MovieHub</div>
            <div className="text-xs text-gray-400">Admin Console</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`)
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={cn(
                'block rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-[#e50914]/15 text-[#ff676f]'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              )}
            >
              {link.label}
            </Link>
          )
        })}
      </nav>

      <div className="space-y-3 border-t border-white/10 p-4">
        <Link href="/" onClick={onNavigate} className="block rounded-xl px-3 py-2 text-sm text-gray-400 hover:bg-white/5 hover:text-white">
          View Site
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => {
            logout()
            onNavigate?.()
            router.replace('/admin/login')
          }}
        >
          Logout
        </Button>
      </div>
    </div>
  )
}
