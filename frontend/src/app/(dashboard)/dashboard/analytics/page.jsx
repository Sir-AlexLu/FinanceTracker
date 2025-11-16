// src/app/(dashboard)/dashboard/analytics/page.jsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { transactionsAPI } from '@/lib/api-safe'
import { toast } from '@/hooks/useToast'
import { formatCurrency } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { 
  ChartBarIcon, CalendarIcon, TrendingUpIcon, TrendingDownIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'

const PERIODS = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
  { value: 'all', label: 'All Time' },
]

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [period, setPeriod] = useState('month')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [period])

  const loadAnalytics = async () => {
    setIsLoading(true)
    
    const params = {}
    const now = new Date()
    
    if (period !== 'all') {
      let startDate = new Date()
      switch (period) {
        case 'week':
          startDate.setDate(now.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(now.getMonth() - 1)
          break
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3)
          break
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1)
          break
      }
      params.startDate = startDate.toISOString()
    }

    const [analyticsRes, transactionsRes] = await Promise.allSettled([
      transactionsAPI.getAnalytics(params),
      transactionsAPI.getAll(params),
    ])

    if (analyticsRes.status === 'fulfilled' && analyticsRes.value.success) {
      setAnalytics(analyticsRes.value.data)
    } else {
      toast.error('Failed to load analytics')
    }

    if (transactionsRes.status === 'fulfilled' && transactionsRes.value.success) {
      setTransactions(transactionsRes.value.data.transactions || [])
    }

    setIsLoading(false)
  }

  // Prepare chart data
  const categoryData = useMemo(() => {
    if (!analytics?.categoryBreakdown) return []
    return Object.entries(analytics.categoryBreakdown).map(([name, value]) => ({
      name,
      value: parseFloat(value),
    }))
  }, [analytics])

  const trendData = useMemo(() => {
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
    return Object.values(monthlyData).slice(-6)
  }, [transactions])

  if (isLoading) {
    return <AnalyticsSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-display font-bold">Analytics</h1>
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <Button
              key={p.value}
              variant={period === p.value ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <SummaryCard
          title="Total Income"
          value={formatCurrency(analytics?.totalIncome || 0)}
          icon={TrendingUpIcon}
          iconClass="text-green-600 bg-green-100"
          trend="+12.5%"
        />
        <SummaryCard
          title="Total Expenses"
          value={formatCurrency(analytics?.totalExpense || 0)}
          icon={TrendingDownIcon}
          iconClass="text-red-600 bg-red-100"
          trend="-3.2%"
        />
        <SummaryCard
          title="Net Savings"
          value={formatCurrency(analytics?.netSavings || 0)}
          icon={ArrowPathIcon}
          iconClass={analytics?.netSavings >= 0 ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'}
          trend={analytics?.netSavings >= 0 ? '+8.7%' : '-2.1%'}
        />
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
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
              <EmptyState title="No expense data" description="Add some expenses to see the breakdown" />
            )}
          </CardContent>
        </Card>

        {/* Income vs Expenses Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Income vs Expenses Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No trend data" description="Add transactions over time to see trends" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Transactions"
          value={analytics?.transactionCount || 0}
          icon={ChartBarIcon}
          iconClass="text-blue-600 bg-blue-100"
        />
        <StatCard
          title="Avg Income"
          value={formatCurrency(analytics?.avgIncome || 0)}
          icon={CurrencyDollarIcon}
          iconClass="text-green-600 bg-green-100"
        />
        <StatCard
          title="Avg Expense"
          value={formatCurrency(analytics?.avgExpense || 0)}
          icon={CurrencyDollarIcon}
          iconClass="text-red-600 bg-red-100"
        />
        <StatCard
          title="Savings Rate"
          value={`${analytics?.savingsRate || 0}%`}
          icon={ArrowPathIcon}
          iconClass="text-purple-600 bg-purple-100"
        />
      </div>
    </div>
  )
}

function SummaryCard({ title, value, icon: Icon, iconClass, trend }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{title}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{value}</p>
            {trend && (
              <span className={`text-xs font-medium ${trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {trend}
              </span>
            )}
          </div>
          <div className={`p-3 rounded-2xl ${iconClass}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatCard({ title, value, icon: Icon, iconClass }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg ${iconClass}`}>
            <Icon className="h-5 w-5" />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">{title}</p>
        </div>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      </CardContent>
    </Card>
  )
}

function EmptyState({ title, description }) {
  return (
    <div className="h-[300px] flex flex-col items-center justify-center text-slate-500">
      <ChartBarIcon className="h-12 w-12 mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm">{description}</p>
    </div>
  )
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-48"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="h-[300px] bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
