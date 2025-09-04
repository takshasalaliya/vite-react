import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, Lock, Mail, Zap, Star, Sparkles, Moon, Sun, Rocket } from 'lucide-react'

export default function Login() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [showPassword, setShowPassword] = useState(false)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [showSuccess, setShowSuccess] = useState(false)
	const { signIn } = useAuth()
	const navigate = useNavigate()
	const canvasRef = useRef(null)

	// Starfield particle system for background
	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return

		const ctx = canvas.getContext('2d')
		canvas.width = window.innerWidth
		canvas.height = window.innerHeight

		const stars = []
		const starCount = 200

		// Create stars
		for (let i = 0; i < starCount; i++) {
			stars.push({
				x: Math.random() * canvas.width,
				y: Math.random() * canvas.height,
				vx: (Math.random() - 0.5) * 0.2,
				vy: (Math.random() - 0.5) * 0.2,
				size: Math.random() * 2 + 0.5,
				opacity: Math.random() * 0.8 + 0.2,
				twinkle: Math.random() * Math.PI * 2,
				twinkleSpeed: Math.random() * 0.02 + 0.01,
				color: ['#C96F63', '#FFCC66', '#1E3A8A', '#F6F9FF'][Math.floor(Math.random() * 4)]
			})
		}

		// Animation loop
		const animate = () => {
			ctx.clearRect(0, 0, canvas.width, canvas.height)
			
			stars.forEach(star => {
				star.x += star.vx
				star.y += star.vy
				star.twinkle += star.twinkleSpeed

				// Wrap around edges
				if (star.x < 0) star.x = canvas.width
				if (star.x > canvas.width) star.x = 0
				if (star.y < 0) star.y = canvas.height
				if (star.y > canvas.height) star.y = 0

				// Twinkling effect
				const twinkleOpacity = star.opacity * (0.5 + 0.5 * Math.sin(star.twinkle))

				// Draw star
				ctx.beginPath()
				ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
				ctx.fillStyle = star.color + Math.floor(twinkleOpacity * 255).toString(16).padStart(2, '0')
				ctx.fill()

				// Add star glow
				ctx.beginPath()
				ctx.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2)
				ctx.fillStyle = star.color + Math.floor(twinkleOpacity * 50).toString(16).padStart(2, '0')
				ctx.fill()
			})

			requestAnimationFrame(animate)
		}

		animate()

		// Handle resize
		const handleResize = () => {
			canvas.width = window.innerWidth
			canvas.height = window.innerHeight
		}

		window.addEventListener('resize', handleResize)
		return () => window.removeEventListener('resize', handleResize)
	}, [])

	const handleSubmit = async (e) => {
		e.preventDefault()
		console.log('Login form submitted')
		console.log('Email:', email)
		console.log('Password length:', password.length)
		
		setLoading(true)
		setError('')

		try {
			console.log('Calling signIn function...')
			const result = await signIn(email, password)
			console.log('SignIn result:', result)
			
			// Check if authentication was successful by checking for user and role
			if (result && result.user && result.role) {
				setShowSuccess(true)
				setTimeout(() => {
					// Redirect based on user role
					const role = result.role
					if (role === 'admin') {
						navigate('/admin/dashboard')
					} else if (role === 'event_manager') {
						navigate('/event-manager/dashboard')
					} else if (role === 'event_handler') {
						navigate('/event-handler/dashboard')
					} else if (role === 'registration_committee' || role === 'scanner_committee') {
						navigate('/registration-committee/users')
					} else if (role === 'participant') {
						navigate('/user')
				} else {
						// Fallback to user dashboard
						navigate('/user')
					}
				}, 1500)
			} else {
				setError('Login failed - Invalid response from server')
			}
		} catch (err) {
			console.error('Login error:', err)
			setError(err.message || 'An unexpected error occurred')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-[#07021A] via-[#0B1536] to-[#0B0412] text-[#F6F9FF]">
			{/* Animated Starfield Background */}
			<canvas
				ref={canvasRef}
				className="absolute inset-0 z-0"
				style={{ background: 'radial-gradient(ellipse at center, #1E3A8A 0%, #0B1536 50%, #07021A 100%)' }}
			/>

			{/* Nebula Gradient Overlay */}
			<div className="absolute inset-0 z-1 bg-gradient-to-b from-[#2A0E3D]/30 via-transparent to-[#0B0412]/40"></div>

			{/* Main Content */}
			<div className="relative z-20 flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
				<div className="w-full max-w-md sm:max-w-lg">
					{/* Header */}
					<div className="text-center mb-8 sm:mb-12">
						{/* Logo */}
						<div className="flex justify-center mb-4 sm:mb-6">
							<img 
								src="/image/Logo with Name.png" 
								alt="INNOSTRA Logo" 
								className="h-12 sm:h-16 md:h-20 w-auto"
								style={{ filter: 'drop-shadow(0 0 20px rgba(201, 111, 99, 0.5))' }}
							/>
						</div>
						
						{/* Title */}
						<h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-[0.1em] mb-2 sm:mb-4 text-white">
							Enter the Galaxy
						</h1>
						
						{/* Subtitle */}
						<p className="text-sm sm:text-base text-[#F6F9FF]/80 max-w-sm mx-auto">
							Access your stellar dashboard and explore the cosmos of events
					</p>
				</div>

					{/* Login Form */}
					<div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/20 shadow-2xl">
						<form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
							{/* Email Field */}
							<div>
								<label htmlFor="email" className="block text-sm sm:text-base font-medium text-white mb-2">
									<Mail className="inline-block w-4 h-4 mr-2" />
									Email Address
								</label>
							<input
									type="email"
								id="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
									required
									className="w-full px-4 py-3 sm:py-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#C96F63] focus:border-transparent transition-all duration-300"
										placeholder="Enter your email"
							/>
							</div>

							{/* Password Field */}
							<div>
								<label htmlFor="password" className="block text-sm sm:text-base font-medium text-white mb-2">
									<Lock className="inline-block w-4 h-4 mr-2" />
									Password
								</label>
						<div className="relative">
							<input
										type={showPassword ? 'text' : 'password'}
								id="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
										required
										className="w-full px-4 py-3 sm:py-4 pr-12 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#C96F63] focus:border-transparent transition-all duration-300"
										placeholder="Enter your password"
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
										className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white transition-colors duration-200"
									>
										{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
							</button>
						</div>
					</div>

							{/* Error Message */}
					{error && (
								<div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 sm:p-4 text-red-300 text-sm sm:text-base">
									{error}
									</div>
							)}

							{/* Success Message */}
							{showSuccess && (
								<div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 sm:p-4 text-green-300 text-sm sm:text-base">
									Login successful! Redirecting...
						</div>
					)}

							{/* Submit Button */}
						<button
							type="submit"
							disabled={loading}
								className="w-full bg-gradient-to-r from-[#C96F63] to-[#C96F63]/80 text-white font-bold py-3 sm:py-4 px-6 rounded-lg hover:from-[#C96F63]/90 hover:to-[#C96F63]/70 focus:outline-none focus:ring-2 focus:ring-[#C96F63] focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
								>
									{loading ? (
									<>
										<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
										<span>Signing In...</span>
									</>
								) : (
									<>
										<Rocket className="w-5 h-5" />
										<span>Launch into Dashboard</span>
									</>
									)}
						</button>
						</form>

						{/* Back to Home Link */}
						<div className="mt-6 sm:mt-8 text-center">
							<a
								href="/"
								className="text-[#F6F9FF]/70 hover:text-[#F6F9FF] text-sm sm:text-base transition-colors duration-200 flex items-center justify-center space-x-2"
							>
								<Sparkles className="w-4 h-4" />
								<span>Return to Home</span>
							</a>
						</div>
					</div>

					{/* Footer */}
					<div className="mt-8 sm:mt-12 text-center">
						<div className="flex items-center justify-center space-x-2 mb-2">
							<Star className="w-4 h-4 text-[#C96F63]" />
							<span className="text-[#F6F9FF]/60 text-xs sm:text-sm">INNOSTRA '25</span>
							<Star className="w-4 h-4 text-[#C96F63]" />
						</div>
						<p className="text-[#F6F9FF]/50 text-xs sm:text-sm">
							Every Mind Holds an Astra
						</p>
					</div>
				</div>
			</div>
		</div>
	)
}