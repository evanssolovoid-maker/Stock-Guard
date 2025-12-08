import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Navigate } from 'react-router-dom'
import Button from '../components/Button'
import ThemeToggle from '../components/ThemeToggle'
import {
  Package,
  BarChart3,
  Users,
  Shield,
  TrendingUp,
  Clock,
  Smartphone,
  CheckCircle,
  ArrowRight,
  DollarSign,
  FileText,
  Zap,
  Globe,
  Lock,
} from 'lucide-react'

export default function Landing() {
  const { user, loading } = useAuth()

  // Show loading state briefly
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-purple-500"></div>
      </div>
    )
  }

  // Redirect to dashboard if logged in
  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const features = [
    {
      icon: Package,
      title: 'Inventory Management',
      description: 'Track your products, quantities, and categories in real-time. Get instant alerts when stock runs low.',
    },
    {
      icon: DollarSign,
      title: 'Sales Tracking',
      description: 'Log sales quickly with multi-item support. Calculate change automatically and track every transaction.',
    },
    {
      icon: BarChart3,
      title: 'Analytics & Insights',
      description: 'View detailed sales reports, revenue trends, and product performance to make data-driven decisions.',
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Add managers and workers with role-based access. Everyone works together seamlessly.',
    },
    {
      icon: Clock,
      title: 'Real-Time Updates',
      description: 'See sales and inventory changes instantly across all devices. No delays, no sync issues.',
    },
    {
      icon: Smartphone,
      title: 'Mobile Responsive',
      description: 'Access your business data from anywhere. Works perfectly on phones, tablets, and desktops.',
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your data is encrypted and secure. Role-based access ensures only authorized users see sensitive information.',
    },
    {
      icon: Zap,
      title: 'Fast & Reliable',
      description: 'Lightning-fast performance powered by modern technology. No lag, no downtime.',
    },
  ]

  const benefits = [
    'Save time with automated inventory tracking',
    'Reduce errors with digital sales logging',
    'Make better decisions with real-time analytics',
    'Grow your team with easy worker management',
    'Access your data from anywhere, anytime',
    'No technical knowledge required - simple and intuitive',
  ]

  const useCases = [
    {
      title: 'Retail Stores',
      description: 'Perfect for retail shops tracking daily sales and inventory levels.',
    },
    {
      title: 'Small Businesses',
      description: 'Ideal for small businesses managing products and sales without complex systems.',
    },
    {
      title: 'Market Vendors',
      description: 'Great for market vendors tracking multiple products and daily transactions.',
    },
    {
      title: 'Service Providers',
      description: 'Track services, products, and sales all in one place.',
    },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Package className="w-8 h-8 text-blue-500 dark:text-purple-500" />
              <span className="text-xl font-bold text-gray-900 dark:text-slate-50">
                StockGuard
              </span>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link to="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-slate-50 mb-6">
            Manage Your Inventory & Sales
            <br />
            <span className="text-blue-500 dark:text-purple-500">
              Like a Pro
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-slate-400 mb-8 max-w-3xl mx-auto">
            StockGuard is a modern inventory and sales tracking system designed
            for Ugandan small businesses. Track products, log sales, and grow
            your business with powerful analytics.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 dark:bg-slate-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-slate-50 mb-4">
              Everything You Need to Manage Your Business
            </h2>
            <p className="text-xl text-gray-600 dark:text-slate-400">
              Powerful features designed for small businesses
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="card p-6 hover:shadow-lg transition-shadow"
              >
                <feature.icon className="w-12 h-12 text-blue-500 dark:text-purple-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-50 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-slate-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-slate-50 mb-6">
                Why Choose StockGuard?
              </h2>
              <p className="text-xl text-gray-600 dark:text-slate-400 mb-8">
                StockGuard helps you streamline your business operations and
                make informed decisions with real-time data and insights.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-lg text-gray-700 dark:text-slate-300">
                      {benefit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card p-8 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-800 dark:to-purple-900">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <TrendingUp className="w-12 h-12 text-blue-500 dark:text-purple-500" />
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-50">
                      Real-Time Analytics
                    </h3>
                    <p className="text-gray-600 dark:text-slate-400">
                      Track your business performance instantly
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <FileText className="w-12 h-12 text-blue-500 dark:text-purple-500" />
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-50">
                      Easy Reporting
                    </h3>
                    <p className="text-gray-600 dark:text-slate-400">
                      Generate reports with date range filtering
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Globe className="w-12 h-12 text-blue-500 dark:text-purple-500" />
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-50">
                      Cloud-Based
                    </h3>
                    <p className="text-gray-600 dark:text-slate-400">
                      Access from anywhere, no installation needed
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="bg-gray-50 dark:bg-slate-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-slate-50 mb-4">
              Perfect For Your Business Type
            </h2>
            <p className="text-xl text-gray-600 dark:text-slate-400">
              Whether you run a retail store or a market stall, StockGuard works
              for you
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((useCase, index) => (
              <div key={index} className="card p-6 text-center">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-50 mb-3">
                  {useCase.title}
                </h3>
                <p className="text-gray-600 dark:text-slate-400">
                  {useCase.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Privacy Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card p-12 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-purple-900">
            <div className="max-w-3xl mx-auto text-center">
              <Lock className="w-16 h-16 text-blue-500 dark:text-purple-500 mx-auto mb-6" />
              <h2 className="text-4xl font-bold text-gray-900 dark:text-slate-50 mb-4">
                Your Data is Safe & Secure
              </h2>
              <p className="text-xl text-gray-600 dark:text-slate-400 mb-8">
                StockGuard uses industry-standard encryption and security
                practices. Your business data is protected with role-based
                access control, ensuring only authorized users can access
                sensitive information.
              </p>
              <div className="flex flex-wrap justify-center gap-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" />
                  <span className="text-gray-700 dark:text-slate-300">
                    Encrypted Data Storage
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" />
                  <span className="text-gray-700 dark:text-slate-300">
                    Role-Based Access Control
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" />
                  <span className="text-gray-700 dark:text-slate-300">
                    Regular Backups
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-500 dark:bg-purple-600 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join businesses across Uganda using StockGuard to manage their
            inventory and sales more efficiently.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-white text-white hover:bg-white/10"
              >
                Sign In to Your Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-slate-950 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-6 h-6 text-blue-500 dark:text-purple-500" />
                <span className="text-xl font-bold text-white">StockGuard</span>
              </div>
              <p className="text-sm">
                Modern inventory and sales tracking for Ugandan small businesses.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/signup"
                    className="text-sm hover:text-blue-400 dark:hover:text-purple-400 transition-colors"
                  >
                    Sign Up
                  </Link>
                </li>
                <li>
                  <Link
                    to="/login"
                    className="text-sm hover:text-blue-400 dark:hover:text-purple-400 transition-colors"
                  >
                    Sign In
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Features</h3>
              <ul className="space-y-2 text-sm">
                <li>Inventory Management</li>
                <li>Sales Tracking</li>
                <li>Analytics & Reports</li>
                <li>Team Collaboration</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} StockGuard. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
