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
            console.error('Error fetching registrations for workshop:', workshop.id, regError)
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
      if (editingWorkshop) {
        const { error } = await supabase
          .from('workshops')
          .update(formData)
          .eq('id', editingWorkshop.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('workshops')
          .insert([formData])
        
        if (error) throw error
      }

      setShowModal(false)
      setEditingWorkshop(null)
      resetForm()
      fetchWorkshops()
    } catch (error) {
      console.error('Error saving workshop:', error)
      alert('Error saving workshop: ' + error.message)
    }
  }

  const handleEdit = (workshop) => {
    setEditingWorkshop(workshop)
    setFormData({
      title: workshop.title || '',
      description: workshop.description || '',
      photo_url: workshop.photo_url || '',
      fee: workshop.fee || 0,
      capacity: workshop.capacity || null,
      start_time: workshop.start_time ? new Date(workshop.start_time).toISOString().slice(0, 16) : '',
      end_time: workshop.end_time ? new Date(workshop.end_time).toISOString().slice(0, 16) : '',
      speakers: workshop.speakers || [],
      is_active: workshop.is_active
    })
    setShowModal(true)
  }

  const handleDelete = async (workshopId) => {
    if (!confirm('Are you sure you want to delete this workshop?')) return

    try {
      const { error } = await supabase
        .from('workshops')
        .delete()
        .eq('id', workshopId)
      
      if (error) throw error
      
      fetchWorkshops()
    } catch (error) {
      console.error('Error deleting workshop:', error)
      alert('Error deleting workshop: ' + error.message)
    }
  }

  const handleToggleActive = async (workshopId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('workshops')
        .update({ is_active: !currentStatus })
        .eq('id', workshopId)
      
      if (error) throw error
      
      fetchWorkshops()
    } catch (error) {
      console.error('Error updating workshop status:', error)
      alert('Error updating workshop status: ' + error.message)
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

  const resetForm = () => {
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
    setNewSpeaker('')
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Workshops Management</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage workshops and training sessions
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add Workshop</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search workshops..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={activeOnly}
                onChange={(e) => setActiveOnly(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Active Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Workshops grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workshops.map((workshop) => (
          <div key={workshop.id} className="card p-6">
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
                <span className="text-gray-500 dark:text-gray-400">
                  Fee: ₹{workshop.fee}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  Capacity: {workshop.capacity || 'Unlimited'}
                </span>
              </div>

              {workshop.start_time && workshop.end_time && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      {new Date(workshop.start_time).toLocaleDateString()} - {new Date(workshop.end_time).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}

              {workshop.speakers && workshop.speakers.length > 0 && (
                <div className="text-sm">
                  <p className="text-gray-500 dark:text-gray-400 mb-1">Speakers:</p>
                  <div className="flex flex-wrap gap-1">
                    {workshop.speakers.map((speaker, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs"
                      >
                        {speaker}
                      </span>
                    ))}
                  </div>
                </div>
              )}

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

      {/* Add/Edit Workshop Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {editingWorkshop ? 'Edit Workshop' : 'Add New Workshop'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Workshop Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
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
                    Workshop Photo
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
                      Fee
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.fee}
                      onChange={(e) => setFormData(prev => ({ ...prev, fee: parseFloat(e.target.value) || 0 }))}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Capacity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.capacity || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value ? parseInt(e.target.value) : null }))}
                      className="input-field"
                      placeholder="Unlimited"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Start Time
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.start_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      End Time
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.end_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Speakers
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newSpeaker}
                      onChange={(e) => setNewSpeaker(e.target.value)}
                      placeholder="Add speaker name"
                      className="input-field flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpeaker())}
                    />
                    <button
                      type="button"
                      onClick={addSpeaker}
                      className="btn-secondary px-3"
                    >
                      <UserPlus className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {formData.speakers.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {formData.speakers.map((speaker, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs flex items-center space-x-1"
                        >
                          <span>{speaker}</span>
                          <button
                            type="button"
                            onClick={() => removeSpeaker(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
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
                      setEditingWorkshop(null)
                      resetForm()
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingWorkshop ? 'Update' : 'Create'} Workshop
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

export default Workshops 