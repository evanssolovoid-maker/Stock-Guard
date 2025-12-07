import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, ArrowLeft, CheckCircle } from 'lucide-react'
import AuthLayout from '../components/AuthLayout'
import Input from '../components/Input'
import Button from '../components/Button'
import { supabase } from '../services/supabase'
import { toast } from 'react-hot-toast'

export default function ForgotPassword() {
  const [username, setUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [step, setStep] = useState(1) // 1: Enter username, 2: Reset password
  const [userFound, setUserFound] = useState(false)
  const navigate = useNavigate()

  const validateUsername = () => {
    const newErrors = {}
    if (!username || !username.trim()) {
      newErrors.username = 'Username is required'
    } else if (username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validatePassword = () => {
    const newErrors = {}

    if (!newPassword) {
      newErrors.newPassword = 'New password is required'
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters'
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCheckUsername = async (e) => {
    e.preventDefault()
    if (!validateUsername()) return

    setLoading(true)
    try {
      // Check if user exists
      const { data: user, error } = await supabase
        .from('user_profiles')
        .select('id, username')
        .eq('username', username.trim())
        .single()

      if (error || !user) {
        setErrors({ username: 'Username not found' })
        setLoading(false)
        return
      }

      setUserFound(true)
      setStep(2)
      toast.success('Username verified. Please set a new password.')
    } catch (error) {
      console.error('Error checking username:', error)
      toast.error('Failed to verify username. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!validatePassword()) return

    setLoading(true)
    try {
      // Call the database function to reset password
      const { data, error } = await supabase.rpc('reset_user_password', {
        p_username: username.trim(),
        p_new_password: newPassword,
      })

      if (error) {
        console.error('Password reset error:', error)
        throw new Error(error.message || 'Failed to reset password')
      }

      // Check if password was reset successfully
      if (data === false || data === null) {
        throw new Error('Failed to reset password. Username may not exist.')
      }

      toast.success('Password reset successfully! You can now sign in with your new password.')
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (error) {
      console.error('Error resetting password:', error)
      toast.error(error.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout 
      title={step === 1 ? "Reset Password" : "Set New Password"} 
      subtitle={step === 1 ? "Enter your username to reset your password" : "Please enter your new password"}
    >
      {step === 1 ? (
        <form onSubmit={handleCheckUsername} className="space-y-4">
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 mb-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> This will reset your password immediately. Make sure you have access to this account.
            </p>
          </div>

          <Input
            label="Username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            error={errors.username}
            leadingIcon={Lock}
            placeholder="Enter your username"
            required
            autoComplete="username"
            autoFocus
          />

          <Button type="submit" fullWidth loading={loading}>
            Verify Username
          </Button>

          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Link>
          </div>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4">
          {userFound && (
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                  Username verified: <strong>{username}</strong>
                </p>
              </div>
            </div>
          )}

          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            error={errors.newPassword}
            leadingIcon={Lock}
            placeholder="Enter new password (min. 8 characters)"
            required
            autoComplete="new-password"
            autoFocus
          />

          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
            leadingIcon={Lock}
            placeholder="Confirm new password"
            required
            autoComplete="new-password"
          />

          <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              ⚠️ <strong>Security Note:</strong> Your password will be reset immediately. Make sure you're authorized to reset this account's password.
            </p>
          </div>

          <Button type="submit" fullWidth loading={loading}>
            Reset Password
          </Button>

          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => {
                setStep(1)
                setNewPassword('')
                setConfirmPassword('')
                setErrors({})
                setUserFound(false)
              }}
              className="text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 transition-colors"
            >
              Use different username
            </button>
            <span className="text-gray-300 dark:text-slate-600">|</span>
            <Link
              to="/login"
              className="text-sm text-blue-500 hover:text-blue-600 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
            >
              Back to Sign In
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  )
}
