'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { transactionsAPI, accountsAPI } from '@/lib/api-safe'
import { toast } from '@/hooks/useToast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { 
  PlusIcon, FilterIcon, SearchIcon,
  ArrowTrendingUpIcon, ArrowTrendingDownIcon, ArrowPathIcon,
  CalendarIcon, DollarSignIcon, Trash2Icon
} from 'lucide-react'
import { useVirtualizer } from '@tanstack/react-virtual'

const TRANSACTION_TYPES = [
  { value: 'all', label: 'All', icon: null },
  { value: 'income', label: 'Income', icon: ArrowTrendingUpIcon },
  { value: 'expense', label: 'Expense', icon: ArrowTrendingDownIcon },
  { value: 'transfer', label: 'Transfer', icon: ArrowPathIcon },
]

const CATEGORIES = {
  income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Other Income'],
  expense: ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Other'],
  transfer: ['Transfer'],
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
        t.category?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        t.description?.toLowerCase().includes(debouncedSearch.toLowerCase())
      return matchesType && matchesSearch
    })
  }, [transactions, filterType, debouncedSearch])

  // Virtualization
  const parentRef = useRef(null)
  const rowVirtualizer = useVirtualizer({
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
    
    try {
      const [txRes, accountsRes] = await Promise.allSettled([
        transactionsAPI.getAll(),
        accountsAPI.getAll(),
      ])

      if (txRes.status === 'fulfilled' && txRes.value.success) {
        setTransactions(txRes.value.data.transactions || [])
      } else {
        toast.error('Failed to load transactions')
      }

      if (accountsRes.status === 'fulfilled' && accountsRes.value.success) {
        const accs = accountsRes.value.data.accounts || []
        setAccounts(accs)
        if (accs.length > 0) {
          setValue('accountId', accs[0]._id || accs[0].id)
        }
      } else {
        toast.error('Failed to load accounts')
      }
    } catch (error) {
      console.error('Load error:', error)
      toast.error('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      const response = await transactionsAPI.create(data)
      
      if (response.success) {
        toast.success('Transaction created')
        await loadData()
        resetForm()
      } else {
        toast.error(response.error || 'Failed to create transaction')
      }
    } catch (error) {
      toast.error('Network error')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    const defaultAccountId = accounts[0]?._id || accounts[0]?.id || ''
    reset({
      accountId: defaultAccountId,
      type: 'expense',
      amount: '',
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    })
    setShowForm(false)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return
    
    setIsLoading(true)
    try {
      const response = await transactionsAPI.delete(id)
      
      if (response.success) {
        toast.success('Transaction deleted')
        await loadData()
      } else {
        toast.error(response.error || 'Failed to delete')
      }
    } catch (error) {
      toast.error('Network error')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading && transactions.length === 0) {
    return <TransactionsSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <h1 className="text-3xl font-display font-bold">Transactions</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <PlusIcon className="h-5 w-5 mr-2" />
          {showForm ? 'Cancel' : 'New Transaction'}
        </Button>
      </motion.div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Type Filter */}
            <div className="flex items-center gap-2 flex-wrap">
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
            <div className="flex-1 min-w-0">
              <Input
                icon={SearchIcon}
                placeholder="Search by category or description..."
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
            className="overflow-hidden"
          >
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Account */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Account</label>
                      <select
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        {...register('accountId', { required: 'Account is required' })}
                        disabled={accounts.length === 0 || isLoading}
                      >
                        {accounts.length === 0 ? (
                          <option value="">No accounts available</option>
                        ) : (
                          accounts.map((acc) => (
                            <option key={acc._id || acc.id} value={acc._id || acc.id}>
                              {acc.name} • {formatCurrency(acc.balance)} {acc.currency}
                            </option>
                          ))
                        )}
                      </select>
                      {errors.accountId && (
                        <p className="text-red-500 text-xs mt-1">{errors.accountId.message}</p>
                      )}
                    </div>

                    {/* Type */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Type</label>
                      <select
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        {...register('type', { required: 'Type is required' })}
                        onChange={(e) => {
                          setValue('type', e.target.value)
                          setValue('category', '')
                        }}
                      >
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                        <option value="transfer">Transfer</option>
                      </select>
                    </div>

                    {/* Amount */}
                    <Input
                      label="Amount"
                      type="number"
                      step="0.01"
                      icon={DollarSignIcon}
                      error={errors.amount?.message}
                      {...register('amount', { 
                        required: 'Amount is required',
                        min: { value: 0.01, message: 'Amount must be positive' },
                        valueAsNumber: true
                      })}
                      placeholder="0.00"
                      disabled={isLoading}
                    />

                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Category</label>
                      <select
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        {...register('category', { required: 'Category is required' })}
                        disabled={isLoading}
                      >
                        <option value="">Select Category</option>
                        {(CATEGORIES[transactionType] || []).map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      {errors.category && (
                        <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>
                      )}
                    </div>

                    {/* Date */}
                    <Input
                      label="Date"
                      type="date"
                      icon={CalendarIcon}
                      error={errors.date?.message}
                      {...register('date', { required: 'Date is required' })}
                      disabled={isLoading}
                    />

                    {/* Description */}
                    <Input
                      label="Description (Optional)"
                      error={errors.description?.message}
                      {...register('description')}
                      placeholder="Add a note..."
                      disabled={isLoading}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button type="submit" isLoading={isLoading}>
                      Add Transaction
                    </Button>
                    <Button type="button" variant="ghost" onClick={resetForm} disabled={isLoading}>
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
            <div ref={parentRef} className="h-[600px] overflow-y-auto scrollbar-hide border rounded-lg">
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                  const transaction = filteredTransactions[virtualItem.index]
                  return (
                    <motion.div
                      key={transaction._id || transaction.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualItem.size}px`,
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                      className="px-1"
                    >
                      <TransactionRow
                        transaction={transaction}
                        accounts={accounts}
                        onDelete={handleDelete}
                      />
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/* Sub-components */
function TransactionRow({ transaction, accounts, onDelete }) {
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
  const Icon = icons[transaction.type] || ArrowPathIcon

  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0 px-2 hover:bg-accent/50 rounded-lg transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`p-2 rounded-lg ${typeStyles[transaction.type]}`}>
          <Icon className="h-4 w-4 text-current" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-900 dark:text-white truncate">{transaction.category || 'Uncategorized'}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {account?.name || 'Unknown'} • {formatDate(transaction.date)}
          </p>
          {transaction.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">
              {transaction.description}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <p className={`font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
          {transaction.type === 'income' ? '+' : '-'}
          {formatCurrency(transaction.amount, transaction.currency)}
        </p>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(transaction._id || transaction.id)}
          className="text-slate-400 hover:text-red-500"
        >
          <Trash2Icon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function EmptyState({ title, description }) {
  return (
    <div className="text-center py-12">
      <div className="bg-slate-100 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
        <SearchIcon className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs mx-auto">{description}</p>
    </div>
  )
}

function TransactionsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-48 animate-pulse"></div>
        <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-9 w-20 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
              ))}
            </div>
            <div className="flex-1 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
                   }
