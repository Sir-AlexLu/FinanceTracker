// frontend/src/app/page.js
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { WalletIcon, ChartBarIcon, ArrowPathIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

const features = [
  {
    name: 'Smart Accounts',
    description: 'Manage multiple accounts with real-time balance updates and intelligent categorization.',
    icon: WalletIcon,
    color: 'bg-blue-500',
  },
  {
    name: 'AI Analytics',
    description: 'Get insights into spending patterns with predictive analytics and trend forecasting.',
    icon: ChartBarIcon,
    color: 'bg-green-500',
  },
  {
    name: 'Auto Sync',
    description: 'Automatically sync transactions and get notified of unusual spending activity.',
    icon: ArrowPathIcon,
    color: 'bg-purple-500',
  },
  {
    name: 'Bank-Level Security',
    description: 'End-to-end encryption, 2FA, and biometric authentication keep your data safe.',
    icon: ShieldCheckIcon,
    color: 'bg-red-500',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100 },
  },
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-card/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <WalletIcon className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">FinanceTracker</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center"
      >
        <motion.h1
          variants={itemVariants}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent"
        >
          Take Control of Your <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Financial Future
          </span>
        </motion.h1>
        <motion.p
          variants={itemVariants}
          className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto"
        >
          Track, analyze, and optimize your finances with AI-powered insights. 
          Beautifully designed, incredibly fast, and built for modern life.
        </motion.p>
        <motion.div variants={itemVariants} className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="bg-primary text-primary-foreground px-8 py-4 rounded-xl font-semibold text-lg hover:bg-primary/90 transition-transform hover:scale-105 shadow-lg"
          >
            Start Free Today →
          </Link>
          <Link
            href="/login"
            className="border border-input bg-background px-8 py-4 rounded-xl font-semibold text-lg hover:bg-accent transition-transform hover:scale-105"
          >
            Sign In to Dashboard
          </Link>
        </motion.div>
      </motion.section>

      {/* Features Grid */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
      >
        <motion.h2 variants={itemVariants} className="text-3xl font-bold text-center mb-12">
          Why Choose FinanceTracker?
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.name}
              variants={itemVariants}
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-card p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`h-12 w-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}>
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.name}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bg-primary/5 border-t border-border py-16"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2 variants={itemVariants} className="text-3xl font-bold mb-4">
            Ready to Transform Your Finances?
          </motion.h2>
          <motion.p variants={itemVariants} className="text-muted-foreground mb-8">
            Join 10,000+ users who've already taken control of their money.
          </motion.p>
          <motion.div variants={itemVariants}>
            <Link
              href="/register"
              className="bg-primary text-primary-foreground px-8 py-4 rounded-xl font-semibold text-lg hover:bg-primary/90 transition-transform hover:scale-105 shadow-lg inline-block"
            >
              Get Started Free →
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-muted-foreground">
            © 2024 FinanceTracker. Built with ❤️ and modern tech.
          </p>
        </div>
      </footer>
    </div>
  )
}
