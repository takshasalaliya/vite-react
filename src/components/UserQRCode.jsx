import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import { supabase } from '../lib/supabase'

const UserQRCode = ({ userId, userName, userEmail, userPhoto }) => {
  const [qrCodeData, setQrCodeData] = useState('')
  const [showWelcome, setShowWelcome] = useState(false)
  const [isDestroyed, setIsDestroyed] = useState(false)

  useEffect(() => {
    // Generate QR code data
    const qrData = JSON.stringify({ user_id: userId })
    setQrCodeData(qrData)

    // Subscribe to real-time attendance updates for this user
    const channel = supabase
      .channel(`attendance_${userId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'attendance',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        // When attendance is recorded, trigger the destroy animation
        handleAttendanceRecorded(payload.new)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const handleAttendanceRecorded = (attendanceRecord) => {
    // Start destroy animation
    setIsDestroyed(true)
    
    // Show welcome message after animation
    setTimeout(() => {
      setShowWelcome(true)
    }, 1000)
  }

  const generateQRCode = async () => {
    try {
      const qrCode = await QRCode.toDataURL(qrCodeData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      return qrCode
    } catch (error) {
      console.error('Error generating QR code:', error)
      return null
    }
  }

  if (showWelcome) {
    return (
      <div className="text-center p-8">
        <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
          <span className="text-4xl text-white font-bold">
            {userName?.charAt(0)?.toUpperCase() || 'U'}
          </span>
        </div>
        <h2 className="text-2xl font-bold text-green-600 mb-2">
          Welcome {userName}!
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Your attendance has been recorded successfully
        </p>
        <div className="mt-4 text-sm text-gray-500">
          <p>✓ Checked in</p>
          <p>✓ QR Code validated</p>
        </div>
      </div>
    )
  }

  if (isDestroyed) {
    return (
      <div className="text-center p-8">
        <div className="w-32 h-32 mx-auto mb-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
          <span className="text-4xl text-white">💥</span>
        </div>
        <h2 className="text-xl font-bold text-red-600 mb-2">
          QR Code Destroyed
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Processing attendance...
        </p>
      </div>
    )
  }

  return (
    <div className="text-center p-6">
      <div className="mb-4">
        {userPhoto ? (
          <img
            src={userPhoto}
            alt={userName}
            className="w-20 h-20 rounded-full mx-auto object-cover border-4 border-purple-200"
          />
        ) : (
          <div className="w-20 h-20 rounded-full mx-auto bg-purple-100 flex items-center justify-center">
            <span className="text-2xl text-purple-600 font-bold">
              {userName?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
        )}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-2">
          {userName}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {userEmail}
        </p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-lg">
        <QRCodeDisplay qrData={qrCodeData} />
        <p className="text-xs text-gray-500 mt-2">
          Scan this QR code to record attendance
        </p>
      </div>

      <div className="mt-4 text-xs text-gray-400">
        <p>User ID: {userId}</p>
        <p>Generated: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  )
}

// Separate component for QR code display with destroy animation
const QRCodeDisplay = ({ qrData }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState('')

  useEffect(() => {
    const generateQR = async () => {
      try {
        const qrCode = await QRCode.toDataURL(qrData, {
          width: 200,
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

    if (qrData) {
      generateQR()
    }
  }, [qrData])

  if (!qrCodeUrl) {
    return (
      <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="relative">
      <img
        src={qrCodeUrl}
        alt="QR Code"
        className="w-48 h-48 mx-auto"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-purple-100 opacity-20 rounded-lg"></div>
    </div>
  )
}

export default UserQRCode
