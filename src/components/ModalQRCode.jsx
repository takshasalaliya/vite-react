import { useState, useEffect } from 'react'
import { QrCode, Download, User, Copy } from 'lucide-react'

const ModalQRCode = ({ userId, userName, userEmail, userPhoto }) => {
  const [qrCodeImage, setQrCodeImage] = useState('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (userId) {
      generateQRCode()
    }
  }, [userId])

  const generateQRCode = () => {
    setLoading(true)
    
    // Use Google Charts API - the same method that works in TestQRCode
    const qrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=200x200&chl=${encodeURIComponent(userId)}&chld=M|0`
    
    const img = new Image()
    img.onload = () => {
      setQrCodeImage(qrUrl)
      setLoading(false)
    }
    img.onerror = () => {
      // Fallback to QR Server API
      const fallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(userId)}`
      setQrCodeImage(fallbackUrl)
      setLoading(false)
    }
    img.src = qrUrl
  }

  const downloadQRCode = () => {
    if (qrCodeImage) {
      const link = document.createElement('a')
      link.href = qrCodeImage
      link.download = `qr-code-${userName}-${userId}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const copyUserId = () => {
    navigator.clipboard.writeText(userId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Generating QR Code...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <QrCode className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Attendance QR Code
          </h3>
        </div>
        <button
          onClick={downloadQRCode}
          className="flex items-center space-x-2 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-md hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span className="text-sm">Download</span>
        </button>
      </div>

      {/* User Info */}
      <div className="flex items-center space-x-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div className="relative">
          {userPhoto ? (
            <img
              src={userPhoto}
              alt={userName}
              className="w-16 h-16 rounded-full object-cover border-2 border-purple-500"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center border-2 border-purple-500">
              <User className="w-8 h-8 text-purple-500" />
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
        </div>
        
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            {userName}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {userEmail}
          </p>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">User ID:</span>
            <code className="text-xs bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded font-mono">
              {userId}
            </code>
            <button
              onClick={copyUserId}
              className="text-purple-500 hover:text-purple-600 transition-colors"
              title="Copy User ID"
            >
              <Copy className="w-3 h-3" />
            </button>
            {copied && (
              <span className="text-xs text-green-500">Copied!</span>
            )}
          </div>
        </div>
      </div>

      {/* QR Code */}
      <div className="flex justify-center mb-4">
        <div className="relative">
          {qrCodeImage ? (
            <img
              src={qrCodeImage}
              alt="QR Code"
              className="w-48 h-48 border-4 border-gray-200 dark:border-gray-600 rounded-lg"
            />
          ) : (
            <div className="w-48 h-48 border-4 border-gray-200 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-gray-700">
              <div className="text-center">
                <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">QR Code not available</p>
              </div>
            </div>
          )}
          {qrCodeImage && userPhoto && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-lg">
                <img
                  src={userPhoto}
                  alt="Profile"
                  className="w-10 h-10 rounded-lg object-cover"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Scan this QR code to mark attendance
        </p>
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>• Contains user ID: <code className="bg-gray-100 dark:bg-gray-600 px-1 rounded">{userId}</code></p>
          <p>• Generated on: {new Date().toLocaleDateString()}</p>
          <p>• Valid for attendance scanning</p>
        </div>
      </div>
    </div>
  )
}

export default ModalQRCode
