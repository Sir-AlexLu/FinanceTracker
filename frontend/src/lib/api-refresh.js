// src/lib/api-refresh.js
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL

class APIClient {
  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })

    this.refreshTokenPromise = null

    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('finance-tracker-token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config
        
        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true
          
          try {
            // Try to refresh token
            const newToken = await this.refreshToken()
            if (newToken) {
              localStorage.setItem('finance-tracker-token', newToken)
              originalRequest.headers.Authorization = `Bearer ${newToken}`
              return this.client(originalRequest)
            }
          } catch (refreshError) {
            // Refresh failed, logout
            localStorage.removeItem('finance-tracker-token')
            localStorage.removeItem('finance-tracker-user')
            window.location.href = '/login'
            return Promise.reject(refreshError)
          }
        }
        
        return Promise.reject(error)
      }
    )
  }

  async refreshToken() {
    // If a refresh is already in progress, return that promise
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise
    }

    this.refreshTokenPromise = (async () => {
      try {
        const refreshToken = localStorage.getItem('finance-tracker-refresh-token')
        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        const response = await this.client.post('/auth/refresh', { refreshToken })
        
        if (response.data.success) {
          const { token } = response.data.data
          localStorage.setItem('finance-tracker-token', token)
          return token
        }
        
        throw new Error('Refresh failed')
      } catch (error) {
        console.error('Token refresh failed:', error)
        throw error
      } finally {
        this.refreshTokenPromise = null
      }
    })()

    return this.refreshTokenPromise
  }

  async request(config) {
    try {
      const response = await this.client(config)
      return {
        success: true,
        data: response.data.data || null,
        message: response.data.message || 'Success',
      }
    } catch (error) {
      console.error('API Error:', error.message)
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || error.message,
      }
    }
  }
}

const apiClient = new APIClient()

// Export wrapped API methods
export const authAPI = {
  register: (data) => apiClient.request({ method: 'POST', url: '/auth/register', data }),
  login: (data) => apiClient.request({ method: 'POST', url: '/auth/login', data }),
  getMe: () => apiClient.request({ method: 'GET', url: '/auth/me' }),
  refresh: () => apiClient.request({ method: 'POST', url: '/auth/refresh' }),
}

export const accountsAPI = {
  getAll: () => apiClient.request({ method: 'GET', url: '/accounts' }),
  create: (data) => apiClient.request({ method: 'POST', url: '/accounts', data }),
  update: (id, data) => apiClient.request({ method: 'PUT', url: `/accounts/${id}`, data }),
  delete: (id) => apiClient.request({ method: 'DELETE', url: `/accounts/${id}` }),
}

export const transactionsAPI = {
  getAll: (params) => apiClient.request({ method: 'GET', url: '/transactions', params }),
  create: (data) => apiClient.request({ method: 'POST', url: '/transactions', data }),
  update: (id, data) => apiClient.request({ method: 'PUT', url: `/transactions/${id}`, data }),
  delete: (id) => apiClient.request({ method: 'DELETE', url: `/transactions/${id}` }),
  getAnalytics: (params) => apiClient.request({ method: 'GET', url: '/transactions/analytics', params }),
}
