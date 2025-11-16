'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { toast } from '@/hooks/useToast'
import useAuthStore from '@/store/authStore'
import { authAPI } from '@/lib/api-safe'
import { Input } from '@/components/atoms/Input'
import { Button } from '@/components/atoms/Button'
import { 
  Mail, Lock, Eye, EyeOff, Wallet 
} from 'lucide-react'

const formVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 },
}

export default function LoginPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data) => {
    setIsLoading(true)
    
    try {
      const response = await authAPI.login(data)
      
      if (response.success) {
        setAuth(response.data.user, response.data.token)
        toast.success('Welcome back! Redirecting...')
        
        // Smooth redirect
        setTimeout(() => {
          router.push('/dashboard')
          reset()
        }, 600)
      } else {
        toast.error(response.error || 'Invalid credentials')
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-slate-50 via-primary-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
        className="w-full max-w-md"
      >
        {/* Logo & Title */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring' }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-primary-500 to-purple-500 mb-6 shadow-xl">
            <Wallet className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-2">
            Welcome Back
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Sign in to continue managing your finances
          </p>
        </motion.div>

        {/* Form */}
        <motion.form
          variants={formVariants}
          initial="hidden"
          animate="visible"
          onSubmit={handleSubmit(onSubmit)}
          className="glass-neumorph p-8 rounded-3xl shadow-2xl space-y-6"
        >
          {/* Email Field */}
          <motion.div variants={itemVariants}>
            <Input
              label="Email Address"
              type="email"
              icon={Mail}
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Please enter a valid email',
                },
              })}
              placeholder="you@example.com"
              disabled={isLoading}
              autoComplete="email"
            />
          </motion.div>

          {/* Password Field with Toggle */}
          <motion.div variants={itemVariants}>
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                icon={Lock}
                error={errors.password?.message}
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
                placeholder="••••••••"
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 p-2 rounded-lg hover:bg-accent/80 transition-colors"
                disabled={isLoading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-slate-500" />
                ) : (
                  <Eye className="h-4 w-4 text-slate-500" />
                )}
              </button>
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.div variants={itemVariants}>
            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
              disabled={isLoading}
              size="lg"
              className="font-medium"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </motion.div>

          {/* Footer */}
          <motion.div variants={itemVariants} className="text-center pt-2">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Don't have an account?{' '}
              <Link 
                href="/register" 
                className="font-semibold text-primary-600 hover:text-primary-700 dark:hover:text-primary-400 transition-colors underline-offset-4 hover:underline"
              >
                Sign up free
              </Link>
            </p>
          </motion.div>
        </motion.form>

        {/* Optional: Demo Credentials */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-6 text-xs text-slate-500 dark:text-slate-400"
        >
          Demo: <span className="font-mono">demo@finance.com</span> /{' '}
          <span className="font-mono">password</span>
        </motion.p>
      </motion.div>
    </div>
  )
}
