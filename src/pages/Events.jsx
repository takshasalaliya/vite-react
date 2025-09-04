import { useState, useEffect } from 'react'
import { X, Calendar, Users, Clock, MapPin, DollarSign, BookOpen, Star, Sparkles, Rocket, Moon, Sun, Flame } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion'

export default function Events() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  // Framer Motion values for INNOSTRA theme
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 1000], [0, -200])
  const opacity = useTransform(scrollY, [0, 300], [1, 0])
  const scale = useSpring(1, { stiffness: 100, damping: 30 })

  // Fetch events from database
  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      
      // Fetch events from events table
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      // Fetch workshops from workshops table
      const { data: workshopsData, error: workshopsError } = await supabase
        .from('workshops')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (eventsError || workshopsError) {
        console.error('Error fetching data:', { eventsError, workshopsError })
        // Fallback to sample events if database fails
        setEvents(getSampleEvents())
      } else {
        // Transform events data
        const transformedEvents = (eventsData || []).map(event => ({
          id: event.id,
          title: event.name,
          category: event.category,
          description: event.description || 'No description available',
          image: event.photo_url || "https://i.ibb.co/7d7WB7bY/6d641e5b8c6c.webp",
          date: new Date(event.created_at).toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric',
            year: 'numeric'
          }),
          time: new Date(event.created_at).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          }),
          capacity: event.max_participants ? `${event.max_participants} participants` : "Unlimited",
         
        }))

        // Transform workshops data
        const transformedWorkshops = (workshopsData || []).map(workshop => ({
          id: workshop.id,
          title: workshop.title,
          category: 'workshop',
          description: workshop.description || 'No description available',
          image: workshop.photo_url || "https://i.ibb.co/7d7WB7bY/6d641e5b8c6c.webp",
          date: new Date(workshop.created_at).toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric',
            year: 'numeric'
          }),
          time: new Date(workshop.created_at).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          }),
          capacity: workshop.capacity ? `${workshop.capacity} participants` : "Unlimited",
          venue: workshop.venue || 'TBA',
          // Workshop-specific fields
          speakers: workshop.speakers || [],
          start_time: workshop.start_time ? new Date(workshop.start_time).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          }) : null,
          end_time: workshop.end_time ? new Date(workshop.end_time).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          }) : null
        }))

        // Combine events and workshops
        const allEvents = [...transformedEvents, ...transformedWorkshops]
        setEvents(allEvents)
      }
    } catch (error) {
      console.error('Error fetching events:', error)
      setEvents(getSampleEvents())
    } finally {
      setLoading(false)
    }
  }

  // Sample events fallback
  const getSampleEvents = () => [
    {
      id: 1,
      title: "Tech Hackathon 2024",
      category: "tech",
      description: "A 24-hour coding challenge where teams compete to build innovative solutions.",
      image: "https://i.ibb.co/7d7WB7bY/6d641e5b8c6c.webp",
      date: "August 15, 2024",
      time: "9:00 AM",
      capacity: "100 participants",
      venue: "Main Auditorium",
      fee: 500
    },
    {
      id: 2,
      title: "Cultural Festival",
      category: "non-tech",
      description: "Celebrate diversity through music, dance, and cultural performances.",
      image: "https://i.ibb.co/7d7WB7bY/6d641e5b8c6c.webp",
      date: "August 20, 2024",
      time: "6:00 PM",
      capacity: "Unlimited",
      venue: "Open Air Theater",
      fee: 0
    },
    {
      id: 3,
      title: "Web Development Workshop",
      category: "workshop",
      description: "Learn modern web development techniques with hands-on projects.",
      image: "https://i.ibb.co/7d7WB7bY/6d641e5b8c6c.webp",
      date: "August 18, 2024",
      time: "2:00 PM",
      capacity: "50 participants",
      venue: "Computer Lab",
      fee: 300,
      speakers: ["Dr. Sarah Johnson", "Prof. Mike Chen"],
      start_time: "2:00 PM",
      end_time: "5:00 PM"
    }
  ]

  const getEventsByCategory = (category) => {
    if (category === 'all') return events
    return events.filter(event => event.category === category)
  }

  const getCategoryDisplayName = (category) => {
    const names = {
      'all': 'All Events',
      'tech': 'Technology',
      'workshop': 'Workshop',
      'non-tech': 'Non-Technology',
      'food': 'Food'
    }
    return names[category] || category
  }

  const getCategoryIcon = (category) => {
    const icons = {
      'tech': <Rocket className="w-4 h-4" />,
      'workshop': <BookOpen className="w-4 h-4" />,
      'non-tech': <Star className="w-4 h-4" />,
      'food': <Flame className="w-4 h-4" />
    }
    return icons[category] || <Sparkles className="w-4 h-4" />
  }

  const getEventAccent = (category) => {
    const accents = {
      'tech': 'from-blue-500 to-purple-600',
      'workshop': 'from-purple-500 to-pink-600',
      'non-tech': 'from-green-500 to-teal-600',
      'food': 'from-yellow-500 to-orange-600'
    }
    return accents[category] || 'from-gray-500 to-gray-600'
  }

  const handleEventClick = (event) => {
    setSelectedEvent(event)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedEvent(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* INNOSTRA Starfield Background */}
        <div className="absolute inset-0">
          {[...Array(100)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center justify-center mb-4">
              <Star className="w-8 h-8 text-yellow-400 mr-2 animate-pulse" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                INNOSTRA
              </h1>
              <Star className="w-8 h-8 text-yellow-400 ml-2 animate-pulse" />
            </div>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400 mx-auto"></div>
            <p className="text-gray-300 mt-4 text-lg">Loading stellar events...</p>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* INNOSTRA Starfield Background */}
      <div className="absolute inset-0">
        {[...Array(100)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <motion.div 
        className="relative z-10 pt-16 pb-8 px-6"
        style={{ y, opacity }}
      >
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center justify-center mb-6">
              <Star className="w-12 h-12 text-yellow-400 mr-3 animate-pulse" />
              <h1 className="text-6xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                INNOSTRA
              </h1>
              <Star className="w-12 h-12 text-yellow-400 ml-3 animate-pulse" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Events</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Experience the future of technology and innovation at our cinematic festival
            </p>
          </motion.div>
          </div>
      </motion.div>

      {/* Category Tabs */}
      <motion.div 
        className="relative z-10 px-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap justify-center gap-4">
            {['all', 'tech', 'workshop', 'non-tech', 'food'].map((category) => (
              <motion.button
                key={category}
                onClick={() => setActiveTab(category)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-full backdrop-blur-sm border transition-all duration-300 ${
                  activeTab === category
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black border-yellow-400 shadow-lg shadow-yellow-400/25'
                    : 'bg-white/10 text-white border-white/20 hover:bg-white/20 hover:border-white/40'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {getCategoryIcon(category)}
                <span className="font-semibold">{getCategoryDisplayName(category)}</span>
              </motion.button>
            ))}
            </div>
          </div>
      </motion.div>

      {/* Events Grid */}
      <motion.div 
        className="relative z-10 px-6 pb-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {getEventsByCategory(activeTab).map((event, index) => (
              <motion.div
                key={event.id}
                className="group relative"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -10 }}
              >
                <div className="relative overflow-hidden rounded-2xl backdrop-blur-sm bg-white/10 border border-white/20 group-hover:border-yellow-400/50 transition-all duration-500">
                  {/* Event Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    
                    {/* Category Badge */}
                    <div className="absolute top-4 left-4">
                      <div className={`flex items-center space-x-2 px-3 py-1 rounded-full bg-gradient-to-r ${getEventAccent(event.category)} text-white text-sm font-semibold backdrop-blur-sm`}>
                        {getCategoryIcon(event.category)}
                        <span>{getCategoryDisplayName(event.category)}</span>
        </div>
      </div>

                    {/* Price Badge */}
                    <div className="absolute top-4 right-4">
                     
                </div>
              </div>

                  {/* Event Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-yellow-400 transition-colors duration-300">
                      {event.title}
                    </h3>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-gray-300 text-sm">
                        <Calendar className="w-4 h-4 mr-2 text-yellow-400" />
                        {event.date} at {event.time}
                      </div>
                      <div className="flex items-center text-gray-300 text-sm">
                        <Users className="w-4 h-4 mr-2 text-yellow-400" />
                        {event.capacity}
                </div>

                </div>

                    <motion.button
                      onClick={() => handleEventClick(event)}
                      className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold py-3 px-6 rounded-xl hover:from-yellow-300 hover:to-orange-400 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-yellow-400/25"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="flex items-center justify-center space-x-2">
                        <Sparkles className="w-4 h-4" />
                        <span>View Details</span>
                      </span>
                    </motion.button>
                    </div>
                </div>
              </motion.div>
            ))}
                  </div>
                  
          {getEventsByCategory(activeTab).length === 0 && (
            <motion.div 
              className="text-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              <Star className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-pulse" />
              <h3 className="text-2xl font-bold text-white mb-2">No Events Found</h3>
              <p className="text-gray-300">Check back soon for upcoming stellar events!</p>
            </motion.div>
                  )}
                </div>
      </motion.div>

      {/* Event Detail Modal */}
      {showModal && selectedEvent && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeModal}></div>
          
          <motion.div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl backdrop-blur-sm bg-white/10 border border-white/20"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            {/* Modal Header */}
            <div className="relative h-64 overflow-hidden rounded-t-2xl">
              <img
                src={selectedEvent.image}
                alt={selectedEvent.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              
                  <button
                onClick={closeModal}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors duration-300 flex items-center justify-center"
                  >
                <X className="w-5 h-5" />
                  </button>

              <div className="absolute bottom-4 left-4 right-4">
                <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-gradient-to-r ${getEventAccent(selectedEvent.category)} text-white text-sm font-semibold backdrop-blur-sm mb-2`}>
                  {getCategoryIcon(selectedEvent.category)}
                  <span>{getCategoryDisplayName(selectedEvent.category)}</span>
                </div>
                <h2 className="text-3xl font-bold text-white">{selectedEvent.title}</h2>
                </div>
              </div>

            {/* Modal Content */}
            <div className="p-6">
              <p className="text-gray-300 mb-6 leading-relaxed">
                {selectedEvent.description}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-3">
                  <div className="flex items-center text-gray-300">
                    <Calendar className="w-5 h-5 mr-3 text-yellow-400" />
                    <span>{selectedEvent.date} at {selectedEvent.time}</span>
                </div>
                  <div className="flex items-center text-gray-300">
                    <Users className="w-5 h-5 mr-3 text-yellow-400" />
                    <span>{selectedEvent.capacity}</span>
                </div>

                  </div>
                  
                {/* Workshop-specific details */}
                {selectedEvent.category === 'workshop' && (
                  <div className="space-y-3">
                    {selectedEvent.speakers && selectedEvent.speakers.length > 0 && (
                      <div className="flex items-start text-gray-300">
                        <BookOpen className="w-5 h-5 mr-3 text-yellow-400 mt-0.5" />
                        <div>
                          <span className="font-semibold">Speakers:</span>
                          <div className="mt-1">
                            {selectedEvent.speakers.map((speaker, index) => (
                              <div key={index} className="text-sm">• {speaker}</div>
                            ))}
                </div>
              </div>
            </div>
                    )}
                    {selectedEvent.start_time && selectedEvent.end_time && (
                      <div className="flex items-center text-gray-300">
                        <Clock className="w-5 h-5 mr-3 text-yellow-400" />
                        <span>{selectedEvent.start_time} - {selectedEvent.end_time}</span>
        </div>
      )}
                </div>
                  )}
                </div>

             
                  </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

