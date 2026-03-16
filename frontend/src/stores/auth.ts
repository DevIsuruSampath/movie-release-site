import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, TokenResponse } from '@/types'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  setTokens: (tokens: TokenResponse) => void
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isAdmin: false,

      login: async (email: string, password: string) => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          })
          const data = await response.json()
          
          set({
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            isAuthenticated: true,
            isAdmin: data.is_superuser || false,
          })
          
          localStorage.setItem('access_token', data.access_token)
          localStorage.setItem('refresh_token', data.refresh_token)
        } catch (error) {
          console.error('Login failed:', error)
          throw error
        }
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isAdmin: false,
        })
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      },

      setTokens: (tokens: TokenResponse) => {
        set({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          isAuthenticated: true,
        })
        localStorage.setItem('access_token', tokens.access_token)
        localStorage.setItem('refresh_token', tokens.refresh_token)
      },

      setUser: (user: User) => {
        set({
          user,
          isAdmin: user.is_superuser,
          isAuthenticated: true,
        })
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)
