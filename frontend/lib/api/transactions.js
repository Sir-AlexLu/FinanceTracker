// File: FinanceTracker/frontend/lib/api/transactions.js
import apiClient from './client'

export const transactionsApi = {
  create: (data) => apiClient.post('/api/transactions', data),
  
  getAll: (params) => apiClient.get('/api/transactions', { params }),
  
  getById: (id) => apiClient.get(`/api/transactions/${id}`),
  
  update: (id, data) => apiClient.patch(`/api/transactions/${id}`, data),
  
  delete: (id) => apiClient.delete(`/api/transactions/${id}`),
  
  getSummary: (params) => apiClient.get('/api/transactions/summary', { params }),
}
