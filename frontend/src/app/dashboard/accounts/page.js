// frontend/src/app/dashboard/accounts/page.js
'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { accountsAPI } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/components/Notifications'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  PlusIcon, WalletIcon, TrashIcon, PencilIcon, 
  CurrencyDollarIcon, BanknotesIcon, ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAccount, setEditingAccount] = useState(null)
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'cash',
    balance: '',
    currency: 'USD',
    description: '',
  })

  const accountTypes = [
    { value: 'cash', label: 'Cash', icon: CurrencyDollarIcon, color: 'bg-green-500' },
    { value: 'bank', label: 'Bank', icon: BanknotesIcon, color: 'bg-blue-500' },
    { value: 'investment', label: 'Investment', icon: ChartBarIcon, color: 'bg-purple-500' },
  ]

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      setIsLoading(true)
      const response = await accountsAPI.getAll()
      if (response.data.success) {
        setAccounts(response.data.data.accounts)
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
      toast.error('Failed to load accounts')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = editingAccount
        ? await accountsAPI.update(editingAccount._id || editingAccount.id, formData)
        : await accountsAPI.create(formData)

      if (response.data.success) {
        toast.success(editingAccount ? 'Account updated successfully' : 'Account created successfully')
        await fetchAccounts()
        handleCancel()
      }
    } catch (error) {
      console.error('Error saving account:', error)
      toast.error(error.response?.data?.message || 'Failed to save account')
    }
  }

  const handleEdit = (account) => {
    setEditingAccount(account)
    setFormData({
      name: account.name,
      type: account.type,
      balance: account.balance,
      currency: account.currency,
      description: account.description || '',
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this account? All associated transactions will also be deleted.')) return

    try {
      await accountsAPI.delete(id)
      toast.success('Account deleted successfully')
      await fetchAccounts()
    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error('Failed to delete account')
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingAccount(null)
    setFormData({
      name: '',
      type: 'cash',
      balance: '',
      currency: 'USD',
      description: '',
    })
  }

  const getAccountType = (type) => accountTypes.find(at => at.value === type)

  if (isLoading) return <AccountsSkeleton />

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <h1 className="text-3xl font-bold">Accounts</h1>
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
              <CardHeader>
                <CardTitle>{editingAccount ? 'Edit Account' : 'Create New Account'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Account Name *"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="My Savings Account"
                    />
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Account Type *</label>
                      <div className="grid grid-cols-3 gap-2">
                        {accountTypes.map((type) => {
                          const Icon = type.icon
                          const isSelected = formData.type === type.value
                          return (
                            <button
                              key={type.value}
                              type="button"
                              onClick={() => setFormData({ ...formData, type: type.value })}
                              className={`p-3 rounded-lg border-2 transition-all ${
                                isSelected
                                  ? 'border-primary bg-primary/10'
                                  : 'border-muted hover:border-accent-foreground/20'
                              }`}
                            >
                              <Icon className={`h-6 w-6 mx-auto mb-1 ${type.color} text-white rounded p-1`} />
                              <p className="text-xs font-medium">{type.label}</p>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <Input
                      label="Initial Balance"
                      type="number"
                      step="0.01"
                      value={formData.balance}
                      onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                      placeholder="0.00"
                    />

                    <Input
                      label="Currency"
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                      placeholder="USD"
                      maxLength="3"
                    />
                  </div>

                  <Input
                    label="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description..."
                  />

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button type="submit" isLoading={isLoading}>
                      {editingAccount ? 'Update Account' : 'Create Account'}
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCancel}>
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
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <AnimatePresence>
          {accounts.map((account) => (
            <AccountCard
              key={account._id || account.id}
              account={account}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty State */}
      {accounts.length === 0 && !showForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <WalletIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No accounts yet</h3>
          <p className="text-muted-foreground mb-4">Create your first account to start tracking your finances</p>
          <Button onClick={() => setShowForm(true)}>
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Account
          </Button>
        </motion.div>
      )}
    </div>
  )
}

function AccountCard({ account, onEdit, onDelete }) {
  const typeConfig = {
    cash: { icon: CurrencyDollarIcon, color: 'bg-green-500' },
    bank: { icon: BanknotesIcon, color: 'bg-blue-500' },
    investment: { icon: ChartBarIcon, color: 'bg-purple-500' },
  }
  
  const { icon: Icon, color } = typeConfig[account.type] || typeConfig.cash

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -5 }}
      className="relative"
    >
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-start mb-4">
            <div className={`h-12 w-12 rounded-xl ${color} flex items-center justify-center`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onEdit(account)}
              >
                <PencilIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                onClick={() => onDelete(account._id || account.id)}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <h3 className="text-lg font-bold mb-1">{account.name}</h3>
          <p className="text-sm text-muted-foreground capitalize mb-4">{account.type}</p>
          
          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted-foreground mb-1">Balance</p>
            <p className="text-2xl font-bold">{formatCurrency(account.balance)}</p>
            <p className="text-xs text-muted-foreground mt-1">{account.currency}</p>
          </div>
          
          {account.description && (
            <p className="text-sm text-muted-foreground mt-4">{account.description}</p>
          )}

          {parseFloat(account.balance) < 100 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
              <p className="text-sm text-yellow-800">Low balance warning</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

function AccountsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 bg-muted rounded w-48"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="animate-pulse space-y-4">
                <div className="flex justify-between">
                  <div className="h-12 w-12 bg-muted rounded-xl"></div>
                  <div className="h-8 w-16 bg-muted rounded"></div>
                </div>
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="border-t border-border pt-4">
                  <div className="h-4 bg-muted rounded w-16 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-32"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
                        }
                        
