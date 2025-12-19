import { createContext, useContext, useEffect, useState } from 'react'
import { authService } from '../services/auth.service'
import { supabase } from '../services/supabase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load session from localStorage on mount - make it fast
    loadSession()
  }, [])

  const loadSession = async () => {
    try {
      const currentUser = authService.getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
        // Set profile immediately from localStorage to avoid blocking
        if (currentUser.role) {
          setProfile({ 
            id: currentUser.id, 
            role: currentUser.role,
            business_name: currentUser.business_name,
            business_owner_id: currentUser.business_owner_id || currentUser.id,
            business_category: currentUser.business_category
          })
        }
        setLoading(false) // Don't block - allow pages to render
        
        // Load full profile in background
        loadUserProfile(currentUser.id).catch(err => {
          console.error('Error loading profile:', err)
          // Keep the profile from localStorage if load fails
        })
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
      return
    }

    try {
      // Fetch user profile from database (non-blocking)
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, role, business_name, business_category, business_owner_id, phone_number, username, profile_picture_url')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('Error loading profile:', error)
        // Keep existing profile from localStorage
        return
      }

      if (data) {
        setProfile(data)
      } else {
        // Profile doesn't exist - keep profile from localStorage
        console.warn('User profile not found for:', userId)
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
      // Keep existing profile from localStorage
    }
  }

  const signIn = async (username, password, businessName = null) => {
    try {
      setLoading(true)
      
      const { user: signedInUser, error } = await authService.signIn(username, password, businessName)
      
      if (error) {
        console.error('Auth service sign in error:', error)
        setLoading(false)
        throw new Error(error)
      }
      
      if (signedInUser) {
        setUser(signedInUser)
        // Set profile immediately from signedInUser to avoid blocking
        setProfile({
          id: signedInUser.id,
          username: signedInUser.username,
          role: signedInUser.role,
          business_name: signedInUser.business_name,
          business_owner_id: signedInUser.business_owner_id || signedInUser.id,
          business_category: signedInUser.business_category,
          phone_number: signedInUser.phone_number,
          profile_picture_url: signedInUser.profile_picture_url
        })
        setLoading(false) // Don't block - allow navigation immediately
        
        // Load full profile in background (non-blocking)
        loadUserProfile(signedInUser.id).catch(err => {
          console.error('Error loading profile after sign in:', err)
          // Keep the profile from signIn if load fails
        })
        return { user: signedInUser, error: null }
      } else {
        setLoading(false)
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
