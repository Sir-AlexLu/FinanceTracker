// File: FinanceTracker/frontend/app/page.js
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  ArrowRight, 
  BarChart3, 
  DollarSign, 
  PieChart, 
  TrendingUp,
  Shield,
  Zap
} from 'lucide-react'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="px-4 py-20 md:py-32 bg-gradient-to-b from-primary/10 to-background">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Take Control of Your Finances
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Track expenses, monitor income, and visualize your financial journey with powerful analytics and insights.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-20 bg-background">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Everything You Need to Manage Money
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<DollarSign className="h-10 w-10 text-primary" />}
              title="Track Transactions"
              description="Record income and expenses with categories for better organization"
            />
            <FeatureCard
              icon={<PieChart className="h-10 w-10 text-primary" />}
              title="Visual Analytics"
              description="Beautiful charts and graphs to understand your spending patterns"
            />
            <FeatureCard
              icon={<TrendingUp className="h-10 w-10 text-primary" />}
              title="Financial Insights"
              description="Get monthly summaries and track your financial progress"
            />
            <FeatureCard
              icon={<Shield className="h-10 w-10 text-primary" />}
              title="Secure & Private"
              description="Your data is encrypted and secure with enterprise-grade security"
            />
            <FeatureCard
              icon={<Zap className="h-10 w-10 text-primary" />}
              title="Lightning Fast"
              description="Built with performance in mind for the best user experience"
            />
            <FeatureCard
              icon={<BarChart3 className="h-10 w-10 text-primary" />}
              title="Detailed Reports"
              description="Generate comprehensive reports for better financial planning"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 bg-primary/5">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Start Your Financial Journey Today
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already taking control of their finances with FinanceTracker.
          </p>
          <Link href="/register">
            <Button size="lg" className="gap-2">
              Create Free Account
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
