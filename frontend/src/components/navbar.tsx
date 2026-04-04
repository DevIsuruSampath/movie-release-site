'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Button } from '@/components/ui/button'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/movies', label: 'Movies' },
  { href: '/categories', label: 'Categories' },
  { href: '/search', label: 'Search' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    handleScroll()
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    document.body.classList.toggle('mobile-menu-open', isMobileMenuOpen)
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : ''

    return () => {
      document.body.classList.remove('mobile-menu-open')
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileMenuOpen(false)
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  return (
    <>
      <nav
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'border-b border-white/10 bg-[#07080d]/82 shadow-[0_14px_50px_rgba(0,0,0,0.32)] backdrop-blur-2xl'
            : 'bg-gradient-to-b from-[#07080d]/92 via-[#07080d]/55 to-transparent'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4 md:h-20">
            <Link href="/" className="group flex items-center gap-3" aria-label="MovieHub home">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[linear-gradient(135deg,#ff4655,#b20710)] text-white shadow-[0_14px_34px_rgba(229,9,20,0.35)] transition-transform duration-300 group-hover:scale-105">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              </div>
              <div>
                <div className="text-base font-semibold tracking-[-0.03em] text-white sm:text-lg">
                  Movie<span className="text-[#ff6b72]">Hub</span>
                </div>
                <div className="hidden text-[11px] uppercase tracking-[0.24em] text-slate-400 sm:block">
                  Cinematic discovery
                </div>
              </div>
            </Link>

            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] p-1.5 backdrop-blur-xl md:flex">
              {navLinks.map((link) => {
                const active = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'bg-white text-[#11131a] shadow-[0_8px_24px_rgba(255,255,255,0.12)]'
                        : 'text-slate-300 hover:bg-white/8 hover:text-white'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </div>

            <div className="hidden items-center gap-3 md:flex">
              <Link href="/search">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-11 rounded-full border border-white/10 bg-white/[0.03] px-4 text-slate-200 hover:bg-white/10"
                  aria-label="Search movies"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-5.6-5.6m1.6-4.4a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search
                </Button>
              </Link>
              <Link href="/admin/login">
                <Button variant="outline" size="sm" className="h-11 rounded-full border-white/15 bg-white/[0.03] px-5 text-white hover:bg-white/10">
                  Admin
                </Button>
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((current) => !current)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white transition active:scale-[0.97] md:hidden"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <div
        className={`fixed inset-0 z-[60] transition ${isMobileMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'} md:hidden`}
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
        <div
          id="mobile-menu"
          className={`absolute inset-x-3 top-3 rounded-[28px] border border-white/10 bg-[#0b0d12]/96 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.4)] backdrop-blur-2xl transition duration-300 ${
            isMobileMenuOpen ? 'translate-y-0 scale-100' : '-translate-y-4 scale-[0.98]'
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <div className="text-lg font-semibold text-white">MovieHub</div>
              <div className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-400">Cinematic navigation</div>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white"
              aria-label="Close menu"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-2 py-4">
            {navLinks.map((link) => {
              const active = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex min-h-[52px] items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                    active
                      ? 'border-[#ff6b72]/40 bg-[#e50914]/16 text-[#ff7f86]'
                      : 'border-white/8 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06]'
                  }`}
                >
                  <span>{link.label}</span>
                  <svg className="h-4 w-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )
            })}
          </div>

          <div className="grid gap-3 border-t border-white/10 pt-4">
            <Link href="/search" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="ghost" className="h-12 w-full justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white hover:bg-white/10">
                Search catalog
              </Button>
            </Link>
            <Link href="/admin/login" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="outline" className="h-12 w-full justify-center rounded-2xl border-white/15 bg-white/[0.03] text-white hover:bg-white/10">
                Admin login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
