import { supabase } from './supabase'

export const authService = {
  // Sign in with username and password
  async signIn(username, password) {
    try {
      // Fetch user by username
      const { data: user, error: userError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('username', username)
        .single()

      if (userError || !user) {
        throw new Error('Invalid username or password')
      }

      // Verify password using PostgreSQL function
      const { data: authData, error: authError } = await supabase.rpc('verify_password', {
        p_username: username,
        p_password: password
      })

      if (authError) {
        console.error('Password verification error:', authError)
        throw new Error('Authentication failed')
      }

      // Check if password is valid
      const validResult = Array.isArray(authData) ? authData[0] : authData
      if (!validResult || !validResult.valid) {
        throw new Error('Invalid username or password')
      }

      // Store session in localStorage
      const session = {
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          business_name: user.business_name,
          profile_picture_url: user.profile_picture_url,
          phone_number: user.phone_number
        },
        token: btoa(JSON.stringify({ id: user.id, timestamp: Date.now() }))
      }

      localStorage.setItem('stockguard_session', JSON.stringify(session))

      return { user: session.user, error: null }
    } catch (error) {
      console.error('Sign in error:', error)
      return { user: null, error: error.message || 'Invalid username or password' }
    }
  },

  // Sign up (only owner can create accounts)
  async signUp(userData, creatorRole) {
    try {
      // Check if creator has permission
      if (creatorRole === 'worker') {
        throw new Error('Workers cannot create accounts')
      }

      if (creatorRole === 'manager' && userData.role === 'manager') {
        throw new Error('Managers cannot create other managers')
      }

      // Check manager limit if creating manager
      if (userData.role === 'manager') {
        // Get owner settings to check manager limit
        const currentUser = this.getCurrentUser()
        if (!currentUser) {
          throw new Error('You must be logged in to create users')
        }

        // Get owner ID (if creator is owner, use their ID; if manager, need to get owner_id)
        const ownerId = currentUser.role === 'owner' ? currentUser.id : null
        
        if (ownerId) {
          const { data: settings } = await supabase
            .from('owner_settings')
            .select('max_managers')
            .eq('owner_id', ownerId)
            .single()

          if (settings) {
            const { count } = await supabase
              .from('user_profiles')
              .select('*', { count: 'exact', head: true })
              .eq('role', 'manager')

            if (count >= settings.max_managers) {
              throw new Error(`Maximum ${settings.max_managers} managers allowed`)
            }
          }
        }
      }

      // Check if profile picture is mandatory
      const currentUser = this.getCurrentUser()
      if (currentUser) {
        const ownerId = currentUser.role === 'owner' ? currentUser.id : null
        
        if (ownerId) {
          const { data: settings } = await supabase
            .from('owner_settings')
            .select('profile_pictures_mandatory')
            .eq('owner_id', ownerId)
            .single()

          if (settings?.profile_pictures_mandatory && !userData.profile_picture_url) {
            throw new Error('Profile picture is required')
          }
        }
      }

      // Create user using PostgreSQL function
      const { data, error } = await supabase.rpc('create_user', {
        p_username: userData.username,
        p_password: userData.password,
        p_role: userData.role,
        p_business_name: userData.business_name || null,
        p_phone_number: userData.phone_number || null,
        p_profile_picture_url: userData.profile_picture_url || null
      })

      if (error) {
        console.error('Create user error:', error)
        throw error
      }

      return { user: data, error: null }
    } catch (error) {
      console.error('Sign up error:', error)
      return { user: null, error: error.message || 'Failed to create user' }
    }
  },

  // Get current user from localStorage
  getCurrentUser() {
    try {
      const session = localStorage.getItem('stockguard_session')
      if (!session) return null

      const parsed = JSON.parse(session)
      return parsed.user || null
    } catch (error) {
      console.error('Error parsing session:', error)
      return null
    }
  },

  // Sign out
  signOut() {
    localStorage.removeItem('stockguard_session')
    return { error: null }
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getCurrentUser()
  },

  // Get session (for compatibility with existing code)
  async getSession() {
    const user = this.getCurrentUser()
    if (!user) {
      return { session: null, error: null }
    }
    return {
      session: {
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      },
      error: null
    }
  },

  // Mock auth state change for compatibility (won't actually trigger)
  onAuthStateChange(callback) {
    // Return a mock subscription object
    return {
      data: {
        subscription: {
          unsubscribe: () => {}
        }
      }
    }
  }
}
