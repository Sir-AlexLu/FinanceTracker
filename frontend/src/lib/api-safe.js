import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, // 10 second timeout
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('finance-tracker-token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor with retry logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error
    
    // Handle network errors
    if (!response) {
      console.error('Network error:', error.message)
      return Promise.reject(new Error('Network error. Please check your connection.'))
    }

    // Handle 401 Unauthorized
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('finance-tracker-token')
        localStorage.removeItem('finance-tracker-user')
        window.location.href = '/login'
      }
      return Promise.reject(new Error('Session expired. Please login again.'))
    }

    // Handle 422 Validation errors
    if (response.status === 422) {
      const message = Object.values(response.data?.errors || {})
        .flat()
        .join(', ') || 'Validation failed'
      return Promise.reject(new Error(message))
    }

    // Handle 500+ errors
    if (response.status >= 500) {
      return Promise.reject(new Error('Server error. Please try again later.'))
    }

    return Promise.reject(error)
  }
)

// Safe API wrapper
const safeAPI = async (apiCall) => {
  try {
    const response = await apiCall()
    
    // Validate response structure
    if (!response?.data || typeof response.data.success === 'undefined') {
      throw new Error('Invalid response format from server')
    }
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Request failed')
    }
    
    return {
      success: true,
      data: response.data.data || null,
      message: response.data.message || 'Success'
    }
  } catch (error) {
    console.error('API Error:', error.message)
    return {
      success: false,
      data: null,
      error: error.response?.data?.message || error.message
    }
  }
}

// Auth API
export const authAPI = {
  register: (data) => safeAPI(() => api.post('/auth/register', data)),
  login: (data) => safeAPI(() => api.post('/auth/login', data)),
  getMe: () => safeAPI(() => api.get('/auth/me')),
}

// Accounts API
export const accountsAPI = {
  getAll: () => safeAPI(() => api.get('/accounts')),
  getOne: (id) => safeAPI(() => api.get(`/accounts/${id}`)),
  create: (data) => safeAPI(() => api.post('/accounts', data)),
  update: (id, data) => safeAPI(() => api.put(`/accounts/${id}`, data)),
  delete: (id) => safeAPI(() => api.delete(`/accounts/${id}`)),
  getBalance: (id) => safeAPI(() => api.get(`/accounts/${id}/balance`)),
}

// Transactions API
export const transactionsAPI = {
  getAll: (params = {}) => safeAPI(() => api.get('/transactions', { params })),
  getOne: (id) => safeAPI(() => api.get(`/transactions/${id}`)),
  create: (data) => safeAPI(() => api.post('/transactions', data)),
  transfer: (data) => safeAPI(() => api.post('/transactions/transfer', data)),
  update: (id, data) => safeAPI(() => api.put(`/transactions/${id}`, data)),
  delete: (id) => safeAPI(() => api.delete(`/transactions/${id}`)),
  getAnalytics: (params = {}) => safeAPI(() => api.get('/transactions/analytics', { params })),
}

export default api
