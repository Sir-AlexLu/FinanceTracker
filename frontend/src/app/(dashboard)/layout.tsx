'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import useAuthStore from '@/store/authStore'
import { Toaster } from 'react-hot-toast'
import { MenuIcon, XMarkIcon, SunIcon, MoonIcon, Wallet } from 'lucide-react'
import { Sidebar } from '@/components/organisms/Sidebar'
import { MobileNav } from '@/components/organisms/MobileNav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading, initialize, theme, setTheme } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    initialize()
    setIsReady(true)
  }, [initialize])

  useEffect(() => {
    if (isReady && !isLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isAuthenticated, isLoading, isReady, router])

  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  if (!isReady || isLoading) {
    return <AuthLoadingScreen />
  }

  if (!isAuthenticated) {
    return null
  }

  const pageTitle = pathname.split('/').pop()
  const formattedTitle = pageTitle
    ? pageTitle.charAt(0).toUpperCase() + pageTitle.slice(1)
    : 'Dashboard'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <Toaster position="top-right" />

      <div className="flex">
        <aside className="hidden lg:block w-72">
          <Sidebar />
        </aside>

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

        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 180 }}
              className="fixed left-0 top-0 z-50 h-full w-72 lg:hidden shadow-2xl"
            >
              <Sidebar onClose={() => setSidebarOpen(false)} />
            </motion.aside>
          )}
        </AnimatePresence>

        <div className="flex-1 flex flex-col min-h-screen">
          <header className="sticky top-0 z-30 glass-neumorph border-b border-border px-4 py-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-accent/80 transition-colors"
                aria-label="Open menu"
              >
                <MenuIcon className="h-6 w-6 text-slate-700 dark:text-slate-300" />
              </button>

              <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                {formattedTitle}
              </h1>

              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </main>

          <MobileNav />
        </div>
      </div>
    </div>
  )
}

function AuthLoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-slate-50 via-primary-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-primary-500 to-purple-500 mb-6 shadow-xl">
          <Wallet className="h-8 w-8 text-white" />
        </div>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          className="h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-sm text-slate-600 dark:text-slate-400 font-medium"
        >
          Loading your dashboard...
        </motion.p>
      </motion.div>
    </div>
  )
}

function ThemeToggle() {
  const { theme, setTheme } = useAuthStore()

  const toggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg hover:bg-accent/80 transition-colors"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <SunIcon className="h-5 w-5 text-yellow-500" />
      ) : (
        <MoonIcon className="h-5 w-5 text-slate-600" />
      )}
    </button>
  )
}
