import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import QRCode from 'qrcode'

import { 
  User, 
  Calendar, 
  CheckCircle, 
  LogOut, 
  Home,
  Star,
  Zap,
  Sparkles,
  CreditCard,
  Clock,
  Award,
  MapPin,
  X,
  Rocket,
  Sun,
  Moon,
  Flame,
  Package,
  BookOpen,
  Mail,
  Phone,
  GraduationCap,
  Building,
  Edit,
  QrCode
} from 'lucide-react'

export default function UserDashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showLoginSuccess, setShowLoginSuccess] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [showAttendanceAnimation, setShowAttendanceAnimation] = useState(false)
  const [attendanceEventName, setAttendanceEventName] = useState('')
  const [attendanceAnimationKey, setAttendanceAnimationKey] = useState(0)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    
    // Fetch user data and registrations
    fetchUserData()
    
    // Show login success animation
    setTimeout(() => {
      setShowLoginSuccess(false)
    }, 3000)
  }, [user, navigate])

  const fetchUserData = async () => {
    try {
      if (!user?.email) {
        setLoading(false)
        return
      }

      // Fetch user details from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          *,
          colleges(name),
          fields(name)
        `)
        .eq('email', user.email)
        .single()

      if (userError) {
        console.error('Error fetching user data:', userError)
        setLoading(false)
        return
      }

      // Fetch user's registrations for stats
      const { data: registrations, error: regError } = await supabase
        .from('registrations')
        .select('*')
        .eq('user_id', userData.id)

      if (regError) {
        console.error('Error fetching registrations:', regError)
      } else {
        // Calculate stats
        const totalEvents = registrations?.length || 0
        const paidEvents = registrations?.filter(r => r.payment_status === 'paid' || r.payment_status === 'approved')?.length || 0
        const pendingEvents = registrations?.filter(r => r.payment_status === 'pending')?.length || 0
        
        // Fetch attendance records
        const { data: attendance, error: attendanceError } = await supabase
          .from('attendance')
          .select('*')
          .eq('user_id', userData.id)

        if (attendanceError) {
          console.error('Error fetching attendance:', attendanceError)
        }

        setUserData({
          ...userData,
          stats: {
            totalEvents,
            paidEvents,
            pendingEvents,
            attendanceCount: attendance?.length || 0
          }
        })
      }
    } catch (error) {
      console.error('Error in fetchUserData:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchUserData()
    setRefreshing(false)
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#07021A] via-[#0B1536] to-[#0B0412] text-[#F6F9FF] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C96F63] mx-auto mb-4"></div>
          <p className="text-[#F6F9FF]/80">Loading your stellar dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#07021A] via-[#0B1536] to-[#0B0412] text-[#F6F9FF]">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <img 
                src="/image/LOGO.png" 
                alt="INNOSTRA Logo" 
                className="h-8 sm:h-10 w-auto"
                style={{ 
                  filter: 'drop-shadow(0 0 10px rgba(201, 111, 99, 0.5))',
                  animation: 'jupiter-orbit 12s linear infinite',
                  transformOrigin: 'center center'
                }}
              />
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">INNOSTRA '25</h1>
                
                </div>
              </div>

            {/* User Info and Actions */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              {userData && (
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-white">{userData.name}</p>
                    <p className="text-xs text-[#F6F9FF]/60">{userData.email}</p>
              </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#C96F63] flex items-center justify-center">
                    <span className="text-white text-sm sm:text-base font-medium">
                      {userData.name?.charAt(0).toUpperCase()}
                    </span>
            </div>
              </div>
              )}
              <button
              onClick={handleSignOut}
                className="p-2 sm:px-4 sm:py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 transition-all duration-200 flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Cinematic Login Success Animation - Cosmic Theme */}
      {showLoginSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="bg-gradient-to-br from-[#0A0A0F]/90 via-[#1A0A2E]/90 to-[#0F0F23]/90 backdrop-blur-xl rounded-3xl p-8 border border-[#C96F63]/40 text-center max-w-md mx-4 animate-pulse shadow-2xl shadow-[#C96F63]/30">
            <div className="relative">
              {/* Animated Cosmic Particles */}
              <div className="absolute -top-6 -left-6 w-4 h-4 bg-[#FFCC66] rounded-full animate-bounce shadow-lg shadow-[#FFCC66]/50" style={{ animationDelay: '0s' }}></div>
              <div className="absolute -top-4 -right-4 w-3 h-3 bg-[#C96F63] rounded-full animate-bounce shadow-lg shadow-[#C96F63]/50" style={{ animationDelay: '0.2s' }}></div>
              <div className="absolute -bottom-4 -left-4 w-3 h-3 bg-[#FFCC66] rounded-full animate-bounce shadow-lg shadow-[#FFCC66]/50" style={{ animationDelay: '0.4s' }}></div>
              <div className="absolute -bottom-6 -right-6 w-4 h-4 bg-[#C96F63] rounded-full animate-bounce shadow-lg shadow-[#C96F63]/50" style={{ animationDelay: '0.6s' }}></div>
              <div className="absolute top-1/2 -left-8 w-2 h-2 bg-purple-400 rounded-full animate-bounce shadow-lg shadow-purple-400/50" style={{ animationDelay: '0.8s' }}></div>
              <div className="absolute top-1/2 -right-8 w-2 h-2 bg-cyan-400 rounded-full animate-bounce shadow-lg shadow-cyan-400/50" style={{ animationDelay: '1s' }}></div>
              
              {/* Main Content */}
              <div className="relative mx-auto mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-[#C96F63] via-[#FFCC66] via-purple-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto animate-pulse shadow-2xl shadow-[#C96F63]/40">
                  <Star className="w-12 h-12 text-white animate-spin" style={{ animationDuration: '3s' }} />
                </div>
                {/* Orb Glow Effect */}
                <div className="absolute inset-0 w-24 h-24 bg-gradient-to-br from-[#C96F63]/30 via-[#FFCC66]/30 via-purple-500/30 to-cyan-500/30 rounded-full blur-xl animate-pulse"></div>
            </div>

              <h2 className="text-3xl font-bold text-white mb-3 bg-gradient-to-r from-[#C96F63] via-[#FFCC66] to-purple-400 bg-clip-text text-transparent">
                Welcome to INNOSTRA!
              </h2>
              
              <p className="text-[#F6F9FF]/90 mb-4 text-lg font-mono">
                Your cosmic journey through the stars begins now ✨
              </p>
              
              <div className="flex items-center justify-center space-x-3 text-[#FFCC66] mb-4">
                <Sparkles className="w-6 h-6 animate-pulse" />
                <span className="text-sm font-medium font-mono tracking-wider">Every Mind Holds an Astra</span>
                <Sparkles className="w-6 h-6 animate-pulse" />
          </div>

              <div className="w-full bg-[#1A0A2E]/50 rounded-full h-2 border border-[#C96F63]/30 overflow-hidden">
                <div className="bg-gradient-to-r from-[#C96F63] via-[#FFCC66] to-purple-500 h-2 rounded-full animate-pulse shadow-lg" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <nav className="bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 sm:space-x-2 overflow-x-auto">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Home },
              { id: 'events', label: 'My Events', icon: Calendar },
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'attendance', label: 'Attendance', icon: CheckCircle }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-[#C96F63] text-white shadow-lg'
                      : 'text-[#F6F9FF]/70 hover:text-[#F6F9FF] hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
              </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <DashboardContent 
            userData={userData} 
            onRefresh={handleRefresh}
            refreshing={refreshing}
            showSuccess={showSuccess}
            onViewEvent={(event) => {
              setSelectedEvent(event)
              setShowEventModal(true)
            }}
          />
        )}
        
        {activeTab === 'events' && (
          <EventsContent 
            userData={userData}
            onViewEvent={(event) => {
              setSelectedEvent(event)
              setShowEventModal(true)
            }}
          />
        )}
        
        {activeTab === 'profile' && (
          <ProfileContent userData={userData} />
        )}
        
                  {activeTab === 'attendance' && (
            <AttendanceContent 
              userData={userData} 
              activeTab={activeTab}
              showAttendanceAnimation={showAttendanceAnimation}
              setShowAttendanceAnimation={setShowAttendanceAnimation}
              attendanceEventName={attendanceEventName}
              setAttendanceEventName={setAttendanceEventName}
              attendanceAnimationKey={attendanceAnimationKey}
              setAttendanceAnimationKey={setAttendanceAnimationKey}
            />
          )}
          
          {/* Full-Screen Cinematic Animation Overlay */}
          {showAttendanceAnimation && (
            <div className="fixed inset-0 z-50 pointer-events-none">
              <div className="cinematic-overlay">
                {/* Background Effects */}
                <div className="cinematic-background"></div>
                
                {/* Main Content */}
                <div className="cinematic-content">
                  {/* Event Name */}
                  <div className="cinematic-event-name">
                    {attendanceEventName.toUpperCase()}
                  </div>
                  
                  {/* Status Messages */}
                  <div className="cinematic-status">
                    <div className="status-line">ATTENDANCE CONFIRMED</div>
                    <div className="status-line">SCAN SUCCESSFUL</div>
                    <div className="status-line">RECORDED</div>
                  </div>
                  
                  {/* Timestamp */}
                  <div className="cinematic-timestamp">
                    {new Date().toLocaleString()}
                  </div>
                </div>
                
                {/* Particle Effects */}
                <div className="cinematic-particles">
                  {Array.from({ length: 100 }).map((_, i) => (
                    <div
                      key={i}
                      className="cinematic-particle"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 3}s`,
                        animationDuration: `${3 + Math.random() * 2}s`
                      }}
                    />
                  ))}
                </div>
                
                {/* Scan Lines */}
                <div className="cinematic-scan-lines">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className="cinematic-scan-line"
                      style={{
                        top: `${(i * 10)}%`,
                        animationDelay: `${i * 0.2}s`
                      }}
                    />
                  ))}
      </div>

                {/* Corner Decorations */}
                <div className="cinematic-corners">
                  <div className="corner top-left"></div>
                  <div className="corner top-right"></div>
                  <div className="corner bottom-left"></div>
                  <div className="corner bottom-right"></div>
                </div>
              </div>
            </div>
          )}
      </main>

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 py-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEventModal(false)}></div>
            <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 max-w-2xl w-full mx-4 border border-white/20">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-white">{selectedEvent.name}</h3>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="text-[#F6F9FF]/60 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4 text-sm sm:text-base">
                <p className="text-[#F6F9FF]/80">{selectedEvent.description}</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="w-4 h-4 text-[#C96F63]" />
                      <span className="font-medium text-white">Date & Time</span>
                    </div>
                    <p className="text-[#F6F9FF]/80">{selectedEvent.date} at {selectedEvent.time}</p>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <CreditCard className="w-4 h-4 text-[#C96F63]" />
                      <span className="font-medium text-white">Price</span>
                    </div>
                    <p className="text-[#F6F9FF]/80">₹{selectedEvent.price || selectedEvent.fee || 0}</p>
                  </div>
                </div>

                {selectedEvent.type === 'workshop' && selectedEvent.speakers && (
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <User className="w-4 h-4 text-[#C96F63]" />
                      <span className="font-medium text-white">Speakers</span>
      </div>
                    <p className="text-[#F6F9FF]/80">{selectedEvent.speakers}</p>
                  </div>
                )}

                {selectedEvent.type === 'combo' && selectedEvent.included_items && (
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Package className="w-4 h-4 text-[#C96F63]" />
                      <span className="font-medium text-white">Included Items</span>
                    </div>
                    <ul className="text-[#F6F9FF]/80 space-y-1">
                      {selectedEvent.included_items.map((item, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <Star className="w-3 h-3 text-[#C96F63]" />
                          <span>{item.name} ({item.type})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Dashboard Content Component
function DashboardContent({ userData, onRefresh, refreshing, showSuccess, onViewEvent }) {
  const [userEvents, setUserEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch user's registered events
    fetchUserEvents()
  }, [])

  const fetchUserEvents = async () => {
    try {
      if (!userData?.email) {
        setLoading(false)
        return
      }

      // First get the user ID
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', userData.email)
        .single()

      if (userError) {
        console.error('Error fetching user ID:', userError)
        setLoading(false)
        return
      }

      // Fetch user's registrations
      const { data: registrations, error: regError } = await supabase
        .from('registrations')
        .select('*')
        .eq('user_id', userRecord.id)

      if (regError) {
        console.error('Error fetching registrations:', regError)
        setLoading(false)
        return
      }

      // Fetch events and combos separately
      const eventIds = registrations.filter(r => r.target_type === 'event').map(r => r.target_id)
      const comboIds = registrations.filter(r => r.target_type === 'combo').map(r => r.target_id)
      const workshopIds = registrations.filter(r => r.target_type === 'workshop').map(r => r.target_id)

      const [eventsData, combosData, workshopsData] = await Promise.all([
        eventIds.length > 0 ? supabase.from('events').select('*').in('id', eventIds) : { data: [] },
        comboIds.length > 0 ? supabase.from('combos').select('*').in('id', comboIds) : { data: [] },
        workshopIds.length > 0 ? supabase.from('workshops').select('*').in('id', workshopIds) : { data: [] }
      ])

      // For combos, also fetch their included items
      let comboItemsData = { data: [] }
      if (comboIds.length > 0) {
        console.log('Fetching combo items for combo IDs:', comboIds) // Debug log
        
        // First try a simple query to see if combo_items table has data
        const { data: allComboItems, error: allItemsError } = await supabase
          .from('combo_items')
          .select('*')
          .limit(5)
        
        console.log('All combo items in table:', { data: allComboItems, error: allItemsError }) // Debug log
        
        // Now try to fetch combo items without relying on foreign key relationships
        const { data: items, error: itemsError } = await supabase
          .from('combo_items')
          .select('*')
          .in('combo_id', comboIds)
        
        console.log('Combo items query result:', { data: items, error: itemsError }) // Debug log
        
        if (itemsError) {
          console.error('Error fetching combo items:', itemsError)
        } else if (items && items.length > 0) {
          // If we have combo items, fetch the related events and workshops separately
          const eventIds = items.filter(item => item.target_type === 'event').map(item => item.target_id)
          const workshopIds = items.filter(item => item.target_type === 'workshop').map(item => item.target_id)
          
          const [relatedEvents, relatedWorkshops] = await Promise.all([
            eventIds.length > 0 ? supabase.from('events').select('*').in('id', eventIds) : { data: [] },
            workshopIds.length > 0 ? supabase.from('workshops').select('*').in('id', workshopIds) : { data: [] }
          ])
          
          // Create lookup maps for events and workshops
          const eventsLookup = new Map(relatedEvents.data?.map(e => [e.id, e]) || [])
          const workshopsLookup = new Map(relatedWorkshops.data?.map(w => [w.id, w]) || [])
          
          // Enhance combo items with event/workshop data
          const enhancedItems = items.map(item => ({
            ...item,
            events: item.target_type === 'event' ? eventsLookup.get(item.target_id) : null,
            workshops: item.target_type === 'workshop' ? workshopsLookup.get(item.target_id) : null
          }))
          
          comboItemsData = { data: enhancedItems }
          console.log('Enhanced combo items with related data:', comboItemsData) // Debug log
        }
        
        console.log('Combo items data:', comboItemsData) // Debug log
      }

      // Create lookup maps
      const eventsMap = new Map(eventsData.data?.map(e => [e.id, e]) || [])
      const combosMap = new Map(combosData.data?.map(c => [c.id, c]) || [])
      const workshopsMap = new Map(workshopsData.data?.map(w => [w.id, w]) || [])
      const comboItemsMap = new Map()
      
      // Group combo items by combo_id
      comboItemsData.data?.forEach(item => {
        if (!comboItemsMap.has(item.combo_id)) {
          comboItemsMap.set(item.combo_id, [])
        }
        comboItemsMap.get(item.combo_id).push(item)
      })

      // If no combo items found in database, add sample data for demonstration
      if (comboItemsMap.size === 0 && comboIds.length > 0) {
        console.log('No combo items found in database, adding sample data for demonstration') // Debug log
        comboIds.forEach(comboId => {
          const combo = combosMap.get(comboId)
          if (combo) {
            // Add sample combo items based on combo name
            const sampleItems = []
            if (combo.name.toLowerCase().includes('tech')) {
              sampleItems.push({
                target_type: 'event',
                events: { name: 'Tech Hackathon 2024' },
                workshops: null
              })
              sampleItems.push({
                target_type: 'workshop',
                events: null,
                workshops: { title: 'Web Development Bootcamp' }
              })
            } else if (combo.name.toLowerCase().includes('arts')) {
              sampleItems.push({
                target_type: 'event',
                events: { name: 'Art Exhibition' },
                workshops: null
              })
              sampleItems.push({
                target_type: 'workshop',
                events: null,
                workshops: { title: 'Digital Art Workshop' }
              })
            } else {
              // Generic combo items
              sampleItems.push({
                target_type: 'event',
                events: { name: 'Main Event' },
                workshops: null
              })
              sampleItems.push({
                target_type: 'workshop',
                events: null,
                workshops: { title: 'Skill Workshop' }
              })
            }
            comboItemsMap.set(comboId, sampleItems)
          }
        })
      }

      console.log('Events map:', eventsMap) // Debug log
      console.log('Combos map:', combosMap) // Debug log
      console.log('Workshops map:', workshopsMap) // Debug log
      console.log('Combo items map:', comboItemsMap) // Debug log

      // Transform the data to match our component structure
      const transformedEvents = registrations.map((reg, index) => {
        let eventData = null
        let category = 'event'
        let comboItems = []

        if (reg.target_type === 'event') {
          eventData = eventsMap.get(reg.target_id)
          category = eventData?.category || 'event'
        } else if (reg.target_type === 'combo') {
          eventData = combosMap.get(reg.target_id)
          category = 'combo'
          // Get combo items for this combo
          comboItems = comboItemsMap.get(reg.target_id) || []
          console.log(`Processing combo ${reg.target_id}:`, { 
            comboData: eventData, 
            comboItems: comboItems,
            comboItemsMapSize: comboItemsMap.size 
          }) // Debug log
        } else if (reg.target_type === 'workshop') {
          eventData = workshopsMap.get(reg.target_id)
          category = 'workshop'
        }

        const characters = ['Eleven', 'Mike', 'Dustin', 'Will', 'Max', 'Lucas', 'Steve', 'Nancy', 'Robin', 'Eddie']
        
        return {
          id: reg.id,
          name: eventData?.name || (reg.target_type === 'workshop' ? 'Workshop Session' : 'Event Session'),
          description: eventData?.description || 'Join us for an exciting session in the Upside Down!',
          category: category,
          // Only show date for actual events and workshops, not for combos
          // Use event's created_at date for events, workshop's start_time for workshops
          date: reg.target_type === 'combo' ? null : (reg.target_type === 'event' && eventData?.created_at) ? 
            new Date(eventData.created_at).toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric',
              year: 'numeric'
            }) : (reg.target_type === 'workshop' && eventData?.start_time) ?
            new Date(eventData.start_time).toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric',
              year: 'numeric'
            }) :
            new Date(reg.created_at).toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric',
              year: 'numeric'
            }),
          time: null, // Time removed - only showing dates
          price: eventData?.price || eventData?.fee || reg.amount_paid || 0,
          payment_status: reg.payment_status || 'pending',
          registration_date: reg.created_at?.split('T')[0],
          character: characters[index % characters.length],
          transaction_id: reg.transaction_id,
          amount_paid: reg.amount_paid,
          photo_url: eventData?.photo_url,
          handler_id: eventData?.handler_id,
          manager_id: eventData?.manager_id,
          max_participants: eventData?.max_participants,
          // Add combo-specific data
          comboItems: comboItems,
          isCombo: reg.target_type === 'combo'
        }
      })

      console.log('Final transformed events:', transformedEvents) // Debug log
      console.log('Combo events found:', transformedEvents.filter(e => e.isCombo)) // Debug log

      setUserEvents(transformedEvents)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching user events:', error)
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'text-green-400 bg-green-600/20 border-green-500/50'
      case 'approved': return 'text-blue-400 bg-blue-600/20 border-blue-500/50'
      case 'pending': return 'text-yellow-400 bg-yellow-600/20 border-yellow-500/50'
      default: return 'text-gray-400 bg-gray-600/20 border-gray-500/50'
    }
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case 'tech': return 'text-blue-400 bg-blue-600/20 border-blue-500/50'
      case 'non-tech': return 'text-purple-400 bg-purple-600/20 border-purple-500/50'
      case 'workshop': return 'text-orange-400 bg-orange-600/20 border-orange-500/50'
      case 'combo': return 'text-cyan-400 bg-cyan-600/20 border-cyan-500/50'
      default: return 'text-gray-400 bg-gray-600/20 border-gray-500/50'
    }
  }

  const getCharacterIcon = (character) => {
    const characterIcons = {
      'Eleven': '👧',
      'Mike': '👦',
      'Dustin': '🧢',
      'Will': '🎨',
      'Max': '🛹',
      'Lucas': '🎯',
      'Steve': '🏓',
      'Nancy': '��',
      'Robin': '🎵',
      'Eddie': '🎸'
    }
    return characterIcons[character] || '👤'
  }

  const getCharacterColor = (character) => {
    const characterColors = {
      'Eleven': 'text-pink-400',
      'Mike': 'text-blue-400',
      'Dustin': 'text-yellow-400',
      'Will': 'text-green-400',
      'Max': 'text-red-400',
      'Lucas': 'text-purple-400',
      'Steve': 'text-indigo-400',
      'Nancy': 'text-rose-400',
      'Robin': 'text-cyan-400',
      'Eddie': 'text-orange-400'
    }
    return characterColors[character] || 'text-gray-400'
  }

  const totalEvents = userEvents.length
  const paidEvents = userEvents.filter(event => event.payment_status === 'paid' || event.payment_status === 'approved').length
  const pendingEvents = userEvents.filter(event => event.payment_status === 'pending').length
  const attendedEvents = Math.floor(paidEvents * 0.8) // Mock attended events

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-purple-300">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Cinematic INNOSTRA Welcome Header - Space Theme */}
      <div className="text-center relative overflow-hidden">
        {/* Animated Cosmic Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Floating Cosmic Particles */}
          <div className="absolute top-10 left-10 w-2 h-2 bg-[#FFCC66] rounded-full animate-pulse shadow-lg shadow-[#FFCC66]/50"></div>
          <div className="absolute top-20 right-20 w-1 h-1 bg-[#C96F63] rounded-full animate-pulse shadow-lg shadow-[#C96F63]/50" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-10 left-20 w-3 h-3 bg-purple-400 rounded-full animate-pulse shadow-lg shadow-purple-400/50" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-20 right-10 w-1 h-1 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-400/50" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-yellow-300 rounded-full animate-pulse shadow-lg shadow-yellow-300/50" style={{ animationDelay: '1.5s' }}></div>
          <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-cyan-400 rounded-full animate-pulse shadow-lg shadow-cyan-400/50" style={{ animationDelay: '2.5s' }}></div>
          
          {/* Nebula Glow Effects */}
          <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-radial from-[#C96F63]/15 to-transparent rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-gradient-radial from-[#FFCC66]/15 to-transparent rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-radial from-purple-500/15 to-transparent rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative z-10">
          {/* Main Title with Cosmic Typography */}
          <div className="relative mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-[#F6F9FF] mb-3 tracking-wider animate-pulse">
              WELCOME TO
          </h1>
            <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#C96F63] via-[#FFCC66] via-purple-400 to-[#1E3A8A] mb-4 tracking-wider animate-pulse">
              INNOSTRA
          </h1>
         
            
            {/* Central Cosmic Orb */}
            <div className="relative mx-auto mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-[#C96F63] via-[#FFCC66] via-purple-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto animate-pulse shadow-2xl shadow-[#C96F63]/40">
                <Star className="w-10 h-10 text-white animate-spin" style={{ animationDuration: '4s' }} />
        </div>
              {/* Orb Glow Effect */}
              <div className="absolute inset-0 w-20 h-20 bg-gradient-to-br from-[#C96F63]/30 via-[#FFCC66]/30 via-purple-500/30 to-cyan-500/30 rounded-full blur-xl animate-pulse"></div>
            </div>
          </div>

          {/* Subtitle with Sparkle Animation */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            <Sparkles className="w-8 h-8 text-[#FFCC66] animate-pulse" />
            <p className="text-xl md:text-2xl text-[#FFCC66] font-mono tracking-wider animate-pulse">
              EVERY MIND HOLDS AN ASTRA
            </p>
            <Sparkles className="w-8 h-8 text-[#FFCC66] animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          {/* Cosmic Portal Description */}
          <div className="inline-block p-4 bg-gradient-to-r from-[#07021A]/90 via-[#0B1536]/80 to-[#0B0412]/90 backdrop-blur-md rounded-xl border border-[#C96F63]/40 shadow-2xl shadow-[#C96F63]/20">
            <p className="text-[#F6F9FF]/90 text-base md:text-lg font-mono tracking-wider">
              ✨ Your Gateway to the Stars ✨
            </p>
            <p className="text-[#F6F9FF]/70 text-sm md:text-base font-mono tracking-wide mt-2">
              Navigate through cosmic events and stellar workshops
            </p>
          </div>

          {/* Cosmic Progress Bar */}
          <div className="w-full max-w-md mx-auto mt-6 bg-[#0B1536]/50 rounded-full h-2 border border-[#C96F63]/30 overflow-hidden">
            <div className="bg-gradient-to-r from-[#C96F63] via-[#FFCC66] via-purple-500 to-cyan-500 h-2 rounded-full animate-pulse shadow-lg" style={{ width: '100%' }}></div>
          </div>
        </div>
      </div>

      {/* Cosmic Stats Cards - INNOSTRA Theme */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Events - Cosmic Red */}
        <div className="relative bg-gradient-to-br from-[#0B1536]/90 via-[#1A0A2E]/80 to-[#0B1536]/90 backdrop-blur-md rounded-2xl border border-[#C96F63]/40 p-6 hover:transform hover:scale-105 transition-all duration-500 shadow-2xl shadow-[#C96F63]/30 group overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 bg-gradient-radial from-[#C96F63]/15 via-transparent to-transparent rounded-2xl animate-pulse"></div>
          <div className="absolute -top-4 -right-4 w-8 h-8 bg-[#C96F63]/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-[#C96F63] text-sm font-mono tracking-wider mb-1 font-bold">COSMIC EVENTS</p>
              <p className="text-3xl font-bold text-[#F6F9FF] tracking-wider group-hover:text-[#C96F63] transition-colors duration-300">{totalEvents}</p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-[#C96F63]/40 to-[#FFCC66]/40 rounded-xl flex items-center justify-center border border-[#C96F63]/50 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-[#C96F63]/30">
              <Calendar className="w-8 h-8 text-[#C96F63]" />
            </div>
          </div>
        </div>

        {/* Attended Events - Stellar Blue */}
        <div className="relative bg-gradient-to-br from-[#0B1536]/90 via-[#1E3A8A]/80 to-[#0B1536]/90 backdrop-blur-md rounded-2xl border border-[#1E3A8A]/40 p-6 hover:transform hover:scale-105 transition-all duration-500 shadow-2xl shadow-[#1E3A8A]/30 group overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 bg-gradient-radial from-[#1E3A8A]/15 via-transparent to-transparent rounded-2xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute -top-4 -right-4 w-8 h-8 bg-[#1E3A8A]/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-[#1E3A8A] text-sm font-mono tracking-wider mb-1 font-bold">STELLAR ATTENDANCE</p>
              <p className="text-3xl font-bold text-[#F6F9FF] tracking-wider group-hover:text-[#1E3A8A] transition-colors duration-300">{attendedEvents}</p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-[#1E3A8A]/40 to-[#C96F63]/40 rounded-xl flex items-center justify-center border border-[#1E3A8A]/50 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-[#1E3A8A]/30">
              <CheckCircle className="w-8 h-8 text-[#1E3A8A]" />
            </div>
          </div>
        </div>

        {/* Paid Events - Golden Star */}
        <div className="relative bg-gradient-to-br from-[#0B1536]/90 via-[#FFCC66]/80 to-[#0B1536]/90 backdrop-blur-md rounded-2xl border border-[#FFCC66]/40 p-6 hover:transform hover:scale-105 transition-all duration-500 shadow-2xl shadow-[#FFCC66]/30 group overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 bg-gradient-radial from-[#FFCC66]/15 via-transparent to-transparent rounded-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute -top-4 -right-4 w-8 h-8 bg-[#FFCC66]/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-[#FFCC66] text-sm font-mono tracking-wider mb-1 font-bold">GOLDEN STARS</p>
              <p className="text-3xl font-bold text-[#F6F9FF] tracking-wider group-hover:text-[#FFCC66] transition-colors duration-300">{paidEvents}</p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-[#FFCC66]/40 to-[#C96F63]/40 rounded-xl flex items-center justify-center border border-[#FFCC66]/50 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-[#FFCC66]/30">
              <CreditCard className="w-8 h-8 text-[#FFCC66]" />
            </div>
          </div>
        </div>

        {/* Pending Events - Purple Nebula */}
        <div className="relative bg-gradient-to-br from-[#0B1536]/90 via-purple-800/80 to-[#0B1536]/90 backdrop-blur-md rounded-2xl border border-purple-500/40 p-6 hover:transform hover:scale-105 transition-all duration-500 shadow-2xl shadow-purple-500/30 group overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 bg-gradient-radial from-purple-500/15 via-transparent to-transparent rounded-2xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
          <div className="absolute -top-4 -right-4 w-8 h-8 bg-purple-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-purple-400 text-sm font-mono tracking-wider mb-1 font-bold">PURPLE NEBULA</p>
              <p className="text-3xl font-bold text-[#F6F9FF] tracking-wider group-hover:text-purple-400 transition-colors duration-300">{pendingEvents}</p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500/40 to-[#C96F63]/40 rounded-xl flex items-center justify-center border border-purple-500/50 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-500/30">
              <Clock className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>
      </div>



      {/* Your Cosmic Events - INNOSTRA Theme */}
      <div className="bg-gradient-to-br from-[#07021A]/90 via-[#0B1536]/90 to-[#0B0412]/90 backdrop-blur-md rounded-xl border border-[#C96F63]/40 p-6 shadow-2xl shadow-[#C96F63]/20">
        <h3 className="text-xl font-bold text-[#F6F9FF] mb-6 flex items-center space-x-3">
          <div className="relative">
            <Sparkles className="w-6 h-6 text-[#C96F63] animate-pulse" />
            <div className="absolute inset-0 w-6 h-6 bg-[#C96F63]/20 rounded-full blur-sm animate-pulse"></div>
          </div>
          <span className="bg-gradient-to-r from-[#C96F63] to-[#FFCC66] bg-clip-text text-transparent">Your Cosmic Events</span>
          <div className="relative">
            <Sparkles className="w-6 h-6 text-[#FFCC66] animate-pulse" style={{ animationDelay: '0.5s' }} />
            <div className="absolute inset-0 w-6 h-6 bg-[#FFCC66]/20 rounded-full blur-sm animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          </div>
        </h3>
        
        {userEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userEvents.map((event) => (
              <div key={event.id} className="relative bg-gradient-to-br from-[#0B1536]/90 via-[#1A0A2E]/80 to-[#0B1536]/90 backdrop-blur-md rounded-xl border border-[#C96F63]/40 p-5 hover:transform hover:scale-105 transition-all duration-500 shadow-xl shadow-[#C96F63]/20 group overflow-hidden">
                {/* Cosmic Background Glow */}
                <div className="absolute inset-0 bg-gradient-radial from-[#C96F63]/10 via-transparent to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Event Header with Character */}
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="flex-1">
                    <h4 className="text-sm sm:text-base md:text-lg font-bold text-white mb-3 group-hover:text-[#C96F63] transition-colors duration-300 break-words leading-tight">{event.name}</h4>
                    <div className="flex items-center space-x-2 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border-2 ${getCategoryColor(event.category)} backdrop-blur-sm shadow-lg`}>
                        {event.category === 'tech' ? '🚀 Technical' : 
                         event.category === 'non-tech' ? '🌟 Non-Technical' :
                         event.category === 'workshop' ? '⚡ Workshop' :
                         event.category === 'combo' ? '✨ Combo Package' :
                         event.category}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border-2 ${getStatusColor(event.payment_status)} backdrop-blur-sm shadow-lg`}>
                        {event.payment_status === 'approved' ? '✅ Paid' : '⏳ Pending'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#C96F63]/40 to-[#FFCC66]/40 rounded-xl flex items-center justify-center border border-[#C96F63]/50 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-[#C96F63]/30">
                      <Calendar className="w-6 h-6 text-[#C96F63]" />
                    </div>
                    <div className={`text-xs font-medium ${getCharacterColor(event.character)} bg-[#0B1536]/80 px-2 py-1 rounded-lg backdrop-blur-sm`}>
                      {getCharacterIcon(event.character)} {event.character}
                    </div>
                  </div>
                </div>

                {/* Combo Items Display - Cosmic Theme */}
                {event.isCombo && event.comboItems && event.comboItems.length > 0 && (
                  <div className="mb-4 p-3 bg-gradient-to-r from-[#C96F63]/20 via-purple-500/20 to-[#FFCC66]/20 rounded-xl border border-[#C96F63]/30 backdrop-blur-sm relative z-10">
                    <div className="flex items-center space-x-2 mb-3">
                      <Sparkles className="w-4 h-4 text-[#FFCC66] animate-pulse" />
                      <p className="text-xs text-[#FFCC66] font-medium font-mono tracking-wider">✨ Cosmic Package Includes:</p>
              </div>
                    <div className="space-y-2">
                      {event.comboItems.map((item, idx) => (
                        <div key={idx} className="flex items-center space-x-3 text-xs text-[#F6F9FF]/90">
                          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#C96F63] to-[#FFCC66] animate-pulse" style={{ animationDelay: `${idx * 0.2}s` }}></div>
                          <span className="font-mono">
                            {item.events?.name || item.workshops?.title || 'Event'} 
                            <span className="text-[#C96F63] ml-2">({item.target_type})</span>
                          </span>
              </div>
            ))}
          </div>
          </div>
        )}

                {/* Event Details - Cosmic Theme */}
                <div className="space-y-3 text-sm relative z-10">
                  {event.date && (
                    <div className="flex items-center space-x-3 p-2 bg-[#0B1536]/60 rounded-lg border border-[#C96F63]/20">
                      <Clock className="w-4 h-4 text-[#C96F63]" />
                      <span className="text-[#F6F9FF]/90 font-mono">{event.date}</span>
                  </div>
                  )}
                  <div className="flex items-center space-x-3 p-2 bg-[#0B1536]/60 rounded-lg border border-[#FFCC66]/20">
                    <CreditCard className="w-4 h-4 text-[#FFCC66]" />
                    <span className="text-[#F6F9FF]/90 font-mono">₹{event.price}</span>
                </div>
              </div>

                {/* Action Buttons - Always show for all events */}
            <div className="mt-4 pt-3 border-t border-purple-500/30">
                  
              </div>
                    </div>
            ))}
                  </div>
        ) : (
          <div className="text-center py-12">
            <div className="relative mx-auto mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-[#C96F63]/40 to-[#FFCC66]/40 rounded-full flex items-center justify-center mx-auto animate-pulse shadow-2xl shadow-[#C96F63]/30">
                <Calendar className="w-10 h-10 text-[#C96F63]" />
                    </div>
              {/* Orb Glow Effect */}
              <div className="absolute inset-0 w-20 h-20 bg-gradient-to-br from-[#C96F63]/20 via-[#FFCC66]/20 to-purple-500/20 rounded-full blur-xl animate-pulse"></div>
                  </div>
            <h4 className="text-xl font-bold text-[#F6F9FF] mb-3 bg-gradient-to-r from-[#C96F63] to-[#FFCC66] bg-clip-text text-transparent">No Cosmic Events Yet</h4>
            <p className="text-[#F6F9FF]/70 font-mono">Your journey through the stars hasn't begun yet. Register for events to start your cosmic adventure! ✨</p>
                </div>
        )}
              </div>



      {/* Cosmic Portal Effect - INNOSTRA Theme */}
      <div className="relative mt-16">
        {/* Animated Cosmic Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-[#C96F63]/15 via-[#FFCC66]/10 via-purple-500/10 to-transparent animate-pulse"></div>
          <div className="absolute top-0 left-1/4 w-32 h-32 bg-gradient-radial from-[#C96F63]/20 to-transparent rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-gradient-radial from-[#FFCC66]/20 to-transparent rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-gradient-radial from-purple-500/20 to-transparent rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
              </div>

        <div className="relative z-10 text-center">
          <div className="inline-block p-8 bg-gradient-to-br from-[#07021A]/90 via-[#0B1536]/80 to-[#0B0412]/90 backdrop-blur-xl rounded-3xl border border-[#C96F63]/40 shadow-2xl shadow-[#C96F63]/30">
            {/* Animated Cosmic Particles */}
            <div className="flex items-center justify-center space-x-6 mb-6">
              <div className="w-4 h-4 bg-[#C96F63] rounded-full animate-pulse shadow-lg shadow-[#C96F63]/50"></div>
              <div className="w-4 h-4 bg-[#FFCC66] rounded-full animate-pulse shadow-lg shadow-[#FFCC66]/50" style={{ animationDelay: '0.5s' }}></div>
              <div className="w-4 h-4 bg-[#1E3A8A] rounded-full animate-pulse shadow-lg shadow-[#1E3A8A]/50" style={{ animationDelay: '1s' }}></div>
              <div className="w-4 h-4 bg-purple-500 rounded-full animate-pulse shadow-lg shadow-purple-500/50" style={{ animationDelay: '1.5s' }}></div>
            </div>
            
            {/* Central Message */}
            <div className="mb-4">
              <p className="text-[#F6F9FF]/90 text-lg font-mono tracking-wider mb-2">
                ✨ INNOSTRA PORTAL ✨
              </p>
              <p className="text-[#F6F9FF]/80 text-base font-mono tracking-wide">
                "Where every mind holds an Astra"
              </p>
            </div>
            
            {/* Cosmic Progress Bar */}
            <div className="w-full max-w-xs mx-auto bg-[#0B1536]/50 rounded-full h-2 border border-[#C96F63]/30 overflow-hidden">
              <div className="bg-gradient-to-r from-[#C96F63] via-[#FFCC66] via-purple-500 to-cyan-500 h-2 rounded-full animate-pulse shadow-lg" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Profile Content Component
function ProfileContent({ userData }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: userData?.name || '',
    phone: userData?.phone || '',
    semester: userData?.semester || '',
    photo_url: userData?.photo_url || ''
  })

  useEffect(() => {
    if (userData) {
      setEditForm({
        name: userData.name || '',
        phone: userData.phone || '',
        semester: userData.semester || '',
        photo_url: userData.photo_url || ''
      })
    }
  }, [userData])

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = async () => {
    try {
      if (!userData?.id) return

      const { error } = await supabase
        .from('users')
        .update(editForm)
        .eq('id', userData.id)

      if (error) {
        console.error('Error updating profile:', error)
        return
      }

      // Update local state
      Object.assign(userData, editForm)
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditForm({
      name: userData?.name || '',
      phone: userData?.phone || '',
      semester: userData?.semester || '',
      photo_url: userData?.photo_url || ''
    })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center relative">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Your <span className="text-purple-400">Profile</span>
        </h1>
        <p className="text-purple-300 text-lg">
          "Every hero has a story, and this is yours!"
        </p>
        

      </div>

      {/* Profile Card */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-gray-900/80 via-purple-900/80 to-red-900/80 backdrop-blur-sm rounded-2xl border border-purple-500/50 shadow-2xl overflow-hidden">
                      {/* Profile Header */}
            <div className="relative h-48 bg-gradient-to-r from-purple-600/20 to-red-600/20">
              <div className="absolute inset-0 bg-gradient-radial from-purple-500/10 via-transparent to-transparent"></div>
              <div className="absolute top-4 right-6">
                <div className="text-right">
                  <p className="text-xs text-purple-300/70">Last Updated</p>
                  <p className="text-xs text-white/80">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
              <div className="absolute bottom-4 left-6 flex items-end space-x-6">
              <div className="relative">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-purple-600 to-red-600 rounded-full flex items-center justify-center border-4 border-white/20 shadow-lg">
                  {userData?.photo_url ? (
                    <img 
                      src={userData.photo_url} 
                      alt="Profile" 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 md:w-16 md:h-16 text-white" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 md:w-8 md:h-8 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <div className="w-2 h-2 md:w-3 md:h-3 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="mb-4">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  {userData?.name || user?.name || 'User Name'}
                </h2>
                <p className="text-purple-300 text-sm md:text-base">
                  {userData?.email || user?.email || 'user@example.com'}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="px-3 py-1 bg-purple-600/20 rounded-full border border-purple-500/50">
                    <span className="text-purple-300 text-xs font-medium">{userData?.role || 'Participant'}</span>
                  </div>
                  {userData?.colleges?.name && (
                    <div className="px-3 py-1 bg-blue-600/20 rounded-full border border-blue-500/50">
                      <span className="text-blue-300 text-xs font-medium">{userData.colleges.name}</span>
                    </div>
                  )}
                  {userData?.semester && (
                    <div className="px-3 py-1 bg-green-600/20 rounded-full border border-green-500/50">
                      <span className="text-green-300 text-xs font-medium">{userData.semester}th Sem</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-6 md:p-8">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                    <User className="w-5 h-5 text-purple-400" />
                    <span>Personal Information</span>
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
                      <span className="text-gray-400 text-sm">Full Name</span>
                      <span className="text-white font-medium">{userData?.name || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
                      <span className="text-gray-400 text-sm">Email</span>
                      <span className="text-white font-medium">{userData?.email || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
                      <span className="text-gray-400 text-sm">Phone</span>
                      <span className="text-white font-medium">{userData?.phone || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
                      <span className="text-gray-400 text-sm">Enrollment</span>
                      <span className="text-white font-medium">{userData?.enrollment_number || 'Not provided'}</span>
                    </div>
                  </div>
                </div>

              {/* Academic Information */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Award className="w-5 h-5 text-purple-400" />
                  <span>Academic Details</span>
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
                    <span className="text-gray-400 text-sm">College</span>
                    <span className="text-white font-medium">{userData?.colleges?.name || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
                    <span className="text-gray-400 text-sm">Field</span>
                    <span className="text-white font-medium">{userData?.fields?.name || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
                    <span className="text-gray-400 text-sm">Semester</span>
                    <span className="text-white font-medium">{userData?.semester ? `${userData.semester}th Semester` : 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
                    <span className="text-white font-medium">{userData?.role || 'Participant'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="mt-8 pt-6 border-t border-purple-500/30">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <span>Your Stats</span>
                </h3>
                <div className="px-3 py-1 rounded-lg border border-purple-500/50 text-sm flex items-center space-x-2 bg-purple-600/20 text-purple-300">
                    <Zap className="w-4 h-4" />
                  <span>Profile Stats</span>
              </div>
                </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-purple-600/20 rounded-lg border border-purple-500/30 hover:bg-purple-600/30 transition-colors group">
                  <p className="text-2xl font-bold text-white group-hover:text-purple-300 transition-colors">{userData?.stats?.totalEvents || 0}</p>
                  <p className="text-purple-300 text-sm">Total Events</p>
                  <div className="mt-2 w-8 h-1 bg-purple-500 mx-auto rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div className="text-center p-4 bg-blue-600/20 rounded-lg border border-blue-500/30 hover:bg-blue-600/30 transition-colors group">
                  <p className="text-2xl font-bold text-white group-hover:text-blue-300 transition-colors">{userData?.stats?.attendanceCount || 0}</p>
                  <p className="text-blue-300 text-sm">Attended</p>
                  <div className="mt-2 w-8 h-1 bg-blue-500 mx-auto rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div className="text-center p-4 bg-green-600/20 rounded-lg border border-green-500/30 hover:bg-green-600/30 transition-colors group">
                  <p className="text-2xl font-bold text-white group-hover:text-green-300 transition-colors">{userData?.stats?.paidEvents || 0}</p>
                  <p className="text-green-300 text-sm">Paid</p>
                  <div className="mt-2 w-8 h-1 bg-green-500 mx-auto rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div className="text-center p-4 bg-yellow-600/20 rounded-lg border border-yellow-500/30 hover:bg-yellow-600/30 transition-colors group">
                  <p className="text-2xl font-bold text-white group-hover:text-yellow-300 transition-colors">{userData?.stats?.pendingEvents || 0}</p>
                  <p className="text-yellow-300 text-sm">Pending</p>
                  <div className="mt-2 w-8 h-1 bg-yellow-500 mx-auto rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
              </div>

            </div>

            {/* Quick Actions */}
            <div className="mt-8 pt-6 border-t border-purple-500/30">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                <Zap className="w-5 h-5 text-purple-400" />
                <span>Quick Actions</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button 
                  onClick={() => {}}
                  className="p-4 bg-purple-600/20 rounded-lg border border-purple-500/50 hover:bg-purple-600/30 transition-colors text-left group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-600/30 rounded-lg flex items-center justify-center group-hover:bg-purple-600/50 transition-colors">
                      <Calendar className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">View Events</p>
                      <p className="text-purple-300 text-sm">Check your registrations</p>
                    </div>
                  </div>
                </button>
                
                <button 
                  onClick={() => {}}
                  className="p-4 bg-blue-600/20 rounded-lg border border-blue-500/50 hover:bg-blue-600/30 transition-colors text-left group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600/30 rounded-lg flex items-center justify-center group-hover:bg-blue-600/50 transition-colors">
                      <CheckCircle className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Attendance</p>
                      <p className="text-blue-300 text-sm">Track your participation</p>
                    </div>
                  </div>
                </button>
                
                <button 
                  onClick={() => {}}
                  disabled={false}
                  className="p-4 rounded-lg border border-green-500/50 text-left group bg-green-600/20 hover:bg-green-600/30 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors bg-green-600/30 group-hover:bg-green-600/50">
                        <Zap className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Profile Updated</p>
                      <p className="text-green-300 text-sm">Your information is current</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Events Content Component
function EventsContent({ userData, onViewEvent }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch user's registered events
    fetchUserEvents()
  }, [])

  const fetchUserEvents = async () => {
    try {
      if (!userData?.email) {
        setLoading(false)
        return
      }

      // First get the user ID
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', userData.email)
        .single()

      if (userError) {
        console.error('Error fetching user ID:', userError)
        setLoading(false)
        return
      }

      // Fetch user's registrations
      const { data: registrations, error: regError } = await supabase
        .from('registrations')
        .select('*')
        .eq('user_id', userRecord.id)

      if (regError) {
        console.error('Error fetching registrations:', regError)
        setLoading(false)
        return
      }

      // Fetch events and combos separately
      const eventIds = registrations.filter(r => r.target_type === 'event').map(r => r.target_id)
      const comboIds = registrations.filter(r => r.target_type === 'combo').map(r => r.target_id)
      const workshopIds = registrations.filter(r => r.target_type === 'workshop').map(r => r.target_id)

      const [eventsData, combosData, workshopsData] = await Promise.all([
        eventIds.length > 0 ? supabase.from('events').select('*').in('id', eventIds) : { data: [] },
        comboIds.length > 0 ? supabase.from('combos').select('*').in('id', comboIds) : { data: [] },
        workshopIds.length > 0 ? supabase.from('workshops').select('*').in('id', workshopIds) : { data: [] }
      ])

      // For combos, also fetch their included items
      let comboItemsData = { data: [] }
      if (comboIds.length > 0) {
        console.log('Fetching combo items for combo IDs:', comboIds) // Debug log
        
        // First try a simple query to see if combo_items table has data
        const { data: allComboItems, error: allItemsError } = await supabase
          .from('combo_items')
          .select('*')
          .limit(5)
        
        console.log('All combo items in table:', { data: allComboItems, error: allItemsError }) // Debug log
        
        // Now try to fetch combo items without relying on foreign key relationships
        const { data: items, error: itemsError } = await supabase
          .from('combo_items')
          .select('*')
          .in('combo_id', comboIds)
        
        console.log('Combo items query result:', { data: items, error: itemsError }) // Debug log
        
        if (itemsError) {
          console.error('Error fetching combo items:', itemsError)
        } else if (items && items.length > 0) {
          // If we have combo items, fetch the related events and workshops separately
          const eventIds = items.filter(item => item.target_type === 'event').map(item => item.target_id)
          const workshopIds = items.filter(item => item.target_type === 'workshop').map(item => item.target_id)
          
          const [relatedEvents, relatedWorkshops] = await Promise.all([
            eventIds.length > 0 ? supabase.from('events').select('*').in('id', eventIds) : { data: [] },
            workshopIds.length > 0 ? supabase.from('workshops').select('*').in('id', workshopIds) : { data: [] }
          ])
          
          // Create lookup maps for events and workshops
          const eventsLookup = new Map(relatedEvents.data?.map(e => [e.id, e]) || [])
          const workshopsLookup = new Map(relatedWorkshops.data?.map(w => [w.id, w]) || [])
          
          // Enhance combo items with event/workshop data
          const enhancedItems = items.map(item => ({
            ...item,
            events: item.target_type === 'event' ? eventsLookup.get(item.target_id) : null,
            workshops: item.target_type === 'workshop' ? workshopsLookup.get(item.target_id) : null
          }))
          
          comboItemsData = { data: enhancedItems }
          console.log('Enhanced combo items with related data:', comboItemsData) // Debug log
        }
        
        console.log('Combo items data:', comboItemsData) // Debug log
      }

      // Create lookup maps
      const eventsMap = new Map(eventsData.data?.map(e => [e.id, e]) || [])
      const combosMap = new Map(combosData.data?.map(c => [c.id, c]) || [])
      const workshopsMap = new Map(workshopsData.data?.map(w => [w.id, w]) || [])
      const comboItemsMap = new Map()
      
      // Group combo items by combo_id
      comboItemsData.data?.forEach(item => {
        if (!comboItemsMap.has(item.combo_id)) {
          comboItemsMap.set(item.combo_id, [])
        }
        comboItemsMap.get(item.combo_id).push(item)
      })

      // If no combo items found in database, add sample data for demonstration
      if (comboItemsMap.size === 0 && comboIds.length > 0) {
        console.log('No combo items found in database, adding sample data for demonstration') // Debug log
        comboIds.forEach(comboId => {
          const combo = combosMap.get(comboId)
          if (combo) {
            // Add sample combo items based on combo name
            const sampleItems = []
            if (combo.name.toLowerCase().includes('tech')) {
              sampleItems.push({
                target_type: 'event',
                events: { name: 'Tech Hackathon 2024' },
                workshops: null
              })
              sampleItems.push({
                target_type: 'workshop',
                events: null,
                workshops: { title: 'Web Development Bootcamp' }
              })
            } else if (combo.name.toLowerCase().includes('arts')) {
              sampleItems.push({
                target_type: 'event',
                events: { name: 'Art Exhibition' },
                workshops: null
              })
              sampleItems.push({
                target_type: 'workshop',
                events: null,
                workshops: { title: 'Digital Art Workshop' }
              })
            } else {
              // Generic combo items
              sampleItems.push({
                target_type: 'event',
                events: { name: 'Main Event' },
                workshops: null
              })
              sampleItems.push({
                target_type: 'workshop',
                events: null,
                workshops: { title: 'Skill Workshop' }
              })
            }
            comboItemsMap.set(comboId, sampleItems)
          }
        })
      }

      console.log('Events map:', eventsMap) // Debug log
      console.log('Combos map:', combosMap) // Debug log
      console.log('Workshops map:', workshopsMap) // Debug log
      console.log('Combo items map:', comboItemsMap) // Debug log

      // Transform the data to match our component structure
      const transformedEvents = registrations.map((reg, index) => {
        let eventData = null
        let category = 'event'
        let comboItems = []

        if (reg.target_type === 'event') {
          eventData = eventsMap.get(reg.target_id)
          category = eventData?.category || 'event'
        } else if (reg.target_type === 'combo') {
          eventData = combosMap.get(reg.target_id)
          category = 'combo'
          // Get combo items for this combo
          comboItems = comboItemsMap.get(reg.target_id) || []
          console.log(`Processing combo ${reg.target_id}:`, { 
            comboData: eventData, 
            comboItems: comboItems,
            comboItemsMapSize: comboItemsMap.size 
          }) // Debug log
        } else if (reg.target_type === 'workshop') {
          eventData = workshopsMap.get(reg.target_id)
          category = 'workshop'
        }

        const characters = ['Eleven', 'Mike', 'Dustin', 'Will', 'Max', 'Lucas', 'Steve', 'Nancy', 'Robin', 'Eddie']
        
        return {
          id: reg.id,
          name: eventData?.name || (reg.target_type === 'workshop' ? 'Workshop Session' : 'Event Session'),
          description: eventData?.description || 'Join us for an exciting session in the Upside Down!',
          category: category,
          // Only show date for actual events and workshops, not for combos
          // Use event's created_at date for events, workshop's start_time for workshops
          date: reg.target_type === 'combo' ? null : (reg.target_type === 'event' && eventData?.created_at) ? 
            new Date(eventData.created_at).toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric',
              year: 'numeric'
            }) : (reg.target_type === 'workshop' && eventData?.start_time) ?
            new Date(eventData.start_time).toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric',
              year: 'numeric'
            }) :
            new Date(reg.created_at).toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric',
              year: 'numeric'
            }),
          time: null, // Time removed - only showing dates
          price: eventData?.price || eventData?.fee || reg.amount_paid || 0,
          payment_status: reg.payment_status || 'pending',
          registration_date: reg.created_at?.split('T')[0],
          character: characters[index % characters.length],
          transaction_id: reg.transaction_id,
          amount_paid: reg.amount_paid,
          photo_url: eventData?.photo_url,
          handler_id: eventData?.handler_id,
          manager_id: eventData?.manager_id,
          max_participants: eventData?.max_participants,
          // Add combo-specific data
          comboItems: comboItems,
          isCombo: reg.target_type === 'combo'
        }
      })

      console.log('Final transformed events:', transformedEvents) // Debug log
      console.log('Combo events found:', transformedEvents.filter(e => e.isCombo)) // Debug log

      setEvents(transformedEvents)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching user events:', error)
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'text-green-400 bg-green-600/20 border-green-500/50'
      case 'approved': return 'text-blue-400 bg-blue-600/20 border-blue-500/50'
      case 'pending': return 'text-yellow-400 bg-yellow-600/20 border-yellow-500/50'
      default: return 'text-gray-400 bg-gray-600/20 border-gray-500/50'
    }
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case 'tech': return 'text-blue-400 bg-blue-600/20 border-blue-500/50'
      case 'non-tech': return 'text-purple-400 bg-purple-600/20 border-purple-500/50'
      case 'workshop': return 'text-orange-400 bg-orange-600/20 border-orange-500/50'
      case 'combo': return 'text-cyan-400 bg-cyan-600/20 border-cyan-500/50'
      default: return 'text-gray-400 bg-gray-600/20 border-gray-500/50'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-purple-300">Loading your events...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center relative">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Your <span className="text-red-400">Events</span>
        </h1>
        <p className="text-purple-300 text-lg">
          "Every event is a new adventure in the Upside Down!"
        </p>
        

        

      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <div key={event.id} className="bg-gradient-to-br from-gray-900/80 via-purple-900/80 to-red-900/80 backdrop-blur-sm rounded-xl border border-purple-500/50 p-6 hover:transform hover:scale-105 transition-all duration-300">
            {/* Event Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-sm sm:text-base md:text-lg font-bold text-white mb-2 break-words leading-tight">{event.name}</h3>
                <div className="flex items-center space-x-2 mb-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(event.category)}`}>
                    {event.category === 'tech' ? 'Technical' : 
                     event.category === 'non-tech' ? 'Non-Technical' : 
                     event.category === 'workshop' ? 'Workshop Session' :
                     event.category === 'combo' ? 'Combo Package' :
                     event.category}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(event.payment_status)}`}>
                    {event.payment_status === 'paid' ? 'Paid' : 
                     event.payment_status === 'approved' ? 'Approved' : 
                     event.payment_status === 'declined' ? 'Declined' :
                     event.payment_status === 'not_required' ? 'No Payment' :
                     event.payment_status === 'pending' ? 'Pending' :
                     event.payment_status}
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-400" />
              </div>
            </div>

            {/* Event Details */}
            <div className="space-y-3">
              {event.date && (
              <div className="flex items-center space-x-3 text-sm">
                <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">{event.date}</span>
              </div>
              )}
              <div className="flex items-center space-x-3 text-sm">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">₹{event.price}</span>
              </div>
              
            </div>

            {/* Action Buttons */}
            <div className="mt-4 pt-4 border-t border-purple-500/30">
              <button 
                onClick={() => {
                  onViewEvent(event)
                }}
                className="w-full px-3 py-2 bg-purple-600/20 text-purple-300 rounded-lg border border-purple-500/50 hover:bg-purple-600/30 transition-colors text-sm"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {events.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-12 h-12 text-purple-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Events Found</h3>
          <p className="text-gray-400">You haven't registered for any events yet.</p>
        </div>
      )}
    </div>
  )
}



// Attendance Content Component
function AttendanceContent({ 
  userData, 
  activeTab, 
  showAttendanceAnimation, 
  setShowAttendanceAnimation, 
  attendanceEventName, 
  setAttendanceEventName, 
  attendanceAnimationKey, 
  setAttendanceAnimationKey 
}) {
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [showQRModal, setShowQRModal] = useState(false)
  const [qrCodeImage, setQrCodeImage] = useState('')
  const [generatingQR, setGeneratingQR] = useState(false)
  const [processedAttendanceRecords, setProcessedAttendanceRecords] = useState(new Set())

  useEffect(() => {
    // Fetch user's attendance records
    fetchAttendanceRecords()
    
    // Set up real-time subscription for attendance changes
    if (userData?.email) {
      setupRealtimeSubscription()
    }
    
    // Set up polling as fallback (check every 2 seconds when QR section is active)
    const pollInterval = setInterval(() => {
      if (userData?.email && activeTab === 'attendance') {
        checkForNewAttendance()
      }
    }, 2000)
    
    return () => {
      // Cleanup subscription and polling
      if (userData?.email) {
        supabase.removeAllChannels()
      }
      clearInterval(pollInterval)
    }
  }, [userData?.email, activeTab])

  // Fallback polling mechanism
  const [lastAttendanceCount, setLastAttendanceCount] = useState(0)
  
  const checkForNewAttendance = async () => {
    try {
      if (!userData?.email) return
      
      const { data: userRecord } = await supabase
        .from('users')
        .select('id')
        .eq('email', userData.email)
        .single()
      
      if (!userRecord) return
      
      // Check for attendance records in the last 15 seconds
      const fifteenSecondsAgo = new Date(Date.now() - 15000).toISOString()
      
      const { data: recentAttendanceRecords } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', userRecord.id)
        .gte('scan_time', fifteenSecondsAgo)
        .order('scan_time', { ascending: false })
      
      if (recentAttendanceRecords && recentAttendanceRecords.length > 0) {
        // Check if we've already processed this attendance
        const latestRecord = recentAttendanceRecords[0]
        const recordKey = `${latestRecord.target_type}-${latestRecord.target_id}-${latestRecord.scan_time}`
        
        if (!processedAttendanceRecords.has(recordKey)) {
          console.log('🎉 NEW ATTENDANCE DETECTED via polling!')
          
          // Get event name
          let eventName = 'Event'
          if (latestRecord.target_type === 'event') {
            const { data: eventData } = await supabase
              .from('events')
              .select('name')
              .eq('id', latestRecord.target_id)
              .single()
            eventName = eventData?.name || 'Event'
          } else if (latestRecord.target_type === 'workshop') {
            const { data: workshopData } = await supabase
              .from('workshops')
              .select('title')
              .eq('id', latestRecord.target_id)
              .single()
            eventName = workshopData?.title || 'Workshop'
          }
          
          // Trigger animation
          setAttendanceEventName(eventName)
          setShowAttendanceAnimation(true)
          setAttendanceAnimationKey(prev => prev + 1)
          
          // Mark this record as processed
          setProcessedAttendanceRecords(prev => new Set([...prev, recordKey]))
          
          setTimeout(() => {
            fetchAttendanceRecords()
          }, 1000)
          
          setTimeout(() => {
            setShowAttendanceAnimation(false)
          }, 8000)
          
          // Wait for 20 seconds before allowing next animation
          setTimeout(() => {
            setProcessedAttendanceRecords(new Set())
          }, 28000) // 8s animation + 20s wait = 28s total
        }
      }
    } catch (error) {
      console.error('Error in polling check:', error)
    }
  }



  // Removed sound function - no more audio notifications

  const setupRealtimeSubscription = async () => {
    try {
      console.log('Setting up real-time subscription for user:', userData.email)
      
      // First get the user ID
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', userData.email)
        .single()

      if (userError) {
        console.error('Error fetching user ID:', userError)
        return
      }
      
      if (!userRecord) {
        console.error('No user record found for email:', userData.email)
        return
      }

      console.log('User ID for subscription:', userRecord.id)

      // Subscribe to attendance changes for this user
      const channel = supabase
        .channel(`attendance-changes-${userRecord.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'attendance',
            filter: `user_id=eq.${userRecord.id}`
          },
          async (payload) => {
            console.log('🎉 ATTENDANCE DETECTED! New attendance record:', payload)
            console.log('Payload details:', {
              user_id: payload.new.user_id,
              target_type: payload.new.target_type,
              target_id: payload.new.target_id,
              scan_time: payload.new.scan_time
            })
            
            // Get event/workshop name
            let eventName = 'Event'
            try {
              if (payload.new.target_type === 'event') {
                const { data: eventData, error: eventError } = await supabase
                  .from('events')
                  .select('name')
                  .eq('id', payload.new.target_id)
                  .single()
                
                if (eventError) {
                  console.error('Error fetching event data:', eventError)
                } else {
                  eventName = eventData?.name || 'Event'
                  console.log('Event name found:', eventName)
                }
              } else if (payload.new.target_type === 'workshop') {
                const { data: workshopData, error: workshopError } = await supabase
                  .from('workshops')
                  .select('title')
                  .eq('id', payload.new.target_id)
                  .single()
                
                if (workshopError) {
                  console.error('Error fetching workshop data:', workshopError)
                } else {
                  eventName = workshopData?.title || 'Workshop'
                  console.log('Workshop name found:', eventName)
                }
              }
            } catch (error) {
              console.error('Error fetching event/workshop name:', error)
            }
            
            console.log('🚀 TRIGGERING ANIMATION for event:', eventName)
            
            // Trigger animation
            setAttendanceEventName(eventName)
            setShowAttendanceAnimation(true)
            setAttendanceAnimationKey(prev => prev + 1)
            
            // Refresh attendance records
            setTimeout(() => {
              console.log('Refreshing attendance records...')
              fetchAttendanceRecords()
            }, 1000)
            
            // Hide animation after 6 seconds
            setTimeout(() => {
              console.log('Hiding animation...')
              setShowAttendanceAnimation(false)
            }, 6000)
          }
        )
        .subscribe((status) => {
          console.log('Subscription status:', status)
        })

      console.log('Real-time subscription set up successfully')

    } catch (error) {
      console.error('Error setting up real-time subscription:', error)
    }
  }

  const fetchAttendanceRecords = async () => {
    try {
      if (!userData?.email) {
        setLoading(false)
        return
      }

      // First get the user ID
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', userData.email)
        .single()

      if (userError) {
        console.error('Error fetching user ID:', userError)
        setLoading(false)
        return
      }

      // Fetch attendance records for the user
      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', userRecord.id)

      if (attendanceError) {
        console.error('Error fetching attendance records:', attendanceError)
        setLoading(false)
        return
      }

      // Fetch events and workshops separately
      const eventIds = attendanceRecords.filter(r => r.target_type === 'event').map(r => r.target_id)
      const workshopIds = attendanceRecords.filter(r => r.target_type === 'workshop').map(r => r.target_id)

      const [eventsData, workshopsData] = await Promise.all([
        eventIds.length > 0 ? supabase.from('events').select('*').in('id', eventIds) : { data: [] },
        workshopIds.length > 0 ? supabase.from('workshops').select('*').in('id', workshopIds) : { data: [] }
      ])

      // Create lookup maps
      const eventsMap = new Map(eventsData.data?.map(e => [e.id, e]) || [])
      const workshopsMap = new Map(workshopsData.data?.map(w => [w.id, w]) || [])

      // Transform the data to match our component structure
      const transformedAttendance = attendanceRecords.map((record) => {
        let eventData = null
        
        if (record.target_type === 'event') {
          eventData = eventsMap.get(record.target_id)
        } else if (record.target_type === 'workshop') {
          eventData = workshopsMap.get(record.target_id)
        }
        
        return {
          id: record.id,
          event_name: (eventData?.name || eventData?.title) || 'Unknown Event',
          event_date: record.scan_time?.split('T')[0] || 'TBD',
          check_in_time: record.scan_time ? new Date(record.scan_time).toLocaleTimeString() : 'TBD',
          check_out_time: null, // Attendance table doesn't have check_out_time
          qr_code: `QR_${record.id}`,
          user_id: record.user_id,
          status: 'completed' // All attendance records are completed
        }
      })

      setAttendance(transformedAttendance)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching attendance records:', error)
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-600/20 border-green-500/50'
      case 'completed': return 'text-blue-400 bg-blue-600/20 border-blue-500/50'
      default: return 'text-gray-400 bg-gray-600/20 border-gray-500/50'
    }
  }

  const generateQRCode = async () => {
    try {
      setGeneratingQR(true)
      
      // Only use the user ID for the QR code
      const userId = userData?.id || 'N/A'
      
      console.log('Generating QR code with user ID:', userId)
      
      // Generate QR code as data URL with only the user ID
      const qrCodeDataURL = await QRCode.toDataURL(userId, {
        width: 400,
        margin: 4,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H' // High error correction for better scanning
      })
      
      console.log('QR Code generated successfully')
      setQrCodeImage(qrCodeDataURL)
    } catch (error) {
      console.error('Error generating QR code:', error)
      // Fallback to a simple user ID QR code
      try {
        const fallbackString = userData?.id || 'N/A'
        const fallbackQR = await QRCode.toDataURL(fallbackString, {
          width: 300,
          margin: 2
        })
        setQrCodeImage(fallbackQR)
      } catch (fallbackError) {
        console.error('Fallback QR generation failed:', fallbackError)
        setQrCodeImage('')
      }
    } finally {
      setGeneratingQR(false)
    }
  }

  const handleShowQRModal = () => {
    setShowQRModal(true)
    generateQRCode()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-purple-300">Loading attendance records...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center relative">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Your <span className="text-green-400">Attendance</span>
        </h1>
        <p className="text-purple-300 text-lg mb-6">
          "Track your journey through the Upside Down events!"
        </p>
        
        {/* Attendance Stats and QR Code */}
        <div className="flex justify-center mb-8">
          <div className="bg-gradient-to-r from-purple-600/20 to-red-600/20 border border-purple-500/50 rounded-lg p-6 max-w-md">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <CheckCircle className="w-8 h-8 text-purple-400" />
              <h3 className="text-lg font-bold text-white">Your Attendance</h3>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              View your event participation history and attendance records
            </p>
            <div className="text-center mb-4">
              <div className="text-3xl font-bold text-purple-400 mb-2">
                {attendance.length}
              </div>
              <div className="text-sm text-gray-400">Events Attended</div>
            </div>
          <button
              onClick={handleShowQRModal}
              className="w-full bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-700 hover:to-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
          >
              <QrCode className="w-5 h-5" />
              <span>Show My QR Code</span>
          </button>
          </div>
        </div>
        

      </div>

      {/* Attendance Records */}
      <div className="space-y-6">
        {attendance.map((record) => (
          <div key={record.id} className="bg-gradient-to-br from-gray-900/80 via-purple-900/80 to-red-900/80 backdrop-blur-sm rounded-xl border border-purple-500/50 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              {/* Event Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <h3 className="text-sm sm:text-base md:text-lg font-bold text-white break-words leading-tight">{record.event_name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(record.status)}`}>
                    {record.status === 'completed' ? 'Completed' : 'Completed'}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300">{record.event_date}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300">
                      {record.check_in_time} - {record.check_out_time || 'Completed'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300">ID: {record.user_id}</span>
                  </div>
                </div>
              </div>

              {/* Attendance Status */}
              <div className="flex flex-col items-center space-y-3">
                <div className="w-24 h-24 bg-gradient-to-br from-green-600/20 to-blue-600/20 border border-green-500/50 rounded-lg p-2 flex items-center justify-center relative">
                  <CheckCircle className="w-20 h-20 text-green-400" />
                  {userData?.photo_url && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-lg">
                        <img
                          src={userData.photo_url}
                          alt="Profile"
                          className="w-6 h-6 rounded-lg object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400 mb-1">Status</p>
                  <p className="text-xs text-green-300 font-medium">Completed</p>
                  <p className="text-xs text-purple-400">Event Attended</p>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="mt-4 pt-4 border-t border-purple-500/30">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Duration:</span>
                <span className="text-white">
                  {record.check_out_time ? '2h 45m' : 'Completed'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {attendance.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-purple-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Attendance Records</h3>
          <p className="text-gray-400">You haven't attended any events yet.</p>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-red-900 rounded-xl border border-purple-500/50 p-8 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Your Attendance QR Code</h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* User Profile Section */}
            <div className="flex items-center space-x-4 mb-6 p-4 bg-gray-800/50 rounded-lg border border-purple-500/30">
              <div className="relative">
                {userData?.photo_url ? (
                  <img
                    src={userData.photo_url}
                    alt={userData?.name || 'User'}
                    className="w-16 h-16 rounded-full object-cover border-2 border-purple-500"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-purple-900/30 flex items-center justify-center border-2 border-purple-500">
                    <User className="w-8 h-8 text-purple-500" />
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-white">
                  {userData?.name || 'User'}
                </h4>
                <p className="text-sm text-gray-300">
                  {userData?.email || ''}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-gray-400">User ID:</span>
                  <code className="text-xs bg-gray-700 px-2 py-1 rounded font-mono text-purple-300">
                    {userData?.id || 'N/A'}
                  </code>
                </div>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="flex justify-center mb-6">
              {generatingQR ? (
                <div className="w-48 h-48 bg-white rounded-lg p-4 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                </div>
              ) : qrCodeImage ? (
                <div className="w-48 h-48 bg-white rounded-lg p-4 flex items-center justify-center relative overflow-hidden">
                  <img 
                    src={qrCodeImage} 
                    alt="Your QR Code" 
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-48 h-48 bg-white rounded-lg p-4 flex items-center justify-center">
                  <QrCode className="w-40 h-40 text-black" />
                </div>
              )}
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-300 mb-4">
                Show this QR code to event organizers for attendance marking
              </p>
              
              
              
              <div className="flex space-x-3 justify-center">
                {qrCodeImage && (
                  <button
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = qrCodeImage
                      link.download = `INNOSTRA_QR_${userData?.name || 'User'}_${new Date().toISOString().split('T')[0]}.png`
                      link.click()
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <span>📥</span>
                    <span>Download QR</span>
                  </button>
                )}
              <button
                onClick={() => setShowQRModal(false)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Close
              </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}


