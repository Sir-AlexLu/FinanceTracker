'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import useAuthStore from '@/store/authStore'
import { motion, AnimatePresence } from 'framer-motion'

export default function AuthLayout({ children }) {
  const router = useRouter()
  const { isAuthenticated, isLoading, initialize } = useAuthStore()
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    // Initialize auth from localStorage
    initialize()
    
    // Check if user is already logged in
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard')
    } else {
      setCheckingAuth(false)
    }
  }, [isAuthenticated, isLoading, router, initialize])

  if (checkingAuth) {
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

  if (isAuthenticated) {
    return null // Prevent rendering auth pages when logged in
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
