import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Search, Edit, Trash2, Calendar, Users, DollarSign, Eye, EyeOff, BarChart3, Download } from 'lucide-react'
import { uploadImage, validateImage } from '../utils/imageUpload'

const EventHandler = () => {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showEventModal, setShowEventModal] = useState(false)
  const [showParticipationModal, setShowParticipationModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [activeOnly, setActiveOnly] = useState(false)
  const [participations, setParticipations] = useState([])
  const [managers, setManagers] = useState([])

  const [eventFormData, setEventFormData] = useState({
    name: '',
    description: '',
    photo_url: '',
    price: 0,
    category: 'tech',
    manager_id: '',
    max_participants: null,
    is_active: true
  })

  useEffect(() => {
    if (user) {
      fetchEvents()
      fetchManagers()
    }
  }, [user, searchTerm, selectedCategory, activeOnly])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('events')
        .select('*')
        .eq('handler_id', user.id)
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

      const { data, error } = await query
      if (error) throw error

      const eventsWithDetails = await Promise.all(
        (data || []).map(async (event) => {
          let manager = null
          if (event.manager_id) {
            const { data: managerData } = await supabase
              .from('users')
              .select('id, name, email, phone')
              .eq('id', event.manager_id)
              .single()
            manager = managerData
          }

          const { data: registrations } = await supabase
            .from('registrations')
            .select(`
              id, payment_status, amount_paid, created_at,
              users(id, name, email, phone, college_id, semester, field_id)
            `)
            .eq('target_type', 'event')
            .eq('target_id', event.id)

          const registrationsList = registrations || []
          const paidRegistrations = registrationsList.filter(reg => reg.payment_status === 'approved')
          
          return {
            ...event,
            manager,
            participations: registrationsList,
            totalRegistrations: registrationsList.length,
            paidRegistrations: paidRegistrations.length,
            remainingSeats: event.max_participants ? event.max_participants - registrationsList.length : null
          }
        })
      )

      setEvents(eventsWithDetails)
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchManagers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, phone')
        .eq('role', 'event_manager')
        .order('name')
      
      if (error) throw error
      setManagers(data || [])
    } catch (error) {
      console.error('Error fetching managers:', error)
    }
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

  const handleEventSubmit = async (e) => {
    e.preventDefault()
    
    try {
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

      const eventDataToSave = {
        ...eventFormData,
        photo_url: photoUrl,
        manager_id: eventFormData.manager_id || null,
        handler_id: user.id
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

  const handleEditEvent = (event) => {
    setEditingEvent(event)
    setEventFormData({
      name: event.name || '',
      description: event.description || '',
      photo_url: event.photo_url || '',
      price: event.price || 0,
      category: event.category || 'tech',
      manager_id: event.manager_id || '',
      max_participants: event.max_participants || null,
      is_active: event.is_active
    })
    setShowEventModal(true)
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
      manager_id: '',
      max_participants: null,
      is_active: true
    })
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('')
    setActiveOnly(false)
  }

  const exportParticipationData = () => {
    if (!selectedEvent || !participations.length) return

    const csvData = [
      ['Name', 'Email', 'Phone', 'Payment Status', 'Amount Paid', 'Registration Date'],
      ...participations.map(p => [
        p.users?.name || 'N/A',
        p.users?.email || 'N/A',
        p.users?.phone || 'N/A',
        p.payment_status,
        p.amount_paid || 0,
        new Date(p.created_at).toLocaleDateString()
      ])
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
    { value: 'non-tech', label: 'Non-Tech' }
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Event Handler Panel</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your assigned events and view participation details
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              setShowEventModal(true)
              fetchManagers()
            }}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Add Event</span>
          </button>
        </div>
      </div>

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

            <button onClick={clearFilters} className="btn-secondary">
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Events grid */}
      {events.length === 0 ? (
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
                  fetchManagers()
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
                    <p className="text-gray-500 dark:text-gray-400">Manager</p>
                    <p className="font-medium">{event.manager?.name || 'Unassigned'}</p>
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
                      Event Manager
                    </label>
                    <select
                      value={eventFormData.manager_id}
                      onChange={(e) => setEventFormData(prev => ({ ...prev, manager_id: e.target.value }))}
                      className="input-field"
                    >
                      <option value="">Select Manager</option>
                      {managers.map(manager => (
                        <option key={manager.id} value={manager.id}>
                          {manager.name}
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

export default EventHandler
