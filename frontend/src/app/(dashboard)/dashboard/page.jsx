'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { accountsAPI, transactionsAPI } from '@/lib/api-safe'
import { toast } from '@/hooks/useToast'
import { formatCurrency } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { 
  WalletIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, ArrowPathIcon,
  PlusIcon, AlertTriangleIcon, InfoIcon
} from 'lucide-react'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export default function DashboardPage() {
  const [accounts, setAccounts] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [recentTransactions, setRecentTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setIsLoading(true)
    
    try {
      const [accountsRes, analyticsRes, transactionsRes] = await Promise.allSettled([
        accountsAPI.getAll(),
        transactionsAPI.getAnalytics(),
        transactionsAPI.getAll({ limit: 5 }),
      ])

      if (accountsRes.status === 'fulfilled' && accountsRes.value.success) {
        setAccounts(accountsRes.value.data.accounts || [])
      } else {
        toast.error('Failed to load accounts')
        setAccounts([])
      }

      if (analyticsRes.status === 'fulfilled' && analyticsRes.value.success) {
        setAnalytics(analyticsRes.value.data)
      } else {
        toast.error('Failed to load analytics')
        setAnalytics(null)
      }

      if (transactionsRes.status === 'fulfilled' && transactionsRes.value.success) {
        setRecentTransactions(transactionsRes.value.data.transactions || [])
      } else {
        setRecentTransactions([])
      }
    } catch (error) {
      console.error('Dashboard error:', error)
      toast.error('Failed to load dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const totalBalance = accounts.reduce((sum, acc) => {
    const balance = parseFloat(acc.balance || 0)
    return sum + (isNaN(balance) ? 0 : balance)
  }, 0)

  const lowBalanceAccounts = accounts.filter(acc => {
    const balance = parseFloat(acc.balance || 0)
    return balance < 100
  })

  if (isLoading) {
    return <DashboardSkeleton />
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Balance"
          value={formatCurrency(totalBalance)}
          icon={WalletIcon}
          iconClass="text-primary-600 bg-primary-100 dark:bg-primary-900/20"
          subtitle={`${accounts.length} account${accounts.length !== 1 ? 's' : ''}`}
          trend="+12.5%"
        />
        <SummaryCard
          title="Total Income"
          value={formatCurrency(analytics?.totalIncome || 0)}
          icon={ArrowTrendingUpIcon}
          iconClass="text-green-600 bg-green-100 dark:bg-green-900/20"
          subtitle="This month"
          trend="+8.3%"
        />
        <SummaryCard
          title="Total Expenses"
          value={formatCurrency(analytics?.totalExpense || 0)}
          icon={ArrowTrendingDownIcon}
          iconClass="text-red-600 bg-red-100 dark:bg-red-900/20"
          subtitle="This month"
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
          subtitle="Income - Expenses"
          trend={(analytics?.netSavings || 0) >= 0 ? '+15.7%' : '-5.1%'}
        />
      </div>

      {/* Low Balance Alert */}
      {lowBalanceAccounts.length > 0 && (
        <AlertCard
          type="warning"
          title="Low Balance Alert"
          message={`${lowBalanceAccounts.length} account${lowBalanceAccounts.length > 1 ? 's' : ''} below $100: ${lowBalanceAccounts.map(a => a.name).join(', ')}`}
        />
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accounts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Your Accounts</CardTitle>
            <Link href="/dashboard/accounts">
              <Button variant="ghost" size="sm">
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Account
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {accounts.length === 0 ? (
                <EmptyState
                  title="No accounts yet"
                  description="Add your first account to start tracking"
                  action="Create Account"
                  href="/dashboard/accounts"
                />
              ) : (
                accounts.slice(0, 3).map((account) => (
                  <AccountRow key={account._id || account.id} account={account} />
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Transactions</CardTitle>
            <Link href="/dashboard/transactions">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentTransactions.length === 0 ? (
                <EmptyState
                  title="No transactions yet"
                  description="Record your first transaction"
                  action="Add Transaction"
                  href="/dashboard/transactions"
                />
              ) : (
                recentTransactions.map((transaction) => (
                  <TransactionRow key={transaction._id || transaction.id} transaction={transaction} />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}

/* Sub-components */
function SummaryCard({ title, value, icon: Icon, iconClass, subtitle, trend }) {
  return (
    <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} className="transition-transform">
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{title}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{value}</p>
              <div className="flex items-center gap-2 text-xs">
                {subtitle && <p className="text-slate-500">{subtitle}</p>}
                {trend && (
                  <span className={`font-medium ${trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {trend}
                  </span>
                )}
              </div>
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

function AlertCard({ type, title, message }) {
  const styles = {
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/10 dark:border-yellow-800 dark:text-yellow-300',
    error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/10 dark:border-red-800 dark:text-red-300',
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/10 dark:border-blue-800 dark:text-blue-300',
  }

  const icons = {
    warning: AlertTriangleIcon,
    error: AlertTriangleIcon,
    info: InfoIcon,
  }

  const Icon = icons[type] || AlertTriangleIcon

  return (
    <motion.div variants={itemVariants}>
      <Card className={`border-l-4 ${styles[type]}`}>
        <CardContent className="flex items-start gap-3 py-4">
          <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm">{title}</p>
            <p className="text-xs mt-1">{message}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function AccountRow({ account }) {
  const accountTypeIcons = {
    cash: WalletIcon,
    bank: LandmarkIcon,
    investment: TrendingUpIcon,
  }

  const accountTypeColors = {
    cash: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    bank: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    investment: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
  }

  const Icon = accountTypeIcons[account.type] || WalletIcon
  const colorClass = accountTypeColors[account.type] || accountTypeColors.cash

  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-accent/50 hover:bg-accent/80 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${colorClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium text-slate-900 dark:text-white">{account.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{account.type} • {account.currency}</p>
        </div>
      </div>
      <p className="font-bold text-slate-900 dark:text-white">{formatCurrency(account.balance, account.currency)}</p>
    </div>
  )
}

function TransactionRow({ transaction }) {
  const typeStyles = {
    income: 'text-green-600 bg-green-100 dark:bg-green-900/20',
    expense: 'text-red-600 bg-red-100 dark:bg-red-900/20',
    transfer: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20',
  }

  const icons = {
    income: ArrowTrendingUpIcon,
    expense: ArrowTrendingDownIcon,
    transfer: ArrowPathIcon,
  }

  const Icon = icons[transaction.type] || ArrowPathIcon

  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${typeStyles[transaction.type]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="font-medium text-slate-900 dark:text-white">{transaction.category || 'Uncategorized'}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {transaction.description || 'No description'}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
          {transaction.type === 'income' ? '+' : '-'}
          {formatCurrency(transaction.amount, transaction.currency)}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
      </div>
    </div>
  )
}

function EmptyState({ title, description, action, href }) {
  return (
    <div className="text-center py-12">
      <div className="bg-slate-100 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
        <WalletIcon className="h-8 w-8 text-slate-400" />
      </div>
      <p className="text-slate-600 dark:text-slate-400 mb-2 font-medium">{title}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{description}</p>
      <Link href={href}>
        <Button variant="primary" size="sm">
          {action}
        </Button>
      </Link>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Import Lucide icons used in AccountRow
import { LandmarkIcon, TrendingUpIcon } from 'lucide-react'
