'use client'

import { useState, useEffect } from 'react'
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
  Mail, User, Lock, Eye, EyeOff, CheckCircle, Wallet 
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

export default function RegisterPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const password = watch('password')
  const confirmPassword = watch('confirmPassword')

  // Calculate password strength
  useEffect(() => {
    let strength = 0
    if (password.length >= 8) strength += 25
    if (/[a-z]/.test(password)) strength += 25
    if (/[A-Z]/.test(password)) strength += 25
    if (/[0-9]/.test(password)) strength += 25
    if (/[^A-Za-z0-9]/.test(password)) strength += 25
    setPasswordStrength(Math.min(strength, 100))
  }, [password])

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 25) return 'bg-red-500'
    if (passwordStrength <= 50) return 'bg-orange-500'
    if (passwordStrength <= 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getPasswordStrengthLabel = () => {
    if (passwordStrength <= 25) return 'Weak'
    if (passwordStrength <= 50) return 'Fair'
    if (passwordStrength <= 75) return 'Good'
    return 'Strong'
  }

  const onSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setIsLoading(true)
    
    try {
      const response = await authAPI.register({
        name: data.name,
        email: data.email,
        password: data.password,
      })
      
      if (response.success) {
        setAuth(response.data.user, response.data.token)
        toast.success('Account created! Welcome aboard!')
        
        setTimeout(() => {
          router.push('/dashboard')
          reset()
        }, 600)
      } else {
        toast.error(response.error || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)
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
            Create Account
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Start your financial journey today
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
          {/* Name */}
          <motion.div variants={itemVariants}>
            <Input
              label="Full Name"
              icon={User}
              error={errors.name?.message}
              {...register('name', {
                required: 'Name is required',
                minLength: {
                  value: 2,
                  message: 'Name must be at least 2 characters',
                },
              })}
              placeholder="John Doe"
              disabled={isLoading}
              autoComplete="name"
            />
          </motion.div>

          {/* Email */}
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

          {/* Password */}
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
                autoComplete="new-password"
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

            {/* Password Strength */}
            {password && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-500 dark:text-slate-400">
                    Password Strength
                  </span>
                  <span className={`font-medium ${getPasswordStrengthColor().replace('bg-', 'text-')}`}>
                    {getPasswordStrengthLabel()}
                  </span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${passwordStrength}%` }}
                    transition={{ duration: 0.3 }}
                    className={`h-full ${getPasswordStrengthColor()} transition-colors`}
                  />
                </div>
                {passwordStrength < 75 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Try adding uppercase, numbers, and symbols
                  </p>
                )}
              </motion.div>
            )}
          </motion.div>

          {/* Confirm Password */}
          <motion.div variants={itemVariants}>
            <div className="relative">
              <Input
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                icon={confirmPassword && confirmPassword === password ? CheckCircle : Lock}
                error={errors.confirmPassword?.message}
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => value === password || 'Passwords do not match',
                })}
                placeholder="••••••••"
                disabled={isLoading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-9 p-2 rounded-lg hover:bg-accent/80 transition-colors"
                disabled={isLoading}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-slate-500" />
                ) : (
                  <Eye className="h-4 w-4 text-slate-500" />
                )}
              </button>
            </div>
          </motion.div>

          {/* Submit */}
          <motion.div variants={itemVariants}>
            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
              disabled={isLoading || passwordStrength < 50}
              size="lg"
              className="font-medium"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </motion.div>

          {/* Footer */}
          <motion.div variants={itemVariants} className="text-center pt-2">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Already have an account?{' '}
              <Link 
                href="/login" 
                className="font-semibold text-primary-600 hover:text-primary-700 dark:hover:text-primary-400 transition-colors underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </motion.div>
        </motion.form>
      </motion.div>
    </div>
  )
}
