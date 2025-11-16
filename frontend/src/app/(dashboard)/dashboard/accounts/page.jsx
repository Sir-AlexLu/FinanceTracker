// src/app/(dashboard)/dashboard/accounts/page.jsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { accountsAPI } from '@/lib/api-safe'
import { toast } from '@/hooks/useToast'
import { formatCurrency } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { 
  WalletIcon, PlusIcon, PencilIcon, TrashIcon, 
  CurrencyDollarIcon, BanknotesIcon, ChartBarIcon,
  CheckIcon, XMarkIcon
} from '@heroicons/react/24/outline'
import { useVirtual } from '@tanstack/react-virtual'

const accountTypes = [
  { value: 'cash', label: 'Cash', icon: CurrencyDollarIcon, color: 'bg-green-500' },
  { value: 'bank', label: 'Bank', icon: BanknotesIcon, color: 'bg-blue-500' },
  { value: 'investment', label: 'Investment', icon: ChartBarIcon, color: 'bg-purple-500' },
]

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingAccount, setEditingAccount] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      type: 'cash',
      balance: '',
      currency: 'USD',
      description: '',
    },
  })

  const selectedType = watch('type')

  // Virtualization for large account lists
  const parentRef = useRef(null)
  const virtualizer = useVirtual({
    count: accounts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    overscan: 5,
  })

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    setIsLoading(true)
    const response = await accountsAPI.getAll()
    
    if (response.success) {
      setAccounts(response.data.accounts || [])
    } else {
      toast.error('Failed to load accounts')
    }
    setIsLoading(false)
  }

  const onSubmit = async (data) => {
    setIsLoading(true)
    
    const apiCall = editingAccount
      ? accountsAPI.update(editingAccount._id || editingAccount.id, data)
      : accountsAPI.create(data)

    const response = await apiCall

    if (response.success) {
      toast.success(editingAccount ? 'Account updated' : 'Account created')
      await loadAccounts()
      handleCancel()
    } else {
      toast.error(response.error)
    }
    setIsLoading(false)
  }

  const handleEdit = (account) => {
    setEditingAccount(account)
    setValue('name', account.name)
    setValue('type', account.type)
    setValue('balance', account.balance)
    setValue('currency', account.currency)
    setValue('description', account.description || '')
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    setDeleteId(id)
    const confirmed = confirm('Delete this account? All transactions will also be deleted.')
    
    if (confirmed) {
      setIsLoading(true)
      const response = await accountsAPI.delete(id)
      
      if (response.success) {
        toast.success('Account deleted')
        await loadAccounts()
      } else {
        toast.error(response.error)
      }
      setIsLoading(false)
    }
    setDeleteId(null)
  }

  const handleCancel = () => {
    setEditingAccount(null)
    setShowForm(false)
    reset({
      name: '',
      type: 'cash',
      balance: '',
      currency: 'USD',
      description: '',
    })
  }

  if (isLoading && accounts.length === 0) {
    return <AccountsSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <h1 className="text-3xl font-display font-bold">Accounts</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <PlusIcon className="h-5 w-5 mr-2" />
          {showForm ? 'Cancel' : 'New Account'}
        </Button>
      </motion.div>

      {/* Create/Edit Form */}
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
                    <Input
                      label="Account Name"
                      error={errors.name?.message}
                      {...register('name', { required: 'Name is required' })}
                      placeholder="My Savings Account"
                      disabled={isLoading}
                    />

                    <div>
                      <label className="block text-sm font-medium mb-2">Account Type</label>
                      <div className="grid grid-cols-3 gap-2">
                        {accountTypes.map((type) => {
                          const Icon = type.icon
                          return (
                            <motion.button
                              key={type.value}
                              type="button"
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setValue('type', type.value)}
                              className={`p-3 rounded-xl border-2 transition-all ${
                                selectedType === type.value
                                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                  : 'border-border hover:border-accent'
                              }`}
                            >
                              <Icon className={`h-6 w-6 mx-auto mb-1 ${type.color} text-white rounded-lg p-1`} />
                              <p className="text-xs font-medium">{type.label}</p>
                            </motion.button>
                          )
                        })}
                      </div>
                    </div>

                    <Input
                      label="Initial Balance"
                      type="number"
                      step="0.01"
                      error={errors.balance?.message}
                      {...register('balance', { 
                        required: 'Balance is required',
                        min: { value: 0, message: 'Balance cannot be negative' }
                      })}
                      placeholder="0.00"
                      disabled={isLoading}
                    />

                    <Input
                      label="Currency"
                      error={errors.currency?.message}
                      {...register('currency', { 
                        required: 'Currency is required',
                        pattern: { value: /^[A-Z]{3}$/, message: '3-letter code (e.g., USD)' }
                      })}
                      placeholder="USD"
                      maxLength="3"
                      disabled={isLoading}
                    />
                  </div>

                  <Input
                    label="Description (Optional)"
                    error={errors.description?.message}
                    {...register('description')}
                    placeholder="Optional description..."
                    disabled={isLoading}
                  />

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button type="submit" isLoading={isLoading}>
                      {editingAccount ? 'Update Account' : 'Create Account'}
                    </Button>
                    <Button type="button" variant="ghost" onClick={handleCancel}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Accounts Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        {accounts.length === 0 ? (
          <EmptyState
            title="No accounts yet"
            description="Create your first account to start tracking your finances"
            action="Create Account"
            onClick={() => setShowForm(true)}
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
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const account = accounts[virtualItem.index]
                return (
                  <motion.div
                    key={account._id || account.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: virtualItem.index * 0.05 }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    <AccountCard
                      account={account}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      isDeleting={deleteId === (account._id || account.id)}
                    />
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

/* Sub-components */
function AccountCard({ account, onEdit, onDelete, isDeleting }) {
  const accountType = accountTypes.find(t => t.value === account.type)
  const Icon = accountType?.icon
  const color = accountType?.color

  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`h-12 w-12 rounded-xl ${color} flex items-center justify-center`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{account.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">{account.type} • {account.currency}</p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(account)}
              disabled={isDeleting}
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => onDelete(account._id || account.id)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <TrashIcon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Balance</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(account.balance)}
          </p>
        </div>

        {account.description && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">
            {account.description}
          </p>
        )}

        {parseFloat(account.balance) < 100 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2 dark:bg-yellow-900/10 dark:border-yellow-800">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
            <p className="text-sm text-yellow-800 dark:text-yellow-200">Low balance warning</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function EmptyState({ title, description, action, onClick }) {
  return (
    <Card>
      <CardContent className="text-center py-12">
        <WalletIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6">{description}</p>
        <Button onClick={onClick} variant="primary" size="sm">
          {action}
        </Button>
      </CardContent>
    </Card>
  )
}

function AccountsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-48"></div>
      <div className="grid grid-cols-1 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="animate-pulse space-y-4">
                <div className="flex justify-between">
                  <div className="h-12 w-12 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                  <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

import { useRef } from 'react'
import { ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
