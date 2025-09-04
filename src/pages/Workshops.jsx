import { useState, useEffect } from 'react'
import { supabase, STORAGE_BUCKETS, uploadFile, validateFile } from '../lib/supabase'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  BookOpen,
  Users,
  DollarSign,
  Clock,
  Eye,
  EyeOff,
  UserPlus
} from 'lucide-react'
import { uploadImage, validateImage } from '../utils/imageUpload'

const Workshops = () => {
  const [workshops, setWorkshops] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showParticipationModal, setShowParticipationModal] = useState(false)
  const [selectedWorkshop, setSelectedWorkshop] = useState(null)
  const [participations, setParticipations] = useState([])
  const [editingWorkshop, setEditingWorkshop] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeOnly, setActiveOnly] = useState(true)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    photo_url: '',
    fee: 0,
    capacity: null,
    start_time: '',
    end_time: '',
    speakers: [],
    is_active: true
  })

  const [newSpeaker, setNewSpeaker] = useState('')

  useEffect(() => {
    fetchWorkshops()
  }, [searchTerm, activeOnly])

  const fetchWorkshops = async () => {
    try {
      setLoading(true)
      
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

      const { data, error } = await query

      if (error) throw error

      // Fetch registrations separately for each workshop (direct + via combos including this workshop)
      const workshopsWithRegistrations = await Promise.all(
        (data || []).map(async (workshop) => {
          try {
            // Direct registrations for this workshop
            const { data: directRegs } = await supabase
              .from('registrations')
              .select('id, payment_status, amount_paid, created_at, users(id, name, email, phone, college_id, semester, field_id)')
              .eq('target_type', 'workshop')
              .eq('target_id', workshop.id)

            // Combos that include this workshop
            const { data: comboItems, error: comboItemsError } = await supabase
              .from('combo_items')
              .select('combo_id')
              .eq('target_type', 'workshop')
              .eq('target_id', workshop.id)

            let comboRegs = []
            if (!comboItemsError && (comboItems?.length || 0) > 0) {
              const comboIds = comboItems.map(ci => ci.combo_id)
              const { data: comboRegsData } = await supabase
                .from('registrations')
                .select('id, payment_status, amount_paid, created_at, users(id, name, email, phone, college_id, semester, field_id)')
                .eq('target_type', 'combo')
                .in('target_id', comboIds)
              comboRegs = comboRegsData || []
            }

            const directWithType = (directRegs || []).map(r => ({ ...r, registrationType: 'Direct' }))
            const comboWithType = (comboRegs || []).map(r => ({ ...r, registrationType: 'Combo' }))
            const mergedMap = new Map()
            ;[...directWithType, ...comboWithType].forEach(r => {
              const key = r.users?.id
              if (key && !mergedMap.has(key)) {
                mergedMap.set(key, r)
              }
            })
            const uniqueRegistrations = Array.from(mergedMap.values())
            
            return {
              ...workshop,
              registrations: uniqueRegistrations
            }
          } catch (error) {
            console.error(`Error fetching registrations for workshop ${workshop.id}:`, error)
            return {
              ...workshop,
              registrations: []
            }
          }
        })
      )

      setWorkshops(workshopsWithRegistrations)
    } catch (error) {
      console.error('Error fetching workshops:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const todayDate = new Date().toISOString().split('T')[0]
      const toIsoDateTime = (timeString) => {
        if (!timeString) return null
        // Compose local date + time, then serialize to ISO
        const date = new Date(`${todayDate}T${timeString}`)
        return isNaN(date.getTime()) ? null : date.toISOString()
      }

      const workshopData = {
        ...formData,
        fee: parseFloat(formData.fee),
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        start_time: toIsoDateTime(formData.start_time),
        end_time: toIsoDateTime(formData.end_time)
      }

      if (editingWorkshop) {
        const { error } = await supabase
          .from('workshops')
          .update(workshopData)
          .eq('id', editingWorkshop.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('workshops')
          .insert([workshopData])
        
        if (error) throw error
      }

      setShowModal(false)
      setEditingWorkshop(null)
      setFormData({
        title: '',
        description: '',
        photo_url: '',
        fee: 0,
        capacity: null,
        start_time: '',
        end_time: '',
        speakers: [],
        is_active: true
      })
      fetchWorkshops()
    } catch (error) {
      console.error('Error saving workshop:', error)
      alert('Error saving workshop')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this workshop?')) return

    try {
      const { error } = await supabase
        .from('workshops')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      fetchWorkshops()
    } catch (error) {
      console.error('Error deleting workshop:', error)
      alert('Error deleting workshop')
    }
  }

  const handleEdit = (workshop) => {
    setEditingWorkshop(workshop)
    const toTimeInput = (isoString) => {
      if (!isoString) return ''
      try {
        const d = new Date(isoString)
        const hh = String(d.getHours()).padStart(2, '0')
        const mm = String(d.getMinutes()).padStart(2, '0')
        return `${hh}:${mm}`
      } catch {
        return ''
      }
    }
    setFormData({
      title: workshop.title,
      description: workshop.description,
      photo_url: workshop.photo_url,
      fee: workshop.fee,
      capacity: workshop.capacity,
      start_time: toTimeInput(workshop.start_time),
      end_time: toTimeInput(workshop.end_time),
      speakers: workshop.speakers || [],
      is_active: workshop.is_active
    })
    setShowModal(true)
  }

  const handleViewParticipants = async (workshopId) => {
    try {
      const workshop = workshops.find(w => w.id === workshopId)
      if (workshop) {
        setSelectedWorkshop(workshop)
        setParticipations(workshop.registrations || [])
        setShowParticipationModal(true)
      }
    } catch (error) {
      console.error('Error fetching participants:', error)
    }
  }

  const addSpeaker = () => {
    if (newSpeaker.trim()) {
      setFormData(prev => ({
        ...prev,
        speakers: [...prev.speakers, newSpeaker.trim()]
      }))
      setNewSpeaker('')
    }
  }

  const removeSpeaker = (index) => {
    setFormData(prev => ({
      ...prev,
      speakers: prev.speakers.filter((_, i) => i !== index)
    }))
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const isValid = await validateImage(file)
      if (!isValid) {
        alert('Please select a valid image file (JPG, PNG, GIF) under 5MB')
        return
      }

      const url = await uploadImage(file)
      setFormData(prev => ({ ...prev, photo_url: url }))
    } catch (error) {
      console.error('Error uploading photo:', error)
      alert('Error uploading photo')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading workshops...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Workshops</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Manage workshop sessions and registrations</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm sm:text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Add Workshop
        </button>
          </div>
      </div>

        {/* Search and Filters */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          <div className="flex-1">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search workshops..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
              <label className="flex items-center">
              <input
                type="checkbox"
                checked={activeOnly}
                onChange={(e) => setActiveOnly(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Active Only</span>
            </label>
          </div>
        </div>
      </div>

        {/* Workshops Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {workshops.map((workshop) => (
            <div key={workshop.id} className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-2 sm:space-y-0">
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">{workshop.title}</h3>
                    <div className="flex items-center space-x-2 mb-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${workshop.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                        {workshop.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        Workshop
                      </span>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                  {workshop.description}
                </p>
                
                <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4" />
                    <span>Fee: ₹{workshop.fee}</span>
                  </div>
                  {workshop.capacity && (
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>Capacity: {workshop.capacity}</span>
                    </div>
                  )}
                  {workshop.start_time && workshop.end_time && (
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>{workshop.start_time} - {workshop.end_time}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>Registrations: {workshop.registrations?.length || 0}</span>
                  </div>
              </div>
                
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                    onClick={() => handleViewParticipants(workshop.id)}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                </button>
                <button
                  onClick={() => handleEdit(workshop)}
                    className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(workshop.id)}
                    className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-red-700 dark:text-red-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
                  </div>
                </div>
                    ))}
                  </div>

        {workshops.length === 0 && !loading && (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No workshops</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new workshop.</p>
                  </div>
                )}
      </div>

      {/* Add/Edit Workshop Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 py-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {editingWorkshop ? 'Edit Workshop' : 'Add Workshop'}
              </h3>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                  <input
                    type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fee</label>
                    <input
                      type="number"
                      value={formData.fee}
                      onChange={(e) => setFormData({...formData, fee: e.target.value})}
                      min="0"
                      step="0.01"
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Capacity</label>
                    <input
                      type="number"
                      value={formData.capacity || ''}
                      onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                      min="1"
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Time</label>
                    <input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Time</label>
                    <input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Speakers</label>
                  <div className="mt-1 flex space-x-2">
                    <input
                      type="text"
                      value={newSpeaker}
                      onChange={(e) => setNewSpeaker(e.target.value)}
                      placeholder="Add speaker name"
                      className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={addSpeaker}
                      className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Add
                    </button>
                  </div>
                  {formData.speakers.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.speakers.map((speaker, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                        >
                          {speaker}
                          <button
                            type="button"
                            onClick={() => removeSpeaker(index)}
                            className="ml-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</label>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingWorkshop(null)
                      setFormData({
                        title: '',
                        description: '',
                        photo_url: '',
                        fee: 0,
                        capacity: null,
                        start_time: '',
                        end_time: '',
                        speakers: [],
                        is_active: true
                      })
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {editingWorkshop ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Participation Modal */}
      {showParticipationModal && selectedWorkshop && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 py-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowParticipationModal(false)}></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Participants for: {selectedWorkshop.title}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Total Registrations: {participations.length}
                </p>
              </div>
              
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Registration Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Payment Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount Paid</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {participations.map((participation) => (
                        <tr key={participation.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {participation.users?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {participation.users?.email || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {participation.users?.phone || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              participation.registrationType === 'Direct' 
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                                : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                            }`}>
                              {participation.registrationType}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              participation.payment_status === 'approved' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : participation.payment_status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                              {participation.payment_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            ₹{participation.amount_paid || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {participations.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No participants</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">No one has registered for this workshop yet.</p>
                  </div>
                )}
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowParticipationModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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

export default Workshops 