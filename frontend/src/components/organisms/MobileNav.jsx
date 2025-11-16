'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  HomeIcon, WalletIcon, PlusIcon, ChartBarIcon, UserIcon 
} from '@heroicons/react/24/outline'

const navItems = [
  { href: '/dashboard', icon: HomeIcon, label: 'Home' },
  { href: '/dashboard/accounts', icon: WalletIcon, label: 'Accounts' },
  { href: '/dashboard/transactions', icon: PlusIcon, label: 'Add', special: true },
  { href: '/dashboard/analytics', icon: ChartBarIcon, label: 'Analytics' },
  { href: '/dashboard/profile', icon: UserIcon, label: 'Profile' },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="glass-neumorph mx-4 mb-4 rounded-2xl p-2">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center justify-center"
              >
                {item.special ? (
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="bg-gradient-to-r from-primary-500 to-purple-500 text-white p-3 rounded-2xl shadow-lg -mt-6"
                  >
                    <Icon className="h-6 w-6" />
                  </motion.div>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`${isActive ? 'text-primary-600' : 'text-slate-600 dark:text-slate-400'}`}
                  >
                    <Icon className="h-5 w-5" />
                    {isActive && (
                      <motion.div
                        layoutId="mobile-indicator"
                        className="absolute -bottom-1 h-1 w-1 bg-primary-600 rounded-full"
                      />
                    )}
                  </Button>
                )}
                {!item.special && (
                  <span className={`text-xs mt-1 ${isActive ? 'text-primary-600 font-medium' : 'text-slate-500'}`}>
                    {item.label}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

import { Button } from '@/components/atoms/Button'
