'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import Link from 'next/link'
import { ArrowRightIcon, SparklesIcon, ShieldIcon, ChartIcon, WalletIcon, MobileIcon } from '@heroicons/react/24/solid'

const features = [
  {
    icon: ShieldIcon,
    title: 'Bank-Level Security',
    description: 'End-to-end encryption, 2FA, and biometric authentication keep your data safe.',
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    icon: ChartIcon,
    title: 'AI-Powered Analytics',
    description: 'Get insights into your spending patterns with machine learning predictions.',
    gradient: 'from-purple-500 to-purple-600',
  },
  {
    icon: WalletIcon,
    title: 'Multi-Account Support',
    description: 'Manage all your accounts in one beautiful dashboard. Cash, bank, investments.',
    gradient: 'from-green-500 to-green-600',
  },
  {
    icon: MobileIcon,
    title: 'Mobile-First Design',
    description: 'Native app experience on your phone. Smooth, fast, and offline-ready.',
    gradient: 'from-amber-500 to-amber-600',
  },
]

export default function Home() {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: containerRef })
  const y = useTransform(scrollYProgress, [0, 1], [0, -100])

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <motion.div
          animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute top-0 left-0 w-96 h-96 bg-primary-500 rounded-full blur-3xl opacity-10"
        />
        <motion.div
          animate={{ x: [0, -100, 0], y: [0, -50, 0] }}
          transition={{ duration: 20, repeat: Infinity, delay: 5 }}
          className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-10"
        />
      </div>

      {/* Hero */}
      <motion.section
        style={{ y }}
        className="min-h-screen flex items-center justify-center px-4 py-20"
      >
        <div className="text-center max-w-5xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-display font-bold mb-6"
          >
            <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              Master Your Money
            </span>
            <br />
            <span className="text-slate-900 dark:text-white">With Style</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-10"
          >
            The most beautiful way to track your finances. Built for modern life.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/register">
              <Button variant="primary" size="xl" icon={ArrowRightIcon}>
                Start Free Trial
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="xl">
                Sign In
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-20 flex items-center justify-center gap-6 text-slate-500"
          >
            <SparklesIcon className="h-6 w-6 text-yellow-500" />
            <span>No credit card required • 30-day free trial</span>
          </motion.div>
        </div>
      </motion.section>

      {/* Features */}
      <section className="py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-display font-bold text-center mb-20"
          >
            Why You'll Love It
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="glass-neumorph p-8 rounded-3xl group"
              >
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                  className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${feature.gradient} 
                             flex items-center justify-center mb-6 group-hover:shadow-xl
                             transition-shadow`}
                >
                  <feature.icon className="h-8 w-8 text-white" />
                </motion.div>
                <h3 className="text-2xl font-display font-bold mb-4 group-hover:text-primary-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-4 bg-gradient-to-br from-primary-50 to-purple-50 dark:from-slate-800 dark:to-slate-900">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-display font-bold mb-8"
          >
            Ready to Transform Your Finances?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xl text-slate-600 dark:text-slate-300 mb-12"
          >
            Join 50,000+ users who've already taken control of their money.
          </motion.p>
          <Link href="/register">
            <Button variant="primary" size="xl">
              Get Started Free →
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

function Button({ children, variant = 'primary', size = 'md', icon: Icon, ...props }) {
  const variants = {
    primary: 'bg-gradient-to-r from-primary-500 to-purple-500 text-white hover:from-primary-600 hover:to-purple-600 shadow-lg shadow-primary-500/25',
    outline: 'border-2 border-primary-500 text-primary-600 hover:bg-primary-50 dark:hover:bg-slate-800',
  }
  
  const sizes = {
    md: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl',
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`${variants[variant]} ${sizes[size]} rounded-2xl font-semibold inline-flex items-center gap-2 transition-all`}
      {...props}
    >
      {Icon && <Icon className="h-5 w-5" />}
      {children}
    </motion.button>
  )
}
