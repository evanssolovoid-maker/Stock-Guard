import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'react-hot-toast'
import AuthLayout from '../components/AuthLayout'
import Input from '../components/Input'
import Button from '../components/Button'
import { User, Lock } from 'lucide-react'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
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

    // If user exists but no profile yet, wait a bit
    if (user && !profile && !justLoggedIn) return

    // If we have user and profile, navigate
    if (user && profile) {
      // Determine redirect based on role
      if (profile.role === 'owner') {
        navigate('/dashboard', { replace: true })
      } else if (profile.role === 'manager') {
        navigate('/manager-dashboard', { replace: true })
      } else if (profile.role === 'worker') {
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
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      await signIn(username.trim(), password)
      toast.success('Welcome back!')
      setJustLoggedIn(true)
    } catch (error) {
      console.error('Sign in error:', error)
      
      // Provide helpful error messages
      if (error.message?.includes('Invalid username or password') || error.message?.includes('Invalid')) {
        toast.error('Invalid username or password. Please check your credentials and try again.')
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
