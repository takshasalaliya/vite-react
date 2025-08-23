import { useState } from 'react'
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  Menu, 
  X, 
  Home, 
  Users, 
  Building2, 
  Calendar, 
  BookOpen, 
  Package, 
  ClipboardList, 
  QrCode, 
  BarChart3, 
  Settings,
  LogOut,
  Sun,
  Moon,
  UserCheck,
  ChevronDown
} from 'lucide-react'

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const { user, signOut, isAdmin, isEventManager, isRegistrationCommittee, isScannerCommittee, userRole } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // Define navigation based on user role
  const getNavigation = () => {
    if (isAdmin) {
      return [
        { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
        { name: 'Users', href: '/admin/users', icon: Users },
        { name: 'Colleges', href: '/admin/colleges', icon: Building2 },
        { name: 'Events', href: '/admin/events', icon: Calendar },
        { name: 'Event Manager', href: '/admin/event-manager', icon: UserCheck },
        { name: 'Workshops', href: '/admin/workshops', icon: BookOpen },
        { name: 'Combos', href: '/admin/combos', icon: Package },
        { name: 'Registrations', href: '/admin/registrations', icon: ClipboardList },
        { name: 'Attendance', href: '/admin/attendance', icon: QrCode },
        { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
        { name: 'Settings', href: '/admin/settings', icon: Settings },
      ]
    } else if (isEventManager) {
      return [
        { name: 'Event Manager Dashboard', href: '/event-manager/dashboard', icon: Home },
      ]
    } else if (userRole === 'event_handler') {
      return [
        { name: 'Event Handler Dashboard', href: '/event-handler/dashboard', icon: Home },
      ]
    } else if (isRegistrationCommittee || isScannerCommittee) {
      return [
        ...(isScannerCommittee ? [] : [{ name: 'User Management', href: '/registration-committee/users', icon: Users }]),
        ...(isScannerCommittee ? [] : [{ name: 'Event Management', href: '/registration-committee/events', icon: Calendar }]),
        { name: isScannerCommittee ? 'Scanner' : 'Attendance Management', href: '/registration-committee/attendance', icon: QrCode },
      ];
    }
    return []
  }

  const navigation = getNavigation()

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100 dark:bg-gray-900">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-800">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {isAdmin ? 'Admin Panel' : isEventManager ? 'Event Manager Panel' : (isRegistrationCommittee || isScannerCommittee) ? (isScannerCommittee ? 'Scanner Panel' : 'Registration Coordinator Panel') : 'Event Handler Panel'}
              </h1>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                      isActive
                        ? 'bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <item.icon className="mr-4 h-6 w-6" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {isAdmin ? 'Admin Panel' : isEventManager ? 'Event Manager Panel' : (isRegistrationCommittee || isScannerCommittee) ? (isScannerCommittee ? 'Scanner Panel' : 'Registration Coordinator Panel') : 'Event Handler Panel'}
                </h1>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                        isActive
                          ? 'bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top header */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white dark:bg-gray-800 shadow">
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex items-center">
              <button
                type="button"
                className="lg:hidden px-4 border-r border-gray-200 dark:border-gray-700 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                onClick={() => setSidebarOpen(true)}
              >
                <span className="sr-only">Open sidebar</span>
                <Menu className="h-6 w-6" />
              </button>
              <div className="ml-4 lg:ml-0">
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {isAdmin ? 'Admin Panel' : isEventManager ? 'Event Manager Panel' : (isRegistrationCommittee || isScannerCommittee) ? (isScannerCommittee ? 'Scanner Panel' : 'Registration Coordinator Panel') : 'Event Handler Panel'}
                </h1>
              </div>
            </div>
            
            {/* User profile dropdown */}
            <div className="ml-4 flex items-center md:ml-6">
              {/* Dark mode toggle - separate from profile dropdown */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 mr-2"
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              
              <div className="relative">
                <button
                  type="button"
                  className="max-w-xs bg-white dark:bg-gray-800 rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-3">
                      {user?.photo_url ? (
                        <img
                          src={user.photo_url}
                          alt={user?.name || user?.email}
                          className="h-8 w-8 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.nextSibling.style.display = 'flex'
                          }}
                        />
                      ) : null}
                      <div className={`h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center ${user?.photo_url ? 'hidden' : 'flex'}`}>
                        <span className="text-sm font-medium text-white">
                          {user?.email?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="hidden md:block">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {user?.name || user?.email}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {isAdmin ? 'Administrator' : isEventManager ? 'Event Manager' : isRegistrationCommittee ? 'Registration Coordinator' : isScannerCommittee ? 'Scanner Committee' : 'Event Handler'}
                        </div>
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </button>

                {/* Profile dropdown menu */}
                {profileDropdownOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {user?.name || user?.email}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {isAdmin ? 'Administrator' : isEventManager ? 'Event Manager' : isRegistrationCommittee ? 'Registration Coordinator' : isScannerCommittee ? 'Scanner Committee' : 'Event Handler'}
                      </div>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <div className="flex items-center">
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign out
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      {/* Overlay for mobile dropdown */}
      {profileDropdownOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden" 
          onClick={() => setProfileDropdownOpen(false)}
        />
      )}
    </div>
  )
}

export default Layout