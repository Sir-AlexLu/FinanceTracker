// File: FinanceTracker/frontend/lib/api/auth.js
import apiClient from './client'

export const authApi = {
  register: (data) => apiClient.post('/api/auth/register', data),
  login: (data) => apiClient.post('/api/auth/login', data),
  logout: () => apiClient.post('/api/auth/logout'),
  getMe: () => apiClient.get('/api/auth/me'),
}
