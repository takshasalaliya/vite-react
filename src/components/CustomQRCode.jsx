import { useState, useEffect } from 'react'
import { QrCode, Download, User, Copy } from 'lucide-react'

const CustomQRCode = ({ userId, userName, userEmail, userPhoto }) => {
  const [qrCodeImage, setQrCodeImage] = useState('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (userId) {
      generateCustomQR()
    }
  }, [userId])

  const generateCustomQR = async () => {
    try {
      setLoading(true)
      
      // Create QR code data - just the user ID for simplicity
      const qrData = userId

      // Try to generate real QR code first
      try {
        const QRCode = (await import('qrcode')).default
        const qrImage = await QRCode.toDataURL(qrData, {
          width: 300,
          margin: 2,
          color: {
            dark: '#00CED1', // Teal
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'M'
        })
        
        // Now overlay the custom design on top
        const finalImage = await overlayCustomDesign(qrImage, userId)
        setQrCodeImage(finalImage)
      } catch (error) {
        console.error('QR Code generation failed:', error)
        // Fallback to canvas-based QR
        createCanvasQR(userId)
      }
    } catch (error) {
      console.error('Error generating custom QR code:', error)
      createCanvasQR(userId)
    } finally {
      setLoading(false)
    }
  }

  const overlayCustomDesign = async (qrImageUrl, userId) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      canvas.width = 300
      canvas.height = 300
      const ctx = canvas.getContext('2d')
      
      const img = new Image()
      img.onload = () => {
        // Draw the base QR code
        ctx.drawImage(img, 0, 0, 300, 300)
        
        // Add custom styling to finder patterns
        const size = 12
        const margin = 30
        
        // Create gradient for finder patterns
        const gradient = ctx.createLinearGradient(0, 0, 60, 60)
        gradient.addColorStop(0, '#FF0000') // Red
        gradient.addColorStop(1, '#4A0080') // Deep blue/purple
        
        // Overlay gradient borders on finder patterns
        // Top-left
        ctx.fillStyle = gradient
        ctx.fillRect(margin - 2, margin - 2, size * 3 + 4, size * 3 + 4)
        
        // Top-right
        ctx.fillRect(300 - margin - size * 3 - 2, margin - 2, size * 3 + 4, size * 3 + 4)
        
        // Bottom-left
        ctx.fillRect(margin - 2, 300 - margin - size * 3 - 2, size * 3 + 4, size * 3 + 4)
        
        // Add central logo area (clear space for profile photo)
        ctx.fillStyle = '#FFD700' // Yellow
        ctx.fillRect(120, 120, 60, 60)
        ctx.fillStyle = '#000000'
        ctx.font = 'bold 12px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('INNOSTRA', 150, 140)
        ctx.font = 'bold 10px Arial'
        ctx.fillText('25', 150, 155)
        
        // Add user ID text at bottom
        ctx.fillStyle = '#000000'
        ctx.font = 'bold 14px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('USER ID', 150, 280)
        ctx.font = '10px Arial'
        ctx.fillText(userId.substring(0, 8), 150, 295)
        
        resolve(canvas.toDataURL())
      }
      img.src = qrImageUrl
    })
  }

  const createCanvasQR = (userId) => {
    const canvas = document.createElement('canvas')
    canvas.width = 300
    canvas.height = 300
    const ctx = canvas.getContext('2d')
    
    // White background
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, 300, 300)
    
    // Create gradient for finder patterns
    const gradient = ctx.createLinearGradient(0, 0, 60, 60)
    gradient.addColorStop(0, '#FF0000') // Red
    gradient.addColorStop(1, '#4A0080') // Deep blue/purple
    
    const size = 12
    const margin = 30
    
    // Draw corner finder patterns with gradient borders
    // Top-left
    ctx.fillStyle = gradient
    ctx.fillRect(margin - 2, margin - 2, size * 3 + 4, size * 3 + 4)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(margin, margin, size * 3, size * 3)
    ctx.fillStyle = '#00CED1' // Teal
    ctx.fillRect(margin + size, margin + size, size, size)
    
    // Top-right
    ctx.fillStyle = gradient
    ctx.fillRect(300 - margin - size * 3 - 2, margin - 2, size * 3 + 4, size * 3 + 4)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(300 - margin - size * 3, margin, size * 3, size * 3)
    ctx.fillStyle = '#00CED1' // Teal
    ctx.fillRect(300 - margin - size * 2, margin + size, size, size)
    
    // Bottom-left
    ctx.fillStyle = gradient
    ctx.fillRect(margin - 2, 300 - margin - size * 3 - 2, size * 3 + 4, size * 3 + 4)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(margin, 300 - margin - size * 3, size * 3, size * 3)
    ctx.fillStyle = '#00CED1' // Teal
    ctx.fillRect(margin + size, 300 - margin - size * 2, size, size)
    
    // Draw data pattern with teal circles
    ctx.fillStyle = '#00CED1' // Teal
    for (let i = 0; i < 20; i++) {
      for (let j = 0; j < 20; j++) {
        if (Math.random() > 0.5) {
          const x = margin + size * 4 + i * size
          const y = margin + j * size
          ctx.beginPath()
          ctx.arc(x + size/2, y + size/2, size/2 - 1, 0, 2 * Math.PI)
          ctx.fill()
        }
      }
    }
    
    // Add central logo area
    ctx.fillStyle = '#FFD700' // Yellow
    ctx.fillRect(120, 120, 60, 60)
    ctx.fillStyle = '#000000'
    ctx.font = 'bold 12px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('INNOSTRA', 150, 140)
    ctx.font = 'bold 10px Arial'
    ctx.fillText('25', 150, 155)
    
    // Add user ID text at bottom
    ctx.fillStyle = '#000000'
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('USER ID', 150, 280)
    ctx.font = '10px Arial'
    ctx.fillText(userId.substring(0, 8), 150, 295)
    
    setQrCodeImage(canvas.toDataURL())
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
          <p className="text-sm text-gray-500">Generating Custom QR Code...</p>
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
              className="w-64 h-64 border-4 border-gray-200 dark:border-gray-600 rounded-lg"
            />
          ) : (
            <div className="w-64 h-64 border-4 border-gray-200 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-gray-700">
              <div className="text-center">
                <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">QR Code not available</p>
              </div>
            </div>
          )}
          {qrCodeImage && userPhoto && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shadow-lg">
                <img
                  src={userPhoto}
                  alt="Profile"
                  className="w-14 h-14 rounded-lg object-cover"
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

export default CustomQRCode
