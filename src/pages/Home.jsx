import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { 
  Calendar, 
  Users, 
  Star, 
  ArrowRight, 
  Clock, 
  MapPin, 
  DollarSign,
  BookOpen,
  Package,
  ChevronRight,
  ChevronLeft
} from 'lucide-react'

const Home = () => {
  const [events, setEvents] = useState([])
  const [workshops, setWorkshops] = useState([])
  const [combos, setCombos] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('events')
  const [currentSlide, setCurrentSlide] = useState(0)

	useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      // Fetch workshops
      const { data: workshopsData } = await supabase
        .from('workshops')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      // Fetch combos
      const { data: combosData } = await supabase
        .from('combos')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      setEvents(eventsData || [])
      setWorkshops(workshopsData || [])
      setCombos(combosData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % 3)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + 3) % 3)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case 'tech':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'non-tech':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'workshop':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'combo':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'free':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'tech':
        return 'Technical'
      case 'non-tech':
        return 'Non-Technical'
      case 'workshop':
        return 'Workshop'
      case 'combo':
        return 'Combo'
      case 'free':
        return 'Free Event'
      default:
        return category
    }
  }

	const handleRegistrationClick = (e) => {
		e.preventDefault()
		alert('Registration is closed. Please contact +91 9426532062 (Rudra Patel)')
	}

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#07021A] via-[#0B1536] to-[#0B0412] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C96F63] mx-auto mb-4"></div>
          <p className="text-[#F6F9FF]/80">Loading INNOSTRA...</p>
        </div>
      </div>
    )
	}

	return (
    <div className="min-h-screen bg-gradient-to-b from-[#07021A] via-[#0B1536] to-[#0B0412] text-[#F6F9FF]">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#07021A]/80 via-[#0B1536]/60 to-[#0B0412]/80"></div>
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-gradient-radial from-[#C96F63]/20 via-transparent to-transparent rounded-full animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-gradient-radial from-[#1E3A8A]/15 via-transparent to-transparent rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-0 w-48 h-48 bg-gradient-radial from-[#FFCC66]/10 via-transparent to-transparent rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="max-w-7xl mx-auto text-center">
            {/* Logo */}
            <div className="flex justify-center mb-6 sm:mb-8">
              <img 
                src="/image/LOGO.png" 
                alt="INNOSTRA Logo" 
                className="h-16 sm:h-20 md:h-24 lg:h-32 xl:h-40 w-auto"
                style={{ filter: 'drop-shadow(0 0 30px rgba(201, 111, 99, 0.5))' }}
              />
            </div>

            {/* Main Title */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-[0.1em] mb-4 sm:mb-6 text-white">
              <span className="text-[#C96F63]">INNOSTRA</span> '25
            </h1>
            
            {/* Subtitle */}
            <p className="text-lg sm:text-xl md:text-2xl text-[#F6F9FF]/90 mb-6 sm:mb-8 max-w-3xl mx-auto">
              Where every mind holds an Astra ✨
            </p>
            
            {/* Description */}
            <p className="text-base sm:text-lg text-[#F6F9FF]/70 mb-8 sm:mb-12 max-w-2xl mx-auto">
              Experience the ultimate fusion of technology, innovation, and creativity at INNOSTRA'25 - the most anticipated tech festival of the year.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
              <Link
                to="/login"
                className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 border border-transparent text-base sm:text-lg font-bold rounded-lg text-white bg-gradient-to-r from-[#C96F63] to-[#C96F63]/80 hover:from-[#C96F63]/90 hover:to-[#C96F63]/70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C96F63] transition-all duration-300 transform hover:scale-105 shadow-lg shadow-[#C96F63]/25"
              >
                <Star className="mr-2 h-5 w-5" />
                Join the Galaxy
              </Link>
              <Link
                to="/register"
                onClick={handleRegistrationClick}
                className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 border border-[#C96F63]/30 text-base sm:text-lg font-bold rounded-lg text-[#C96F63] bg-[#0B1536]/50 hover:bg-[#0B1536]/70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C96F63] transition-all duration-300 backdrop-blur-sm"
              >
                <Users className="mr-2 h-5 w-5" />
                Register Now
              </Link>
					</div>
				</div>
					</div>
      </section>

      {/* Stats Section */}
      <section className="py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="text-center p-4 sm:p-6 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
              <div className="text-2xl sm:text-3xl font-bold text-[#C96F63] mb-2">{events.length}</div>
              <div className="text-sm sm:text-base text-[#F6F9FF]/70">Events</div>
				</div>
            <div className="text-center p-4 sm:p-6 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
              <div className="text-2xl sm:text-3xl font-bold text-[#FFCC66] mb-2">{workshops.length}</div>
              <div className="text-sm sm:text-base text-[#F6F9FF]/70">Workshops</div>
					</div>
            <div className="text-center p-4 sm:p-6 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
              <div className="text-2xl sm:text-3xl font-bold text-[#1E3A8A] mb-2">{combos.length}</div>
              <div className="text-sm sm:text-base text-[#F6F9FF]/70">Combo Packages</div>
				</div>
            <div className="text-center p-4 sm:p-6 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
              <div className="text-2xl sm:text-3xl font-bold text-[#C96F63] mb-2">∞</div>
              <div className="text-sm sm:text-base text-[#F6F9FF]/70">Possibilities</div>
					</div>
				</div>
					</div>
      </section>

      {/* Events Section */}
      <section className="py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Explore Our <span className="text-[#C96F63]">Galaxy</span>
            </h2>
            <p className="text-lg sm:text-xl text-[#F6F9FF]/70 max-w-2xl mx-auto">
              Discover a universe of events, workshops, and combo packages designed to ignite your passion for technology and innovation.
            </p>
				</div>

          {/* Navigation Tabs */}
          <div className="mb-8 sm:mb-12">
            <div className="px-4">
              <div className="flex w-full gap-1 sm:gap-2 bg-white/10 backdrop-blur-sm rounded-lg p-1 sm:p-2">
              {[
                { id: 'events', label: 'Events', icon: Calendar, count: events.filter(e => e.category !== 'food' && e.category !== 'free').length },
                { id: 'free', label: 'Free Events', icon: Star, count: events.filter(e => e.category === 'free').length },
                { id: 'workshops', label: 'Workshops', icon: BookOpen, count: workshops.length },
                { id: 'combos', label: 'Combos', icon: Package, count: combos.length }
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 min-w-0 flex flex-col sm:flex-row items-center justify-center sm:space-x-2 space-y-1 sm:space-y-0 px-3 sm:px-4 py-2 sm:py-3 rounded-md text-sm sm:text-base font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-[#C96F63] text-white shadow-lg'
                        : 'text-[#F6F9FF]/70 hover:text-[#F6F9FF] hover:bg-white/10'
                    }`}
                  >
                    <Icon className="shrink-0 w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-center whitespace-normal break-words leading-snug">{tab.label}</span>
                    <span className="shrink-0 bg-white/20 px-2 py-1 rounded-full text-xs mt-0 sm:mt-0">
                      {tab.count}
                    </span>
                  </button>
                )
              })}
              </div>
            </div>
			</div>

          {/* Content */}
          <div className="min-h-[400px]">
            {activeTab === 'events' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {events.filter(e => e.category !== 'food' && e.category !== 'free').map((event) => (
                  <div key={event.id} className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden hover:bg-white/15 transition-all duration-300">
                    {event.photo_url && (
                      <img 
                        src={event.photo_url} 
                        alt={event.name}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-4 sm:p-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(event.category)}`}>
                          {getCategoryLabel(event.category)}
                        </span>
                        <span className="text-[#C96F63] font-bold">₹{event.price}</span>
			</div>
                      <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{event.name}</h3>
                      <p className="text-[#F6F9FF]/70 text-sm sm:text-base mb-4 line-clamp-3">
                        {event.description}
                      </p>
                      <div className="space-y-2 text-sm text-[#F6F9FF]/60">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>{formatDate(event.created_at)}</span>
                        </div>
                        {event.max_participants && (
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4" />
                            <span>Max: {event.max_participants} participants</span>
                          </div>
                        )}
                      </div>
                      <Link
                        to="/register"
                        onClick={handleRegistrationClick}
                        className="mt-4 inline-flex items-center justify-center w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#C96F63] hover:bg-[#C96F63]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C96F63] transition-colors"
                      >
                        Register Now
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </div>
						</div>
                ))}
						</div>
					)}
					
            {activeTab === 'free' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {events.filter(e => e.category === 'free').map((event) => (
                  <div key={event.id} className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden hover:bg-white/15 transition-all duration-300">
                    {event.photo_url && (
                      <img 
                        src={event.photo_url} 
                        alt={event.name}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-4 sm:p-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(event.category)}`}>
                          {getCategoryLabel(event.category)}
                        </span>
                        <span className="text-emerald-400 font-bold">FREE</span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{event.name}</h3>
                      <p className="text-[#F6F9FF]/70 text-sm sm:text-base mb-4 line-clamp-3">
                        {event.description}
                      </p>
                      <div className="space-y-2 text-sm text-[#F6F9FF]/60">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>{formatDate(event.created_at)}</span>
                        </div>
                        {event.max_participants && (
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4" />
                            <span>Max: {event.max_participants} participants</span>
                          </div>
                        )}
                      </div>
                      <Link
                        to="/register"
                        onClick={handleRegistrationClick}
                        className="mt-4 inline-flex items-center justify-center w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
                      >
                        Register Now
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
					
            {activeTab === 'workshops' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {workshops.map((workshop) => (
                  <div key={workshop.id} className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden hover:bg-white/15 transition-all duration-300">
                    {workshop.photo_url && (
                      <img 
                        src={workshop.photo_url} 
                        alt={workshop.title}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-4 sm:p-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          Workshop
                        </span>
                        <span className="text-[#C96F63] font-bold">₹{workshop.fee}</span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{workshop.title}</h3>
                      <p className="text-[#F6F9FF]/70 text-sm sm:text-base mb-4 line-clamp-3">
                        {workshop.description}
                      </p>
                      <div className="space-y-2 text-sm text-[#F6F9FF]/60">
                        {workshop.start_time && workshop.end_time && (
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>{workshop.start_time} - {workshop.end_time}</span>
                          </div>
                        )}
                        {workshop.capacity && (
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4" />
                            <span>Capacity: {workshop.capacity}</span>
                          </div>
                        )}
                        {workshop.speakers && workshop.speakers.length > 0 && (
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4" />
                            <span>Speakers: {workshop.speakers.join(', ')}</span>
                          </div>
                        )}
				</div>
                      <Link
                        to="/register"
                        onClick={handleRegistrationClick}
                        className="mt-4 inline-flex items-center justify-center w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#C96F63] hover:bg-[#C96F63]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C96F63] transition-colors"
                      >
                        Register Now
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))}
					</div>
            )}

            {activeTab === 'combos' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {combos.map((combo) => (
                  <div key={combo.id} className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden hover:bg-white/15 transition-all duration-300">
                    {combo.photo_url && (
                      <img 
                        src={combo.photo_url} 
                        alt={combo.name}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-4 sm:p-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                          Combo Package
                        </span>
                        <span className="text-[#C96F63] font-bold">₹{combo.price}</span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{combo.name}</h3>
                      <p className="text-[#F6F9FF]/70 text-sm sm:text-base mb-4 line-clamp-3">
                        {combo.description}
                      </p>
                      <div className="space-y-2 text-sm text-[#F6F9FF]/60">
                        {combo.capacity && (
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4" />
                            <span>Capacity: {combo.capacity}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <Package className="w-4 h-4" />
                          <span>Multiple events included</span>
							</div>
							</div>
                      <Link
                        to="/register"
                        onClick={handleRegistrationClick}
                        className="mt-4 inline-flex items-center justify-center w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#C96F63] hover:bg-[#C96F63]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C96F63] transition-colors"
                      >
                        Register Now
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
							</div>
				</div>
                ))}
					</div>
            )}

            {/* Empty State */}
            {((activeTab === 'events' && events.length === 0) ||
              (activeTab === 'workshops' && workshops.length === 0) ||
              (activeTab === 'combos' && combos.length === 0)) && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-[#F6F9FF]/60" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No {activeTab} available</h3>
                <p className="text-[#F6F9FF]/60">Check back soon for exciting new content!</p>
              </div>
            )}
							</div>
						</div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Star className="w-6 h-6 text-[#C96F63]" />
              <span className="text-xl font-bold text-white">INNOSTRA '25</span>
              <Star className="w-6 h-6 text-[#C96F63]" />
						</div>
            <p className="text-[#F6F9FF]/60 text-sm sm:text-base">
              Every Mind Holds an Astra
            </p>
            <div className="mt-4 flex justify-center space-x-4">
              <Link
                to="/login"
                className="text-[#F6F9FF]/60 hover:text-[#F6F9FF] text-sm transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={handleRegistrationClick}
                className="text-[#F6F9FF]/60 hover:text-[#F6F9FF] text-sm transition-colors"
              >
                Register
              </Link>
						</div>
					</div>
				</div>
			</footer>
		</div>
	)
}

export default Home


