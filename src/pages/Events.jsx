import { useState, useEffect } from 'react'
import { supabase, STORAGE_BUCKETS, uploadFile, validateFile } from '../lib/supabase'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Calendar,
  Users,
  DollarSign,
  Eye,
  EyeOff,
  BookOpen
} from 'lucide-react'
import { uploadImage, validateImage } from '../utils/imageUpload'

const Events = () => {
  const [events, setEvents] = useState([])
  const [workshops, setWorkshops] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [users, setUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedManager, setSelectedManager] = useState('')
  const [selectedHandler, setSelectedHandler] = useState('')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [activeOnly, setActiveOnly] = useState(false)
  const [showType, setShowType] = useState('all') // 'all', 'events', 'workshops'

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    photo_url: '',
    price: 0,
    category: 'tech',
    handler_id: '',
    manager_id: '',
    max_participants: null,
    is_active: true
  })

  // Debug: Monitor events and workshops state changes
  useEffect(() => {
    console.log('Events: events state changed:', events)
    console.log('Events: events length:', events.length)
    console.log('Events: workshops state changed:', workshops)
    console.log('Events: workshops length:', workshops.length)
    console.log('Events: showType:', showType)
  }, [events, workshops, showType])

  const categories = [
    { value: 'tech', label: 'Tech' },
    { value: 'non-tech', label: 'Non-Tech' }
  ]

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        await Promise.all([
          fetchEvents(),
          fetchWorkshops(),
          fetchUsers()
        ])
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [searchTerm, selectedCategory, selectedManager, selectedHandler, priceRange, activeOnly])

  const fetchEvents = async () => {
    try {
      console.log('Events: Starting to fetch events...')
      
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

      if (selectedManager) {
        query = query.eq('manager_id', selectedManager)
      }

      if (selectedHandler) {
        query = query.eq('handler_id', selectedHandler)
      }

      if (priceRange.min !== '') {
        query = query.gte('price', parseFloat(priceRange.min))
      }

      if (priceRange.max !== '') {
        query = query.lte('price', parseFloat(priceRange.max))
      }

      if (activeOnly) {
        query = query.eq('is_active', true)
      }

      console.log('Events: Executing query...')
      const { data, error } = await query
      console.log('Events: Query result:', { data, error })

      if (error) {
        console.error('Events: Database error:', error)
        throw error
      }

      console.log('Events: Raw events data:', data)

      // Fetch user data separately to avoid table name conflicts
      const eventsWithUsers = await Promise.all(
        (data || []).map(async (event) => {
          try {
            // Fetch handler and manager data
            let handler = null
            let manager = null
            
            if (event.handler_id) {
              const { data: handlerData } = await supabase
                .from('users')
                .select('id, name, role')
                .eq('id', event.handler_id)
                .single()
              handler = handlerData
            }
            
            if (event.manager_id) {
              const { data: managerData } = await supabase
                .from('users')
                .select('id, name, role')
                .eq('id', event.manager_id)
                .single()
              manager = managerData
            }

            // Fetch registrations
            console.log('Events: Fetching registrations for event:', event.id)
            const { data: registrations } = await supabase
              .from('registrations')
              .select('id, payment_status')
              .eq('target_type', 'event')
              .eq('target_id', event.id)

            const registrationsList = registrations || []
            const paidRegistrations = registrationsList.filter(reg => reg.payment_status === 'approved')
            const unpaidRegistrations = registrationsList.filter(reg => reg.payment_status === 'pending')
            
            return {
              ...event,
              handler,
              manager,
              registrations: registrationsList,
              totalRegistrations: registrationsList.length,
              paidRegistrations: paidRegistrations.length,
              unpaidRegistrations: unpaidRegistrations.length,
              remainingSeats: event.max_participants ? event.max_participants - registrationsList.length : null
            }
          } catch (regError) {
            console.error('Events: Error fetching data for event:', event.id, regError)
            return {
              ...event,
              handler: null,
              manager: null,
              registrations: [],
              totalRegistrations: 0,
              paidRegistrations: 0,
              unpaidRegistrations: 0,
              remainingSeats: event.max_participants
            }
          }
        })
      )

      console.log('Events: Final processed events:', eventsWithUsers)
      setEvents(eventsWithUsers)
    } catch (error) {
      console.error('Events: Error fetching events:', error)
    }
  }

  const fetchWorkshops = async () => {
    try {
      console.log('Events: Starting to fetch workshops...')
      console.log('Events: searchTerm:', searchTerm)
      console.log('Events: activeOnly:', activeOnly)
      
      let query = supabase
        .from('workshops')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      }

      if (activeOnly) {
        query = query.eq('is_active', true)
      }

      console.log('Events: Executing workshops query...')
      const { data, error } = await query
      console.log('Events: Workshops query result:', { data, error })

      if (error) {
        console.error('Events: Workshops database error:', error)
        throw error
      }

      console.log('Events: Raw workshops data:', data)

      // Fetch registrations separately for each workshop
      const workshopsWithRegistrations = await Promise.all(
        (data || []).map(async (workshop) => {
          try {
            const { data: registrations } = await supabase
              .from('registrations')
              .select('id, payment_status')
              .eq('target_type', 'workshop')
              .eq('target_id', workshop.id)

            const registrationsList = registrations || []
            const paidRegistrations = registrationsList.filter(reg => reg.payment_status === 'approved')
            const unpaidRegistrations = registrationsList.filter(reg => reg.payment_status === 'pending')
            
            return {
              ...workshop,
              registrations: registrationsList,
              totalRegistrations: registrationsList.length,
              paidRegistrations: paidRegistrations.length,
              unpaidRegistrations: unpaidRegistrations.length,
              remainingSeats: workshop.capacity ? workshop.capacity - registrationsList.length : null
            }
          } catch (regError) {
            console.error('Events: Error fetching registrations for workshop:', workshop.id, regError)
            return {
              ...workshop,
              registrations: [],
              totalRegistrations: 0,
              paidRegistrations: 0,
              unpaidRegistrations: 0,
              remainingSeats: workshop.capacity
            }
          }
        })
      )

      console.log('Events: Final processed workshops:', workshopsWithRegistrations)
      setWorkshops(workshopsWithRegistrations)
    } catch (error) {
      console.error('Events: Error fetching workshops:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, role')
        .in('role', ['event_manager', 'event_handler'])
        .order('name')
      
      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (editingEvent) {
        const { error } = await supabase
          .from('events')
          .update(formData)
          .eq('id', editingEvent.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('events')
          .insert([formData])
        
        if (error) throw error
      }

      setShowModal(false)
      setEditingEvent(null)
      resetForm()
      fetchEvents()
    } catch (error) {
      console.error('Error saving event:', error)
      alert('Error saving event: ' + error.message)
    }
  }

  const handleEdit = (event) => {
    setEditingEvent(event)
    setFormData({
      name: event.name || '',
      description: event.description || '',
      photo_url: event.photo_url || '',
      price: event.price || 0,
      category: event.category || 'tech',
      handler_id: event.handler_id || '',
      manager_id: event.manager_id || '',
      max_participants: event.max_participants || null,
      is_active: event.is_active
    })
    setShowModal(true)
  }

  const handleDelete = async (eventId) => {
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

  const handleToggleActive = async (eventId, currentStatus) => {
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

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      validateImage(file)
      const photoUrl = await uploadImage(file)
      setFormData(prev => ({ ...prev, photo_url: photoUrl }))
    } catch (error) {
      alert(error.message)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      photo_url: '',
      price: 0,
      category: 'tech',
      handler_id: '',
      manager_id: '',
      max_participants: null,
      is_active: true
    })
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('')
    setSelectedManager('')
    setSelectedHandler('')
    setPriceRange({ min: '', max: '' })
    setActiveOnly(false) // Changed from true to false
  }

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Events Management</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage events and their configurations
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add Event</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Type Filter */}
          <div className="flex items-center space-x-2 mb-4 lg:mb-0">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Show:</label>
            <select
              value={showType}
              onChange={(e) => setShowType(e.target.value)}
              className="input-field"
            >
              <option value="all">All</option>
              <option value="events">Events Only</option>
              <option value="workshops">Workshops Only</option>
            </select>
          </div>
          
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search events and workshops..."
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

            <select
              value={selectedManager}
              onChange={(e) => setSelectedManager(e.target.value)}
              className="input-field"
            >
              <option value="">All Managers</option>
              {users.filter(u => u.role === 'event_manager').map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>

            <select
              value={selectedHandler}
              onChange={(e) => setSelectedHandler(e.target.value)}
              className="input-field"
            >
              <option value="">All Handlers</option>
              {users.filter(u => u.role === 'event_handler').map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>

            <div className="flex items-center space-x-2">
              <input
                type="number"
                placeholder="Min Price"
                value={priceRange.min}
                onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                className="input-field w-24"
              />
              <span className="text-gray-500">-</span>
              <input
                type="number"
                placeholder="Max Price"
                value={priceRange.max}
                onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                className="input-field w-24"
              />
            </div>

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
            <p className="mt-4 text-gray-500 dark:text-gray-400">Loading events and workshops...</p>
          </div>
        </div>
      ) : (showType === 'all' && events.length === 0 && workshops.length === 0) || 
           (showType === 'events' && events.length === 0) || 
           (showType === 'workshops' && workshops.length === 0) ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {showType === 'all' ? 'No events or workshops found' : 
               showType === 'events' ? 'No events found' : 'No workshops found'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchTerm || selectedCategory || selectedManager || selectedHandler || priceRange.min || priceRange.max || activeOnly
                ? 'Try adjusting your filters or search terms.'
                : 'Get started by creating your first event or workshop.'}
            </p>
            {!searchTerm && !selectedCategory && !selectedManager && !selectedHandler && !priceRange.min && !priceRange.max && !activeOnly && (
              <button
                onClick={() => setShowModal(true)}
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
                    onClick={() => handleToggleActive(event.id, event.is_active)}
                    className={`p-1 rounded ${
                      event.is_active 
                        ? 'text-green-600 hover:text-green-900' 
                        : 'text-red-600 hover:text-red-900'
                    }`}
                  >
                    {event.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => handleEdit(event)}
                    className="text-primary-600 hover:text-primary-900 dark:hover:text-primary-400"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
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
                    <p className="text-gray-500 dark:text-gray-400">Manager</p>
                    <p className="font-medium">{event.manager?.name || 'Unassigned'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Handler</p>
                    <p className="font-medium">{event.handler?.name || 'Unassigned'}</p>
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
                </div>
              </div>
            </div>
          ))}

          {/* Display Workshops */}
          {(showType === 'all' || showType === 'workshops') && workshops.map((workshop) => (
            <div key={`workshop-${workshop.id}`} className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <BookOpen className="h-8 w-8 text-primary-600" />
                  <h3 className="ml-3 text-lg font-medium text-gray-900 dark:text-white">
                    {workshop.title}
                  </h3>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleToggleActive(workshop.id, workshop.is_active)}
                    className={`p-1 rounded ${
                      workshop.is_active 
                        ? 'text-green-600 hover:text-green-900' 
                        : 'text-red-600 hover:text-red-900'
                    }`}
                  >
                    {workshop.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => handleEdit(workshop)}
                    className="text-primary-600 hover:text-primary-900 dark:hover:text-primary-400"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(workshop.id)}
                    className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {workshop.photo_url && (
                <img
                  src={workshop.photo_url}
                  alt={workshop.title}
                  className="w-full h-32 object-cover rounded-lg mb-4"
                />
              )}
              
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {workshop.description}
                </p>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    Workshop
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    ₹{workshop.fee}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Capacity</p>
                    <p className="font-medium">{workshop.capacity || 'Unlimited'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Duration</p>
                    <p className="font-medium">
                      {workshop.start_time && workshop.end_time 
                        ? `${workshop.start_time} - ${workshop.end_time}`
                        : 'TBD'
                      }
                    </p>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center">
                      <Users className="h-5 w-5 mx-auto text-gray-400 mb-1" />
                      <p className="font-medium">{workshop.totalRegistrations}</p>
                      <p className="text-xs text-gray-500">Registered</p>
                    </div>
                    <div className="text-center">
                      <DollarSign className="h-5 w-5 mx-auto text-gray-400 mb-1" />
                      <p className="font-medium">{workshop.paidRegistrations}</p>
                      <p className="text-xs text-gray-500">Paid</p>
                    </div>
                  </div>
                  
                  {workshop.capacity && (
                    <div className="mt-2 text-center">
                      <p className="text-xs text-gray-500">
                        {workshop.remainingSeats > 0 ? `${workshop.remainingSeats} seats left` : 'Full'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Event Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {editingEvent ? 'Edit Event' : 'Add New Event'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Event Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="input-field"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Event Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="input-field"
                  />
                  {formData.photo_url && (
                    <img
                      src={formData.photo_url}
                      alt="Preview"
                      className="mt-2 h-20 w-20 rounded-lg object-cover"
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
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
                      Manager
                    </label>
                    <select
                      value={formData.manager_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, manager_id: e.target.value }))}
                      className="input-field"
                    >
                      <option value="">Select Manager</option>
                      {users.filter(u => u.role === 'event_manager').map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Handler
                    </label>
                    <select
                      value={formData.handler_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, handler_id: e.target.value }))}
                      className="input-field"
                    >
                      <option value="">Select Handler</option>
                      {users.filter(u => u.role === 'event_handler').map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Max Participants
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_participants || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_participants: e.target.value ? parseInt(e.target.value) : null }))}
                    className="input-field"
                    placeholder="No limit"
                  />
                </div>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                </label>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingEvent(null)
                      resetForm()
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
    </div>
  )
}

export default Events 