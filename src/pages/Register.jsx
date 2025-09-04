import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import RegistrationForm from '../components/RegistrationForm'
import { ArrowLeft, Star, Sparkles } from 'lucide-react'

const Register = () => {
  const [showSuccess, setShowSuccess] = useState(false)
  const navigate = useNavigate()

  const handleSuccess = () => {
    setShowSuccess(true)
    setTimeout(() => {
      navigate('/login')
    }, 3000)
  }

  const handleClose = () => {
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#07021A] via-[#0B1536] to-[#0B0412] text-[#F6F9FF]">
      {/* Header */}
      <div className="relative z-20 p-4 sm:p-6">
        <button
          onClick={handleClose}
          className="inline-flex items-center space-x-2 text-[#F6F9FF]/70 hover:text-[#F6F9FF] transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </button>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-center max-w-md mx-4">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome to INNOSTRA!</h2>
            <p className="text-[#F6F9FF]/80 mb-4">
              Your registration has been submitted successfully. You'll be redirected to login shortly.
            </p>
            <div className="flex items-center justify-center space-x-2 text-[#C96F63]">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm">Every Mind Holds an Astra</span>
            </div>
          </div>
        </div>
      )}

      {/* Registration Form */}
      <RegistrationForm
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    </div>
  )
}

export default Register
