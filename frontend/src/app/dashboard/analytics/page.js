'use client'

import { useEffect, useState } from 'react'
import { transactionsAPI } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react'

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState('all')

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    setIsLoading(true)
    try {
      const params = {}
      const now = new Date()
      
      if (period === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        params.startDate = startOfMonth.toISOString()
      } else if (period === 'week') {
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
        params.startDate = startOfWeek.toISOString()
      } else if (period === 'year') {
        const startOfYear = new Date(now.getFullYear(), 0, 1)
        params.startDate = startOfYear.toISOString()
      }

      const [analyticsRes, transactionsRes] = await Promise.all([
        transactionsAPI.getAnalytics(params),
        transactionsAPI.getAll(params),
      ])

      if (analyticsRes.data.success) {
        setAnalytics(analyticsRes.data.data)
      }
      if (transactionsRes.data.success) {
        setTransactions(transactionsRes.data.data.transactions)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading analytics...</div>
  }

  // Prepare data for charts
  const categoryData = analytics?.categoryBreakdown ? 
    Object.entries(analytics.categoryBreakdown).map(([name, value]) => ({
      name,
      value: parseFloat(value),
    })) : []

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

  // Monthly trend data
  const monthlyData = {}
  transactions.forEach(t => {
    const month = new Date(t.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    if (!monthlyData[month]) {
      monthlyData[month] = { month, income: 0, expense: 0 }
    }
    if (t.type === 'income') {
      monthlyData[month].income += parseFloat(t.amount)
    } else if (t.type === 'expense') {
      monthlyData[month].expense += parseFloat(t.amount)
    }
  })
  const trendData = Object.values(monthlyData).slice(-6)

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('week')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              period === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              period === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setPeriod('year')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              period === 'year' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            This Year
          </button>
          <button
            onClick={() => setPeriod('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              period === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-green-100">Total Income</p>
            <TrendingUp className="h-6 w-6 text-green-100" />
          </div>
          <p className="text-3xl font-bold">
            {analytics ? formatCurrency(analytics.totalIncome) : '$0.00'}
          </p>
          <p className="text-sm text-green-100 mt-2">
            {period === 'all' ? 'All time' : `This ${period}`}
          </p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-red-100">Total Expenses</p>
            <TrendingDown className="h-6 w-6 text-red-100" />
          </div>
          <p className="text-3xl font-bold">
            {analytics ? formatCurrency(analytics.totalExpense) : '$0.00'}
          </p>
          <p className="text-sm text-red-100 mt-2">
            {period === 'all' ? 'All time' : `This ${period}`}
          </p>
        </div>

        <div className={`bg-gradient-to-br ${
          analytics && parseFloat(analytics.netSavings) >= 0 
            ? 'from-blue-500 to-blue-600' 
            : 'from-orange-500 to-orange-600'
        } rounded-xl shadow-lg p-6 text-white`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-white/90">Net Savings</p>
            <DollarSign className="h-6 w-6 text-white/90" />
          </div>
          <p className="text-3xl font-bold">
            {analytics ? formatCurrency(analytics.netSavings) : '$0.00'}
          </p>
          <p className="text-sm text-white/90 mt-2">
            Income - Expenses
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Expense by Category - Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Expenses by Category</h2>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No expense data available
            </div>
          )}
        </div>

        {/* Income vs Expenses - Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Income vs Expenses Trend</h2>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="income" fill="#10b981" name="Income" />
                <Bar dataKey="expense" fill="#ef4444" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No trend data available
            </div>
          )}
        </div>
      </div>

      {/* Category Breakdown Table */}
      {categoryData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Category Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Visual
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categoryData.map((category, index) => {
                  const percentage = (category.value / parseFloat(analytics.totalExpense)) * 100
                  return (
                    <tr key={category.name}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-3"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <div className="text-sm font-medium text-gray-900">{category.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(category.value)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{percentage.toFixed(1)}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <p className="text-sm font-medium text-gray-600">Total Transactions</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {analytics?.transactionCount || 0}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <p className="text-sm font-medium text-gray-600">Average Income</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {analytics && analytics.transactionCount > 0
              ? formatCurrency(parseFloat(analytics.totalIncome) / analytics.transactionCount)
              : '$0.00'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown className="h-5 w-5 text-red-600" />
            <p className="text-sm font-medium text-gray-600">Average Expense</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {analytics && analytics.transactionCount > 0
              ? formatCurrency(parseFloat(analytics.totalExpense) / analytics.transactionCount)
              : '$0.00'}
          </p>
        </div>
      </div>
    </div>
  )
              }
