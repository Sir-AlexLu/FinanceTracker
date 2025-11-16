'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import useAuthStore from '@/store/authStore'
import { useRouter } from 'next/navigation'
import { Toaster } from 'react-hot-toast'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { Sidebar } from '@/components/organisms/Sidebar'
import { MobileNav } from '@/components/organisms/MobileNav'

export default function DashboardLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading, initialize } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Initialize auth on mount
    initialize()
    setIsReady(true)
  }, [initialize])

  useEffect(() => {
    // Protect dashboard routes
    if (!isLoading && isReady && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router, isReady])

  // Handle route changes (close sidebar on mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // Show loading state while checking auth
  if (!isReady || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  // Prevent rendering dashboard if not authenticated
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <Toaster />
      
      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Mobile Sidebar Backdrop */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 180 }}
              className="fixed left-0 top-0 z-50 h-full w-72 lg:hidden"
            >
              <Sidebar onClose={() => setSidebarOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Top Bar */}
          <header className="sticky top-0 z-30 glass-neumorph border-b border-border px-4 py-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-accent"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-semibold capitalize">
                {pathname.split('/').pop() || 'Dashboard'}
              </h1>
              <div className="flex items-center gap-2">
                {/* Theme Toggle */}
                <ThemeToggle />
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              key={pathname}
            >
              {children}
            </motion.div>
          </main>

          {/* Mobile Navigation */}
          <MobileNav />
        </div>
      </div>
    </div>
  )
}

// Theme Toggle Component
function ThemeToggle() {
  const { theme, setTheme } = useAuthStore()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const toggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg hover:bg-accent transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <SunIcon className="h-5 w-5 text-yellow-500" />
      ) : (
        <MoonIcon className="h-5 w-5 text-slate-600" />
      )}
    </button>
  )
}

import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'
