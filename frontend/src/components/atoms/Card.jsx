'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

export const Card = forwardRef(({ children, className, ...props }, ref) => (
  <motion.div
    ref={ref}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -2, scale: 1.01 }}
    transition={{ type: 'spring', stiffness: 300 }}
    className={cn(
      'glass-neumorph glass-neumorph-dark p-6 rounded-2xl',
      className
    )}
    {...props}
  >
    {children}
  </motion.div>
))

export const CardHeader = ({ children, className }) => (
  <div className={cn('flex items-center justify-between mb-4', className)}>
    {children}
  </div>
)

export const CardTitle = ({ children, className }) => (
  <h3 className={cn('text-2xl font-display font-bold', className)}>
    {children}
  </h3>
)

export const CardContent = ({ children, className }) => (
  <div className={cn('', className)}>{children}</div>
)

export const CardFooter = ({ children, className }) => (
  <div className={cn('mt-6 pt-4 border-t border-border', className)}>
    {children}
  </div>
)
