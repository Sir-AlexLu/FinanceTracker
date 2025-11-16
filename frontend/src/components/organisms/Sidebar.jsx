'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import useAuthStore from '@/store/authStore'
import { toast } from '@/hooks/useToast'
import { 
  HomeIcon, WalletIcon, ArrowUpDownIcon, BarChart3Icon, 
  UserIcon, LogOutIcon, SettingsIcon,
  SunIcon, MoonIcon, XMarkIcon
} from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { Avatar } from '@/components/atoms/Avatar'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Accounts', href: '/dashboard/accounts', icon: WalletIcon },
  { name: 'Transactions', href: '/dashboard/transactions', icon: ArrowUpDownIcon },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3Icon },
  { name: 'Settings', href: '/dashboard/settings', icon: SettingsIcon },
]

export function Sidebar({ onClose }) {
  const pathname = usePathname()
  const { user, logout, theme, setTheme } = useAuthStore()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      toast.success('Logged out successfully')
      onClose?.()
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Logout failed. Please try again.')
    } finally {
      setIsLoggingOut(false)
    }
  }

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    toast.success(`Switched to ${newTheme} mode`)
  }

  return (
    <div className="h-full flex flex-col glass-neumorph glass-neumorph-dark">
      {/* Mobile Header */}
      {onClose && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-accent/80 transition-colors"
            aria-label="Close menu"
          >
            <XMarkIcon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      )}

      {/* Logo */}
      <div className="px-6 py-8">
        <Link href="/dashboard" className="flex items-center gap-3" onClick={onClose}>
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center shadow-lg">
            <WalletIcon className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-display font-bold text-slate-900 dark:text-white">
            FinanceTracker
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 pb-4">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative
                    ${isActive 
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-accent/80 hover:text-slate-900 dark:hover:text-white'
                    }
                  `}
                >
                  <Icon 
                    className={`
                      h-5 w-5 transition-colors
                      ${isActive 
                        ? 'text-white' 
                        : 'text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
                      }
                    `}
                  />
                  <span className="font-medium">{item.name}</span>
                  
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-indicator"
                      className="absolute right-3 h-6 w-1 bg-white rounded-full shadow-md"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User Section */}
      <div className="border-t border-border p-4 space-y-4">
        {/* User Info */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-accent/80 transition-colors">
          <Avatar 
            name={user?.name || 'User'} 
            email={user?.email}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-900 dark:text-white truncate">
              {user?.name || 'Guest User'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {user?.email || 'guest@finance.com'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="flex-1"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <SunIcon className="h-4 w-4 text-yellow-500" />
            ) : (
              <MoonIcon className="h-4 w-4 text-slate-600" />
            )}
          </Button>
          
          <Button
            variant="danger"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex-1"
            aria-label="Logout"
          >
            {isLoggingOut ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <LogOutIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
