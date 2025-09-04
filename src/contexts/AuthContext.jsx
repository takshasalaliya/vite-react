import { createContext, useContext, useEffect, useState } from 'react'
import { AuthService } from '../lib/authService'

const AuthContext = createContext({})

export const useAuth = () => {
	return useContext(AuthContext)
}

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null)
	const [userRole, setUserRole] = useState(null)
	const [loading, setLoading] = useState(true)

	const signIn = async (email, password) => {
		try {
			console.log('AuthContext: Attempting sign in for:', email)
			
			const result = await AuthService.signIn(email, password)
			console.log('AuthContext: Sign in result:', result)
			
			if (result?.user) {
				console.log('AuthContext: Setting user and role...')
				setUser(result.user)
				setUserRole(result.role)
				console.log('AuthContext: User set:', result.user.email, 'Role:', result.role)
				
				// Check if user has valid access (admin, event_manager, or event_handler)
				// Check if user has valid access (admin, event_manager, event_handler, registration_committee, scanner_committee, or participant)
				if (!['admin', 'event_manager', 'event_handler', 'registration_committee', 'scanner_committee', 'participant'].includes(result.role.trim())) {
					console.log('AuthContext: User role not authorized:', result.role)
					setUser(null)
					setUserRole(null)
					throw new Error('Access denied. Invalid user role.')
				}
				
				console.log('AuthContext: Authentication successful')
				return result
			} else {
				throw new Error('Authentication failed')
			}
		} catch (error) {
			console.error('AuthContext: Sign in error:', error)
			throw error
		}
	}

	const signOut = async () => {
		try {
			console.log('AuthContext: Signing out...')
			await AuthService.signOut()
			setUser(null)
			setUserRole(null)
			console.log('AuthContext: Sign out successful')
		} catch (error) {
			console.error('AuthContext: Sign out error:', error)
		}
	}

	// Check if user is admin
	const isAdmin = userRole === 'admin'
	
	// Check if user is event manager
	const isEventManager = userRole === 'event_manager'

	// Check if user is registration committee or scanner committee
	const isRegistrationCommittee = userRole === 'registration_committee'
	const isScannerCommittee = userRole === 'scanner_committee'
	
	// Check if user is participant
	const isParticipant = userRole === 'participant'
	
	// Check if user can access admin panel (admin only)
	const canAccessAdminPanel = isAdmin
	
	// Check if user can access event manager panel (admin or event_manager)
	const canAccessEventManagerPanel = isAdmin || isEventManager

	// Check if user can access registration committee panel (admin, registration_committee, or scanner_committee)
	const canAccessRegistrationCommitteePanel = isAdmin || isRegistrationCommittee || isScannerCommittee
	
	// Check if user can access user dashboard (participant)
	const canAccessUserDashboard = isParticipant

	useEffect(() => {
		const initializeAuth = async () => {
			try {
				console.log('AuthContext: Initializing authentication...')
				
				// For direct database auth, we don't have persistent sessions
				// Users will need to log in each time
				console.log('AuthContext: No persistent session, user needs to log in')
				setUser(null)
				setUserRole(null)
			} catch (error) {
				console.error('AuthContext: Initialization error:', error)
				setUser(null)
				setUserRole(null)
			} finally {
				setLoading(false)
			}
		}

		initializeAuth()
	}, [])

	const value = {
		user,
		userRole,
		loading,
		isAdmin,
		isEventManager,
		isRegistrationCommittee,
		isScannerCommittee,
		isParticipant,
		canAccessAdminPanel,
		canAccessEventManagerPanel,
		canAccessRegistrationCommitteePanel,
		canAccessUserDashboard,
		signIn,
		signOut,
	}

	return (
		<AuthContext.Provider value={value}>
			{children}
		</AuthContext.Provider>
	)
}