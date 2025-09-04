import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import UserAttendanceDisplay from '../components/UserAttendanceDisplay'

const UserAttendancePage = () => {
  const { userId } = useParams()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (userId) {
      fetchUserDetails()
    }
  }, [userId])

  const fetchUserDetails = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, photo_url, enrollment_number')
        .eq('id', userId)
        .single()

      if (error) throw error

      setUser(data)
    } catch (error) {
      console.error('Error fetching user details:', error)
      setError('User not found')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading your attendance QR code...</p>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            {error || 'User Not Found'}
          </h1>
          <p className="text-gray-600">
            Please check the URL or contact event organizers
          </p>
        </div>
      </div>
    )
  }

  return (
    <UserAttendanceDisplay
      userId={user.id}
      userName={user.name}
      userEmail={user.email}
      userPhoto={user.photo_url}
    />
  )
}

export default UserAttendancePage
