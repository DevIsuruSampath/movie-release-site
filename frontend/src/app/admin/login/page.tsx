'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/auth'

export default function LoginPage() {
  const router = useRouter()
  const login = useAuthStore((state) => state.login)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isAdmin = useAuthStore((state) => state.isAdmin)
  const hydrated = useAuthStore((state) => state.hydrated)
  const loading = useAuthStore((state) => state.loading)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (hydrated && isAuthenticated && isAdmin) {
      router.replace('/admin')
    }
  }, [hydrated, isAdmin, isAuthenticated, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4 py-8 sm:px-6 sm:py-10">
      <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#121212] px-5 py-6 shadow-2xl shadow-black/40 sm:max-w-[460px] sm:px-8 sm:py-8 lg:max-w-[500px]">
        <div className="mb-6 sm:mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#ff676f]">MovieHub Admin</p>
          <h1 className="mt-3 text-[2rem] font-semibold leading-tight text-white sm:text-4xl">Admin Login</h1>
          <p className="mt-3 max-w-sm text-sm leading-6 text-gray-400 sm:text-base">
            Sign in to manage movies, uploads, publishing, and the public catalog.
          </p>
        </div>
        <form
          className="space-y-4 sm:space-y-5"
          onSubmit={async (event) => {
            event.preventDefault()
            setError('')
            try {
              await login(email, password)
              router.replace('/admin')
            } catch (loginError) {
              setError(loginError instanceof Error ? loginError.message : 'Login failed')
            }
          }}
        >
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-13 rounded-2xl px-4 text-base sm:h-12"
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-13 rounded-2xl px-4 text-base sm:h-12"
            autoComplete="current-password"
          />
          {error ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-300">
              {error}
            </div>
          ) : null}
          <Button type="submit" className="h-13 w-full rounded-2xl text-base font-semibold sm:h-12" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  )
}
