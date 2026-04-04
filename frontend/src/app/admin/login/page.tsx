'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
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
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null)

  useEffect(() => {
    if (hydrated && isAuthenticated && isAdmin) {
      router.replace('/admin')
    }
  }, [hydrated, isAdmin, isAuthenticated, router])

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    try {
      await login(email, password)
      router.replace('/admin')
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Login failed')
    }
  }, [email, password, login, router])

  const isFormValid = email.trim().length > 0 && password.trim().length > 0

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050608] px-4 py-8 sm:px-6 sm:py-10">
      {/* Ambient background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#e50914] opacity-[0.07] blur-[180px]" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-[#7c3aed] opacity-[0.04] blur-[150px]" />
        <div className="absolute right-0 top-0 h-[300px] w-[300px] rounded-full bg-[#e50914] opacity-[0.03] blur-[120px]" />
      </div>

      {/* Login card */}
      <div className="animate-scale-in relative w-full max-w-[440px]">
        <div className="rounded-[32px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 shadow-[0_32px_100px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-8">
          {/* Logo & heading */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-[linear-gradient(135deg,#ff4655,#b20710)] shadow-[0_18px_44px_rgba(229,9,20,0.35)] transition-transform duration-300 hover:scale-105">
              <svg className="h-7 w-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-[-0.03em] text-white sm:text-3xl">Welcome back</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">Sign in to manage your catalog, media, and publishing workflow.</p>
          </div>

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Email field */}
            <div className="space-y-2">
              <label htmlFor="login-email" className="block text-sm font-medium text-slate-200">
                Email
              </label>
              <div className={`group relative flex items-center rounded-2xl border transition-all duration-200 ${focusedField === 'email' ? 'border-[#ff676f]/60 ring-4 ring-[#e50914]/12 bg-[#11151d]' : 'border-white/10 bg-[#11151d] hover:border-white/15'}`}>
                <span className={`flex h-12 w-12 flex-shrink-0 items-center justify-center transition-colors duration-200 ${focusedField === 'email' ? 'text-[#ff676f]' : 'text-slate-500'}`}>
                  <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </span>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="you@example.com"
                  className="h-12 w-full bg-transparent pr-4 text-base text-white placeholder:text-slate-500 focus:outline-none"
                  autoComplete="email"
                  required
                  style={{ caretColor: '#ffffff' }}
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <label htmlFor="login-password" className="block text-sm font-medium text-slate-200">
                Password
              </label>
              <div className={`group relative flex items-center rounded-2xl border transition-all duration-200 ${focusedField === 'password' ? 'border-[#ff676f]/60 ring-4 ring-[#e50914]/12 bg-[#11151d]' : 'border-white/10 bg-[#11151d] hover:border-white/15'}`}>
                <span className={`flex h-12 w-12 flex-shrink-0 items-center justify-center transition-colors duration-200 ${focusedField === 'password' ? 'text-[#ff676f]' : 'text-slate-500'}`}>
                  <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter your password"
                  className="h-12 w-full bg-transparent pr-12 text-base text-white placeholder:text-slate-500 focus:outline-none"
                  autoComplete="current-password"
                  required
                  style={{ caretColor: '#ffffff' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-1 flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-all duration-200 hover:bg-white/5 hover:text-white active:scale-90"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    /* Eye-off icon */
                    <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    /* Eye icon */
                    <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error ? (
              <div className="animate-slide-up flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/8 px-4 py-3.5 text-sm leading-6 text-red-300">
                <svg className="h-4 w-4 flex-shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                {error}
              </div>
            ) : null}

            {/* Submit button */}
            <Button
              type="submit"
              disabled={loading || !isFormValid}
              className={`group relative h-13 w-full overflow-hidden rounded-2xl text-base font-semibold transition-all duration-300 active:scale-[0.98] ${isFormValid && !loading ? 'bg-[#e50914] shadow-[0_18px_44px_rgba(229,9,20,0.32)] hover:bg-[#b20710] hover:shadow-[0_22px_52px_rgba(229,9,20,0.38)]' : 'bg-[#e50914]/40 cursor-not-allowed'}`}
            >
              <span className="relative z-10 flex items-center justify-center gap-2.5">
                {loading ? (
                  <>
                    <svg className="h-4.5 w-4.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign In
                    <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </>
                )}
              </span>
              {/* Shimmer sweep on hover */}
              {isFormValid && !loading ? (
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              ) : null}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 border-t border-white/[0.06] pt-6 text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              Secured with encrypted authentication
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
