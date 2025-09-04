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
  const [showParticipationModal, setShowParticipationModal] = useState(false)
  const [selectedCombo, setSelectedCombo] = useState(null)
  const [participations, setParticipations] = useState([])
  const [editingCombo, setEditingCombo] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeOnly, setActiveOnly] = useState(false)
  const [events, setEvents] = useState([])
  const [workshops, setWorkshops] = useState([])
  const [excludedEventIds, setExcludedEventIds] = useState([])

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

  useEffect(() => {
    fetchCombos()
    fetchEvents()
    fetchWorkshops()
  }, [searchTerm, activeOnly])

  const fetchCombos = async () => {
    try {
      setLoading(true)
      
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

      const { data, error } = await query

      if (error) {
        console.error('Combos: Database error:', error)
        throw error
      }

      // Fetch combo items and related data separately for each combo
      const combosWithDetails = await Promise.all(
        (data || []).map(async (combo) => {
          try {
            // Fetch combo items
            const { data: comboItems } = await supabase
              .from('combo_items')
              .select('*')
              .eq('combo_id', combo.id)
              .order('position')

            // Fetch combo exclusions (non top-up events)
            const { data: comboExclusions } = await supabase
              .from('combo_exclusions')
              .select('target_id')
              .eq('combo_id', combo.id)

            // Fetch direct registrations for this combo
            const { data: directRegs } = await supabase
              .from('registrations')
              .select('id, payment_status, amount_paid, created_at, users(id, name, email, phone, college_id, semester, field_id)')
              .eq('target_type', 'combo')
              .eq('target_id', combo.id)

            // Fetch combo items with related event/workshop details
            const comboItemsWithDetails = await Promise.all(
              (comboItems || []).map(async (item) => {
                if (item.target_type === 'event') {
                  const { data: eventData } = await supabase
                    .from('events')
                    .select('name, price')
                    .eq('id', item.target_id)
                    .single()
                  return { ...item, target_name: eventData?.name, target_price: eventData?.price }
                } else if (item.target_type === 'workshop') {
                  const { data: workshopData } = await supabase
                    .from('workshops')
                    .select('title, fee')
                    .eq('id', item.target_id)
                    .single()
                  return { ...item, target_name: workshopData?.title, target_price: workshopData?.fee }
                }
                return item
              })
            )

            const directWithType = (directRegs || []).map(r => ({ ...r, registrationType: 'Direct' }))
            const mergedMap = new Map()
            directWithType.forEach(r => {
              const key = r.users?.id
              if (key && !mergedMap.has(key)) {
                mergedMap.set(key, r)
              }
            })
            const uniqueRegistrations = Array.from(mergedMap.values())

            return {
              ...combo,
              combo_items: comboItemsWithDetails,
              combo_exclusions: comboExclusions?.map(e => e.target_id) || [],
              registrations: uniqueRegistrations
            }
          } catch (error) {
            console.error(`Error fetching details for combo ${combo.id}:`, error)
            return {
              ...combo,
              combo_items: [],
              combo_exclusions: [],
              registrations: []
            }
          }
        })
      )

      setCombos(combosWithDetails)
    } catch (error) {
      console.error('Error fetching combos:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, price')
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
        .select('id, title, fee')
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
      const comboData = {
        ...formData,
        price: parseFloat(formData.price),
        capacity: formData.capacity ? parseInt(formData.capacity) : null
      }

      if (editingCombo) {
        const { error } = await supabase
          .from('combos')
          .update(comboData)
          .eq('id', editingCombo.id)
        
        if (error) throw error

        // Update combo items
        await supabase
          .from('combo_items')
          .delete()
          .eq('combo_id', editingCombo.id)

        if (comboItems.length > 0) {
          const { error: itemsError } = await supabase
            .from('combo_items')
            .insert(comboItems.map((item, index) => ({
              target_type: item.target_type,
              target_id: item.target_id,
              combo_id: editingCombo.id,
              position: index
            })))
          
          if (itemsError) throw itemsError
        }

        // Update combo exclusions
        await supabase
          .from('combo_exclusions')
          .delete()
          .eq('combo_id', editingCombo.id)

        if ((excludedEventIds?.length || 0) > 0) {
          const { error: exclError } = await supabase
            .from('combo_exclusions')
            .insert(excludedEventIds.map(eventId => ({
              combo_id: editingCombo.id,
              target_id: eventId
            })))
          if (exclError) throw exclError
        }
      } else {
        const { data: newCombo, error } = await supabase
          .from('combos')
          .insert([comboData])
          .select()
        
        if (error) throw error

        if (comboItems.length > 0) {
          const { error: itemsError } = await supabase
            .from('combo_items')
            .insert(comboItems.map((item, index) => ({
              target_type: item.target_type,
              target_id: item.target_id,
              combo_id: newCombo[0].id,
              position: index
            })))
          
          if (itemsError) throw itemsError
        }

        // Create combo exclusions
        if ((excludedEventIds?.length || 0) > 0) {
          const { error: exclError } = await supabase
            .from('combo_exclusions')
            .insert(excludedEventIds.map(eventId => ({
              combo_id: newCombo[0].id,
              target_id: eventId
            })))
          if (exclError) throw exclError
        }
      }

      setShowModal(false)
      setEditingCombo(null)
      setFormData({
        name: '',
        description: '',
        photo_url: '',
        price: 0,
        capacity: null,
        is_active: true
      })
      setComboItems([])
      setExcludedEventIds([])
      fetchCombos()
    } catch (error) {
      console.error('Error saving combo:', error)
      alert('Error saving combo')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this combo?')) return
    
    try {
      const { error } = await supabase
        .from('combos')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      fetchCombos()
    } catch (error) {
      console.error('Error deleting combo:', error)
      alert('Error deleting combo')
    }
  }

  const handleEdit = (combo) => {
    setEditingCombo(combo)
    setFormData({
      name: combo.name,
      description: combo.description,
      photo_url: combo.photo_url,
      price: combo.price,
      capacity: combo.capacity,
      is_active: combo.is_active
    })
    setComboItems(combo.combo_items || [])
    setExcludedEventIds(combo.combo_exclusions || [])
    setShowModal(true)
  }

  const handleViewParticipants = async (comboId) => {
    try {
      const combo = combos.find(c => c.id === comboId)
      if (combo) {
        setSelectedCombo(combo)
        setParticipations(combo.registrations || [])
        setShowParticipationModal(true)
      }
    } catch (error) {
      console.error('Error fetching participants:', error)
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
          target_name: selectedTargetType === 'event' ? target.name : target.title,
          target_price: selectedTargetType === 'event' ? target.price : target.fee
        }
        
        setComboItems([...comboItems, newItem])
        setSelectedTargetId('')
      }
    }
  }

  const removeComboItem = (index) => {
    setComboItems(comboItems.filter((_, i) => i !== index))
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
          <p className="text-gray-600 dark:text-gray-400">Loading combos...</p>
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Combo Packages</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Manage combo packages and registrations</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm sm:text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Add Combo
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
                  placeholder="Search combos..."
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

        {/* Combos Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {combos.map((combo) => (
            <div key={combo.id} className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-2 sm:space-y-0">
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">{combo.name}</h3>
                    <div className="flex items-center space-x-2 mb-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${combo.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                        {combo.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                        Combo
                      </span>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                  {combo.description}
                </p>
                
                <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4" />
                    <span>Price: ₹{combo.price}</span>
                  </div>
                  {combo.capacity && (
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>Capacity: {combo.capacity}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4" />
                    <span>Items: {combo.combo_items?.length || 0}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>Registrations: {combo.registrations?.length || 0}</span>
                  </div>
                </div>

                {combo.combo_items && combo.combo_items.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Included Items:</p>
                    <div className="space-y-1">
                      {combo.combo_items.slice(0, 3).map((item, index) => (
                        <div key={index} className="flex items-center space-x-2 text-xs">
                          <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {item.target_name} ({item.target_type})
                          </span>
                        </div>
                      ))}
                      {combo.combo_items.length > 3 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          +{combo.combo_items.length - 3} more items
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={() => handleViewParticipants(combo.id)}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-orange-700 bg-orange-100 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </button>
                  <button
                    onClick={() => handleEdit(combo)}
                    className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(combo.id)}
                    className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-red-700 dark:text-red-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {combos.length === 0 && !loading && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No combos</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new combo package.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Combo Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 py-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {editingCombo ? 'Edit Combo' : 'Add Combo'}
                </h3>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Price</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
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
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Photo</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Combo Items</label>
                  <div className="mt-1 flex space-x-2">
                    <select
                      value={selectedTargetType}
                      onChange={(e) => setSelectedTargetType(e.target.value)}
                      className="border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    >
                      <option value="event">Event</option>
                      <option value="workshop">Workshop</option>
                    </select>
                    <select
                      value={selectedTargetId}
                      onChange={(e) => setSelectedTargetId(e.target.value)}
                      className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select {selectedTargetType}</option>
                      {(selectedTargetType === 'event' ? events : workshops).map(item => (
                        <option key={item.id} value={item.id}>
                          {selectedTargetType === 'event' ? item.name : item.title}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={addComboItem}
                      className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Add
                    </button>
                  </div>
                  
                  {comboItems.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {comboItems.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                          <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                            <span className="text-sm text-gray-900 dark:text-white">
                              {item.target_name} ({item.target_type})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeComboItem(index)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Non Top-up Events (Exclusions) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Non Top-up Events (disable when this combo selected)</label>
                  <div className="mt-2 max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-gray-50 dark:bg-gray-700">
                    {events.map(e => (
                      <label key={e.id} className="flex items-center space-x-3 py-1">
                        <input
                          type="checkbox"
                          checked={excludedEventIds.includes(e.id)}
                          onChange={(ev) => {
                            setExcludedEventIds(prev => ev.target.checked ? [...prev, e.id] : prev.filter(id => id !== e.id))
                          }}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-900 dark:text-gray-100">{e.name}</span>
                      </label>
                    ))}
                  </div>
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
                      setEditingCombo(null)
                      setFormData({
                        name: '',
                        description: '',
                        photo_url: '',
                        price: 0,
                        capacity: null,
                        is_active: true
                      })
                      setComboItems([])
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {editingCombo ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Participation Modal */}
      {showParticipationModal && selectedCombo && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 py-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowParticipationModal(false)}></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Participants for: {selectedCombo.name}
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
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">No one has registered for this combo yet.</p>
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

export default Combos 