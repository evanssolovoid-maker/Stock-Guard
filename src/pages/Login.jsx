import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'react-hot-toast'
import AuthLayout from '../components/AuthLayout'
import Input from '../components/Input'
import Button from '../components/Button'
import BusinessSelector from '../components/BusinessSelector'
import { User, Lock, Briefcase, UserCog, UserPlus } from 'lucide-react'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('owner')
  const [businessName, setBusinessName] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [justLoggedIn, setJustLoggedIn] = useState(false)
  const { signIn, user, profile, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  // Redirect to dashboard if already logged in OR after successful login
  useEffect(() => {
    // Don't redirect if we're still loading auth
    if (authLoading) return

    // If we have user, navigate based on role (use profile.role if available, otherwise user.role)
    if (user) {
      const userRole = profile?.role || user.role
      if (userRole === 'owner') {
        navigate('/dashboard', { replace: true })
      } else if (userRole === 'manager') {
        navigate('/manager-dashboard', { replace: true })
      } else if (userRole === 'worker') {
        navigate('/log-sale', { replace: true })
      }
      // Clear loading state if we just logged in
      if (justLoggedIn) {
        setLoading(false)
        setJustLoggedIn(false)
      }
    }
  }, [user, profile, authLoading, justLoggedIn, navigate])

  const validate = () => {
    const newErrors = {}
    if (!username || !username.trim()) {
      newErrors.username = 'Username is required'
    } else if (username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    }
    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 4) {
      newErrors.password = 'Password must be at least 4 characters'
    }
    if (role !== 'owner' && !businessName) {
      newErrors.businessName = 'Please select your company'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      // For owners, business_name is their own; for workers/managers, use selected business
      const businessNameForLogin = role === 'owner' ? null : businessName
      await signIn(username.trim(), password, businessNameForLogin)
      toast.success('Welcome back!')
      setJustLoggedIn(true)
    } catch (error) {
      console.error('Sign in error:', error)
      
      // Provide helpful error messages
      if (error.message?.includes('Invalid username or password') || error.message?.includes('Invalid')) {
        toast.error('Invalid username or password. Please check your credentials and try again.')
      } else if (error.message?.includes('Business') || error.message?.includes('company')) {
        toast.error('Business not found. Please check the company name and try again.')
      } else if (error.message?.includes('Network') || error.message?.includes('fetch')) {
        toast.error('Network error. Please check your internet connection and try again.')
      } else {
        toast.error(error.message || 'Failed to sign in. Please try again.')
      }
      setLoading(false)
      setJustLoggedIn(false)
    }
  }

  return (
    <AuthLayout title="Sign in to your account" subtitle="Welcome back! Please enter your details.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            I am a:
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setRole('owner')
                setBusinessName('')
                setErrors({ ...errors, businessName: undefined })
              }}
              className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                role === 'owner'
                  ? 'border-blue-500 dark:border-purple-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:border-blue-300 dark:hover:border-purple-400'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Briefcase className="w-4 h-4" />
                <span className="text-sm font-medium">Owner</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                setRole('manager')
                setBusinessName('')
              }}
              className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                role === 'manager'
                  ? 'border-blue-500 dark:border-purple-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:border-blue-300 dark:hover:border-purple-400'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <UserCog className="w-4 h-4" />
                <span className="text-sm font-medium">Manager</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                setRole('worker')
                setBusinessName('')
              }}
              className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                role === 'worker'
                  ? 'border-blue-500 dark:border-purple-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:border-blue-300 dark:hover:border-purple-400'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <UserPlus className="w-4 h-4" />
                <span className="text-sm font-medium">Worker</span>
              </div>
            </button>
          </div>
        </div>

        {/* Business Selector for non-owners */}
        {role !== 'owner' && (
          <BusinessSelector
            selectedBusiness={businessName}
            onSelect={setBusinessName}
            error={errors.businessName}
            placeholder="Search for your company..."
          />
        )}

        <Input
          label="Username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          error={errors.username}
          leadingIcon={User}
          placeholder="Enter your username"
          required
          autoComplete="username"
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          leadingIcon={Lock}
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-blue-600 dark:text-purple-600 border-gray-300 dark:border-slate-600 rounded focus:ring-blue-500 dark:focus:ring-purple-500 bg-white dark:bg-slate-700"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-slate-300">
              Remember me
            </span>
          </label>
          <Link
            to="/forgot-password"
            className="text-sm text-blue-500 hover:text-blue-600 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" fullWidth loading={loading}>
          Sign in
        </Button>

        <p className="text-center text-sm text-gray-600 dark:text-slate-400">
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="font-medium text-blue-500 hover:text-blue-600 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
          >
            Sign up
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
