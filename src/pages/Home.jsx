import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/Button'
import ThemeToggle from '../components/ThemeToggle'
import { Package, BarChart3, Users, Shield } from 'lucide-react'

export default function Home() {
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

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-slate-50 mb-4">
            StockGuard
          </h1>
          <p className="text-xl text-gray-600 dark:text-slate-400 mb-8">
            Inventory & Sales Tracking for Ugandan Small Businesses
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" size="lg">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card p-6 text-center">
            <Package className="w-12 h-12 text-blue-500 dark:text-purple-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-50 mb-2">
              Inventory Management
            </h3>
            <p className="text-gray-600 dark:text-slate-400">
              Track your stock levels in real-time
            </p>
          </div>

          <div className="card p-6 text-center">
            <BarChart3 className="w-12 h-12 text-blue-500 dark:text-purple-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-50 mb-2">
              Sales Analytics
            </h3>
            <p className="text-gray-600 dark:text-slate-400">
              Make data-driven decisions
            </p>
          </div>

          <div className="card p-6 text-center">
            <Users className="w-12 h-12 text-blue-500 dark:text-purple-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-50 mb-2">
              Team Collaboration
            </h3>
            <p className="text-gray-600 dark:text-slate-400">
              Work with your team seamlessly
            </p>
          </div>

          <div className="card p-6 text-center">
            <Shield className="w-12 h-12 text-blue-500 dark:text-purple-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-50 mb-2">
              Secure & Reliable
            </h3>
            <p className="text-gray-600 dark:text-slate-400">
              Your data is safe with us
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

