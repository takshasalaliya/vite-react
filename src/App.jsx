import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Home from './pages/Home'
import Participant from './pages/Participant'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Colleges from './pages/Colleges'
import Events from './pages/Events'
import EventManager from './pages/EventManager'
import EventHandler from './pages/EventHandler'
import Workshops from './pages/Workshops'
import Combos from './pages/Combos'
import Registrations from './pages/Registrations'
import Attendance from './pages/Attendance'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Layout from './components/Layout'
import LoadingSpinner from './components/LoadingSpinner'
import RegistrationCoordinator from './pages/RegistrationCoordinator'
import UserDashboard from './pages/UserDashboard'
import UserAttendancePage from './pages/UserAttendancePage'
import Register from './pages/Register'

const ProtectedRoute = ({ children, requireAdmin = false, requireEventManager = false, requireRegistrationCommittee = false }) => {
	const { 
		user, 
		loading, 
		isAdmin, 
		isEventManager, 
		isRegistrationCommittee,
		canAccessAdminPanel, 
		canAccessEventManagerPanel,
		canAccessRegistrationCommitteePanel
	} = useAuth()

	console.log('ProtectedRoute: Current state:', { 
		user: user?.email, 
		loading, 
		isAdmin, 
		isEventManager,
		isRegistrationCommittee,
		requireAdmin,
		requireEventManager,
		requireRegistrationCommittee,
		pathname: window.location.pathname 
	})

	if (loading) {
		console.log('ProtectedRoute: Loading...')
		return <LoadingSpinner />
	}

	if (!user) {
		console.log('ProtectedRoute: No user, redirecting to login')
		return <Navigate to="/login" replace />
	}

	// Check specific access requirements
	if (requireAdmin && !canAccessAdminPanel) {
		console.log('ProtectedRoute: Admin access required but user is not admin')
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
				<div className="max-w-md w-full text-center">
					<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-6">
						<h2 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
							Access Denied
						</h2>
						<p className="text-sm text-red-600 dark:text-red-400">
							You need admin privileges to access this panel.
						</p>
					</div>
				</div>
			</div>
		)
	}

	if (requireEventManager && !canAccessEventManagerPanel) {
		console.log('ProtectedRoute: Event Manager access required but user does not have permission')
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
				<div className="max-w-md w-full text-center">
					<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-6">
						<h2 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
							Access Denied
						</h2>
						<p className="text-sm text-red-600 dark:text-red-400">
							You need event manager privileges to access this panel.
						</p>
					</div>
				</div>
			</div>
		)
	}

	if (requireRegistrationCommittee && !canAccessRegistrationCommitteePanel) {
		console.log('ProtectedRoute: Registration Committee access required but user does not have permission')
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
				<div className="max-w-md w-full text-center">
					<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-6">
						<h2 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
							Access Denied
						</h2>
						<p className="text-sm text-red-600 dark:text-red-400">
							You need registration committee privileges to access this panel.
						</p>
					</div>
				</div>
			</div>
		)
	}

	console.log('ProtectedRoute: Access granted')
	return children
}

function App() {
	return (
		<AuthProvider>
			<Router>
				<Routes>
					<Route path="/login" element={<Login />} />
					<Route path="/register" element={<Register />} />
					
					{/* Admin Panel Routes */}
					<Route
						path="/admin"
						element={
							<ProtectedRoute requireAdmin={true}>
								<Layout />
							</ProtectedRoute>
						}
					>
						<Route index element={<Navigate to="/admin/dashboard" replace />} />
						<Route path="dashboard" element={<Dashboard />} />
						<Route path="users" element={<Users />} />
						<Route path="colleges" element={<Colleges />} />
						<Route path="event-manager" element={<EventManager />} />
						<Route path="events" element={<Events />} />
						<Route path="workshops" element={<Workshops />} />
						<Route path="combos" element={<Combos />} />
						<Route path="registrations" element={<Registrations />} />
						<Route path="attendance" element={<Attendance />} />
						<Route path="reports" element={<Reports />} />
						<Route path="settings" element={<Settings />} />
					</Route>

					{/* Event Manager Panel Routes */}
					<Route
						path="/event-manager"
						element={
							<ProtectedRoute requireEventManager={true}>
								<Layout />
							</ProtectedRoute>
						}
					>
						<Route index element={<Navigate to="/event-manager/dashboard" replace />} />
						<Route path="dashboard" element={<EventManager />} />
					</Route>

					{/* Event Handler Panel Routes */}
					<Route
						path="/event-handler"
						element={
							<ProtectedRoute>
								<Layout />
							</ProtectedRoute>
						}
					>
						<Route index element={<Navigate to="/event-handler/dashboard" replace />} />
						<Route path="dashboard" element={<EventHandler />} />
					</Route>

					{/* Registration Committee Panel Routes */}
					<Route
						path="/registration-committee"
						element={
							<ProtectedRoute requireRegistrationCommittee={true}>
								<Layout />
							</ProtectedRoute>
						}
					>
						<Route index element={<Navigate to="/registration-committee/users" replace />} />
						<Route path="users" element={<RegistrationCoordinator />} />
						<Route path="events" element={<RegistrationCoordinator />} />
						<Route path="attendance" element={<RegistrationCoordinator />} />
					</Route>

					{/* User Dashboard Routes */}
					<Route
						path="/user"
						element={
							<ProtectedRoute>
								<UserDashboard />
							</ProtectedRoute>
						}
					/>

					{/* Public Routes */}
					<Route path="/" element={<Home />} />
					<Route path="/events" element={<Events />} />
					<Route path="/participant" element={<Participant />} />
					<Route path="/attendance/:userId" element={<UserAttendancePage />} />
				</Routes>
			</Router>
		</AuthProvider>
	)
}

export default App
