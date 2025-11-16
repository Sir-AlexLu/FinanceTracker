'use client'

import toast, { Toaster } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, ExclamationCircle, InformationCircle, XMarkIcon } from '@heroicons/react/24/solid'

const notificationVariants = {
  initial: { opacity: 0, y: -50, scale: 0.9 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 50, scale: 0.9 },
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: ExclamationCircle,
  info: InformationCircle,
}

export function Notifications() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        className: 'bg-card text-foreground border border-border shadow-lg',
      }}
    >
      {(t) => {
        const Icon = icons[t.type] || InformationCircle
        return (
          <motion.div
            variants={notificationVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex items-center gap-3 p-4 rounded-lg shadow-lg bg-card border border-border max-w-md"
          >
            <Icon className={`h-6 w-6 ${
              t.type === 'success' ? 'text-green-500' :
              t.type === 'error' ? 'text-red-500' :
              t.type === 'warning' ? 'text-yellow-500' : 'text-blue-500'
            }`} />
            <div className="flex-1">
              <p className="font-semibold text-sm">{t.message}</p>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-muted-foreground hover:text-foreground"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </motion.div>
        )
      }}
    </Toaster>
  )
}

export { toast }
