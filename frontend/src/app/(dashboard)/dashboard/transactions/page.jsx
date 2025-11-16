// src/app/(dashboard)/dashboard/transactions/page.jsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { transactionsAPI, accountsAPI } from '@/lib/api-safe'
import { toast } from '@/hooks/useToast'
import { formatCurrency, formatDate, debounce } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { 
  PlusIcon, FunnelIcon, MagnifyingGlassIcon,
  ArrowTrendingUpIcon, ArrowTrendingDownIcon, ArrowPathIcon,
  CalendarIcon, CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import { useVirtual } from '@tanstack/react-virtual'

const TRANSACTION_TYPES = [
  { value: 'all', label: 'All', icon: null },
  { value: 'income', label: 'Income', icon: ArrowTrendingUpIcon },
  { value: 'expense', label: 'Expense', icon: ArrowTrendingDownIcon },
  { value: 'transfer', label: 'Transfer', icon: ArrowPathIcon },
]

const CATEGORIES = {
  income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Other Income'],
  expense: ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Other'],
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([])
  const [accounts, setAccounts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterType, setFilterType] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showForm, setShowForm] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      accountId: '',
      type: 'expense',
      amount: '',
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    },
  })

  const transactionType = watch('type')
  const selectedAccountId = watch('accountId')

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesType = filterType === 'all' || t.type === filterType
      const matchesSearch = debouncedSearch === '' || 
        t.category.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        t.description?.toLowerCase().includes(debouncedSearch.toLowerCase())
      return matchesType && matchesSearch
    })
  }, [transactions, filterType, debouncedSearch])

  // Virtualization
  const parentRef = useRef(null)
  const virtualizer = useVirtual({
    count: filteredTransactions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    
    const [txRes, accountsRes] = await Promise.allSettled([
      transactionsAPI.getAll(),
      accountsAPI.getAll(),
    ])

    if (txRes.status === 'fulfilled' && txRes.value.success) {
      setTransactions(txRes.value.data.transactions || [])
    }

    if (accountsRes.status === 'fulfilled' && accountsRes.value.success) {
      setAccounts(accountsRes.value.data.accounts || [])
      if (accountsRes.value.data.accounts.length > 0) {
        setValue('accountId', accountsRes.value.data.accounts[0]._id || accountsRes.value.data.accounts[0].id)
      }
    }

    setIsLoading(false)
  }

  const onSubmit = async (data) => {
    setIsLoading(true)
    const response = await transactionsAPI.create(data)
    
    if (response.success) {
      toast.success('Transaction created')
      await loadData()
      resetForm()
    } else {
      toast.error(response.error)
    }
    setIsLoading(false)
  }

  const resetForm = () => {
    reset({
      accountId: accounts[0]?._id || accounts[0]?.id || '',
      type: 'expense',
      amount: '',
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    })
    setShowForm(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return
    
    setIsLoading(true)
    const response = await transactionsAPI.delete(id)
    
    if (response.success) {
      toast.success('Transaction deleted')
      await loadData()
    } else {
      toast.error(response.error)
    }
    setIsLoading(false)
  }

  if (isLoading && transactions.length === 0) {
    return <TransactionsSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-display font-bold">Transactions</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <PlusIcon className="h-5 w-5 mr-2" />
          {showForm ? 'Cancel' : 'New Transaction'}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Type Filter */}
            <div className="flex items-center gap-2">
              {TRANSACTION_TYPES.map((type) => {
                const Icon = type.icon
                return (
                  <Button
                    key={type.value}
                    variant={filterType === type.value ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setFilterType(type.value)}
                  >
                    {Icon && <Icon className="h-4 w-4 mr-1" />}
                    {type.label}
                  </Button>
                )
              })}
            </div>

            {/* Search */}
            <div className="flex-1">
              <Input
                icon={MagnifyingGlassIcon}
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Account</label>
                      <select
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3"
                        {...register('accountId', { required: 'Account is required' })}
                        disabled={accounts.length === 0 || isLoading}
                      >
                        {accounts.length === 0 ? (
                          <option value="">No accounts available</option>
                        ) : (
                          accounts.map((acc) => (
                            <option key={acc._id || acc.id} value={acc._id || acc.id}>
                              {acc.name} ({formatCurrency(acc.balance)})
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Type</label>
                      <select
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3"
                        {...register('type', { required: 'Type is required' })}
                        onChange={(e) => setValue('category', '')}
                      >
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                        <option value="transfer">Transfer</option>
                      </select>
                    </div>

                    <Input
                      label="Amount"
                      type="number"
                      step="0.01"
                      icon={CurrencyDollarIcon}
                      error={errors.amount?.message}
                      {...register('amount', { 
                        required: 'Amount is required',
                        min: { value: 0.01, message: 'Amount must be positive' }
                      })}
                      placeholder="0.00"
                    />

                    <div>
                      <label className="block text-sm font-medium mb-2">Category</label>
                      <select
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3"
                        {...register('category', { required: 'Category is required' })}
                      >
                        <option value="">Select Category</option>
                        {CATEGORIES[transactionType]?.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <Input
                      label="Date"
                      type="date"
                      icon={CalendarIcon}
                      error={errors.date?.message}
                      {...register('date', { required: 'Date is required' })}
                    />

                    <Input
                      label="Description"
                      error={errors.description?.message}
                      {...register('description')}
                      placeholder="Optional description..."
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button type="submit" isLoading={isLoading}>
                      Add Transaction
                    </Button>
                    <Button type="button" variant="ghost" onClick={resetForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filteredTransactions.length} Transaction{filteredTransactions.length !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <EmptyState
              title="No transactions found"
              description="Try adjusting your filters or add a new transaction"
            />
          ) : (
            <div ref={parentRef} className="h-[600px] overflow-y-auto scrollbar-hide">
              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {virtualizer.getVirtualItems().map((virtualItem) => (
                  <TransactionRow
                    key={transactions[virtualItem.index]._id || transactions[virtualItem.index].id}
                    transaction={transactions[virtualItem.index]}
                    accounts={accounts}
                    onDelete={handleDelete}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function TransactionRow({ transaction, accounts, onDelete, style }) {
  const account = accounts.find(a => (a._id || a.id) === transaction.accountId)
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
    <div style={style} className="flex items-center justify-between py-3 border-b border-border last:border-0 px-2 hover:bg-accent/50 rounded-lg transition-colors">
      <div className="flex items-center gap-3 flex-1">
        <div className={`p-2 rounded-lg ${typeStyles[transaction.type]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-900 dark:text-white truncate">{transaction.category}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {account?.name} • {formatDate(transaction.date)}
          </p>
          {transaction.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {transaction.description}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <p className={`font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
          {transaction.type === 'income' ? '+' : '-'}
          {formatCurrency(transaction.amount)}
        </p>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(transaction._id || transaction.id)}
        >
          <TrashIcon className="h-4 w-4 text-slate-400 hover:text-red-500" />
        </Button>
      </div>
    </div>
  )
}

function EmptyState({ title, description }) {
  return (
    <div className="text-center py-12">
      <MagnifyingGlassIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400">{description}</p>
    </div>
  )
}

function TransactionsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-48"></div>
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

import { useRef } from 'react'
import { TrashIcon } from '@heroicons/react/24/outline'
