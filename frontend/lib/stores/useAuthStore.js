// File: FinanceTracker/frontend/lib/stores/useAuthStore.js
import { create } from 'zustand'
import { authApi } from '../api/auth'

const useAuthStore = create((set, get) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,

  login: async (credentials) => {
    set({ isLoading: true })
    try {
      const response = await authApi.login(credentials)
      set({ 
        user: response.data.user, 
        isAuthenticated: true,
        isLoading: false 
      })
      return response
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  register: async (data) => {
    set({ isLoading: true })
    try {
      const response = await authApi.register(data)
      set({ 
        user: response.data.user, 
        isAuthenticated: true,
        isLoading: false 
      })
      return response
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  logout: async () => {
    try {
      await authApi.logout()
      set({ user: null, isAuthenticated: false })
    } catch (error) {
      console.error('Logout error:', error)
    }
  },

  checkAuth: async () => {
    try {
      const response = await authApi.getMe()
      set({ 
        user: response.data.user, 
        isAuthenticated: true 
      })
      return true
    } catch (error) {
      set({ user: null, isAuthenticated: false })
      return false
    }
  },
}))

export default useAuthStore
