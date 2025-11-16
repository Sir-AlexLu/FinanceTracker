// File: FinanceTracker/frontend/app/(dashboard)/dashboard/page.js
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { transactionsApi } from '@/lib/api/transactions'
import useAuthStore from '@/lib/stores/useAuthStore'
import { formatCurrency, formatDate, getMonthName } from '@/lib/utils'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Plus,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1']

export default function DashboardPage() {
  const router = useRouter()
  const { checkAuth } = useAuthStore()
  const [summary, setSummary] = useState(null)
  const [recentTransactions, setRecentTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const isAuth = await checkAuth()
      if (!isAuth) {
        router.push('/login')
        return
      }
      fetchDashboardData()
    }
    init()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [summaryRes, transactionsRes] = await Promise.all([
        transactionsApi.getSummary(),
        transactionsApi.getAll({ limit: 5, sort: '-date' })
      ])
      
      setSummary(summaryRes.data)
      setRecentTransactions(transactionsRes.data.transactions)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loader"></div>
      </div>
    )
  }

  const monthlyChartData = summary?.monthlyBreakdown?.map(item => ({
    month: getMonthName(item.month),
    income: item.income,
    expense: item.expense
  })) || []

  const categoryData = [
    ...(summary?.categoryBreakdown?.income || []).map(item => ({
      ...item,
      type: 'income'
    })),
    ...(summary?.categoryBreakdown?.expense || []).map(item => ({
      ...item,
      type: 'expense'
    }))
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your financial overview</p>
        </div>
        <Link href="/transactions">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary?.summary?.balance || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Current balance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary?.summary?.income?.total || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary?.summary?.income?.count || 0} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(summary?.summary?.expense?.total || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary?.summary?.expense?.count || 0} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(summary?.summary?.income?.count || 0) + (summary?.summary?.expense?.count || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Income"
                />
                <Line 
                  type="monotone" 
                  dataKey="expense" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="Expense"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, total }) => `${category}: ${formatCurrency(total)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Recent Transactions</CardTitle>
            <Link href="/transactions">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction) => (
                <div key={transaction._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${
                      transaction.type === 'income' ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
                    }`}>
                      {transaction.type === 'income' ? (
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.category}</p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.description || 'No description'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(transaction.date)}
                      </p>
                    </div>
                  </div>
                  <div className={`text-lg font-semibold ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No transactions yet. Start by adding your first transaction.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
        }
