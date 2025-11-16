'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  HomeIcon, WalletIcon, PlusCircleIcon, BarChart3Icon, UserIcon 
} from 'lucide-react'
import { Button } from '@/components/atoms/Button'

const navItems = [
  { href: '/dashboard', icon: HomeIcon, label: 'Home' },
  { href: '/dashboard/accounts', icon: WalletIcon, label: 'Accounts' },
  { href: '/dashboard/transactions', icon: PlusCircleIcon, label: 'Add', special: true },
  { href: '/dashboard/analytics', icon: BarChart3Icon, label: 'Analytics' },
  { href: '/dashboard/profile', icon: UserIcon, label: 'Profile' },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden pointer-events-none">
      <div className="glass-neumorph pointer-events-auto mx-4 mb-4 rounded-2xl p-2 shadow-2xl">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center justify-center py-2 flex-1"
              >
                {item.special ? (
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="bg-gradient-to-r from-primary-500 to-purple-500 text-white p-3 rounded-full shadow-xl -mt-8 ring-4 ring-white dark:ring-slate-900"
                  >
                    <Icon className="h-6 w-6" />
                  </motion.div>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`
                      relative rounded-xl transition-all
                      ${isActive 
                        ? 'text-primary-600 dark:text-primary-400' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    {isActive && (
                      <motion.div
                        layoutId="mobile-nav-indicator"
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 bg-primary-600 rounded-full"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </Button>
                )}
                {!item.special && (
                  <span className={`
                    text-xs mt-1 transition-colors
                    ${isActive 
                      ? 'text-primary-600 dark:text-primary-400 font-semibold' 
                      : 'text-slate-500 dark:text-slate-400'
                    }
                  `}>
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
