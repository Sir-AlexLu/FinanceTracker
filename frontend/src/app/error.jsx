// src/app/error.jsx
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/atoms/Button'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Log to error reporting service
    console.error('Global error:', error)
  }, [error])

  return (
    <html>
      <body className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center max-w-md p-8 glass-neumorph rounded-3xl">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-3xl font-display font-bold mb-4">Something went wrong</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {error.message || 'An unexpected error occurred'}
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={reset} variant="primary">
              Try Again
            </Button>
            <Button onClick={() => window.location.href = '/'} variant="ghost">
              Go Home
            </Button>
          </div>
        </div>
      </body>
    </html>
  )
}
