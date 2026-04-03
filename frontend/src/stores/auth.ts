'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import api, { ApiError } from '@/lib/api'
import type { AuthResponse, User } from '@/types'

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  hydrated: boolean
  loading: boolean
  setHydrated: (value: boolean) => void
  setSession: (payload: AuthResponse) => void
  login: (email: string, password: string) => Promise<void>
  refresh: () => Promise<boolean>
  fetchCurrentUser: () => Promise<User | null>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isAdmin: false,
      hydrated: false,
      loading: false,

      setHydrated: (value) => set({ hydrated: value }),

      setSession: (payload) => {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('access_token', payload.access_token)
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        }
        set({
          user: payload.user,
          accessToken: payload.access_token,
          isAuthenticated: true,
          isAdmin: payload.user.is_admin || payload.user.is_superuser,
        })
      },

      login: async (email, password) => {
        set({ loading: true })
        try {
          const response = await api.login({ email, password })
          get().setSession(response)
        } catch (error) {
          throw error instanceof ApiError ? error : new Error('Login failed')
        } finally {
          set({ loading: false })
        }
      },

      refresh: async () => {
        try {
          const response = await api.refresh('')
          get().setSession(response)
          return true
        } catch {
          get().logout()
          return false
        }
      },

      fetchCurrentUser: async () => {
        try {
          const user = await api.me()
          set({
            user,
            isAuthenticated: true,
            isAdmin: user.is_admin || user.is_superuser,
          })
          return user
        } catch {
          const refreshed = await get().refresh()
          if (!refreshed) return null
          try {
            const user = await api.me()
            set({
              user,
              isAuthenticated: true,
              isAdmin: user.is_admin || user.is_superuser,
            })
            return user
          } catch {
            get().logout()
            return null
          }
        }
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('access_token')
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        }
        void api.logout().catch(() => undefined)
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isAdmin: false,
          loading: false,
        })
      },
    }),
    {
      name: 'admin-auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
      partialize: () => ({}),
    }
  )
)
