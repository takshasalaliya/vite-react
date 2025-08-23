import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:')
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing')
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test function to verify connection
export const testConnection = async () => {
  try {
    console.log('Testing Supabase connection...')
    console.log('URL:', supabaseUrl)
    console.log('Key exists:', !!supabaseAnonKey)
    
    const { data, error } = await supabase.from('users').select('count').limit(1)
    console.log('Test query result:', { data, error })
    
    if (error) {
      console.error('Supabase connection test failed:', error)
      return false
    }
    console.log('Supabase connection test successful')
    return true
  } catch (error) {
    console.error('Supabase connection test error:', error)
    return false
  }
}

// Test auth functionality
export const testAuth = async () => {
  try {
    console.log('Testing Supabase auth...')
    const { data, error } = await supabase.auth.getSession()
    console.log('Auth test result:', { data, error })
    return !error
  } catch (error) {
    console.error('Auth test error:', error)
    return false
  }
}

// Storage bucket names
export const STORAGE_BUCKETS = {
  PROFILE_PHOTOS: 'profile-photos',
  EVENT_PHOTOS: 'event-photos',
  WORKSHOP_PHOTOS: 'workshop-photos',
  COMBO_PHOTOS: 'combo-photos'
}

// File upload utility
export const uploadFile = async (bucket, file, path) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    })
  
  if (error) throw error
  
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)
  
  return publicUrl
}

// File validation utility
export const validateFile = (file) => {
  const maxSize = 1024 * 1024 // 1MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
  
  if (file.size > maxSize) {
    throw new Error('File size must be less than 1MB')
  }
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Only JPEG, JPG, and PNG files are allowed')
  }
  
  return true
}

// Auth utilities
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const getUserRole = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()
  
  if (error) return null
  return data.role
}

export const isAdmin = async (userId) => {
  const role = await getUserRole(userId)
  return role === 'admin'
}

// Database utilities
export const fetchWithPagination = async (table, page = 1, pageSize = 10, filters = {}) => {
  let query = supabase
    .from(table)
    .select('*', { count: 'exact' })
  
  // Apply filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      if (typeof value === 'string' && value.includes('%')) {
        query = query.ilike(key, value)
      } else {
        query = query.eq(key, value)
      }
    }
  })
  
  // Apply pagination
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  
  const { data, error, count } = await query
    .range(from, to)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  
  return {
    data: data || [],
    count: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize)
  }
} 