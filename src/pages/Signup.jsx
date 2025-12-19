import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'react-hot-toast'
import AuthLayout from '../components/AuthLayout'
import Input from '../components/Input'
import Button from '../components/Button'
import BusinessCategorySelector from '../components/BusinessCategorySelector'
import BusinessSelector from '../components/BusinessSelector'
import { User, Lock, Building2, Phone, Briefcase, UserCog, UserPlus } from 'lucide-react'

export default function Signup() {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [role, setRole] = useState('owner')
  const { signUp, signIn } = useAuth()
  const navigate = useNavigate()

  // Form fields
  const [username, setUsername] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [businessCategory, setBusinessCategory] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { strength: 0, label: '', color: '' }
    let strength = 0
    if (pwd.length >= 8) strength++
    if (/[a-z]/.test(pwd)) strength++
    if (/[A-Z]/.test(pwd)) strength++
    if (/[0-9]/.test(pwd)) strength++
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++

    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
    const colors = ['red', 'orange', 'yellow', 'blue', 'green']
    return {
      strength,
      label: labels[strength - 1] || '',
      color: colors[strength - 1] || 'gray',
    }
  }

  const validate = () => {
    const newErrors = {}
    
    if (!username.trim()) {
      newErrors.username = 'Username is required'
    } else if (username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    } else if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores'
    }
    
    if (role === 'owner') {
      if (!businessName.trim()) {
        newErrors.businessName = 'Business name is required'
      }
      if (!businessCategory) {
        newErrors.businessCategory = 'Please select your business type'
      }
    } else {
      // For workers/managers, business name comes from selector
      if (!businessName) {
        newErrors.businessName = 'Please select your company'
      }
    }
    
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required'
    }
    
    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    if (!termsAccepted) {
      newErrors.terms = 'You must accept the terms and conditions'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const userData = {
        username: username.trim().toLowerCase(),
        password: password,
        role: role,
        business_name: role === 'owner' ? businessName.trim() : businessName,
        business_category: role === 'owner' ? businessCategory : null,
        phone_number: phone.trim(),
      }

      const { user, error } = await signUp(userData)

      if (error) {
        throw new Error(error)
      }

      if (!user) {
        throw new Error('Failed to create account')
      }

      // Auto-sign in after successful signup
      const businessNameForLogin = role === 'owner' ? null : businessName
      await signIn(userData.username, userData.password, businessNameForLogin)
      
      toast.success('Account created successfully!')
      
      // Redirect based on role
      if (role === 'owner') {
        navigate('/dashboard')
      } else if (role === 'manager') {
        navigate('/manager-dashboard')
      } else {
        navigate('/log-sale')
      }
    } catch (error) {
      console.error('Signup error:', error)
      
      let errorMessage = 'Failed to create account'
      
      if (error.message) {
        errorMessage = error.message
      }
      
      // Common error messages
      if (errorMessage.includes('already exists') || errorMessage.includes('already registered') || errorMessage.includes('unique')) {
        errorMessage = 'This username is already taken. Please choose a different one.'
      } else if (errorMessage.includes('password')) {
        errorMessage = 'Password does not meet requirements. Please use a stronger password.'
      } else if (errorMessage.includes('username')) {
        errorMessage = 'Invalid username. Please check and try again.'
      }
      
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const passwordStrength = getPasswordStrength(password)

  return (
    <AuthLayout title="Create your account" subtitle="Get started with StockGuard today">
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
                setBusinessCategory('')
                setErrors({ ...errors, businessName: undefined, businessCategory: undefined })
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
                setBusinessCategory('')
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
                setBusinessCategory('')
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

        <Input
          label="Username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
          error={errors.username}
          leadingIcon={User}
          placeholder="johndoe"
          required
          autoComplete="username"
        />

        {/* Business Name Input for Owners */}
        {role === 'owner' && (
          <Input
            label="Business Name"
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            error={errors.businessName}
            leadingIcon={Building2}
            placeholder="My Business"
            required
          />
        )}

        {/* Business Selector for Workers/Managers */}
        {role !== 'owner' && (
          <BusinessSelector
            selectedBusiness={businessName}
            onSelect={setBusinessName}
            error={errors.businessName}
            placeholder="Search for your company..."
          />
        )}

        {/* Business Category Selector for Owners Only */}
        {role === 'owner' && (
          <BusinessCategorySelector
            selected={businessCategory}
            onChange={setBusinessCategory}
            error={errors.businessCategory}
          />
        )}

        <Input
          label="Phone Number"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          error={errors.phone}
          leadingIcon={Phone}
          placeholder="+256 700 000 000"
          required
        />

        <div>
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            leadingIcon={Lock}
            placeholder="••••••••"
            required
            autoComplete="new-password"
          />
          {password && (
            <div className="mt-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      passwordStrength.color === 'red'
                        ? 'bg-red-500'
                        : passwordStrength.color === 'orange'
                        ? 'bg-amber-500'
                        : passwordStrength.color === 'yellow'
                        ? 'bg-yellow-500'
                        : passwordStrength.color === 'blue'
                        ? 'bg-blue-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-slate-400">
                  {passwordStrength.label}
                </span>
              </div>
            </div>
          )}
        </div>

        <Input
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          leadingIcon={Lock}
          placeholder="••••••••"
          required
          autoComplete="new-password"
        />

        <label className="flex items-start">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="w-4 h-4 text-blue-600 dark:text-purple-600 border-gray-300 dark:border-slate-600 rounded focus:ring-blue-500 dark:focus:ring-purple-500 bg-white dark:bg-slate-700 mt-0.5"
          />
          <span className="ml-2 text-sm text-gray-700 dark:text-slate-300">
            I agree to the{' '}
            <Link to="/terms" className="text-blue-500 dark:text-purple-400 hover:underline">
              Terms and Conditions
            </Link>
          </span>
        </label>
        {errors.terms && (
          <p className="text-sm text-red-500 dark:text-red-400">{errors.terms}</p>
        )}

        <Button type="submit" fullWidth loading={loading}>
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-gray-600 dark:text-slate-400">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-medium text-blue-500 hover:text-blue-600 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
