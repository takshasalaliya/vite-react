import { useState, useEffect } from 'react'
import { QrCode } from 'lucide-react'

const TestQRCode = ({ userId }) => {
  const [qrCodeImage, setQrCodeImage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      generateTestQR()
    }
  }, [userId])

  const generateTestQR = () => {
    setLoading(true)
    
    // Use Google Charts API - very reliable
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

  if (loading) {
    return (
      <div className="text-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
        <p className="text-sm text-gray-300">Generating QR Code...</p>
      </div>
    )
  }

  return (
    <div className="text-center p-6 border border-purple-500/30 rounded-lg bg-gradient-to-br from-gray-800/50 to-purple-900/30 backdrop-blur-sm">
      <h3 className="text-lg font-semibold mb-3 text-white">Attendance QR Code</h3>
      <p className="text-sm text-gray-300 mb-3">User ID: {userId}</p>
      {qrCodeImage && (
        <div className="relative inline-block">
          <img
            src={qrCodeImage}
            alt="QR Code"
            className="w-40 h-40 mx-auto border-4 border-purple-500/50 rounded-lg shadow-2xl shadow-purple-500/20"
          />
          {/* Stranger Things themed overlay */}
          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-purple-500/10 to-red-500/10 pointer-events-none"></div>
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-purple-500 rounded-full animate-pulse"></div>
          <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-red-500 rounded-full animate-pulse delay-100"></div>
        </div>
      )}
      <p className="text-xs text-purple-300 mt-3 font-mono">Scan to verify: {userId}</p>
    </div>
  )
}

export default TestQRCode
