'use client'

import { useEffect, useState } from 'react'
import { transactionsAPI, accountsAPI } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, ArrowUpCircle, ArrowDownCircle, ArrowRightLeft, Filter, Search } from 'lucide-react'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([])
  const [accounts, setAccounts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showTransferForm, setShowTransferForm] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const [formData, setFormData] = useState({
    accountId: '',
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  })

  const [transferData, setTransferData] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [transactionsRes, accountsRes] = await Promise.all([
        transactionsAPI.getAll(),
        accountsAPI.getAll(),
      ])

      if (transactionsRes.data.success) {
        setTransactions(transactionsRes.data.data.transactions)
      }
      if (accountsRes.data.success) {
        setAccounts(accountsRes.data.data.accounts)
        if (accountsRes.data.data.accounts.length > 0) {
          setFormData(prev => ({ ...prev, accountId: accountsRes.data.data.accounts[0]._id || accountsRes.data.data.accounts[0].id }))
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await transactionsAPI.create(formData)
      if (response.data.success) {
        await fetchData()
        setShowCreateForm(false)
        setFormData({
          accountId: accounts[0]?._id || accounts[0]?.id || '',
          type: 'expense',
          amount: '',
          category: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
        })
      }
    } catch (error) {
      console.error('Error creating transaction:', error)
      alert(error.response?.data?.message || 'Failed to create transaction')
    }
  }

  const handleTransfer = async (e) => {
    e.preventDefault()
    try {
      const response = await transactionsAPI.transfer(transferData)
      if (response.data.success) {
        await fetchData()
        setShowTransferForm(false)
        setTransferData({
          fromAccountId: '',
          toAccountId: '',
          amount: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
        })
      }
    } catch (error) {
      console.error('Error creating transfer:', error)
      alert(error.response?.data?.message || 'Failed to create transfer')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return

    try {
      await transactionsAPI.delete(id)
      setTransactions(transactions.filter(t => (t._id || t.id) !== id))
    } catch (error) {
      console.error('Error deleting transaction:', error)
      alert('Failed to delete transaction')
    }
  }

  const filteredTransactions = transactions.filter(t => {
    const matchesType = filterType === 'all' || t.type === filterType
    const matchesSearch = t.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.description?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesType && matchesSearch
  })

  const incomeCategories = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other Income']
  const expenseCategories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Other']

  if (isLoading) {
    return <div className="text-center py-8">Loading transactions...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowTransferForm(!showTransferForm)}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            <ArrowRightLeft className="h-5 w-5" />
            Transfer
          </button>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            New Transaction
          </button>
        </div>
      </div>

      {/* Create Transaction Form */}
      {showCreateForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">New Transaction</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account *
                </label>
                <select
                  required
                  value={formData.accountId}
                  onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Account</option>
                  {accounts.map((acc) => (
                    <option key={acc._id || acc.id} value={acc._id || acc.id}>
                      {acc.name} ({formatCurrency(acc.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type *
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value, category: '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Category</option>
                  {(formData.type === 'income' ? incomeCategories : expenseCategories).map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional description..."
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Create Transaction
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

      {/* Transfer Form */}
      {showTransferForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Transfer Between Accounts</h2>
          <form onSubmit={handleTransfer} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Account *
                </label>
                <select
                  required
                  value={transferData.fromAccountId}
                  onChange={(e) => setTransferData({ ...transferData, fromAccountId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Account</option>
                  {accounts.map((acc) => (
                    <option key={acc._id || acc.id} value={acc._id || acc.id}>
                      {acc.name} ({formatCurrency(acc.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To Account *
                </label>
                <select
                  required
                  value={transferData.toAccountId}
                  onChange={(e) => setTransferData({ ...transferData, toAccountId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Account</option>
                  {accounts.filter(acc => (acc._id || acc.id) !== transferData.fromAccountId).map((acc) => (
                    <option key={acc._id || acc.id} value={acc._id || acc.id}>
                      {acc.name} ({formatCurrency(acc.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={transferData.amount}
                  onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={transferData.date}
                  onChange={(e) => setTransferData({ ...transferData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <input
                type="text"
                value={transferData.description}
                onChange={(e) => setTransferData({ ...transferData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Optional description..."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
              >
                Transfer Funds
              </button>
              <button
                type="button"
                onClick={() => setShowTransferForm(false)}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filter:</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('income')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === 'income' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Income
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === 'expense' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Expenses
            </button>
            <button
              onClick={() => setFilterType('transfer')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === 'transfer' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Transfers
            </button>
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search transactions..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">No transactions found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTransactions.map((transaction) => {
              const account = accounts.find(a => (a._id || a.id) === transaction.accountId)
              const toAccount = transaction.toAccountId ? accounts.find(a => (a._id || a.id) === transaction.toAccountId) : null
              
              return (
                <div key={transaction._id || transaction.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'income' ? 'bg-green-100' :
                        transaction.type === 'expense' ? 'bg-red-100' : 'bg-purple-100'
                      }`}>
                        {transaction.type === 'income' ? (
                          <ArrowUpCircle className="h-5 w-5 text-green-600" />
                        ) : transaction.type === 'expense' ? (
                          <ArrowDownCircle className="h-5 w-5 text-red-600" />
                        ) : (
                          <ArrowRightLeft className="h-5 w-5 text-purple-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{transaction.category}</p>
                        <p className="text-sm text-gray-500">
                          {account?.name}
                          {transaction.type === 'transfer' && toAccount && ` → ${toAccount.name}`}
                        </p>
                        {transaction.description && (
                          <p className="text-sm text-gray-500">{transaction.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-lg ${
                        transaction.type === 'income' ? 'text-green-600' :
                        transaction.type === 'expense' ? 'text-red-600' : 'text-purple-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}
                        {formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-sm text-gray-500">{formatDate(transaction.date)}</p>
                      <button
                        onClick={() => handleDelete(transaction._id || transaction.id)}
                        className="text-xs text-red-600 hover:underline mt-1"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
              }
