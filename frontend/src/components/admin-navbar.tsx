'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth'

const links = [
  { href: '/admin', label: 'Dashboard', icon: 'M3 13h18M3 7h10M3 19h14' },
  { href: '/admin/movies', label: 'Movies', icon: 'M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4' },
  { href: '/admin/categories', label: 'Categories', icon: 'M4 7h16M4 12h16M4 17h10' },
  { href: '/admin/tags', label: 'Tags', icon: 'M7 7h.01M7 3h6l8 8-6 6-8-8V3z' },
  { href: '/admin/storage', label: 'Storage', icon: 'M4 7h16v10H4zM4 11h16' },
  { href: '/admin/settings', label: 'Settings', icon: 'M10.325 4.317a1 1 0 011.35-.936l1.065.355a1 1 0 00.95-.156l.885-.662a1 1 0 011.41.12l.707.707a1 1 0 01.12 1.41l-.662.885a1 1 0 00-.156.95l.355 1.065a1 1 0 01-.936 1.35l-1.118.062a1 1 0 00-.84.488l-.61.94a1 1 0 01-1.7 0l-.61-.94a1 1 0 00-.84-.488l-1.118-.062a1 1 0 01-.936-1.35l.355-1.065a1 1 0 00-.156-.95l-.662-.885a1 1 0 01.12-1.41l.707-.707a1 1 0 011.41-.12l.885.662a1 1 0 00.95.156l1.065-.355z' },
  { href: '/admin/activity', label: 'Activity', icon: 'M3 12h4l3 8 4-16 3 8h4' },
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
    <div className={cn('flex h-full flex-col bg-[#0d0f14]', mobile ? 'border-r border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.38)]' : 'border-r border-white/10')}>
      <div className="border-b border-white/10 px-5 py-6">
        <Link href="/admin" className="flex items-center gap-3" onClick={onNavigate}>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[linear-gradient(135deg,#ff5a5f,#b20710)] text-white shadow-[0_16px_34px_rgba(229,9,20,0.32)]">
            <span className="text-lg font-bold">M</span>
          </div>
          <div>
            <div className="text-base font-semibold text-white">MovieHub</div>
            <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Admin console</div>
          </div>
        </Link>
      </div>

      <div className="px-4 pt-4">
        <div className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-4 text-sm text-slate-300 shadow-[0_18px_40px_rgba(0,0,0,0.2)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#ff7f86]">Publishing mode</div>
          <div className="mt-2 text-base font-medium text-white">Premium workflow</div>
          <p className="mt-2 leading-6 text-slate-400">Manage movies, media, and release flow with clearer navigation and stronger visual status cues.</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-3 py-5">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`)
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-sm font-medium transition-all active:scale-[0.99]',
                active
                  ? 'border-[#ff7f86]/35 bg-[#e50914]/14 text-[#ff7f86] shadow-[0_10px_24px_rgba(229,9,20,0.12)]'
                  : 'border-transparent text-slate-400 hover:border-white/8 hover:bg-white/[0.03] hover:text-white'
              )}
            >
              <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl border transition', active ? 'border-[#ff7f86]/25 bg-[#e50914]/18 text-[#ff7f86]' : 'border-white/8 bg-white/[0.03] text-slate-400')}>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={link.icon} />
                </svg>
              </span>
              <span>{link.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="space-y-3 border-t border-white/10 p-4">
        <Link href="/" onClick={onNavigate} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300 transition hover:bg-white/[0.06] hover:text-white">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 19l-7-7 7-7" />
          </svg>
          View site
        </Link>
        <Button
          variant="ghost"
          className="h-12 w-full justify-start rounded-2xl border border-white/8 bg-white/[0.03] px-4 text-sm text-white hover:bg-white/[0.06]"
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
