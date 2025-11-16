'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { transactionsAPI } from '@/lib/api-safe'
import { toast } from '@/hooks/useToast'
import { formatCurrency } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { 
  BarChart3Icon, CalendarIcon, TrendingUpIcon, TrendingDownIcon,
  ArrowPathIcon, DollarSignIcon
} from 'lucide-react'
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
      params.startDate = startDate.toISOString().split('T')[0]
    }

    try {
      const [analyticsRes, transactionsRes] = await Promise.allSettled([
        transactionsAPI.getAnalytics(params),
        transactionsAPI.getAll({ ...params, limit: 100 }),
      ])

      if (analyticsRes.status === 'fulfilled' && analyticsRes.value.success) {
        setAnalytics(analyticsRes.value.data)
      } else {
        toast.error('Failed to load analytics')
        setAnalytics(null)
      }

      if (transactionsRes.status === 'fulfilled' && transactionsRes.value.success) {
        setTransactions(transactionsRes.value.data.transactions || [])
      } else {
        setTransactions([])
      }
    } catch (error) {
      console.error('Analytics load error:', error)
      toast.error('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  // Prepare chart data
  const categoryData = useMemo(() => {
    if (!analytics?.categoryBreakdown) return []
    return Object.entries(analytics.categoryBreakdown)
      .map(([name, value]) => ({
        name,
        value: parseFloat(value),
      }))
      .sort((a, b) => b.value - a.value)
  }, [analytics])

  const trendData = useMemo(() => {
    const monthlyData = {}
    transactions.forEach(t => {
      const date = new Date(t.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), income: 0, expense: 0 }
      }
      const amount = parseFloat(t.amount) || 0
      if (t.type === 'income') {
        monthlyData[monthKey].income += amount
      } else if (t.type === 'expense') {
        monthlyData[monthKey].expense += amount
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
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <h1 className="text-3xl font-display font-bold">Analytics</h1>
        <div className="flex flex-wrap gap-2">
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
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <SummaryCard
          title="Total Income"
          value={formatCurrency(analytics?.totalIncome || 0)}
          icon={TrendingUpIcon}
          iconClass="text-green-600 bg-green-100 dark:bg-green-900/20"
          trend="+12.5%"
        />
        <SummaryCard
          title="Total Expenses"
          value={formatCurrency(analytics?.totalExpense || 0)}
          icon={TrendingDownIcon}
          iconClass="text-red-600 bg-red-100 dark:bg-red-900/20"
          trend="-3.2%"
        />
        <SummaryCard
          title="Net Savings"
          value={formatCurrency(analytics?.netSavings || 0)}
          icon={ArrowPathIcon}
          iconClass={
            (analytics?.netSavings || 0) >= 0 
              ? 'text-green-600 bg-green-100 dark:bg-green-900/20' 
              : 'text-red-600 bg-red-100 dark:bg-red-900/20'
          }
          trend={(analytics?.netSavings || 0) >= 0 ? '+8.7%' : '-2.1%'}
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
                    innerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)} 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
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
                <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="income" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    dot={{ fill: '#10b981', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expense" 
                    stroke="#ef4444" 
                    strokeWidth={3} 
                    dot={{ fill: '#ef4444', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No trend data" description="Add transactions over time to see trends" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          title="Total Transactions"
          value={analytics?.transactionCount || 0}
          icon={BarChart3Icon}
          iconClass="text-blue-600 bg-blue-100 dark:bg-blue-900/20"
        />
        <StatCard
          title="Avg Income"
          value={formatCurrency(analytics?.avgIncome || 0)}
          icon={DollarSignIcon}
          iconClass="text-green-600 bg-green-100 dark:bg-green-900/20"
        />
        <StatCard
          title="Avg Expense"
          value={formatCurrency(analytics?.avgExpense || 0)}
          icon={DollarSignIcon}
          iconClass="text-red-600 bg-red-100 dark:bg-red-900/20"
        />
        <StatCard
          title="Savings Rate"
          value={`${(analytics?.savingsRate || 0).toFixed(1)}%`}
          icon={ArrowPathIcon}
          iconClass="text-purple-600 bg-purple-100 dark:bg-purple-900/20"
        />
      </motion.div>
    </div>
  )
}

/* Sub-components */
function SummaryCard({ title, value, icon: Icon, iconClass, trend }) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} className="transition-transform">
      <Card className="hover:shadow-md transition-shadow">
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
              <Icon className="h-6 w-6 text-current" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function StatCard({ title, value, icon: Icon, iconClass }) {
  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg ${iconClass}`}>
            <Icon className="h-5 w-5 text-current" />
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
    <div className="h-[300px] flex flex-col items-center justify-center text-center px-4">
      <div className="bg-slate-100 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mb-4">
        <BarChart3Icon className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">{description}</p>
    </div>
  )
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-48 animate-pulse"></div>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-9 w-20 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-40 animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="animate-pulse space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                </div>
                <div className="h-7 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
