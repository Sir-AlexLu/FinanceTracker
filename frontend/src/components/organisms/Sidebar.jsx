'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import useAuthStore from '@/store/authStore'
import { toast } from '@/hooks/useToast'
import { 
  HomeIcon, WalletIcon, ArrowUpDownIcon, ChartBarIcon, 
  UserIcon, ArrowRightOnRectangleIcon, Cog6ToothIcon,
  SunIcon, MoonIcon, XMarkIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/atoms/Button'
import { Avatar } from '@/components/atoms/Avatar'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Accounts', href: '/dashboard/accounts', icon: WalletIcon },
  { name: 'Transactions', href: '/dashboard/transactions', icon: ArrowUpDownIcon },
  { name: 'Analytics', href: '/dashboard/analytics', icon: ChartBarIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
]

export function Sidebar({ onClose }) {
  const pathname = usePathname()
  const { user, logout, theme, setTheme } = useAuthStore()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      onClose?.()
    } catch (error) {
      toast.error('Logout failed')
    } finally {
      setIsLoggingOut(false)
    }
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <div className="h-full flex flex-col glass-neumorph glass-neumorph-dark">
      {/* Header */}
      {onClose && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">Menu</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Logo */}
      <div className="px-6 py-8">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center">
            <WalletIcon className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-display font-bold">FinanceTracker</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group
                    ${isActive 
                      ? 'bg-primary-500 text-white shadow-lg' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-accent hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'}`} />
                  <span className="font-medium">{item.name}</span>
                  
                  {isActive && (
                    <motion.div
                      layoutId="active-indicator"
                      className="ml-auto h-6 w-1 bg-white rounded-full"
                    />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User Section */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-accent transition-colors">
          <Avatar name={user?.name} />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="flex-1"
          >
            {theme === 'dark' ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="danger"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex-1"
          >
            {isLoggingOut ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
