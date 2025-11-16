// src/hooks/useTransactions.js
import { useState, useCallback } from 'react'
import { transactionsAPI } from '@/lib/api-safe'
import { toast } from '@/hooks/useToast'

export function useTransactions() {
  const [transactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadTransactions = useCallback(async (params = {}) => {
    setIsLoading(true)
    setError(null)
    
    const response = await transactionsAPI.getAll(params)
    
    if (response.success) {
      setTransactions(response.data.transactions || [])
    } else {
      setError(response.error)
      toast.error(response.error)
    }
    
    setIsLoading(false)
    return response
  }, [])

  const createTransaction = useCallback(async (data) => {
    setIsLoading(true)
    const response = await transactionsAPI.create(data)
    
    if (response.success) {
      toast.success('Transaction created')
      await loadTransactions()
    } else {
      toast.error(response.error)
    }
    
    setIsLoading(false)
    return response
  }, [loadTransactions])

  const deleteTransaction = useCallback(async (id) => {
    const response = await transactionsAPI.delete(id)
    
    if (response.success) {
      toast.success('Transaction deleted')
      setTransactions(prev => prev.filter(t => (t._id || t.id) !== id))
    } else {
      toast.error(response.error)
    }
    
    return response
  }, [])

  return {
    transactions,
    isLoading,
    error,
    loadTransactions,
    createTransaction,
    deleteTransaction,
  }
}
