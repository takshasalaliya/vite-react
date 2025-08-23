import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import RegistrationForm from '../components/RegistrationForm'

export default function Home() {
	const canvasRef = useRef(null)
	const [isLoaded, setIsLoaded] = useState(false)
	const [isFirstVisit, setIsFirstVisit] = useState(true)
	const [showRegistrationForm, setShowRegistrationForm] = useState(false)

	useEffect(() => {
		// Check if this is first visit
		const hasVisited = localStorage.getItem('wisteria-visited')
		if (hasVisited) {
			setIsFirstVisit(false)
		} else {
			localStorage.setItem('wisteria-visited', 'true')
		}

		// Initialize advanced particle system
		const canvas = canvasRef.current
		const ctx = canvas.getContext('2d')
		canvas.width = window.innerWidth
		canvas.height = window.innerHeight

		let particles = []
		let animationId

		class Particle {
			constructor() {
				this.x = Math.random() * canvas.width
				this.y = Math.random() * canvas.height
				this.vx = (Math.random() - 0.5) * 1.5
				this.vy = (Math.random() - 0.5) * 1.5
				this.size = Math.random() * 2 + 0.5
				this.opacity = Math.random() * 0.3 + 0.1
				this.color = `hsl(${Math.random() * 60 + 330}, 100%, 50%)`
			}

			update() {
				this.x += this.vx
				this.y += this.vy

				if (this.x < 0 || this.x > canvas.width) this.vx *= -1
				if (this.y < 0 || this.y > canvas.height) this.vy *= -1

				this.opacity += (Math.random() - 0.5) * 0.01
				this.opacity = Math.max(0.1, Math.min(0.4, this.opacity))
			}

			draw() {
				ctx.save()
				ctx.globalAlpha = this.opacity
				ctx.fillStyle = this.color
				ctx.shadowBlur = 8
				ctx.shadowColor = this.color
				ctx.beginPath()
				ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
				ctx.fill()
				ctx.restore()
			}
		}

		// Create particles
		for (let i = 0; i < 100; i++) {
			particles.push(new Particle())
		}

		function animate() {
			ctx.fillStyle = 'rgba(0, 0, 0, 0.03)'
			ctx.fillRect(0, 0, canvas.width, canvas.height)

			particles.forEach(particle => {
				particle.update()
				particle.draw()
			})

			// Connect nearby particles
			particles.forEach((p1, i) => {
				particles.slice(i + 1).forEach(p2 => {
					const dx = p1.x - p2.x
					const dy = p1.y - p2.y
					const distance = Math.sqrt(dx * dx + dy * dy)

					if (distance < 80) {
						ctx.save()
						ctx.globalAlpha = (80 - distance) / 80 * 0.2
						ctx.strokeStyle = '#ff0000'
						ctx.lineWidth = 0.5
						ctx.beginPath()
						ctx.moveTo(p1.x, p1.y)
						ctx.lineTo(p2.x, p2.y)
						ctx.stroke()
						ctx.restore()
					}
				})
			})

			animationId = requestAnimationFrame(animate)
		}

		animate()

		setIsLoaded(true)

		return () => {
			cancelAnimationFrame(animationId)
		}
	}, [isFirstVisit])

	const handleRegistrationSuccess = () => {
		alert('Registration successful! Welcome to Wisteria 2025!')
	}

	return (
		<div className="min-h-screen relative overflow-hidden bg-black text-white">
			{/* Advanced Particle Canvas */}
			<canvas 
				ref={canvasRef} 
				className="absolute inset-0 pointer-events-none z-0"
				style={{ filter: 'blur(0.3px)' }}
			/>

			{/* Multiple Animated Characters - Fixed Positioning */}
			<div className="absolute inset-0 z-10 pointer-events-none">
				{/* Eleven Character - Top Left */}
				<div className="character eleven absolute top-32 left-8 w-24 h-24">
					<div className="character-sprite bg-gradient-to-b from-pink-400 to-pink-800 rounded-full w-full h-full relative overflow-hidden">
						<div className="absolute inset-0 bg-pink-500 opacity-20 animate-pulse"></div>
						<div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-pink-300 rounded-full animate-bounce"></div>
					</div>
					<div className="character-name text-xs text-pink-300 mt-2 text-center animate-fade-in font-bold">Eleven</div>
				</div>

				{/* Mike Character - Top Right */}
				<div className="character mike absolute top-32 right-8 w-20 h-20">
					<div className="character-sprite bg-gradient-to-b from-blue-400 to-blue-800 rounded-full w-full h-full relative overflow-hidden">
						<div className="absolute inset-0 bg-blue-500 opacity-20 animate-ping"></div>
						<div className="absolute top-1/3 left-1/3 w-1/3 h-1/3 bg-blue-300 rounded-full animate-spin"></div>
					</div>
					<div className="character-name text-xs text-blue-300 mt-2 text-center animate-fade-in font-bold">Mike</div>
				</div>

				{/* Dustin Character - Bottom Left */}
				<div className="character dustin absolute bottom-32 left-8 w-20 h-20">
					<div className="character-sprite bg-gradient-to-b from-yellow-400 to-yellow-800 rounded-full w-full h-full relative overflow-hidden">
						<div className="absolute inset-0 bg-yellow-500 opacity-20 animate-pulse"></div>
						<div className="absolute top-1/2 left-1/2 w-1/4 h-1/4 bg-yellow-300 rounded-full animate-bounce"></div>
					</div>
					<div className="character-name text-xs text-yellow-300 mt-2 text-center animate-fade-in font-bold">Dustin</div>
				</div>

				{/* Will Character - Bottom Right */}
				<div className="character will absolute bottom-32 right-8 w-20 h-20">
					<div className="character-sprite bg-gradient-to-b from-green-400 to-green-800 rounded-full w-full h-full relative overflow-hidden">
						<div className="absolute inset-0 bg-green-500 opacity-20 animate-ping"></div>
						<div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-green-300 rounded-full animate-spin"></div>
					</div>
					<div className="character-name text-xs text-green-300 mt-2 text-center animate-fade-in font-bold">Will</div>
				</div>

				{/* Demogorgon - Center */}
				<div className="character demogorgon absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32">
					<div className="character-sprite bg-gradient-to-b from-purple-600 to-black rounded-full w-full h-full relative overflow-hidden animate-demogorgon">
						<div className="absolute inset-0 bg-purple-500 opacity-30 animate-pulse"></div>
						<div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-purple-400 rounded-full animate-spin"></div>
						<div className="absolute top-1/2 left-1/2 w-1/4 h-1/4 bg-red-500 rounded-full animate-ping"></div>
					</div>
					<div className="character-name text-xs text-purple-300 mt-2 text-center animate-fade-in font-bold">Demogorgon</div>
				</div>
			</div>

			{/* Advanced Background Effects - Reduced Opacity */}
			<div className="absolute inset-0 z-5">
				<div className="upside-down-portal absolute top-1/4 left-1/4 w-48 h-48 rounded-full bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 opacity-10 animate-portal"></div>
				<div className="upside-down-portal absolute bottom-1/4 right-1/4 w-36 h-36 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-red-600 opacity-10 animate-portal-reverse"></div>
			</div>

			{/* Main Content */}
			<div className="relative z-20">
				<header className="flex items-center justify-between px-6 py-4">
					<h1 className="text-3xl md:text-5xl tracking-widest font-black text-red-600 animate-title-glow">
						WISTERIA '25
					</h1>
					<nav className="space-x-4 text-sm">
						<Link to="/login" className="text-white hover:text-red-300 transition-colors duration-300 font-semibold">Login</Link>
					</nav>
				</header>

				<main className="flex flex-col items-center text-center px-6 pt-20 pb-24">
					<h2 className="text-5xl md:text-7xl font-black tracking-[0.2em] text-red-600 animate-main-title" data-text="ENTER THE UPSIDE DOWN">
						ENTER THE UPSIDE DOWN
					</h2>
					
					{/* Dynamic Content Based on Visit */}
					{isFirstVisit ? (
						/* First Time Visitor Content */
						<div className="mt-8 max-w-4xl text-white/90 text-lg md:text-xl animate-fade-in-delayed space-y-4">
							<p>
								Welcome to <span className="text-red-400 font-bold">Wisteria '25</span> - where reality meets the extraordinary. 
								Just like Eleven's journey through the Upside Down, prepare to experience technology that defies the laws of physics.
							</p>
							<p>
								This isn't just another college event - this is your portal to a world where innovation meets imagination. 
								From Hawkins to GCET, the adventure awaits those brave enough to cross the threshold.
							</p>
							<p>
								Join us for three days of mind-bending workshops, reality-shifting competitions, and experiences that will make you question everything you thought you knew about technology.
							</p>
						</div>
					) : (
						/* Returning Visitor Content */
						<div className="mt-8 max-w-4xl text-white/90 text-lg md:text-xl animate-fade-in-delayed space-y-4">
							<p>
								Welcome back to <span className="text-blue-400 font-bold">Wisteria '25</span>! 
								The Upside Down awaits your return with even more mind-bending experiences and reality-defying technology.
							</p>
							<p>
								This time, we've prepared something even more extraordinary. New portals, advanced workshops, and challenges that will push your limits beyond what you experienced before.
							</p>
							<p>
								Ready to dive deeper into the unknown? The adventure continues with enhanced workshops, new competitions, and experiences that will redefine your understanding of technology.
							</p>
						</div>
					)}
					
					<div className="mt-6 inline-flex items-center gap-3 px-4 py-2 rounded-full border-2 border-red-700/60 bg-black/40 text-sm text-white animate-badge-pulse">
						<span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
						Diploma Only • Carry College ID at registration
					</div>

					{/* Register Button */}
					<div className="mt-16 animate-float">
						<button 
							onClick={() => setShowRegistrationForm(true)}
							className="btn-advanced-neon"
						>
							<span className="btn-text">Register Participant</span>
							<span className="btn-glow"></span>
						</button>
					</div>

					{/* Enhanced Event Details */}
					<div className="mt-20 w-full max-w-6xl text-white/90">
						<div className="advanced-divider"></div>
						
						{/* Stranger Things Themed Event Highlights */}
						<div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
							<div className="advanced-card tilt-3d">
								<h3 className="text-pink-300 font-bold text-lg">The Hawkins Experience</h3>
								<p className="text-sm opacity-80 mt-2">Reality-bending workshops that will make you question everything</p>
							</div>
							<div className="advanced-card tilt-3d">
								<h3 className="text-blue-300 font-bold text-lg">Upside Down Tech</h3>
								<p className="text-sm opacity-80 mt-2">Advanced technology demonstrations that defy conventional limits</p>
							</div>
							<div className="advanced-card tilt-3d">
								<h3 className="text-yellow-300 font-bold text-lg">Portal Competitions</h3>
								<p className="text-sm opacity-80 mt-2">Mind-bending challenges that test your creativity and skills</p>
							</div>
						</div>

						<div className="marquee-advanced border-y-2 border-red-900/40 py-4">
							<span>
								Wisteria '25 • 17-19 September • GCET College, Anand • Tech • Non-Tech • Workshops • Food Provided • 
								Hawkins Experience • Upside Down Tech • Portal Competitions • Wisteria '25 • 17-19 September • GCET College, Anand • 
								Tech • Non-Tech • Workshops • Food Provided • Hawkins Experience • Upside Down Tech • Portal Competitions •
							</span>
						</div>
						
						<div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
							<div className="advanced-card tilt-3d">
								<h3 className="text-white font-bold text-lg">Dates</h3>
								<p className="text-sm opacity-80 mt-2">17, 18, 19 September</p>
							</div>
							<div className="advanced-card tilt-3d">
								<h3 className="text-white font-bold text-lg">Venue</h3>
								<p className="text-sm opacity-80 mt-2">GCET College, Anand</p>
							</div>
							<div className="advanced-card tilt-3d">
								<h3 className="text-white font-bold text-lg">Includes</h3>
								<p className="text-sm opacity-80 mt-2">Tech • Non-Tech • Workshops • Food</p>
							</div>
							<div className="advanced-card tilt-3d">
								<h3 className="text-white font-bold text-lg">Experience</h3>
								<p className="text-sm opacity-80 mt-2">Something Extraordinary</p>
							</div>
						</div>
					</div>
				</main>

				<footer className="px-6 pb-8 text-sm text-white/80 text-center">
					<p>Wisteria '25 • Welcome to the Future • Hawkins Awaits</p>
				</footer>
			</div>

			{/* Registration Form Modal */}
			<RegistrationForm
				isOpen={showRegistrationForm}
				onClose={() => setShowRegistrationForm(false)}
				onSuccess={handleRegistrationSuccess}
			/>
		</div>
	)
}


