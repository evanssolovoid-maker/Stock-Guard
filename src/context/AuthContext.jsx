import { createContext, useContext, useEffect, useState } from 'react'
import { authService } from '../services/auth.service'
import { supabase } from '../services/supabase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load session from localStorage on mount
    loadSession()
  }, [])

  const loadSession = async () => {
    try {
      const currentUser = authService.getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
        await loadUserProfile(currentUser.id)
      } else {
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    } catch (error) {
      console.error('Error loading session:', error)
      setUser(null)
      setProfile(null)
      setLoading(false)
    }
  }

  const loadUserProfile = async (userId) => {
    if (!userId) {
      console.warn('loadUserProfile called without userId')
      setLoading(false)
      return
    }

    try {
      console.log('Loading user profile for:', userId)
      setLoading(true)
      
      // Fetch user profile from database
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, role, business_name, phone_number, username, profile_picture_url')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('Error loading profile:', error)
        // Set minimal profile if error
        setProfile({ id: userId, role: 'worker' })
        setLoading(false)
        return
      }

      if (data) {
        setProfile(data)
      } else {
        // Profile doesn't exist - this shouldn't happen with custom auth
        console.warn('User profile not found for:', userId)
        setProfile({ id: userId, role: 'worker' })
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
      setProfile({ id: userId, role: 'worker' })
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (username, password) => {
    try {
      console.log('AuthContext.signIn called')
      setLoading(true)
      
      const { user: signedInUser, error } = await authService.signIn(username, password)
      
      if (error) {
        console.error('Auth service sign in error:', error)
        throw new Error(error)
      }
      
      if (signedInUser) {
        setUser(signedInUser)
        await loadUserProfile(signedInUser.id)
        return { user: signedInUser, error: null }
      } else {
        throw new Error('Sign in failed')
      }
    } catch (error) {
      console.error('Sign in failed:', error)
      setLoading(false)
      throw error
    }
  }

  const signUp = async (userData) => {
    try {
      setLoading(true)
      const currentUser = authService.getCurrentUser()
      const creatorRole = currentUser?.role || 'owner' // Default to owner for first signup
      
      const { user: newUser, error } = await authService.signUp(userData, creatorRole)
      
      if (error) {
        throw new Error(error)
      }
      
      return { user: newUser, error: null }
    } catch (error) {
      console.error('Sign up failed:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      const { error } = authService.signOut()
      if (error) throw error
      
      setUser(null)
      setProfile(null)
      
      // Clear any cached data
      localStorage.removeItem('stockguard_session')
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    isOwner: profile?.role === 'owner',
    isManager: profile?.role === 'manager',
    isWorker: profile?.role === 'worker',
    loadProfile: loadUserProfile
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
