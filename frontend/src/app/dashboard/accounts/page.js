'use client'

import { useEffect, useState } from 'react'
import { accountsAPI } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { Plus, Wallet, Trash2, Edit2 } from 'lucide-react'

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'cash',
    balance: '',
    currency: 'USD',
    description: '',
  })

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      const response = await accountsAPI.getAll()
      if (response.data.success) {
        setAccounts(response.data.data.accounts)
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await accountsAPI.create(formData)
      if (response.data.success) {
        setAccounts([...accounts, response.data.data.account])
        setShowCreateForm(false)
        setFormData({
          name: '',
          type: 'cash',
          balance: '',
          currency: 'USD',
          description: '',
        })
      }
    } catch (error) {
      console.error('Error creating account:', error)
      alert(error.response?.data?.message || 'Failed to create account')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this account?')) return

    try {
      await accountsAPI.delete(id)
      setAccounts(accounts.filter(acc => (acc._id || acc.id) !== id))
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('Failed to delete account')
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading accounts...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Accounts</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          New Account
        </button>
      </div>

      {/* Create Account Form */}
      {showCreateForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="My Savings Account"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Type *
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank</option>
                  <option value="investment">Investment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Initial Balance
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <input
                  type="text"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="USD"
                  maxLength="3"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="2"
                placeholder="Optional description..."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Accounts Grid */}
      {accounts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No accounts yet. Create your first account to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => (
            <div 
              key={account._id || account.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  account.type === 'cash' ? 'bg-green-100' :
                  account.type === 'bank' ? 'bg-blue-100' : 'bg-purple-100'
                }`}>
                  <Wallet className={`h-6 w-6 ${
                    account.type === 'cash' ? 'text-green-600' :
                    account.type === 'bank' ? 'text-blue-600' : 'text-purple-600'
                  }`} />
                </div>
                <button
                  onClick={() => handleDelete(account._id || account.id)}
                  className="text-red-600 hover:bg-red-50 p-2 rounded-lg"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-1">{account.name}</h3>
              <p className="text-sm text-gray-500 capitalize mb-4">{account.type}</p>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-600 mb-1">Balance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(account.balance)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{account.currency}</p>
              </div>

              {account.description && (
                <p className="text-sm text-gray-600 mt-4">{account.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
        }
