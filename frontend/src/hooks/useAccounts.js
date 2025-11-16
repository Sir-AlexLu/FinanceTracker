// src/hooks/useAccounts.js
import { useState, useCallback } from 'react'
import { accountsAPI } from '@/lib/api-safe'
import { toast } from '@/hooks/useToast'

export function useAccounts() {
  const [accounts, setAccounts] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadAccounts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    const response = await accountsAPI.getAll()
    
    if (response.success) {
      setAccounts(response.data.accounts || [])
    } else {
      setError(response.error)
      toast.error(response.error)
    }
    
    setIsLoading(false)
    return response
  }, [])

  const createAccount = useCallback(async (data) => {
    setIsLoading(true)
    const response = await accountsAPI.create(data)
    
    if (response.success) {
      toast.success('Account created')
      await loadAccounts()
    } else {
      toast.error(response.error)
    }
    
    setIsLoading(false)
    return response
  }, [loadAccounts])

  const updateAccount = useCallback(async (id, data) => {
    setIsLoading(true)
    const response = await accountsAPI.update(id, data)
    
    if (response.success) {
      toast.success('Account updated')
      await loadAccounts()
    } else {
      toast.error(response.error)
    }
    
    setIsLoading(false)
    return response
  }, [loadAccounts])

  const deleteAccount = useCallback(async (id) => {
    const response = await accountsAPI.delete(id)
    
    if (response.success) {
      toast.success('Account deleted')
      setAccounts(prev => prev.filter(a => (a._id || a.id) !== id))
    } else {
      toast.error(response.error)
    }
    
    return response
  }, [])

  return {
    accounts,
    isLoading,
    error,
    loadAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
  }
}


