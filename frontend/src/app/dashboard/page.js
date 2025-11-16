// frontend/src/app/dashboard/page.js
'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { accountsAPI, transactionsAPI } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/components/Notifications'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  WalletIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, 
  ArrowPathIcon, PlusIcon, ExclamationCircleIcon 
} from '@heroicons/react/24/outline'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
}

export default function DashboardPage() {
  const [accounts, setAccounts] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [recentTransactions, setRecentTransactions] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      const [accountsRes, analyticsRes, transactionsRes] = await Promise.all([
        accountsAPI.getAll(),
        transactionsAPI.getAnalytics(),
        transactionsAPI.getAll({ limit: 5 }),
      ])

      if (accountsRes.data.success) {
        setAccounts(accountsRes.data.data.accounts)
      }
      if (analyticsRes.data.success) {
        setAnalytics(analyticsRes.data.data)
      }
      if (transactionsRes.data.success) {
        setRecentTransactions(transactionsRes.data.data.transactions)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0)
  const lowBalanceAccounts = accounts.filter(acc => parseFloat(acc.balance) < 100)

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
      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Balance"
          value={formatCurrency(totalBalance)}
          icon={WalletIcon}
          iconColor="text-blue-600 bg-blue-100"
          subtitle={`${accounts.length} accounts`}
        />
        <SummaryCard
          title="Total Income"
          value={formatCurrency(analytics?.totalIncome || 0)}
          icon={ArrowTrendingUpIcon}
          iconColor="text-green-600 bg-green-100"
          subtitle="This period"
        />
        <SummaryCard
          title="Total Expenses"
          value={formatCurrency(analytics?.totalExpense || 0)}
          icon={ArrowTrendingDownIcon}
          iconColor="text-red-600 bg-red-100"
          subtitle="This period"
        />
        <SummaryCard
          title="Net Savings"
          value={formatCurrency(analytics?.netSavings || 0)}
          icon={ArrowPathIcon}
          iconColor={parseFloat(analytics?.netSavings || 0) >= 0 ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'}
          subtitle="Income - Expenses"
        />
      </div>

      {/* Alerts */}
      {lowBalanceAccounts.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="border-yellow-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-700">
                <ExclamationCircleIcon className="h-5 w-5" />
                Low Balance Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-yellow-600">
                {lowBalanceAccounts.length} account(s) have low balance: {lowBalanceAccounts.map(acc => acc.name).join(', ')}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Accounts & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Your Accounts</CardTitle>
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/dashboard/accounts'}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Account
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {accounts.map((account) => (
                  <AccountRow key={account._id} account={account} />
                ))}
                {accounts.length === 0 && (
                  <EmptyState
                    title="No accounts yet"
                    description="Add your first account to start tracking your finances"
                    action="Create Account"
                    href="/dashboard/accounts"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Recent Transactions</CardTitle>
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/dashboard/transactions'}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentTransactions.map((transaction) => (
                  <TransactionRow key={transaction._id} transaction={transaction} />
                ))}
                {recentTransactions.length === 0 && (
                  <EmptyState
                    title="No transactions yet"
                    description="Record your first transaction to see insights"
                    action="Add Transaction"
                    href="/dashboard/transactions"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}

function SummaryCard({ title, value, icon: Icon, iconColor, subtitle }) {
  return (
    <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }}>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold mt-1">{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            </div>
            <div className={`p-3 rounded-full ${iconColor}`}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function AccountRow({ account }) {
  const accountTypeColors = {
    cash: 'bg-green-100 text-green-600',
    bank: 'bg-blue-100 text-blue-600',
    investment: 'bg-purple-100 text-purple-600',
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50 hover:bg-accent/80 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${accountTypeColors[account.type]}`}>
          <WalletIcon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium">{account.name}</p>
          <p className="text-xs text-muted-foreground capitalize">{account.type} • {account.currency}</p>
        </div>
      </div>
      <p className="font-bold">{formatCurrency(account.balance)}</p>
    </div>
  )
}

function TransactionRow({ transaction }) {
  const transactionTypeColors = {
    income: 'text-green-600 bg-green-100',
    expense: 'text-red-600 bg-red-100',
    transfer: 'text-purple-600 bg-purple-100',
  }

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${transactionTypeColors[transaction.type]}`}>
          {transaction.type === 'income' && <ArrowTrendingUpIcon className="h-4 w-4" />}
          {transaction.type === 'expense' && <ArrowTrendingDownIcon className="h-4 w-4" />}
          {transaction.type === 'transfer' && <ArrowPathIcon className="h-4 w-4" />}
        </div>
        <div>
          <p className="font-medium text-sm">{transaction.category}</p>
          <p className="text-xs text-muted-foreground">{transaction.description || 'No description'}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
          {transaction.type === 'income' ? '+' : '-'}
          {formatCurrency(transaction.amount)}
        </p>
        <p className="text-xs text-muted-foreground">{new Date(transaction.date).toLocaleDateString()}</p>
      </div>
    </div>
  )
}

function EmptyState({ title, description, action, href }) {
  return (
    <div className="text-center py-8">
      <p className="text-muted-foreground mb-2">{title}</p>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      <Button size="sm" onClick={() => window.location.href = href}>{action}</Button>
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
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                <div className="h-8 bg-muted rounded w-32 mb-1"></div>
                <div className="h-3 bg-muted rounded w-20"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
                    }
  
