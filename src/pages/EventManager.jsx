import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Calendar,
  Users,
  DollarSign,
  Eye,
  EyeOff,
  UserPlus,
  BarChart3,
  Download,
  UserCheck,
  Settings
} from 'lucide-react'
import { uploadImage, validateImage } from '../utils/imageUpload'

const EventManager = () => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showEventModal, setShowEventModal] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showFieldModal, setShowFieldModal] = useState(false)
  const [showParticipationModal, setShowParticipationModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [editingUser, setEditingUser] = useState(null)
  const [editingField, setEditingField] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [activeOnly, setActiveOnly] = useState(false)
  const [handlers, setHandlers] = useState([])
  const [participations, setParticipations] = useState([])
  const [colleges, setColleges] = useState([])
  const [fields, setFields] = useState([])
  const [activeTab, setActiveTab] = useState('events')

  const [eventFormData, setEventFormData] = useState({
    name: '',
    description: '',
    photo_url: '',
    price: 0,
    category: 'tech',
    handler_id: '',
    max_participants: null,
    is_active: true,
    created_at: ''
  })

  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    phone: '',
    enrollment_number: '',
    college_id: '',
    semester: '',
    field_id: '',
    role: 'event_handler',
    photo_url: ''
  })

  const [fieldFormData, setFieldFormData] = useState({
    name: ''
  })

  const roles = [
    { value: 'event_handler', label: 'Event Handler' }
  ]

  // Debug: Monitor events state changes
  useEffect(() => {
    console.log('EventManager: events state changed:', events)
    console.log('EventManager: events length:', events.length)
  }, [events])

  useEffect(() => {
    fetchEvents()
    fetchHandlers()
    fetchColleges()
    fetchFields()
  }, [searchTerm, selectedCategory, activeOnly])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      console.log('EventManager: Starting to fetch events...')
      
      let query = supabase
        .from('events')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      }

      if (selectedCategory) {
        query = query.eq('category', selectedCategory)
      }

      if (activeOnly) {
        query = query.eq('is_active', true)
      }

      console.log('EventManager: Executing query...')
      const { data, error } = await query
      console.log('EventManager: Query result:', { data, error })

      if (error) {
        console.error('EventManager: Database error:', error)
        throw error
      }

      console.log('EventManager: Raw events data:', data)

      // Fetch handler and participation data separately for each event
      const eventsWithDetails = await Promise.all(
        (data || []).map(async (event) => {
          try {
            console.log('EventManager: Fetching details for event:', event.id)
            
            // Fetch handler data
            let handler = null
            if (event.handler_id) {
              const { data: handlerData } = await supabase
                .from('users')
                .select('id, name, email, phone')
                .eq('id', event.handler_id)
              handler = handlerData
            }

            // Fetch registrations/participations (direct + via combos that include this event)
            console.log('EventManager: Fetching participations for event:', event.id)
            const { data: directRegs } = await supabase
              .from('registrations')
              .select(`
                id, 
                payment_status, 
                amount_paid,
                created_at,
                users(id, name, email, phone, college_id, semester, field_id)
              `)
              .eq('target_type', 'event')
              .eq('target_id', event.id)

            // Find combos that include this event
            const { data: comboItems, error: comboItemsError } = await supabase
              .from('combo_items')
              .select('combo_id')
              .eq('target_type', 'event')
              .eq('target_id', event.id)

            let comboRegs = []
            if (!comboItemsError && (comboItems?.length || 0) > 0) {
              const comboIds = comboItems.map(ci => ci.combo_id)
              const { data: comboRegsData } = await supabase
                .from('registrations')
                .select(`
                  id,
                  payment_status,
                  amount_paid,
                  created_at,
                  users(id, name, email, phone, college_id, semester, field_id)
                `)
                .eq('target_type', 'combo')
                .in('target_id', comboIds)
              comboRegs = comboRegsData || []
            }

            const directWithType = (directRegs || []).map(r => ({ ...r, registrationType: 'Direct' }))
            const comboWithType = (comboRegs || []).map(r => ({ ...r, registrationType: 'Combo' }))

            // Merge and de-duplicate by user id
            const mergedMap = new Map()
            ;[...directWithType, ...comboWithType].forEach(r => {
              const key = r.users?.id || r.id
              if (!mergedMap.has(key)) mergedMap.set(key, r)
            })
            const mergedRegs = Array.from(mergedMap.values())

            const paidRegistrations = mergedRegs.filter(reg => reg.payment_status === 'approved')
            const unpaidRegistrations = mergedRegs.filter(reg => reg.payment_status === 'pending')
            
            return {
              ...event,
              handler,
              participations: mergedRegs,
              totalRegistrations: mergedRegs.length,
              paidRegistrations: paidRegistrations.length,
              unpaidRegistrations: unpaidRegistrations.length,
              remainingSeats: event.max_participants ? event.max_participants - mergedRegs.length : null
            }
          } catch (eventError) {
            console.error('EventManager: Error fetching details for event:', event.id, eventError)
            return {
              ...event,
              handler: null,
              participations: [],
              totalRegistrations: 0,
              paidRegistrations: 0,
              unpaidRegistrations: 0,
              remainingSeats: event.max_participants
            }
          }
        })
      )

      console.log('EventManager: Final processed events:', eventsWithDetails)
      setEvents(eventsWithDetails)
    } catch (error) {
      console.error('EventManager: Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchHandlers = async () => {
    try {
      console.log('EventManager: Fetching handlers with event_handler role...')
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, phone, role, photo_url, enrollment_number, college_id, semester, field_id')
        .eq('role', 'event_handler')
        .order('name')
      
      if (error) throw error
      console.log('EventManager: Handlers fetched:', data)
      setHandlers(data || [])
    } catch (error) {
      console.error('Error fetching handlers:', error)
    }
  }

  const fetchColleges = async () => {
    try {
      const { data, error } = await supabase
        .from('colleges')
        .select('*')
        .order('name')
      if (error) throw error
      setColleges(data || [])
    } catch (error) {
      console.error('Error fetching colleges:', error)
    }
  }

  const fetchFields = async () => {
    try {
      const { data, error } = await supabase
        .from('fields')
        .select('*')
        .order('name')
      if (error) throw error
      setFields(data || [])
    } catch (error) {
      console.error('Error fetching fields:', error)
    }
  }

  const handleEventSubmit = async (e) => {
    e.preventDefault()
    
    try {
      // Handle image upload if there's a file selected
      let photoUrl = eventFormData.photo_url
      const fileInput = document.getElementById('event-photo-input')
      if (fileInput && fileInput.files[0]) {
        try {
          photoUrl = await handleImageUpload(fileInput.files[0])
        } catch (uploadError) {
          alert('Error uploading image: ' + uploadError.message)
          return
        }
      }

      // Clean up empty string values for UUID fields
      const eventDataToSave = {
        name: eventFormData.name,
        description: eventFormData.description,
        photo_url: photoUrl,
        price: eventFormData.price,
        category: eventFormData.category,
        handler_id: eventFormData.handler_id || null,
        max_participants: eventFormData.max_participants,
        is_active: eventFormData.is_active,
        created_at: eventFormData.event_date ? new Date(eventFormData.event_date).toISOString() : new Date().toISOString()
      }

      if (editingEvent) {
        const { error } = await supabase
          .from('events')
          .update(eventDataToSave)
          .eq('id', editingEvent.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('events')
          .insert([eventDataToSave])
        
        if (error) throw error
      }

      setShowEventModal(false)
      setEditingEvent(null)
      resetEventForm()
      fetchEvents()
    } catch (error) {
      console.error('Error saving event:', error)
      alert('Error saving event: ' + error.message)
    }
  }

  const handleUserSubmit = async (e) => {
    e.preventDefault()
    
    try {
      // Handle image upload if there's a file selected
      let photoUrl = userFormData.photo_url
      const fileInput = document.getElementById('user-photo-input')
      if (fileInput && fileInput.files[0]) {
        try {
          photoUrl = await handleImageUpload(fileInput.files[0])
        } catch (uploadError) {
          alert('Error uploading image: ' + uploadError.message)
          return
        }
      }

      // Clean up empty string values for UUID fields
      const userDataToSave = {
        ...userFormData,
        photo_url: photoUrl,
        college_id: userFormData.college_id || null,
        field_id: userFormData.field_id || null
      }

      if (editingUser) {
        const { error } = await supabase
          .from('users')
          .update(userDataToSave)
          .eq('id', editingUser.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('users')
          .insert([userDataToSave])
        
        if (error) throw error
      }

      setShowUserModal(false)
      setEditingUser(null)
      resetUserForm()
      fetchHandlers()
    } catch (error) {
      console.error('Error saving user:', error)
      alert('Error saving user: ' + error.message)
    }
  }

  const handleEditEvent = (event) => {
    setEditingEvent(event)
    setEventFormData({
      name: event.name || '',
      description: event.description || '',
      photo_url: event.photo_url || '',
      price: event.price || 0,
      category: event.category || 'tech',
      handler_id: event.handler_id || '',
      max_participants: event.max_participants || null,
      is_active: event.is_active,
      event_date: event.created_at ? new Date(event.created_at).toISOString().split('T')[0] : ''
    })
    setShowEventModal(true)
  }

  const handleEditUser = (user) => {
    setEditingUser(user)
    setUserFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      enrollment_number: user.enrollment_number || '',
      college_id: user.college_id || '',
      semester: user.semester || '',
      field_id: user.field_id || '',
      role: user.role || 'event_handler',
      photo_url: user.photo_url || ''
    })
    setShowUserModal(true)
  }

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event?')) return

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)
      
      if (error) throw error
      
      fetchEvents()
    } catch (error) {
      console.error('Error deleting event:', error)
      alert('Error deleting event: ' + error.message)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)
      
      if (error) throw error
      
      fetchHandlers()
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Error deleting user: ' + error.message)
    }
  }

  const handleToggleEventActive = async (eventId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ is_active: !currentStatus })
        .eq('id', eventId)
      
      if (error) throw error
      
      fetchEvents()
    } catch (error) {
      console.error('Error updating event status:', error)
      alert('Error updating event status: ' + error.message)
    }
  }

  const handleViewParticipation = (event) => {
    setSelectedEvent(event)
    setParticipations(event.participations)
    setShowParticipationModal(true)
  }

  const resetEventForm = () => {
    setEventFormData({
      name: '',
      description: '',
      photo_url: '',
      price: 0,
      category: 'tech',
      handler_id: '',
      max_participants: null,
      is_active: true,
      event_date: ''
    })
  }

  const resetUserForm = () => {
    setUserFormData({
      name: '',
      email: '',
      phone: '',
      enrollment_number: '',
      college_id: '',
      semester: '',
      field_id: '',
      role: 'event_handler',
      photo_url: ''
    })
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('')
    setActiveOnly(false)
  }

  const handleImageUpload = async (file) => {
    try {
      // Validate the image file
      validateImage(file)
      
      // Upload image with fallback
      const imageUrl = await uploadImage(file)
      return imageUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      throw error
    }
  }

  const exportParticipationData = () => {
    if (!selectedEvent || !participations.length) return

    const csvData = [
      ['Name', 'Email', 'Phone', 'College', 'Payment Status', 'Amount Paid', 'Registration Date'],
      ...participations.map(p => {
        const collegeName = colleges.find(c => c.id === (p.users?.college_id || ''))?.name || 'N/A'
        return [
          p.users?.name || 'N/A',
          p.users?.email || 'N/A',
          p.users?.phone || 'N/A',
          collegeName,
          p.payment_status,
          p.amount_paid || 0,
          new Date(p.created_at).toLocaleDateString()
        ]
      })
    ]

    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedEvent.name}_participants.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const categories = [
    { value: 'tech', label: 'Tech' },
    { value: 'non-tech', label: 'Non-Tech' },
    { value: 'food', label: 'Food' },
    { value: 'free', label: 'Free' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Event Manager Panel</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your events, handlers, and view participation details
          </p>
        </div>
                 <div className="flex space-x-3">
           <button
             onClick={() => {
               setShowEventModal(true)
               fetchHandlers() // Refresh handlers when opening modal
             }}
             className="btn-primary flex items-center space-x-2"
           >
             <Plus className="h-5 w-5" />
             <span>Add Event</span>
           </button>
         </div>
      </div>

             {/* Tabs */}
       <div className="border-b border-gray-200 dark:border-gray-700">
         <nav className="-mb-px flex space-x-8">
           <button 
             onClick={() => setActiveTab('events')}
             className={`border-b-2 py-2 px-1 text-sm font-medium ${
               activeTab === 'events'
                 ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                 : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
             }`}
           >
             Events
           </button>
           <button 
             onClick={() => setActiveTab('handlers')}
             className={`border-b-2 py-2 px-1 text-sm font-medium ${
               activeTab === 'handlers'
                 ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                 : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
             }`}
           >
             Event Handlers
           </button>
           <button 
             onClick={() => setActiveTab('fields')}
             className={`border-b-2 py-2 px-1 text-sm font-medium ${
               activeTab === 'fields'
                 ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                 : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
             }`}
           >
             Fields
           </button>
         </nav>
       </div>

             {/* Events Tab Content */}
       {activeTab === 'events' && (
         <>
           {/* Filters */}
           <div className="card p-4">
             <div className="flex flex-col lg:flex-row gap-4">
               <div className="flex-1">
                 <div className="relative">
                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                   <input
                     type="text"
                     placeholder="Search events..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="input-field pl-10"
                   />
                 </div>
               </div>
               
               <div className="flex flex-wrap gap-2">
                 <select
                   value={selectedCategory}
                   onChange={(e) => setSelectedCategory(e.target.value)}
                   className="input-field"
                 >
                   <option value="">All Categories</option>
                   {categories.map(category => (
                     <option key={category.value} value={category.value}>{category.label}</option>
                   ))}
                 </select>

                 <label className="flex items-center space-x-2">
                   <input
                     type="checkbox"
                     checked={activeOnly}
                     onChange={(e) => setActiveOnly(e.target.checked)}
                     className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                   />
                   <span className="text-sm text-gray-700 dark:text-gray-300">Active Only</span>
                 </label>

                 <button
                   onClick={clearFilters}
                   className="btn-secondary"
                 >
                   Clear Filters
                 </button>
               </div>
             </div>
           </div>

           {/* Events grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">Loading events...</p>
          </div>
        </div>
      ) : events.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No events found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchTerm || selectedCategory || activeOnly
                ? 'Try adjusting your filters or search terms.'
                : 'Get started by creating your first event.'}
            </p>
                         {!searchTerm && !selectedCategory && !activeOnly && (
               <button
                 onClick={() => {
                   setShowEventModal(true)
                   fetchHandlers() // Refresh handlers when opening modal
                 }}
                 className="btn-primary"
               >
                 <Plus className="h-5 w-5 mr-2" />
                 Add Event
               </button>
             )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={event.id} className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-primary-600" />
                  <h3 className="ml-3 text-lg font-medium text-gray-900 dark:text-white">
                    {event.name}
                  </h3>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleToggleEventActive(event.id, event.is_active)}
                    className={`p-1 rounded ${
                      event.is_active 
                        ? 'text-green-600 hover:text-green-900' 
                        : 'text-red-600 hover:text-red-900'
                    }`}
                  >
                    {event.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => handleEditEvent(event)}
                    className="text-primary-600 hover:text-primary-900 dark:hover:text-primary-400"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {event.photo_url && (
                <img
                  src={event.photo_url}
                  alt={event.name}
                  className="w-full h-32 object-cover rounded-lg mb-4"
                />
              )}
              
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {event.description}
                </p>
                
                <div className="flex items-center justify-between text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    event.category === 'tech' 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  }`}>
                    {event.category}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    ₹{event.price}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Handler</p>
                    <p className="font-medium">{event.handler?.name || 'Unassigned'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Max Participants</p>
                    <p className="font-medium">{event.max_participants || 'Unlimited'}</p>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center">
                      <Users className="h-5 w-5 mx-auto text-gray-400 mb-1" />
                      <p className="font-medium">{event.totalRegistrations}</p>
                      <p className="text-xs text-gray-500">Registered</p>
                    </div>
                    <div className="text-center">
                      <DollarSign className="h-5 w-5 mx-auto text-gray-400 mb-1" />
                      <p className="font-medium">{event.paidRegistrations}</p>
                      <p className="text-xs text-gray-500">Paid</p>
                    </div>
                  </div>
                  
                  {event.max_participants && (
                    <div className="mt-2 text-center">
                      <p className="text-xs text-gray-500">
                        {event.remainingSeats > 0 ? `${event.remainingSeats} seats left` : 'Full'}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => handleViewParticipation(event)}
                    className="w-full mt-3 btn-secondary flex items-center justify-center space-x-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>View Details</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
         </>
       )}

       {/* Event Handlers Tab Content */}
       {activeTab === 'handlers' && (
         <div className="mt-8">
           <div className="flex justify-between items-center mb-4">
             <h2 className="text-xl font-bold text-gray-900 dark:text-white">Event Handlers</h2>
             <button
               onClick={() => setShowUserModal(true)}
               className="btn-secondary flex items-center space-x-2"
             >
               <UserPlus className="h-5 w-5" />
               <span>Add Event Handler</span>
             </button>
           </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {handlers.map((handler) => (
                <div key={handler.id} className="card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      {handler.photo_url ? (
                        <img
                          src={handler.photo_url}
                          alt={handler.name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <UserCheck className="h-8 w-8 text-primary-600" />
                      )}
                      <h3 className="ml-3 text-lg font-medium text-gray-900 dark:text-white">
                        {handler.name}
                      </h3>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditUser(handler)}
                        className="text-primary-600 hover:text-primary-900 dark:hover:text-primary-400"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(handler.id)}
                        className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="text-sm">
                      <p className="text-gray-500 dark:text-gray-400">Email</p>
                      <p className="font-medium">{handler.email}</p>
                    </div>
                    
                    <div className="text-sm">
                      <p className="text-gray-500 dark:text-gray-400">Phone</p>
                      <p className="font-medium">{handler.phone}</p>
                    </div>

                    <div className="text-sm">
                      <p className="text-gray-500 dark:text-gray-400">Role</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        handler.role === 'event_manager'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {handler.role === 'event_manager' ? 'Event Manager' : 'Event Handler'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
         </div>
       )}

      {/* Fields Tab Content */}
      {activeTab === 'fields' && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Fields</h2>
            <button
              onClick={() => { setShowFieldModal(true); setEditingField(null); setFieldFormData({ name: '' }) }}
              className="btn-secondary flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Add Field</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fields.map((field) => (
              <div key={field.id} className="card p-6 flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{field.name}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => { setEditingField(field); setFieldFormData({ name: field.name || '' }); setShowFieldModal(true) }}
                    className="text-primary-600 hover:text-primary-900 dark:hover:text-primary-400"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={async () => { if (!confirm('Delete field?')) return; await supabase.from('fields').delete().eq('id', field.id); fetchFields() }}
                    className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Field Modal */}
      {showFieldModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {editingField ? 'Edit Field' : 'Add New Field'}
              </h3>
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  const name = fieldFormData.name?.trim()
                  if (!name) return
                  if (editingField) {
                    await supabase.from('fields').update({ name }).eq('id', editingField.id)
                  } else {
                    await supabase.from('fields').insert([{ name }])
                  }
                  setShowFieldModal(false)
                  setEditingField(null)
                  setFieldFormData({ name: '' })
                  fetchFields()
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Field Name *</label>
                  <input
                    type="text"
                    required
                    value={fieldFormData.name}
                    onChange={(e) => setFieldFormData({ name: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => { setShowFieldModal(false); setEditingField(null) }} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary">{editingField ? 'Update' : 'Create'} Field</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {editingEvent ? 'Edit Event' : 'Add New Event'}
              </h3>
              
              <form onSubmit={handleEventSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Event Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={eventFormData.name}
                    onChange={(e) => setEventFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <textarea
                    value={eventFormData.description}
                    onChange={(e) => setEventFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="input-field"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={eventFormData.event_date}
                    onChange={(e) => setEventFormData(prev => ({ ...prev, event_date: e.target.value }))}
                    className="input-field"
                  />
                </div>

                                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                     Event Photo
                   </label>
                   <input
                     id="event-photo-input"
                     type="file"
                     accept="image/*"
                     className="input-field"
                     onChange={(e) => {
                       if (e.target.files[0]) {
                         console.log('Event photo selected:', e.target.files[0])
                       }
                     }}
                   />
                   <p className="text-xs text-gray-500 mt-1">Upload event image (optional)</p>
                   
                   {/* Show existing image if available */}
                   {eventFormData.photo_url && (
                     <div className="mt-2">
                       <p className="text-xs text-gray-500 mb-2">Current image:</p>
                       <img
                         src={eventFormData.photo_url}
                         alt="Current event photo"
                         className="w-32 h-32 object-cover rounded-lg border"
                       />
                     </div>
                   )}
                 </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Price *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={eventFormData.price}
                      onChange={(e) => setEventFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Category
                    </label>
                    <select
                      value={eventFormData.category}
                      onChange={(e) => setEventFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="input-field"
                    >
                      {categories.map(category => (
                        <option key={category.value} value={category.value}>{category.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                       Event Handler
                     </label>
                                         <select
                       value={eventFormData.handler_id}
                       onChange={(e) => setEventFormData(prev => ({ ...prev, handler_id: e.target.value }))}
                       className="input-field"
                     >
                       <option value="">Select Handler</option>
                       {handlers.map(handler => (
                         <option key={handler.id} value={handler.id}>
                           {handler.name}
                         </option>
                       ))}
                     </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Max Participants
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={eventFormData.max_participants || ''}
                      onChange={(e) => setEventFormData(prev => ({ ...prev, max_participants: e.target.value ? parseInt(e.target.value) : null }))}
                      className="input-field"
                      placeholder="Unlimited"
                    />
                  </div>
                </div>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={eventFormData.is_active}
                    onChange={(e) => setEventFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                </label>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEventModal(false)
                      setEditingEvent(null)
                      resetEventForm()
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingEvent ? 'Update' : 'Create'} Event
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
                             <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                 {editingUser ? 'Edit User' : 'Add New Event Handler'}
               </h3>
              
              <form onSubmit={handleUserSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={userFormData.name}
                      onChange={(e) => setUserFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={userFormData.email}
                      onChange={(e) => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Phone *
                    </label>
                    <input
                      type="text"
                      required
                      value={userFormData.phone}
                      onChange={(e) => setUserFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Enrollment Number
                    </label>
                    <input
                      type="text"
                      value={userFormData.enrollment_number}
                      onChange={(e) => setUserFormData(prev => ({ ...prev, enrollment_number: e.target.value }))}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      College
                    </label>
                    <select
                      value={userFormData.college_id}
                      onChange={(e) => setUserFormData(prev => ({ ...prev, college_id: e.target.value }))}
                      className="input-field"
                    >
                      <option value="">Select College</option>
                      {colleges.map(college => (
                        <option key={college.id} value={college.id}>{college.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Field
                    </label>
                    <select
                      value={userFormData.field_id}
                      onChange={(e) => setUserFormData(prev => ({ ...prev, field_id: e.target.value }))}
                      className="input-field"
                    >
                      <option value="">Select Field</option>
                      {fields.map(field => (
                        <option key={field.id} value={field.id}>{field.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Semester
                    </label>
                    <input
                      type="text"
                      value={userFormData.semester}
                      onChange={(e) => setUserFormData(prev => ({ ...prev, semester: e.target.value }))}
                      className="input-field"
                      placeholder="e.g., 3rd Semester"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Role *
                  </label>
                  <select
                    value={userFormData.role}
                    onChange={(e) => setUserFormData(prev => ({ ...prev, role: e.target.value }))}
                    className="input-field"
                  >
                    {roles.map(role => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </div>

                                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                     Profile Photo
                   </label>
                   <input
                     id="user-photo-input"
                     type="file"
                     accept="image/*"
                     className="input-field"
                     onChange={(e) => {
                       if (e.target.files[0]) {
                         console.log('Profile photo selected:', e.target.files[0])
                       }
                     }}
                   />
                   <p className="text-xs text-gray-500 mt-1">Upload profile image (optional)</p>
                   
                   {/* Show existing image if available */}
                   {userFormData.photo_url && (
                     <div className="mt-2">
                       <p className="text-xs text-gray-500 mb-2">Current image:</p>
                       <img
                         src={userFormData.photo_url}
                         alt="Current profile photo"
                         className="w-32 h-32 object-cover rounded-lg border"
                       />
                     </div>
                   )}
                 </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserModal(false)
                      setEditingUser(null)
                      resetUserForm()
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingUser ? 'Update' : 'Create'} User
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Participation Details Modal */}
      {showParticipationModal && selectedEvent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Participation Details: {selectedEvent.name}
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={exportParticipationData}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={() => setShowParticipationModal(false)}
                    className="btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="mb-4 grid grid-cols-3 gap-4 text-center">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{participations.length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Participants</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {participations.filter(p => p.payment_status === 'approved').length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Paid</p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {participations.filter(p => p.payment_status === 'pending').length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Participant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Registration Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Payment Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Amount Paid
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Registration Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {participations.map((participation) => (
                      <tr key={participation.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {participation.users?.name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {participation.users?.email || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {participation.users?.phone || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            participation.registrationType === 'Combo'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          }`}>
                            {participation.registrationType || 'Direct'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            participation.payment_status === 'approved'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : participation.payment_status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {participation.payment_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          ₹{participation.amount_paid || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(participation.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EventManager
