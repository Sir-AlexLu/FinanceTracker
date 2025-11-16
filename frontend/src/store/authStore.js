import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { toast } from '@/hooks/useToast'

const STORAGE_KEYS = {
  TOKEN: 'finance-tracker-token',
  USER: 'finance-tracker-user',
  THEME: 'finance-tracker-theme'
}

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      theme: 'light',

      // Initialize auth from localStorage (fixes refresh issues)
      initialize: () => {
        if (typeof window === 'undefined') return
        
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
        const userStr = localStorage.getItem(STORAGE_KEYS.USER)
        const theme = localStorage.getItem(STORAGE_KEYS.THEME) || 'light'
        
        if (token && userStr) {
          try {
            const user = JSON.parse(userStr)
            set({ 
              user, 
              token, 
              isAuthenticated: true,
              theme
            })
            // Optional: Validate token with backend
            get().validateToken()
          } catch (error) {
            console.error('Failed to parse stored user:', error)
            get().clearAuth()
          }
        }
      },

      // Validate token with backend
      validateToken: async () => {
        const { token } = get()
        if (!token) return false

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            if (data.success) {
              set({ user: data.data.user, isAuthenticated: true })
              return true
            }
          }
          throw new Error('Token invalid')
        } catch (error) {
          console.error('Token validation failed:', error)
          get().clearAuth()
          return false
        }
      },

      setAuth: (user, token) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.TOKEN, token)
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
        }
        set({ user, token, isAuthenticated: true })
      },

      logout: () => {
        get().clearAuth()
        toast.success('Logged out successfully')
      },

      clearAuth: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(STORAGE_KEYS.TOKEN)
          localStorage.removeItem(STORAGE_KEYS.USER)
        }
        set({ user: null, token: null, isAuthenticated: false, isLoading: false })
      },

      setTheme: (theme) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.THEME, theme)
        }
        set({ theme })
        document.documentElement.classList.toggle('dark', theme === 'dark')
      },

      fetchUser: async () => {
        set({ isLoading: true })
        try {
          const isValid = await get().validateToken()
          if (!isValid) {
            // Token invalid, user will be redirected by layout
          }
        } catch (error) {
          console.error('Error fetching user:', error)
          toast.error('Session expired. Please login again.')
          get().clearAuth()
        } finally {
          set({ isLoading: false })
        }
      },
    }),
    {
      name: 'finance-tracker-auth',
      // Don't persist these to localStorage
      partialize: (state) => ({
        theme: state.theme,
      }),
    }
  )
)

// Auto-initialize on store creation
if (typeof window !== 'undefined') {
  useAuthStore.getState().initialize()
}

export default useAuthStore
