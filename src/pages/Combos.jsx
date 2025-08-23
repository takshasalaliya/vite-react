import { useState, useEffect } from 'react'
import { supabase, STORAGE_BUCKETS, uploadFile, validateFile } from '../lib/supabase'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Package,
  Users,
  DollarSign,
  AlertTriangle,
  Eye,
  EyeOff,
  Plus as PlusIcon,
  X
} from 'lucide-react'
import { uploadImage, validateImage } from '../utils/imageUpload'

const Combos = () => {
  const [combos, setCombos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCombo, setEditingCombo] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeOnly, setActiveOnly] = useState(false)
  const [events, setEvents] = useState([])
  const [workshops, setWorkshops] = useState([])

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    photo_url: '',
    price: 0,
    capacity: null,
    is_active: true
  })

  const [comboItems, setComboItems] = useState([])
  const [selectedTargetType, setSelectedTargetType] = useState('event')
  const [selectedTargetId, setSelectedTargetId] = useState('')

  // Debug: Monitor combos state changes
  useEffect(() => {
    console.log('Combos: combos state changed:', combos)
    console.log('Combos: combos length:', combos.length)
  }, [combos])

  useEffect(() => {
    fetchCombos()
    fetchEvents()
    fetchWorkshops()
  }, [searchTerm, activeOnly])

  const fetchCombos = async () => {
    try {
      setLoading(true)
      console.log('Combos: Starting to fetch combos...')
      
      let query = supabase
        .from('combos')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      }

      if (activeOnly) {
        query = query.eq('is_active', true)
      }

      console.log('Combos: Executing query...')
      const { data, error } = await query
      console.log('Combos: Query result:', { data, error })

      if (error) {
        console.error('Combos: Database error:', error)
        throw error
      }

      console.log('Combos: Raw combos data:', data)

      // Fetch combo items and related data separately for each combo
      const combosWithDetails = await Promise.all(
        (data || []).map(async (combo) => {
          try {
            console.log('Combos: Fetching details for combo:', combo.id)
            
            // Fetch combo items
            const { data: comboItems } = await supabase
              .from('combo_items')
              .select('*')
              .eq('combo_id', combo.id)
              .order('position')

            console.log('Combos: Combo items for', combo.id, ':', comboItems)

            // Fetch events and workshops for each combo item
            const itemsWithDetails = await Promise.all(
              (comboItems || []).map(async (item) => {
                try {
                  if (item.target_type === 'event') {
                    const { data: eventData } = await supabase
                      .from('events')
                      .select('id, name, max_participants')
                      .eq('id', item.target_id)
                      .single()
                    return { ...item, event: eventData }
                  } else if (item.target_type === 'workshop') {
                    const { data: workshopData } = await supabase
                      .from('workshops')
                      .select('id, title, capacity')
                      .eq('id', item.target_id)
                      .single()
                    return { ...item, workshop: workshopData }
                  }
                  return item
                } catch (itemError) {
                  console.error('Combos: Error fetching item details:', itemError)
                  return item
                }
              })
            )

            // Fetch registrations
            const { data: registrations } = await supabase
              .from('registrations')
              .select('id, payment_status')
              .eq('target_type', 'combo')
              .eq('target_id', combo.id)

            const registrationsList = registrations || []
            const paidRegistrations = registrationsList.filter(reg => reg.payment_status === 'approved')
            const unpaidRegistrations = registrationsList.filter(reg => reg.payment_status === 'pending')
            
            // Calculate minimum capacity from combo items
            const itemCapacities = itemsWithDetails.map(item => {
              if (item.event) return item.event.max_participants
              if (item.workshop) return item.workshop.capacity
              return null
            }).filter(cap => cap !== null)
            
            const minCapacity = itemCapacities.length > 0 ? Math.min(...itemCapacities) : null
            
            return {
              ...combo,
              combo_items: itemsWithDetails,
              registrations: registrationsList,
              totalRegistrations: registrationsList.length,
              paidRegistrations: paidRegistrations.length,
              unpaidRegistrations: unpaidRegistrations.length,
              remainingSeats: combo.capacity ? combo.capacity - registrationsList.length : null,
              minItemCapacity: minCapacity
            }
          } catch (comboError) {
            console.error('Combos: Error fetching details for combo:', combo.id, comboError)
            return {
              ...combo,
              combo_items: [],
              registrations: [],
              totalRegistrations: 0,
              paidRegistrations: 0,
              unpaidRegistrations: 0,
              remainingSeats: combo.capacity,
              minItemCapacity: null
            }
          }
        })
      )

      console.log('Combos: Final processed combos:', combosWithDetails)
      setCombos(combosWithDetails)
    } catch (error) {
      console.error('Combos: Error fetching combos:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, max_participants')
        .eq('is_active', true)
        .order('name')
      
      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.error('Error fetching events:', error)
    }
  }

  const fetchWorkshops = async () => {
    try {
      const { data, error } = await supabase
        .from('workshops')
        .select('id, title, capacity')
        .eq('is_active', true)
        .order('title')
      
      if (error) throw error
      setWorkshops(data || [])
    } catch (error) {
      console.error('Error fetching workshops:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      let comboId
      
      if (editingCombo) {
        const { error } = await supabase
          .from('combos')
          .update(formData)
          .eq('id', editingCombo.id)
        
        if (error) throw error
        comboId = editingCombo.id
      } else {
        const { data, error } = await supabase
          .from('combos')
          .insert([formData])
          .select()
        
        if (error) throw error
        comboId = data[0].id
      }

      // Handle combo items
      if (comboItems.length > 0) {
        // Delete existing items if editing
        if (editingCombo) {
          await supabase
            .from('combo_items')
            .delete()
            .eq('combo_id', comboId)
        }

        // Insert new items
        const itemsToInsert = comboItems.map((item, index) => ({
          combo_id: comboId,
          target_type: item.target_type,
          target_id: item.target_id,
          position: index
        }))

        const { error: itemsError } = await supabase
          .from('combo_items')
          .insert(itemsToInsert)
        
        if (itemsError) throw itemsError
      }

      setShowModal(false)
      setEditingCombo(null)
      resetForm()
      fetchCombos()
    } catch (error) {
      console.error('Error saving combo:', error)
      alert('Error saving combo: ' + error.message)
    }
  }

  const handleEdit = (combo) => {
    setEditingCombo(combo)
    setFormData({
      name: combo.name || '',
      description: combo.description || '',
      photo_url: combo.photo_url || '',
      price: combo.price || 0,
      capacity: combo.capacity || null,
      is_active: combo.is_active
    })
    
    // Set combo items
    const items = combo.combo_items?.map(item => ({
      target_type: item.target_type,
      target_id: item.target_id,
      name: item.events?.name || item.workshops?.title
    })) || []
    setComboItems(items)
    
    setShowModal(true)
  }

  const handleDelete = async (comboId) => {
    if (!confirm('Are you sure you want to delete this combo?')) return

    try {
      const { error } = await supabase
        .from('combos')
        .delete()
        .eq('id', comboId)
      
      if (error) throw error
      
      fetchCombos()
    } catch (error) {
      console.error('Error deleting combo:', error)
      alert('Error deleting combo: ' + error.message)
    }
  }

  const handleToggleActive = async (comboId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('combos')
        .update({ is_active: !currentStatus })
        .eq('id', comboId)
      
      if (error) throw error
      
      fetchCombos()
    } catch (error) {
      console.error('Error updating combo status:', error)
      alert('Error updating combo status: ' + error.message)
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

  const addComboItem = () => {
    if (selectedTargetId) {
      const target = selectedTargetType === 'event' 
        ? events.find(e => e.id === selectedTargetId)
        : workshops.find(w => w.id === selectedTargetId)
      
      if (target) {
        const newItem = {
          target_type: selectedTargetType,
          target_id: selectedTargetId,
          name: target.name || target.title
        }
        
        setComboItems(prev => [...prev, newItem])
        setSelectedTargetId('')
      }
    }
  }

  const removeComboItem = (index) => {
    setComboItems(prev => prev.filter((_, i) => i !== index))
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      photo_url: '',
      price: 0,
      capacity: null,
      is_active: true
    })
    setComboItems([])
    setSelectedTargetType('event')
    setSelectedTargetId('')
  }

  const getCapacityWarning = (combo) => {
    if (!combo.minItemCapacity || !combo.capacity) return null
    
    if (combo.capacity > combo.minItemCapacity) {
      return {
        type: 'warning',
        message: `Combo capacity (${combo.capacity}) exceeds minimum item capacity (${combo.minItemCapacity})`
      }
    }
    return null
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Combos Management</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage event and workshop combinations
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add Combo</span>
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
                placeholder="Search combos..."
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

      {/* Combos grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">Loading combos...</p>
          </div>
        </div>
      ) : combos.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No combos found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchTerm || activeOnly
                ? 'Try adjusting your filters or search terms.'
                : 'Get started by creating your first combo.'}
            </p>
            {!searchTerm && !activeOnly && (
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Combo
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {combos.map((combo) => {
            const capacityWarning = getCapacityWarning(combo)
            
            return (
              <div key={combo.id} className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Package className="h-8 w-8 text-primary-600" />
                    <h3 className="ml-3 text-lg font-medium text-gray-900 dark:text-white">
                      {combo.name}
                    </h3>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleToggleActive(combo.id, combo.is_active)}
                      className={`p-1 rounded ${
                        combo.is_active 
                          ? 'text-green-600 hover:text-green-900' 
                          : 'text-red-600 hover:text-red-900'
                      }`}
                    >
                      {combo.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => handleEdit(combo)}
                      className="text-primary-600 hover:text-primary-900 dark:hover:text-primary-400"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(combo.id)}
                      className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {combo.photo_url && (
                  <img
                    src={combo.photo_url}
                    alt={combo.name}
                    className="w-full h-32 object-cover rounded-lg mb-4"
                  />
                )}
                
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {combo.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                       ₹{combo.price}
                     </span>
                    {capacityWarning && (
                      <div className="flex items-center text-yellow-600">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        <span className="text-xs">{capacityWarning.message}</span>
                      </div>
                    )}
                  </div>

                  {/* Combo Items */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Included Items:</p>
                    <div className="space-y-1">
                      {combo.combo_items?.map((item, index) => (
                        <div key={index} className="flex items-center space-x-2 text-xs">
                          <span className="w-2 h-2 bg-primary-600 rounded-full"></span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {item.event?.name || item.workshop?.title}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({item.target_type})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center">
                        <Users className="h-5 w-5 mx-auto text-gray-400 mb-1" />
                        <p className="font-medium">{combo.totalRegistrations}</p>
                        <p className="text-xs text-gray-500">Registered</p>
                      </div>
                      <div className="text-center">
                        <DollarSign className="h-5 w-5 mx-auto text-gray-400 mb-1" />
                        <p className="font-medium">{combo.paidRegistrations}</p>
                        <p className="text-xs text-gray-500">Paid</p>
                      </div>
                    </div>
                    
                    {combo.capacity && (
                      <div className="mt-2 text-center">
                        <p className="text-xs text-gray-500">
                          {combo.remainingSeats > 0 ? `${combo.remainingSeats} seats left` : 'Full'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Combo Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {editingCombo ? 'Edit Combo' : 'Add New Combo'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Combo Name *
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
                    Combo Photo
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
                      Price *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Add Combo Items
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <select
                      value={selectedTargetType}
                      onChange={(e) => setSelectedTargetType(e.target.value)}
                      className="input-field"
                    >
                      <option value="event">Event</option>
                      <option value="workshop">Workshop</option>
                    </select>
                    
                    <select
                      value={selectedTargetId}
                      onChange={(e) => setSelectedTargetId(e.target.value)}
                      className="input-field flex-1"
                    >
                      <option value="">Select {selectedTargetType}</option>
                      {selectedTargetType === 'event' 
                        ? events.map(event => (
                            <option key={event.id} value={event.id}>
                              {event.name} (Max: {event.max_participants || 'Unlimited'})
                            </option>
                          ))
                        : workshops.map(workshop => (
                            <option key={workshop.id} value={workshop.id}>
                              {workshop.title} (Capacity: {workshop.capacity || 'Unlimited'})
                            </option>
                          ))
                      }
                    </select>
                    
                    <button
                      type="button"
                      onClick={addComboItem}
                      className="btn-secondary px-3"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {comboItems.length > 0 && (
                    <div className="space-y-2">
                      {comboItems.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {item.name} ({item.target_type})
                          </span>
                          <button
                            type="button"
                            onClick={() => removeComboItem(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
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
                      setEditingCombo(null)
                      resetForm()
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingCombo ? 'Update' : 'Create'} Combo
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

export default Combos 