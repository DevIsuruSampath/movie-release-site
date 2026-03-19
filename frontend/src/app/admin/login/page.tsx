'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/auth'

export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated, isAdmin, hydrated, loading } = useAuthStore((state) => ({
    login: state.login,
    isAuthenticated: state.isAuthenticated,
    isAdmin: state.isAdmin,
    hydrated: state.hydrated,
    loading: state.loading,
  }))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (hydrated && isAuthenticated && isAdmin) {
      router.replace('/admin')
    }
  }, [hydrated, isAdmin, isAuthenticated, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#121212] p-8 shadow-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-white">Admin Login</h1>
          <p className="mt-2 text-sm text-gray-400">Sign in to manage the movie release site.</p>
        </div>
        <form
          className="space-y-4"
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
          <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <Input label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          {error ? <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div> : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  )
}
