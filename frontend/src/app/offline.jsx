// src/app/offline.jsx
import { Button } from '@/components/atoms/Button'
import { WifiIcon } from '@heroicons/react/24/outline'

export default function Offline() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="text-center max-w-md p-8 glass-neumorph rounded-3xl">
        <WifiIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-3xl font-display font-bold mb-4">You're Offline</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Please check your internet connection and try again.
        </p>
        <Button onClick={() => window.location.reload()} variant="primary">
          Retry
        </Button>
      </div>
    </div>
  )
}
