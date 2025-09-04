import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import { supabase } from '../lib/supabase'
import { CheckCircle, XCircle, QrCode, User } from 'lucide-react'

const UserAttendanceDisplay = ({ userId, userName, userEmail, userPhoto }) => {
  const [qrCodeData, setQrCodeData] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [showWelcome, setShowWelcome] = useState(false)
  const [isDestroyed, setIsDestroyed] = useState(false)
  const [attendanceStatus, setAttendanceStatus] = useState('waiting') // waiting, processing, success, error
  const [lastAttendance, setLastAttendance] = useState(null)
  const [lastCheckTime, setLastCheckTime] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('connecting') // connecting, connected, error
  const [errorMessage, setErrorMessage] = useState(null)

  useEffect(() => {
    // Generate QR code data
    const qrData = JSON.stringify({ user_id: userId })
    setQrCodeData(qrData)

    console.log('Setting up real-time subscription for user:', userId)

    // Subscribe to real-time attendance updates for this user
    const channel = supabase
      .channel(`user_attendance_${userId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'attendance'
      }, (payload) => {
        console.log('🎯 Attendance INSERT detected:', payload)
        // Check if this attendance record is for the current user
        if (payload.new && payload.new.user_id === userId) {
          console.log('✅ Attendance recorded for current user, triggering animation')
          handleAttendanceRecorded(payload.new)
        } else {
          console.log('❌ Attendance not for current user. Expected:', userId, 'Got:', payload.new?.user_id)
        }
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'attendance'
      }, (payload) => {
        console.log('🔄 Attendance UPDATE detected:', payload)
        // Check if this attendance record is for the current user
        if (payload.new && payload.new.user_id === userId) {
          console.log('✅ Attendance updated for current user')
          handleAttendanceRecorded(payload.new)
        }
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'attendance'
      }, (payload) => {
        console.log('🌟 Any attendance change detected:', payload)
        // Also check for any attendance changes for this user
        if (payload.new && payload.new.user_id === userId) {
          console.log('✅ Attendance change for current user detected via wildcard')
          handleAttendanceRecorded(payload.new)
        }
      })
      .subscribe((status) => {
        console.log('📡 Subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to attendance changes')
          setConnectionStatus('connected')
          setErrorMessage(null)
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Channel error, trying to reconnect...')
          setConnectionStatus('error')
          setErrorMessage('Real-time connection error')
        } else if (status === 'TIMED_OUT') {
          console.error('⏰ Channel timed out, trying to reconnect...')
          setConnectionStatus('error')
          setErrorMessage('Connection timed out')
        } else if (status === 'CLOSED') {
          console.error('🚪 Channel closed')
          setConnectionStatus('error')
          setErrorMessage('Connection closed')
        }
      })

    // Also check if user already has attendance records
    checkExistingAttendance()

    // Set up polling as fallback (check every 1 second for better responsiveness)
    const pollInterval = setInterval(() => {
      checkForNewAttendance()
    }, 1000)

    // Force an immediate check after a short delay to catch any recent attendance
    const immediateCheck = setTimeout(() => {
      console.log('Performing immediate attendance check...')
      checkForNewAttendance()
    }, 500)

    return () => {
      console.log('Cleaning up subscription for user:', userId)
      supabase.removeChannel(channel)
      clearInterval(pollInterval)
      clearTimeout(immediateCheck)
    }
  }, [userId])

  const checkExistingAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', userId)
        .order('scan_time', { ascending: false })
        .limit(1)

      if (!error && data && data.length > 0) {
        setAttendanceStatus('success')
        setLastAttendance(data[0])
        setShowWelcome(true)
        setLastCheckTime(new Date())
      }
    } catch (error) {
      console.error('Error checking existing attendance:', error)
    }
  }

  const checkForNewAttendance = async () => {
    try {
      console.log('Polling for new attendance for user:', userId)
      
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', userId)
        .order('scan_time', { ascending: false })
        .limit(1)

      if (error) {
        console.error('Error polling attendance:', error)
        return
      }

      if (data && data.length > 0) {
        const latestAttendance = data[0]
        console.log('Latest attendance found:', latestAttendance)
        
        // Check if this is a new attendance record
        if (!lastAttendance) {
          console.log('First attendance record found, triggering animation')
          handleAttendanceRecorded(latestAttendance)
        } else {
          const latestTime = new Date(latestAttendance.scan_time)
          const lastTime = new Date(lastAttendance.scan_time)
          
          if (latestTime > lastTime) {
            console.log('New attendance detected via polling:', latestAttendance)
            console.log('Time difference:', latestTime - lastTime, 'ms')
            handleAttendanceRecorded(latestAttendance)
          } else {
            console.log('No new attendance, latest:', latestTime, 'last:', lastTime)
          }
        }
      } else {
        console.log('No attendance records found for user:', userId)
      }
    } catch (error) {
      console.error('Error checking for new attendance:', error)
    }
  }

  const handleAttendanceRecorded = (attendanceRecord) => {
    console.log('🎉 Handling attendance recorded:', attendanceRecord)
    setLastAttendance(attendanceRecord)
    
    // Start destroy animation
    setIsDestroyed(true)
    setAttendanceStatus('processing')
    
    // Show welcome message after animation
    setTimeout(() => {
      setAttendanceStatus('success')
      setShowWelcome(true)
    }, 1500)
  }

  const generateQRCode = async () => {
    try {
      const qrCode = await QRCode.toDataURL(qrCodeData, {
        width: 250,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      setQrCodeUrl(qrCode)
    } catch (error) {
      console.error('Error generating QR code:', error)
    }
  }

  useEffect(() => {
    if (qrCodeData) {
      generateQRCode()
    }
  }, [qrCodeData])

  // Welcome screen after successful attendance
  if (showWelcome && attendanceStatus === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          {/* Success Animation */}
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* Welcome Message */}
          <h1 className="text-3xl font-bold text-green-600 mb-4">
            Welcome {userName}! 🎉
          </h1>
          
          <p className="text-gray-600 mb-6 text-lg">
            Your attendance has been recorded successfully
          </p>

          {/* Attendance Details */}
          {lastAttendance && (
            <div className="bg-green-50 rounded-lg p-4 mb-6">
              <div className="text-sm text-green-800">
                <p className="font-semibold">✓ Checked in successfully</p>
                <p>Time: {new Date(lastAttendance.scan_time).toLocaleString()}</p>
                <p>Status: Present</p>
              </div>
            </div>
          )}

          {/* Success Indicators */}
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>QR Code validated</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Attendance recorded</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Welcome to the event!</span>
            </div>
          </div>

          {/* User Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-3">
              {userPhoto ? (
                <img
                  src={userPhoto}
                  alt={userName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-green-600" />
                </div>
              )}
              <div className="text-left">
                <p className="font-medium text-gray-900">{userName}</p>
                <p className="text-sm text-gray-500">{userEmail}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Destroy animation screen
  if (isDestroyed && attendanceStatus === 'processing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          {/* Destroy Animation */}
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto bg-red-500 rounded-full flex items-center justify-center animate-pulse">
              <span className="text-4xl">💥</span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-red-600 mb-4">
            QR Code Destroyed!
          </h1>
          
          <p className="text-gray-600 mb-6">
            Processing your attendance...
          </p>

          {/* Loading Animation */}
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          </div>

          <p className="text-sm text-gray-500 mt-4">
            Please wait while we verify your attendance
          </p>
        </div>
      </div>
    )
  }

  // Main QR Code display
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        {/* User Info */}
        <div className="mb-6">
          {userPhoto ? (
            <img
              src={userPhoto}
              alt={userName}
              className="w-20 h-20 rounded-full mx-auto object-cover border-4 border-purple-200"
            />
          ) : (
            <div className="w-20 h-20 rounded-full mx-auto bg-purple-100 flex items-center justify-center border-4 border-purple-200">
              <User className="w-10 h-10 text-purple-600" />
            </div>
          )}
          <h2 className="text-2xl font-bold text-gray-900 mt-3">
            {userName}
          </h2>
          <p className="text-gray-600">
            {userEmail}
          </p>
        </div>

        {/* QR Code */}
        <div className="mb-6">
          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-purple-200">
            {qrCodeUrl ? (
              <div className="relative">
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="w-48 h-48 mx-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-purple-100 opacity-20 rounded-lg"></div>
              </div>
            ) : (
              <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            )}
          </div>
          
          <p className="text-sm text-gray-500 mt-3">
            Scan this QR code to record attendance
          </p>
        </div>

                 {/* Status */}
         <div className="bg-purple-50 rounded-lg p-4">
           <div className="flex items-center justify-center space-x-2 text-purple-700">
             <QrCode className="w-5 h-5" />
             <span className="font-medium">Ready for scanning</span>
           </div>
           <p className="text-xs text-purple-600 mt-1">
             Show this to the event staff
           </p>
           <div className="mt-2 text-xs text-purple-600">
             <div className="flex items-center space-x-2">
               <div className={`w-2 h-2 rounded-full ${
                 connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
                 connectionStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'
               }`}></div>
               <span>
                 {connectionStatus === 'connected' ? 'Real-time monitoring active' :
                  connectionStatus === 'error' ? 'Connection error - using polling' :
                  'Connecting...'}
               </span>
             </div>
             {errorMessage && (
               <p className="text-red-600 mt-1">{errorMessage}</p>
             )}
             {lastCheckTime && (
               <p>Last checked: {lastCheckTime.toLocaleTimeString()}</p>
             )}
           </div>
         </div>

                 {/* Instructions */}
         <div className="mt-6 text-xs text-gray-500 space-y-1">
           <p>• Keep this screen visible</p>
           <p>• QR code will be destroyed after scanning</p>
           <p>• You'll see a welcome message</p>
           <p>• User ID: {userId}</p>
         </div>

         {/* Test Buttons - Remove these in production */}
         <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
           <div className="flex space-x-2">
             <button
               onClick={() => {
                 console.log('Test button clicked - simulating attendance')
                 handleAttendanceRecorded({
                   id: 'test-' + Date.now(),
                   user_id: userId,
                   scan_time: new Date().toISOString(),
                   target_type: 'event',
                   target_id: 'test'
                 })
               }}
               className="px-4 py-2 bg-yellow-500 text-white text-sm rounded-md hover:bg-yellow-600 transition-colors"
             >
               🧪 Test Animation
             </button>
             
             <button
               onClick={() => {
                 console.log('Manual refresh clicked')
                 checkForNewAttendance()
                 setLastCheckTime(new Date())
               }}
               className="px-4 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
             >
               🔄 Manual Check
             </button>
           </div>
           
           <button
             onClick={() => {
               console.log('Testing database connection...')
               checkExistingAttendance()
               setLastCheckTime(new Date())
             }}
             className="px-4 py-2 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 transition-colors w-full"
           >
             🔍 Test Database Connection
           </button>
           
           <div className="text-xs text-gray-600 bg-gray-100 p-2 rounded">
             <p><strong>Debug Info:</strong></p>
             <p>User ID: {userId}</p>
             <p>Status: {attendanceStatus}</p>
             <p>Last Check: {lastCheckTime ? lastCheckTime.toLocaleTimeString() : 'Never'}</p>
             <p>Last Attendance: {lastAttendance ? new Date(lastAttendance.scan_time).toLocaleString() : 'None'}</p>
           </div>
           
           <p className="text-xs text-gray-400">
             Test buttons (remove in production)
           </p>
         </div>
      </div>
    </div>
  )
}

export default UserAttendanceDisplay
