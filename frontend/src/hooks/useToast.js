import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

export { toast }

// Custom toast wrapper with animations
export const showToast = (message, type = 'info') => {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  }

  return toast.custom((t) => (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="glass-neumorph p-4 rounded-2xl max-w-md"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icons[type]}</span>
        <div className="flex-1">
          <p className="font-medium text-slate-900 dark:text-white">{message}</p>
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="text-slate-400 hover:text-slate-600"
        >
          ×
        </button>
      </div>
    </motion.div>
  ), {
    duration: 4000,
    position: 'top-center',
  })
}
