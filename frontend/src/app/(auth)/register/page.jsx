// src/app/(auth)/register/page.jsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { toast } from '@/hooks/useToast'
import useAuthStore from '@/store/authStore'
import { authAPI } from '@/lib/api-safe'
import { Input } from '@/components/atoms/Input'
import { Button } from '@/components/atoms/Button'
import { Mail, User, Lock, CheckCircle } from 'lucide-react'
import Link from 'next/link'

const formVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export default function RegisterPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)

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

  useEffect(() => {
    // Calculate password strength
    let strength = 0
    if (password.length >= 8) strength += 25
    if (/[a-z]/.test(password)) strength += 25
    if (/[A-Z]/.test(password)) strength += 25
    if (/[0-9]/.test(password)) strength += 25
    setPasswordStrength(strength)
  }, [password])

  const onSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setIsLoading(true)
    
    try {
      const response = await authAPI.register(data)
      
      if (response.success) {
        setAuth(response.data.user, response.data.token)
        toast.success('Account created successfully!')
        
        setTimeout(() => {
          router.push('/dashboard')
          reset()
        }, 500)
      } else {
        toast.error(response.error)
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 25) return 'bg-red-500'
    if (passwordStrength <= 50) return 'bg-yellow-500'
    if (passwordStrength <= 75) return 'bg-blue-500'
    return 'bg-green-500'
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-slate-50 via-primary-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-primary-500 to-purple-500 mb-6">
            <User className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold mb-2">Create Account</h1>
          <p className="text-slate-600 dark:text-slate-400">Start your financial journey</p>
        </motion.div>

        {/* Form */}
        <motion.form
          variants={formVariants}
          initial="hidden"
          animate="visible"
          onSubmit={handleSubmit(onSubmit)}
          className="glass-neumorph p-8 space-y-6"
        >
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
            />
          </motion.div>

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
                  message: 'Invalid email address',
                },
              })}
              placeholder="you@example.com"
              disabled={isLoading}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <Input
              label="Password"
              type="password"
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
            />

            {/* Password Strength */}
            {password && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Password Strength</span>
                  <span>{passwordStrength}%</span>
                </div>
                <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${passwordStrength}%` }}
                    className={`h-full ${getPasswordStrengthColor()}`}
                  />
                </div>
              </div>
            )}
          </motion.div>

          <motion.div variants={itemVariants}>
            <Input
              label="Confirm Password"
              type="password"
              icon={Lock}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) => value === password || 'Passwords do not match',
              })}
              placeholder="••••••••"
              disabled={isLoading}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </motion.div>

          {/* Footer */}
          <motion.div variants={itemVariants} className="text-center">
            <p className="text-slate-600 dark:text-slate-400">
              Already have an account?{' '}
              <Link href="/login" className="text-primary-600 hover:underline font-medium">
                Sign in instead
              </Link>
            </p>
          </motion.div>
        </motion.form>
      </motion.div>
    </div>
  )
}
