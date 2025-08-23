import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'

export default function Login() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [showPassword, setShowPassword] = useState(false)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const { signIn } = useAuth()
	const navigate = useNavigate()

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
			console.log('SignIn result.user:', result?.user)
			console.log('SignIn result.user?.email:', result?.user?.email)
			
			// Check if sign in was successful
			if (result?.user) {
				console.log('Login successful, navigating based on role...')
				console.log('Current location before navigation:', window.location.pathname)
				
				// Determine navigation path based on user role
				let navigationPath = '/'
				
				if (result.role === 'admin') {
					navigationPath = '/admin/dashboard'
					console.log('User is admin, navigating to admin dashboard')
				} else if (result.role === 'event_manager') {
					navigationPath = '/event-manager/dashboard'
					console.log('User is event manager, navigating to event manager dashboard')
				} else if (result.role === 'event_handler') {
					navigationPath = '/event-handler/dashboard'
					console.log('User is event handler, navigating to event handler dashboard')
				} else if (result.role === 'registration_committee' || result.role === 'scanner_committee') {
					navigationPath = '/registration-committee/users'
					console.log('User is registration coordinator, navigating to registration coordinator dashboard')
				} else {
					console.log('Unknown role, navigating to root (will be redirected)')
				}
				
				// Wait a moment for the auth state to update
				setTimeout(() => {
					console.log('Executing navigation to', navigationPath)
					navigate(navigationPath)
					console.log('Navigation executed')
				}, 100)
			} else {
				console.log('Login failed - no user data')
				setError('Login failed. Please check your credentials.')
			}
		} catch (error) {
			console.error('Login error:', error)
			setError(error.message || 'Login failed. Please check your credentials.')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-md w-full space-y-8">
				<div>
					<h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
						Sign in to your account
					</h2>
					<p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
						College Event Management System
					</p>
				</div>
				<form className="mt-8 space-y-6" onSubmit={handleSubmit}>
					<div className="rounded-md shadow-sm -space-y-px">
						<div className="relative">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<Mail className="h-5 w-5 text-gray-400" />
							</div>
							<input
								id="email"
								name="email"
								type="email"
								autoComplete="email"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-800"
								placeholder="Email address"
							/>
						</div>
						<div className="relative">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<Lock className="h-5 w-5 text-gray-400" />
							</div>
							<input
								id="password"
								name="password"
								type={showPassword ? 'text' : 'password'}
								autoComplete="current-password"
								required
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 pr-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-800"
								placeholder="Password"
							/>
							<button
								type="button"
								className="absolute inset-y-0 right-0 pr-3 flex items-center"
								onClick={() => setShowPassword(!showPassword)}
							>
								{showPassword ? (
									<EyeOff className="h-5 w-5 text-gray-400" />
								) : (
									<Eye className="h-5 w-5 text-gray-400" />
								)}
							</button>
						</div>
					</div>

					{error && (
						<div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
							<div className="text-sm text-red-800 dark:text-red-200">{error}</div>
						</div>
					)}

					<div>
						<button
							type="submit"
							disabled={loading}
							className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{loading ? 'Signing in...' : 'Sign in'}
						</button>
					</div>

					<div className="text-center">
						<p className="text-xs text-gray-500 dark:text-gray-400">
							Demo credentials: admin@college.edu / admin123
						</p>
					</div>
				</form>
			</div>
		</div>
	)
}