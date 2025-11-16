'use client'

import { useEffect, useState } from 'react'
import { accountsAPI, transactionsAPI } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { Wallet, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react'

export default function DashboardPage() {
  const [accounts, setAccounts] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [accountsRes, analyticsRes] = await Promise.all([
        accountsAPI.getAll(),
        transactionsAPI.getAnalytics(),
      ])

      if (accountsRes.data.success) {
        setAccounts(accountsRes.data.data.accounts)
      }
      if (analyticsRes.data.success) {
        setAnalytics(analyticsRes.data.data)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Balance */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Total Balance</p>
            <Wallet className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(totalBalance)}
          </p>
          <p className="text-xs text-gray-500 mt-1">{accounts.length} accounts</p>
        </div>

        {/* Total Income */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Total Income</p>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600">
            {analytics ? formatCurrency(analytics.totalIncome) : '$0.00'}
          </p>
          <p className="text-xs text-gray-500 mt-1">This period</p>
        </div>

        {/* Total Expenses */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Total Expenses</p>
            <TrendingDown className="h-5 w-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-600">
            {analytics ? formatCurrency(analytics.totalExpense) : '$0.00'}
          </p>
          <p className="text-xs text-gray-500 mt-1">This period</p>
        </div>

        {/* Net Savings */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Net Savings</p>
            <ArrowRightLeft className="h-5 w-5 text-purple-600" />
          </div>
          <p className={`text-2xl font-bold ${analytics && parseFloat(analytics.netSavings) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {analytics ? formatCurrency(analytics.netSavings) : '$0.00'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Income - Expenses</p>
        </div>
      </div>

      {/* Accounts List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Your Accounts</h2>
        
        {accounts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No accounts yet. Create your first account!</p>
            <a 
              href="/dashboard/accounts"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Create Account
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div 
                key={account._id || account.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    account.type === 'cash' ? 'bg-green-100' :
                    account.type === 'bank' ? 'bg-blue-100' : 'bg-purple-100'
                  }`}>
                    <Wallet className={`h-5 w-5 ${
                      account.type === 'cash' ? 'text-green-600' :
                      account.type === 'bank' ? 'text-blue-600' : 'text-purple-600'
                    }`} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{account.name}</p>
                    <p className="text-sm text-gray-500 capitalize">{account.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatCurrency(account.balance)}</p>
                  <p className="text-sm text-gray-500">{account.currency}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
