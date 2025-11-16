'use client'

import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  fullWidth = false,
  icon: Icon,
  className,
  ...props
}, ref) => {
  const variants = {
    primary: 'bg-gradient-to-r from-primary-500 to-purple-500 text-white hover:from-primary-600 hover:to-purple-600 shadow-lg',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
    outline: 'border-2 border-primary-500 text-primary-600 hover:bg-primary-50 dark:hover:bg-slate-800',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl',
    icon: 'p-2',
  }

  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: (disabled || isLoading) ? 1 : 0.95 }}
      whileHover={{ scale: (disabled || isLoading) ? 1 : 1.02 }}
      className={cn(
        'relative inline-flex items-center justify-center rounded-xl font-medium',
        'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        fullWidth && 'w-full',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
        </motion.div>
      )}
      <span className={cn('flex items-center gap-2', isLoading && 'opacity-0')}>
        {Icon && <Icon className={cn('h-5 w-5', size === 'sm' && 'h-4 w-4')} />}
        {children}
      </span>
    </motion.button>
  )
})

Button.displayName = 'Button'
