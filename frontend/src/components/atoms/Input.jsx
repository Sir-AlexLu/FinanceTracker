'use client'

import { forwardRef, useState, useId } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Eye, EyeOff } from 'lucide-react'

export const Input = forwardRef(({
  label,
  type = 'text',
  error,
  helperText,
  icon: Icon,
  className,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const id = useId()

  const isPassword = type === 'password'
  const inputType = isPassword && showPassword ? 'text' : type

  return (
    <div className="relative w-full">
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10">
            <Icon className="h-5 w-5" />
          </div>
        )}

        <input
          ref={ref}
          id={id}
          type={inputType}
          className={cn(
            'peer w-full rounded-xl border bg-white dark:bg-slate-800',
            'px-4 py-3 text-slate-900 dark:text-slate-100',
            'placeholder:transparent focus:outline-none focus:ring-2 focus:ring-primary-500',
            'disabled:cursor-not-allowed disabled:bg-slate-50 dark:disabled:bg-slate-700',
            Icon && 'pl-11',
            'pr-4',
            error && 'border-red-500 focus:ring-red-500',
            !error && 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500',
            className
          )}
          placeholder=" "
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        <label
          htmlFor={id}
          className={cn(
            'absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400',
            'transition-all duration-200 pointer-events-none',
            'peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base',
            'peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary-600',
            (isFocused || props.value) && 'top-2 text-xs',
            Icon && 'pl-8'
          )}
        >
          {label}
        </label>

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 z-10"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>

      {(error || helperText) && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'mt-1.5 text-sm',
            error ? 'text-red-600' : 'text-slate-500 dark:text-slate-400'
          )}
        >
          {error || helperText}
        </motion.p>
      )}
    </div>
  )
})

Input.displayName = 'Input'
