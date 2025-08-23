import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { uploadImage } from '../utils/imageUpload'
import { X, Check, AlertCircle, Upload, Sparkles, TreePine, Zap, Eye, Ghost, Skull, Moon, Star } from 'lucide-react'

const RegistrationForm = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    enrollment_number: '',
    college_id: '',
    field_id: '',
    semester: '',
    photo_url: '',
    selected_tech_events: [],
    selected_non_tech_events: [],
    selected_workshops: [],
    selected_combos: [],
    transaction_id: '',
    amount_paid: ''
  })

  const [colleges, setColleges] = useState([])
  const [fields, setFields] = useState([])
  const [events, setEvents] = useState([])
  const [workshops, setWorkshops] = useState([])
  const [combos, setCombos] = useState([])
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const [validationErrors, setValidationErrors] = useState({
    email: '',
    phone: '',
    enrollment_number: '',
    transaction_id: ''
  })

  const [isValidating, setIsValidating] = useState({
    email: false,
    phone: false,
    enrollment_number: false,
    transaction_id: false
  })

  // Field options will be loaded from database

  const semesterOptions = [
    { value: '1', label: '1st Semester' },
    { value: '2', label: '2nd Semester' },
    { value: '3', label: '3rd Semester' },
    { value: '4', label: '4th Semester' },
    { value: '5', label: '5th Semester' },
    { value: '6', label: '6th Semester' }
  ]

  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen])

  const fetchData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchColleges(),
        fetchFields(),
        fetchEvents(),
        fetchWorkshops(),
        fetchCombos()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchColleges = async () => {
    try {
      const { data, error } = await supabase
        .from('colleges')
        .select('id, name')
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
        .select('id, name')
        .order('name')
      
      if (error) throw error
      setFields(data || [])
    } catch (error) {
      console.error('Error fetching fields:', error)
    }
  }

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
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
        .select('*')
        .eq('is_active', true)
        .order('title')
      
      if (error) throw error
      setWorkshops(data || [])
    } catch (error) {
      console.error('Error fetching workshops:', error)
    }
  }

  const fetchCombos = async () => {
    try {
      const { data, error } = await supabase
        .from('combos')
        .select('*, combo_items(*)')
        .eq('is_active', true)
        .order('name')
      
      if (error) throw error
      setCombos(data || [])
    } catch (error) {
      console.error('Error fetching combos:', error)
    }
  }

  // Check if an event is part of any selected combo
  const isEventInSelectedCombo = (eventId) => {
    return formData.selected_combos.some(comboId => {
      const combo = combos.find(c => c.id === comboId)
      return combo?.combo_items?.some(item => 
        item.target_type === 'event' && item.target_id === eventId
      )
    })
  }

  // Check if a workshop is part of any selected combo
  const isWorkshopInSelectedCombo = (workshopId) => {
    return formData.selected_combos.some(comboId => {
      const combo = combos.find(c => c.id === comboId)
      return combo?.combo_items?.some(item => 
        item.target_type === 'workshop' && item.target_id === workshopId
      )
    })
  }

  const validateEmail = async (email) => {
    if (!email) return
    
    setIsValidating(prev => ({ ...prev, email: true }))
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', email)
      
      if (error) throw error
      
      if (data && data.length > 0) {
        setValidationErrors(prev => ({
          ...prev,
          email: 'This email is already registered'
        }))
      } else {
        setValidationErrors(prev => ({
          ...prev,
          email: ''
        }))
      }
    } catch (error) {
      console.error('Error validating email:', error)
    } finally {
      setIsValidating(prev => ({ ...prev, email: false }))
    }
  }

  const validatePhone = async (phone) => {
    if (!phone) return
    
    setIsValidating(prev => ({ ...prev, phone: true }))
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, phone')
        .eq('phone', phone)
      
      if (error) throw error
      
      if (data && data.length > 0) {
        setValidationErrors(prev => ({
          ...prev,
          phone: 'This phone number is already registered'
        }))
      } else {
        setValidationErrors(prev => ({
          ...prev,
          phone: ''
        }))
      }
    } catch (error) {
      console.error('Error validating phone:', error)
    } finally {
      setIsValidating(prev => ({ ...prev, phone: false }))
    }
  }

  const validateEnrollmentNumber = async (enrollmentNumber) => {
    if (!enrollmentNumber) return
    
    setIsValidating(prev => ({ ...prev, enrollment_number: true }))
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, enrollment_number')
        .eq('enrollment_number', enrollmentNumber)
      
      if (error) throw error
      
      if (data && data.length > 0) {
        setValidationErrors(prev => ({
          ...prev,
          enrollment_number: 'This enrollment number is already registered'
        }))
      } else {
        setValidationErrors(prev => ({
          ...prev,
          enrollment_number: ''
        }))
      }
    } catch (error) {
      console.error('Error validating enrollment number:', error)
    } finally {
      setIsValidating(prev => ({ ...prev, enrollment_number: false }))
    }
  }

  const validateTransactionId = async (transactionId) => {
    if (!transactionId) return
    
    setIsValidating(prev => ({ ...prev, transaction_id: true }))
    
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('id, transaction_id')
        .eq('transaction_id', transactionId)
      
      if (error) throw error
      
      if (data && data.length > 0) {
        setValidationErrors(prev => ({
          ...prev,
          transaction_id: 'This transaction ID is already used'
        }))
      } else {
        setValidationErrors(prev => ({
          ...prev,
          transaction_id: ''
        }))
      }
    } catch (error) {
      console.error('Error validating transaction ID:', error)
    } finally {
      setIsValidating(prev => ({ ...prev, transaction_id: false }))
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }

    if (name === 'email' && value) {
      validateEmail(value)
    } else if (name === 'phone' && value) {
      validatePhone(value)
    } else if (name === 'enrollment_number' && value) {
      validateEnrollmentNumber(value)
    } else if (name === 'transaction_id' && value) {
      validateTransactionId(value)
    }
  }

  const handleEventChange = (eventId, category, checked) => {
    setFormData(prev => {
      const fieldName = category === 'tech' ? 'selected_tech_events' : 'selected_non_tech_events'
      const currentArray = prev[fieldName] || []
      
      let newArray
      if (checked) {
        newArray = [...currentArray, eventId]
      } else {
        newArray = currentArray.filter(id => id !== eventId)
      }
      
      return {
        ...prev,
        [fieldName]: newArray
      }
    })
  }

  const handleWorkshopChange = (workshopId, checked) => {
    setFormData(prev => {
      const currentArray = prev.selected_workshops || []
      
      let newArray
      if (checked) {
        newArray = [...currentArray, workshopId]
      } else {
        newArray = currentArray.filter(id => id !== workshopId)
      }
      
      return {
        ...prev,
        selected_workshops: newArray
      }
    })
  }

  // Handle combo selection with automatic event removal
  const handleComboChange = (comboId, checked) => {
    setFormData(prev => {
      const combo = combos.find(c => c.id === comboId)
      if (!combo) return prev

      let newFormData = { ...prev }
      
      if (checked) {
        // Add combo to selected combos
        newFormData.selected_combos = [...prev.selected_combos, comboId]
        
        // Remove individual events and workshops that are part of this combo
        const eventsToRemove = []
        const workshopsToRemove = []
        
        combo.combo_items?.forEach(item => {
          if (item.target_type === 'event') {
            eventsToRemove.push(item.target_id)
          } else if (item.target_type === 'workshop') {
            workshopsToRemove.push(item.target_id)
          }
        })
        
        // Remove from tech events
        newFormData.selected_tech_events = prev.selected_tech_events.filter(
          eventId => !eventsToRemove.includes(eventId)
        )
        
        // Remove from non-tech events
        newFormData.selected_non_tech_events = prev.selected_non_tech_events.filter(
          eventId => !eventsToRemove.includes(eventId)
        )
        
        // Remove from workshops
        newFormData.selected_workshops = prev.selected_workshops.filter(
          workshopId => !workshopsToRemove.includes(workshopId)
        )
        
      } else {
        // Remove combo from selected combos
        newFormData.selected_combos = prev.selected_combos.filter(id => id !== comboId)
      }
      
      return newFormData
    })
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const photoUrl = await uploadImage(file, 'profile-photos')
      setFormData(prev => ({
        ...prev,
        photo_url: photoUrl
      }))
    } catch (error) {
      console.error('Error uploading photo:', error)
    }
  }

  const calculateTotalPrice = () => {
    let total = 0
    
    // Get all combo items to avoid double-counting
    const comboItemIds = new Set()
    formData.selected_combos.forEach(comboId => {
      const combo = combos.find(c => c.id === comboId)
      if (combo && combo.combo_items) {
        combo.combo_items.forEach(item => {
          comboItemIds.add(item.target_id)
        })
      }
    })
    
    // Add prices for selected tech events (only if not part of selected combos)
    formData.selected_tech_events.forEach(eventId => {
      if (!comboItemIds.has(eventId)) {
        const event = events.find(e => e.id === eventId)
        if (event) total += event.price || 0
      }
    })
    
    // Add prices for selected non-tech events (only if not part of selected combos)
    formData.selected_non_tech_events.forEach(eventId => {
      if (!comboItemIds.has(eventId)) {
        const event = events.find(e => e.id === eventId)
        if (event) total += event.price || 0
      }
    })
    
    // Add prices for selected workshops (only if not part of selected combos)
    formData.selected_workshops.forEach(workshopId => {
      if (!comboItemIds.has(workshopId)) {
        const workshop = workshops.find(w => w.id === workshopId)
        if (workshop) total += workshop.fee || 0
      }
    })
    
    // Add prices for selected combos
    formData.selected_combos.forEach(comboId => {
      const combo = combos.find(c => c.id === comboId)
      if (combo) total += combo.price || 0
    })
    
    return total
  }

  // Get combo event and workshop details for summary
  const getComboDetails = (comboId) => {
    const combo = combos.find(c => c.id === comboId)
    if (!combo || !combo.combo_items) return { events: [], workshops: [] }
    
    const comboEvents = combo.combo_items
      .filter(item => item.target_type === 'event')
      .map(item => {
        const event = events.find(e => e.id === item.target_id)
        return event ? { ...event, isComboItem: true } : null
      })
      .filter(Boolean)
    
    const comboWorkshops = combo.combo_items
      .filter(item => item.target_type === 'workshop')
      .map(item => {
        const workshop = workshops.find(w => w.id === item.target_id)
        return workshop ? { ...workshop, isComboItem: true } : null
      })
      .filter(Boolean)
    
    return { events: comboEvents, workshops: comboWorkshops }
  }

  const isFormValid = () => {
    return (
      formData.name &&
      formData.email &&
      formData.phone &&
      formData.enrollment_number &&
      formData.college_id &&
      formData.field_id &&
      formData.semester &&
      formData.transaction_id &&
      formData.amount_paid &&
      !validationErrors.email &&
      !validationErrors.phone &&
      !validationErrors.enrollment_number &&
      !validationErrors.transaction_id &&
      !isValidating.email &&
      !isValidating.phone &&
      !isValidating.enrollment_number &&
      !isValidating.transaction_id
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!isFormValid()) {
      alert('Please fill all required fields and fix validation errors.')
      return
    }

    try {
      setLoading(true)
      
      console.log('Submitting form data:', formData)

      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([{
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          enrollment_number: formData.enrollment_number,
                     college_id: formData.college_id,
           field_id: formData.field_id,
           semester: formData.semester,
          role: 'participant',
          photo_url: formData.photo_url
        }])
        .select()

      if (userError) {
        console.error('User creation error:', userError)
        throw userError
      }

      const userId = userData[0].id
      console.log('User created with ID:', userId)

      const registrationsToInsert = []

      // Get all combo items to avoid double-counting
      const comboItemIds = new Set()
      formData.selected_combos.forEach(comboId => {
        const combo = combos.find(c => c.id === comboId)
        if (combo && combo.combo_items) {
          combo.combo_items.forEach(item => {
            comboItemIds.add(item.target_id)
          })
        }
      })

      // Add event registrations (only if not part of selected combos)
      const allSelectedEvents = [...formData.selected_tech_events, ...formData.selected_non_tech_events]
      allSelectedEvents.forEach(eventId => {
        if (!comboItemIds.has(eventId)) {
          const event = events.find(e => e.id === eventId)
          if (event) {
            registrationsToInsert.push({
              user_id: userId,
              target_type: 'event',
              target_id: eventId,
              transaction_id: formData.transaction_id || null,
              amount_paid: event.price || 0,
              payment_status: 'pending'
            })
          }
        }
      })

      // Add workshop registrations (only if not part of selected combos)
      formData.selected_workshops.forEach(workshopId => {
        if (!comboItemIds.has(workshopId)) {
          const workshop = workshops.find(w => w.id === workshopId)
          if (workshop) {
            registrationsToInsert.push({
              user_id: userId,
              target_type: 'workshop',
              target_id: workshopId,
              transaction_id: formData.transaction_id || null,
              amount_paid: workshop.fee || 0,
              payment_status: 'pending'
            })
          }
        }
      })

      // Add combo registrations
      formData.selected_combos.forEach(comboId => {
        const combo = combos.find(c => c.id === comboId)
        if (combo) {
          registrationsToInsert.push({
            user_id: userId,
            target_type: 'combo',
            target_id: comboId,
            transaction_id: formData.transaction_id || null,
            amount_paid: combo.price || 0,
            payment_status: 'pending'
          })
        }
      })

      if (registrationsToInsert.length > 0) {
        console.log('Inserting registrations:', registrationsToInsert)
        const { error: regError } = await supabase
          .from('registrations')
          .insert(registrationsToInsert)

        if (regError) {
          console.error('Registration insertion error:', regError)
          throw regError
        }
      }

      // Show success animation
      setShowSuccess(true)
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        enrollment_number: '',
        college_id: '',
        field_id: '',
        semester: '',
        photo_url: '',
        selected_tech_events: [],
        selected_non_tech_events: [],
        selected_workshops: [],
        selected_combos: [],
        transaction_id: '',
        amount_paid: ''
      })
      setValidationErrors({
        email: '',
        phone: '',
        enrollment_number: '',
        transaction_id: ''
      })

      // Close modal after animation
      setTimeout(() => {
        setShowSuccess(false)
        onSuccess && onSuccess()
        onClose()
      }, 3000)

    } catch (error) {
      console.error('Error submitting registration:', error)
      alert('Error submitting registration. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Enhanced Background with 3D Elements */}
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-purple-900 opacity-95"></div>
          
          {/* 3D Tree Branches - Desktop */}
          <div className="hidden md:block absolute top-0 left-0 w-32 h-32 transform -rotate-12 opacity-30">
            <TreePine className="w-full h-full text-green-800 animate-pulse" />
          </div>
          <div className="hidden md:block absolute top-10 right-10 w-24 h-24 transform rotate-12 opacity-40">
            <TreePine className="w-full h-full text-green-700 animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
          <div className="hidden md:block absolute bottom-20 left-20 w-20 h-20 transform rotate-45 opacity-25">
            <TreePine className="w-full h-full text-green-600 animate-pulse" style={{ animationDelay: '2s' }} />
          </div>
          
          {/* 3D Tree Branches - Mobile */}
          <div className="md:hidden absolute top-2 left-2 w-16 h-16 transform -rotate-12 opacity-40">
            <TreePine className="w-full h-full text-green-800 animate-tree-sway" />
          </div>
          <div className="md:hidden absolute top-4 right-4 w-12 h-12 transform rotate-12 opacity-50">
            <TreePine className="w-full h-full text-green-700 animate-tree-sway" style={{ animationDelay: '0.8s' }} />
          </div>
          <div className="md:hidden absolute bottom-4 left-4 w-10 h-10 transform rotate-45 opacity-35">
            <TreePine className="w-full h-full text-green-600 animate-tree-sway" style={{ animationDelay: '1.6s' }} />
          </div>
          <div className="md:hidden absolute top-1/3 right-2 w-8 h-8 transform -rotate-30 opacity-30">
            <TreePine className="w-full h-full text-green-500 animate-tree-sway" style={{ animationDelay: '2.4s' }} />
          </div>
          <div className="md:hidden absolute bottom-1/3 left-2 w-14 h-14 transform rotate-60 opacity-25">
            <TreePine className="w-full h-full text-green-400 animate-tree-sway" style={{ animationDelay: '3.2s' }} />
          </div>
          
          {/* Floating Elements - Desktop */}
          <div className="hidden md:block absolute top-1/4 left-1/4 animate-float">
            <Zap className="w-6 h-6 text-yellow-400 opacity-60" />
          </div>
          <div className="hidden md:block absolute top-1/3 right-1/3 animate-float" style={{ animationDelay: '0.5s' }}>
            <Eye className="w-5 h-5 text-red-400 opacity-50" />
          </div>
          <div className="hidden md:block absolute bottom-1/4 right-1/4 animate-float" style={{ animationDelay: '1.5s' }}>
            <Ghost className="w-4 h-4 text-purple-400 opacity-40" />
          </div>
          <div className="hidden md:block absolute top-1/2 left-1/2 animate-float" style={{ animationDelay: '2.5s' }}>
            <Skull className="w-3 h-3 text-gray-400 opacity-30" />
          </div>
          
          {/* Floating Elements - Mobile */}
          <div className="md:hidden absolute top-8 right-8 animate-float">
            <Zap className="w-4 h-4 text-yellow-400 opacity-70" />
          </div>
          <div className="md:hidden absolute top-16 left-8 animate-float" style={{ animationDelay: '0.7s' }}>
            <Eye className="w-3 h-3 text-red-400 opacity-60" />
          </div>
          <div className="md:hidden absolute bottom-16 right-12 animate-float" style={{ animationDelay: '1.4s' }}>
            <Ghost className="w-3 h-3 text-purple-400 opacity-50" />
          </div>
          <div className="md:hidden absolute top-1/2 right-4 animate-float" style={{ animationDelay: '2.1s' }}>
            <Skull className="w-2 h-2 text-gray-400 opacity-40" />
          </div>
          <div className="md:hidden absolute bottom-8 left-12 animate-float" style={{ animationDelay: '2.8s' }}>
            <Star className="w-3 h-3 text-blue-400 opacity-45" />
          </div>
          
          {/* Upside Down Portal Effects - Desktop */}
          <div className="hidden md:block absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-gradient-radial from-red-500/20 via-transparent to-transparent rounded-full animate-pulse"></div>
          <div className="hidden md:block absolute bottom-0 right-1/4 w-64 h-64 bg-gradient-radial from-blue-500/15 via-transparent to-transparent rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
          
          {/* Upside Down Portal Effects - Mobile */}
          <div className="md:hidden absolute top-0 left-1/2 transform -translate-x-1/2 w-48 h-48 bg-gradient-radial from-red-500/25 via-transparent to-transparent rounded-full animate-pulse"></div>
          <div className="md:hidden absolute bottom-0 right-1/4 w-32 h-32 bg-gradient-radial from-blue-500/20 via-transparent to-transparent rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="md:hidden absolute top-1/2 left-0 w-24 h-24 bg-gradient-radial from-purple-500/15 via-transparent to-transparent rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block align-bottom bg-gradient-to-br from-gray-900 via-purple-900 to-red-900 rounded-lg text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full w-full mx-4 border-2 border-purple-500/50 relative">
          {/* 3D Border Effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-transparent to-red-500/20 rounded-lg"></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-red-500"></div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-purple-500"></div>
          {/* Enhanced Success Animation Overlay */}
          {showSuccess && (
            <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50 animate-pulse">
              <div className="text-center relative">
                {/* 3D Success Elements */}
                <div className="absolute inset-0 bg-gradient-radial from-yellow-400/20 via-transparent to-transparent rounded-full animate-pulse"></div>
                
                <div className="mb-6 relative z-10">
                  <div className="flex justify-center space-x-4 mb-4">
                    <Sparkles className="h-12 w-12 text-yellow-400 animate-bounce" />
                    <Star className="h-12 w-12 text-purple-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
                    <Moon className="h-12 w-12 text-blue-400 animate-bounce" style={{ animationDelay: '0.6s' }} />
                  </div>
                </div>
                
                <h3 className="text-3xl font-bold text-yellow-400 mb-3 animate-pulse relative z-10">
                  Welcome to the Upside Down!
                </h3>
                <p className="text-purple-300 text-xl mb-4 relative z-10">
                  Registration successful! You're now part of Wisteria '25
                </p>
                
                {/* Enhanced Particle Effects */}
                <div className="mt-6 flex justify-center space-x-3 relative z-10">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-ping" style={{ animationDelay: '0.4s' }}></div>
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-ping" style={{ animationDelay: '0.6s' }}></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full animate-ping" style={{ animationDelay: '0.8s' }}></div>
                </div>
                
                                 {/* Floating Characters - Desktop */}
                 <div className="hidden md:block absolute top-0 left-0 w-full h-full pointer-events-none">
                   <div className="absolute top-4 left-4 animate-float">
                     <Ghost className="w-6 h-6 text-purple-400 opacity-60" />
                   </div>
                   <div className="absolute top-8 right-8 animate-float" style={{ animationDelay: '0.5s' }}>
                     <Zap className="w-5 h-5 text-yellow-400 opacity-70" />
                   </div>
                   <div className="absolute bottom-4 left-8 animate-float" style={{ animationDelay: '1s' }}>
                     <Eye className="w-4 h-4 text-red-400 opacity-50" />
                   </div>
                 </div>
                 
                 {/* Floating Characters - Mobile */}
                 <div className="md:hidden absolute top-0 left-0 w-full h-full pointer-events-none">
                   <div className="absolute top-2 left-2 animate-float">
                     <Ghost className="w-4 h-4 text-purple-400 opacity-70" />
                   </div>
                   <div className="absolute top-4 right-4 animate-float" style={{ animationDelay: '0.5s' }}>
                     <Zap className="w-3 h-3 text-yellow-400 opacity-80" />
                   </div>
                   <div className="absolute bottom-2 left-4 animate-float" style={{ animationDelay: '1s' }}>
                     <Eye className="w-3 h-3 text-red-400 opacity-60" />
                   </div>
                   <div className="absolute top-1/2 right-2 animate-float" style={{ animationDelay: '1.5s' }}>
                     <Star className="w-2 h-2 text-blue-400 opacity-50" />
                   </div>
                 </div>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-red-900 px-4 pt-4 pb-3 md:px-6 md:pt-6 md:pb-4 lg:p-8 lg:pb-6 relative">
            {/* Header Background Effects */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-red-500 to-blue-500"></div>
            
            <div className="flex justify-between items-center mb-6 relative">
              <div className="flex items-center space-x-2 md:space-x-3">
                <div className="relative">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-purple-600 to-red-600 rounded-full flex items-center justify-center animate-pulse">
                    <Skull className="w-4 h-4 md:w-6 md:h-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-yellow-400 rounded-full animate-ping"></div>
                </div>
                <div>
                  <h3 className="text-lg md:text-2xl font-bold text-white">
                    <span className="text-red-400">Register</span> Participant
                  </h3>
                  <p className="text-purple-300 text-xs md:text-sm">Enter the Upside Down of Wisteria '25</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-red-400 transition-colors p-1 md:p-2 rounded-full hover:bg-red-500/20"
              >
                <X className="h-5 w-5 md:h-6 md:w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-purple-300">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full border border-purple-500/50 rounded-md px-3 py-2 focus:outline-none focus:ring-purple-500 focus:border-purple-500 bg-gray-800 text-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-300">
                    Email *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-purple-500 focus:border-purple-500 bg-gray-800 text-white placeholder-gray-400 ${
                        validationErrors.email ? 'border-red-500' : 'border-purple-500/50'
                      }`}
                    />
                    {isValidating.email && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                      </div>
                    )}
                    {validationErrors.email && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      </div>
                    )}
                  </div>
                  {validationErrors.email && (
                    <p className="mt-1 text-sm text-red-400">{validationErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-300">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-purple-500 focus:border-purple-500 bg-gray-800 text-white placeholder-gray-400 ${
                        validationErrors.phone ? 'border-red-500' : 'border-purple-500/50'
                      }`}
                    />
                    {isValidating.phone && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                      </div>
                    )}
                    {validationErrors.phone && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      </div>
                    )}
                  </div>
                  {validationErrors.phone && (
                    <p className="mt-1 text-sm text-red-400">{validationErrors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-300">
                    Enrollment Number *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="enrollment_number"
                      value={formData.enrollment_number}
                      onChange={handleInputChange}
                      required
                      className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-purple-500 focus:border-purple-500 bg-gray-800 text-white placeholder-gray-400 ${
                        validationErrors.enrollment_number ? 'border-red-500' : 'border-purple-500/50'
                      }`}
                    />
                    {isValidating.enrollment_number && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                      </div>
                    )}
                    {validationErrors.enrollment_number && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      </div>
                    )}
                  </div>
                  {validationErrors.enrollment_number && (
                    <p className="mt-1 text-sm text-red-400">{validationErrors.enrollment_number}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-300">
                    College *
                  </label>
                  <select
                    name="college_id"
                    value={formData.college_id}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full border border-purple-500/50 rounded-md px-3 py-2 focus:outline-none focus:ring-purple-500 focus:border-purple-500 bg-gray-800 text-white"
                  >
                    <option value="">Select College</option>
                    {colleges.map(college => (
                      <option key={college.id} value={college.id}>
                        {college.name}
                      </option>
                    ))}
                  </select>
                </div>

                                 <div>
                   <label className="block text-sm font-medium text-purple-300">
                     Field *
                   </label>
                   <select
                     name="field_id"
                     value={formData.field_id}
                     onChange={handleInputChange}
                     required
                     className="mt-1 block w-full border border-purple-500/50 rounded-md px-3 py-2 focus:outline-none focus:ring-purple-500 focus:border-purple-500 bg-gray-800 text-white"
                   >
                     <option value="">Select Field</option>
                     {fields.map(field => (
                       <option key={field.id} value={field.id}>
                         {field.name}
                       </option>
                     ))}
                   </select>
                 </div>

                <div>
                  <label className="block text-sm font-medium text-purple-300">
                    Semester *
                  </label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full border border-purple-500/50 rounded-md px-3 py-2 focus:outline-none focus:ring-purple-500 focus:border-purple-500 bg-gray-800 text-white"
                  >
                    <option value="">Select Semester</option>
                    {semesterOptions.map(semester => (
                      <option key={semester.value} value={semester.value}>
                        {semester.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-300">
                    Profile Photo
                  </label>
                  <div className="mt-1 flex items-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label
                      htmlFor="photo-upload"
                      className="cursor-pointer inline-flex items-center px-4 py-2 border border-purple-500/50 rounded-md shadow-sm text-sm font-medium text-purple-300 bg-gray-800 hover:bg-gray-700 transition-colors"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Photo
                    </label>
                  </div>
                  {formData.photo_url && (
                    <img
                      src={formData.photo_url}
                      alt="Profile Preview"
                      className="mt-2 h-20 w-20 object-cover rounded-md border border-purple-500/50"
                    />
                  )}
                </div>
              </div>

              {/* Events, Workshops and Combos Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Technical Events */}
                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2">
                    Technical Events ({formData.selected_tech_events.length} selected)
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-purple-500/50 rounded-md p-3 bg-gray-800/50">
                    {events.filter(e => e.category === 'tech').map(event => {
                      const isDisabled = isEventInSelectedCombo(event.id)
                      return (
                        <label key={event.id} className={`flex items-center space-x-3 py-2 rounded px-2 ${
                          isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700/50 cursor-pointer'
                        }`}>
                          <input
                            type="checkbox"
                            checked={formData.selected_tech_events.includes(event.id)}
                            onChange={(e) => handleEventChange(event.id, 'tech', e.target.checked)}
                            disabled={isDisabled}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                          {isDisabled && (
                            <span className="text-xs text-gray-400 ml-2">
                              (Part of selected combo)
                            </span>
                          )}
                          <div className="flex-1">
                            <span className="text-sm font-medium text-white">
                              {event.name}
                            </span>
                            <span className="text-sm text-purple-300 ml-2">
                              ₹{event.price || 0}
                            </span>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Non-Technical Events */}
                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2">
                    Non-Technical Events ({formData.selected_non_tech_events.length} selected)
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-purple-500/50 rounded-md p-3 bg-gray-800/50">
                    {events.filter(e => e.category === 'non-tech').map(event => {
                      const isDisabled = isEventInSelectedCombo(event.id)
                      return (
                        <label key={event.id} className={`flex items-center space-x-3 py-2 rounded px-2 ${
                          isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700/50 cursor-pointer'
                        }`}>
                          <input
                            type="checkbox"
                            checked={formData.selected_non_tech_events.includes(event.id)}
                            onChange={(e) => handleEventChange(event.id, 'non-tech', e.target.checked)}
                            disabled={isDisabled}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                          {isDisabled && (
                            <span className="text-xs text-gray-400 ml-2">
                              (Part of selected combo)
                            </span>
                          )}
                          <div className="flex-1">
                            <span className="text-sm font-medium text-white">
                              {event.name}
                            </span>
                            <span className="text-sm text-green-300 ml-2">
                              ₹{event.price || 0}
                            </span>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Workshops */}
                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2">
                    Workshops ({formData.selected_workshops.length} selected)
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-purple-500/50 rounded-md p-3 bg-gray-800/50">
                    {workshops.map(workshop => {
                      const isDisabled = isWorkshopInSelectedCombo(workshop.id)
                      return (
                        <label key={workshop.id} className={`flex items-center space-x-3 py-2 rounded px-2 ${
                          isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700/50 cursor-pointer'
                        }`}>
                          <input
                            type="checkbox"
                            checked={formData.selected_workshops.includes(workshop.id)}
                            onChange={(e) => handleWorkshopChange(workshop.id, e.target.checked)}
                            disabled={isDisabled}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          {isDisabled && (
                            <span className="text-xs text-gray-400 ml-2">
                              (Part of selected combo)
                            </span>
                          )}
                          <div className="flex-1">
                            <span className="text-sm font-medium text-white">
                              {workshop.title}
                            </span>
                            <span className="text-sm text-blue-300 ml-2">
                              ₹{workshop.fee || 0}
                            </span>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Combos */}
                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2">
                    Combos ({formData.selected_combos.length} selected)
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-purple-500/50 rounded-md p-3 bg-gray-800/50">
                    {combos.map(combo => (
                      <label key={combo.id} className="flex items-center space-x-3 py-2 hover:bg-gray-700/50 rounded px-2 cursor-pointer">
                        <input
                          type="radio"
                          name="combo"
                          checked={formData.selected_combos.includes(combo.id)}
                          onChange={(e) => handleComboChange(combo.id, e.target.checked)}
                          className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-white">
                            {combo.name}
                          </span>
                          <span className="text-sm text-orange-300 ml-2">
                            ₹{combo.price || 0}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Selection Summary */}
              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">
                  Selection Summary
                </label>
                <div className="p-3 bg-gray-800/50 rounded-md border border-purple-500/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-purple-300">Technical Events:</span>
                      <ul className="mt-1 space-y-1">
                        {formData.selected_tech_events.map(eventId => {
                          const event = events.find(e => e.id === eventId)
                          return event ? (
                            <li key={eventId} className="flex justify-between">
                              <span className="text-white">{event.name}</span>
                              <span className="font-medium text-purple-300">₹{event.price || 0}</span>
                            </li>
                          ) : null
                        })}
                      </ul>
                    </div>
                    <div>
                      <span className="font-medium text-green-300">Non-Technical Events:</span>
                      <ul className="mt-1 space-y-1">
                        {formData.selected_non_tech_events.map(eventId => {
                          const event = events.find(e => e.id === eventId)
                          return event ? (
                            <li key={eventId} className="flex justify-between">
                              <span className="text-white">{event.name}</span>
                              <span className="font-medium text-green-300">₹{event.price || 0}</span>
                            </li>
                          ) : null
                        })}
                      </ul>
                    </div>
                    <div>
                      <span className="font-medium text-blue-300">Workshops:</span>
                      <ul className="mt-1 space-y-1">
                        {formData.selected_workshops.map(workshopId => {
                          const workshop = workshops.find(w => w.id === workshopId)
                          return workshop ? (
                            <li key={workshopId} className="flex justify-between">
                              <span className="text-white">{workshop.title}</span>
                              <span className="font-medium text-blue-300">₹{workshop.fee || 0}</span>
                            </li>
                          ) : null
                        })}
                      </ul>
                    </div>
                    <div>
                      <span className="font-medium text-orange-300">Combos:</span>
                      <ul className="mt-1 space-y-1">
                        {formData.selected_combos.map(comboId => {
                          const combo = combos.find(c => c.id === comboId)
                          const comboDetails = getComboDetails(comboId)
                          return combo ? (
                            <li key={comboId} className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-white font-medium">{combo.name}</span>
                                <span className="font-medium text-orange-300">₹{combo.price || 0}</span>
                              </div>
                              {(comboDetails.events.length > 0 || comboDetails.workshops.length > 0) && (
                                <ul className="ml-4 space-y-1 text-xs">
                                  {comboDetails.events.map(event => (
                                    <li key={event.id} className="flex justify-between text-gray-300">
                                      <span>• {event.name}</span>
                                      <span className="text-gray-400">(included)</span>
                                    </li>
                                  ))}
                                  {comboDetails.workshops.map(workshop => (
                                    <li key={workshop.id} className="flex justify-between text-gray-300">
                                      <span>• {workshop.title}</span>
                                      <span className="text-gray-400">(included)</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          ) : null
                        })}
                      </ul>
                    </div>
                  </div>
                  <div className="border-t border-purple-500/50 pt-2 mt-2">
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-yellow-400">Total:</span>
                      <span className="text-yellow-400">₹{calculateTotalPrice().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-purple-300">
                    Transaction ID *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="transaction_id"
                      value={formData.transaction_id}
                      onChange={handleInputChange}
                      required
                      className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-purple-500 focus:border-purple-500 bg-gray-800 text-white placeholder-gray-400 ${
                        validationErrors.transaction_id ? 'border-red-500' : 'border-purple-500/50'
                      }`}
                    />
                    {isValidating.transaction_id && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                      </div>
                    )}
                    {validationErrors.transaction_id && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      </div>
                    )}
                  </div>
                  {validationErrors.transaction_id && (
                    <p className="mt-1 text-sm text-red-400">{validationErrors.transaction_id}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-300">
                    Amount Paid *
                  </label>
                  <input
                    type="number"
                    name="amount_paid"
                    value={formData.amount_paid}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full border border-purple-500/50 rounded-md px-3 py-2 focus:outline-none focus:ring-purple-500 focus:border-purple-500 bg-gray-800 text-white placeholder-gray-400"
                  />
                  <p className="mt-1 text-xs text-yellow-400">
                    Expected total: ₹{calculateTotalPrice().toFixed(2)}
                  </p>
                </div>
              </div>
            </form>
          </div>

          <div className="bg-gray-800/90 px-4 py-3 md:px-6 md:py-4 lg:px-8 sm:flex sm:flex-row-reverse border-t-2 border-purple-500/50 relative">
            {/* Footer Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-red-500/10"></div>
            
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={!isFormValid() || loading}
              className={`relative w-full inline-flex justify-center rounded-lg border border-transparent shadow-lg px-4 py-2 md:px-6 md:py-3 text-sm md:text-base font-bold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto transition-all transform hover:scale-105 ${
                isFormValid() && !loading
                  ? 'bg-gradient-to-r from-purple-600 via-red-600 to-purple-600 hover:from-purple-700 hover:via-red-700 hover:to-purple-700 focus:ring-purple-500 shadow-purple-500/50'
                  : 'bg-gray-600 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Submitting...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4" />
                  <span>Register Participant</span>
                </div>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-lg border-2 border-purple-500/50 shadow-sm px-4 py-2 md:px-6 md:py-3 bg-gray-800 text-sm md:text-base font-medium text-purple-300 hover:bg-gray-700 hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto transition-all transform hover:scale-105"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegistrationForm
