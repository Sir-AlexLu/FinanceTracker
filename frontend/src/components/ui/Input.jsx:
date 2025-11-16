import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

export function Input({ className, error, icon: Icon, ...props }) {
  return (
    <div className="relative">
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <motion.input
        whileFocus={{ scale: 1.01 }}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2',
          'text-sm ring-offset-background placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          Icon && 'pl-10',
          error && 'border-destructive focus-visible:ring-destructive',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}
    </div>
  )
}
