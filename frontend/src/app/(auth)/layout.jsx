'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import useAuthStore from '@/store/authStore'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet } from 'lucide-react'

export default function AuthLayout({ children }) {
  const router = useRouter()
  const { isAuthenticated, isLoading, initialize } = useAuthStore()
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    const init = async () => {
      await initialize() // Ensure auth state is loaded
      setIsInitializing(false)
    }
    init()
  }, [initialize])

  useEffect(() => {
    if (!isInitializing && !isLoading && isAuthenticated) {
      router.replace('/dashboard') // Use replace to avoid back button loop
    }
  }, [isAuthenticated, isLoading, isInitializing, router])

  // Show loading while initializing or checking auth
  if (isInitializing || isLoading) {
    return <AuthLoadingScreen />
  }

  // If authenticated, prevent rendering auth pages
  if (isAuthenticated) {
    return null
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="auth-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        className="min-h-screen"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// Separate loading component for clarity
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
          Preparing your experience...
        </motion.p>
      </motion.div>
    </div>
  )
}
