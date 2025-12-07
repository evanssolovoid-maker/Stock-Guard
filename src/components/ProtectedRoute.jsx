import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ children, requiredRole = null, allowedRoles = null }) {
  const { user, profile, loading } = useAuth()

  // Wait for auth to finish loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-purple-500"></div>
      </div>
    )
  }

  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/" replace />
  }

  // Wait for profile to load if we need role check
  if ((requiredRole || allowedRoles) && !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-purple-500"></div>
      </div>
    )
  }

  // Check role access only if role requirement exists
  if (requiredRole || allowedRoles) {
    // Check role access
    let hasAccess = false

    if (allowedRoles && Array.isArray(allowedRoles)) {
      // Multiple roles allowed
      hasAccess = allowedRoles.includes(profile?.role)
    } else if (requiredRole) {
      // Single role required
      hasAccess = profile?.role === requiredRole
    }

    if (!hasAccess) {
      // Redirect to appropriate dashboard based on role
      if (profile?.role === 'owner') {
        return <Navigate to="/dashboard" replace />
      } else if (profile?.role === 'manager') {
        return <Navigate to="/manager-dashboard" replace />
      } else if (profile?.role === 'worker') {
        return <Navigate to="/log-sale" replace />
      }
      // If no role match, redirect to login
      return <Navigate to="/" replace />
    }
  }

  return children
}

