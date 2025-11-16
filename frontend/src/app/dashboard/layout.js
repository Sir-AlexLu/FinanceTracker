'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useAuthStore from '@/store/authStore'
import Layout from '@/components/Layout'

export default function DashboardLayout({ children }) {
  const router = useRouter()
  const { isAuthenticated, token } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated && !token) {
      router.push('/login')
    }
  }, [isAuthenticated, token, router])

  if (!isAuthenticated && !token) {
    return null
  }

  return <Layout>{children}</Layout>
}
