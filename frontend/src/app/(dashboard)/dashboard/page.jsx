'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { accountsAPI, transactionsAPI } from '@/lib/api-safe'
import { toast } from '@/hooks/useToast'
import { formatCurrency } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { 
  WalletIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, ArrowPathIcon,
  PlusIcon, ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

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
      // Fetch all data in parallel with error isolation
      const [accountsRes, analyticsRes, transactionsRes] = await Promise.allSettled([
        accountsAPI.getAll(),
        transactionsAPI.getAnalytics(),
        transactionsAPI.getAll({ limit: 5 }),
      ])

      // Handle accounts
      if (accountsRes.status === 'fulfilled' && accountsRes.value.success) {
        setAccounts(accountsRes.value.data.accounts || [])
      } else {
        toast.error('Failed to load accounts')
        setAccounts([])
      }

      // Handle analytics
      if (analyticsRes.status === 'fulfilled' && analyticsRes.value.success) {
        setAnalytics(analyticsRes.value.data)
      } else {
        toast.error('Failed to load analytics')
        setAnalytics(null)
      }

      // Handle transactions
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
          iconClass="text-primary-600 bg-primary-100"
          subtitle={`${accounts.length} accounts`}
          trend="+12.5%"
        />
        <SummaryCard
          title="Total Income"
          value={formatCurrency(analytics?.totalIncome || 0)}
          icon={ArrowTrendingUpIcon}
          iconClass="text-green-600 bg-green-100"
          subtitle="This month"
          trend="+8.3%"
        />
        <SummaryCard
          title="Total Expenses"
          value={formatCurrency(analytics?.totalExpense || 0)}
          icon={ArrowTrendingDownIcon}
          iconClass="text-red-600 bg-red-100"
          subtitle="This month"
          trend="-3.2%"
        />
        <SummaryCard
          title="Net Savings"
          value={formatCurrency(analytics?.netSavings || 0)}
          icon={ArrowPathIcon}
          iconClass={analytics?.netSavings >= 0 ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'}
          subtitle="Income - Expenses"
          trend={analytics?.netSavings >= 0 ? '+15.7%' : '-5.1%'}
        />
      </div>

      {/* Alerts */}
      {lowBalanceAccounts.length > 0 && (
        <AlertCard
          type="warning"
          title="Low Balance Alert"
          message={`${lowBalanceAccounts.length} account(s) need attention: ${lowBalanceAccounts.map(a => a.name).join(', ')}`}
        />
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accounts */}
        <Card>
          <CardHeader>
            <CardTitle>Your Accounts</CardTitle>
            <Link href="/dashboard/accounts">
              <Button variant="ghost" size="sm" icon={PlusIcon}>
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
                  <AccountRow key={account._id} account={account} />
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
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
                  <TransactionRow key={transaction._id} transaction={transaction} />
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
    <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }}>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{title}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{value}</p>
              <div className="flex items-center gap-2">
                {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
                {trend && (
                  <span className={`text-xs font-medium ${trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {trend}
                  </span>
                )}
              </div>
            </div>
            <div className={`p-3 rounded-2xl ${iconClass}`}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function AlertCard({ type, title, message }) {
  const styles = {
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200',
    error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200',
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200',
  }

  const icons = {
    warning: ExclamationTriangleIcon,
    error: ExclamationTriangleIcon,
    info: InformationCircleIcon,
  }

  const Icon = icons[type]

  return (
    <motion.div variants={itemVariants}>
      <Card className={`border-l-4 ${styles[type]}`}>
        <CardContent className="flex items-start gap-3 pt-6">
          <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">{title}</p>
            <p className="text-sm mt-1">{message}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function AccountRow({ account }) {
  const accountTypeStyles = {
    cash: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    bank: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    investment: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-accent/50 hover:bg-accent/80 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${accountTypeStyles[account.type]}`}>
          <WalletIcon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium text-slate-900 dark:text-white">{account.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{account.type} • {account.currency}</p>
        </div>
      </div>
      <p className="font-bold text-slate-900 dark:text-white">{formatCurrency(account.balance)}</p>
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

  const Icon = icons[transaction.type]

  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${typeStyles[transaction.type]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="font-medium text-slate-900 dark:text-white">{transaction.category}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {transaction.description || 'No description'}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
          {transaction.type === 'income' ? '+' : '-'}
          {formatCurrency(transaction.amount)}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {new Date(transaction.date).toLocaleDateString()}
        </p>
      </div>
    </div>
  )
}

function EmptyState({ title, description, action, href }) {
  return (
    <div className="text-center py-12">
      <p className="text-slate-600 dark:text-slate-400 mb-4">{title}</p>
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
    </div>
  )
}

import { InformationCircleIcon } from '@heroicons/react/24/outline'
