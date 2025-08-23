import { supabase } from './supabase'

export class AuthService {
  // Direct database authentication
  static async signIn(email, password) {
    try {
      console.log('AuthService: Attempting direct database authentication...')
      console.log('AuthService: Email:', email)
      console.log('AuthService: Password length:', password.length)
      
      // Query user directly from database using email and phone (password)
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, phone, role, photo_url, created_at, updated_at')
        .eq('email', email)
        .eq('phone', password)
        .single()
      
      console.log('AuthService: Database query result:', { data, error })
      
      if (error) {
        console.error('AuthService: Database error:', error)
        throw new Error('Invalid credentials')
      }
      
      if (!data) {
        console.log('AuthService: No user found with these credentials')
        throw new Error('Invalid credentials')
      }
      
      console.log('AuthService: Authentication successful for user:', data.email)
      console.log('AuthService: User role:', data.role)
      
      // Return user data in the same format as Supabase Auth
      return {
        user: {
          id: data.id,
          email: data.email,
          photo_url: data.photo_url,
          user_metadata: {
            full_name: data.name
          }
        },
        session: {
          user: {
            id: data.id,
            email: data.email
          }
        },
        role: data.role
      }
    } catch (error) {
      console.error('AuthService: Authentication error:', error)
      throw error
    }
  }
  
  // Sign out (just clear local state)
  static async signOut() {
    console.log('AuthService: Signing out...')
    // No need to call Supabase Auth signOut since we're not using it
    return { error: null }
  }
  
  // Get current session (check if user exists in database)
  static async getSession() {
    try {
      // For now, return null since we don't have persistent sessions
      // This will be handled by the AuthContext
      return { data: { session: null }, error: null }
    } catch (error) {
      console.error('AuthService: Get session error:', error)
      return { data: { session: null }, error }
    }
  }
  
  // Check if user exists and has admin role
  static async checkAdminAccess(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()
      
      if (error) {
        console.error('AuthService: Check admin access error:', error)
        return false
      }
      
      return data?.role === 'admin'
    } catch (error) {
      console.error('AuthService: Check admin access exception:', error)
      return false
    }
  }
}
