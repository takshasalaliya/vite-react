import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { uploadImage, validateImage } from '../utils/imageUpload'
import { sendRegistrationSuccessMessage } from '../lib/whatsappService'
import { X, Check, AlertCircle, Upload, Sparkles, TreePine, Zap, Eye, Ghost, Skull, Moon, Star } from 'lucide-react'
import QRCode from 'qrcode'

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
    payment_method: 'online', // 'online' or 'cash'
    transaction_id: '',
    amount_paid: '',
    pay_photo: ''
  })

  const [colleges, setColleges] = useState([])
  const [fields, setFields] = useState([])
  const [events, setEvents] = useState([])
  const [workshops, setWorkshops] = useState([])
  const [combos, setCombos] = useState([])
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadingPayPhoto, setUploadingPayPhoto] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [qrCodeDataURL, setQrCodeDataURL] = useState('')

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
    { value: '5', label: '5th Semester' }
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

  // Keep amount_paid in sync with current selections
  useEffect(() => {
    const total = calculateTotalPrice()
    setFormData(prev => ({ ...prev, amount_paid: total.toFixed(2) }))
  }, [formData.selected_tech_events, formData.selected_non_tech_events, formData.selected_workshops, formData.selected_combos, events, workshops, combos])

  // Generate dynamic UPI QR code
  const generateUPIQRCode = async () => {
    if (!formData.email || !formData.amount_paid) return

    try {
      // Build UPI string with safe handling for bank per-transaction limits
      const totalAmount = parseFloat(formData.amount_paid || '0')
      const SAFE_LIMIT = 2000 // INR
      const baseParams = `upi://pay?pa=henilpatel11.wallet@phonepe&pn=Peoni%20Beauty&cu=INR&tn=Event%20Registration%20-%20${encodeURIComponent(formData.email)}`
      const upiString = totalAmount > SAFE_LIMIT
        ? baseParams // omit amount to let the UPI app enter/split as needed
        : `${baseParams}&am=${totalAmount.toFixed(2)}`
      
      const qrDataURL = await QRCode.toDataURL(upiString, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      
      setQrCodeDataURL(qrDataURL)
    } catch (error) {
      console.error('Error generating QR code:', error)
    }
  }

  // Generate QR code when email or amount changes
  useEffect(() => {
    if (formData.payment_method === 'online' && formData.email && formData.amount_paid) {
      generateUPIQRCode()
    }
  }, [formData.email, formData.amount_paid, formData.payment_method])

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
        .select('*, combo_items(*), combo_exclusions:combo_exclusions(target_id)')
        .eq('is_active', true)
        .order('name')
      
      if (error) throw error
      // Normalize exclusions into array of ids per combo
      const withExclusions = (data || []).map(c => ({
        ...c,
        combo_exclusions: (c.combo_exclusions || []).map(e => e.target_id)
      }))
      setCombos(withExclusions)
    } catch (error) {
      console.error('Error fetching combos:', error)
    }
  }

  // Check if an event is part of any selected combo
  const getEventDisableReason = (eventId) => {
    for (const comboId of formData.selected_combos) {
      const combo = combos.find(c => c.id === comboId)
      if (!combo) continue
      if ((combo.combo_exclusions || []).includes(eventId)) return 'excluded'
      if (combo?.combo_items?.some(item => item.target_type === 'event' && item.target_id === eventId)) return 'included'
    }
    return null
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
    
    // Phone number validation - only allow numbers and limit to 10 digits
    if (name === 'phone') {
      // Remove any non-numeric characters
      const numericValue = value.replace(/\D/g, '')
      // Limit to 10 digits
      const limitedValue = numericValue.slice(0, 10)
      
      setFormData(prev => ({
        ...prev,
        [name]: limitedValue
      }))
      
      // Clear validation error if user is typing
      if (validationErrors.phone) {
        setValidationErrors(prev => ({
          ...prev,
          phone: ''
        }))
      }
      
      // Validate phone number format
      if (limitedValue.length > 0) {
        if (limitedValue.length < 10) {
          setValidationErrors(prev => ({
            ...prev,
            phone: 'Phone number must be exactly 10 digits'
          }))
        } else {
          // Only validate uniqueness if it's exactly 10 digits
          validatePhone(limitedValue)
        }
      }
      return
    }
    
    // Email validation - basic format check
    if (name === 'email') {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
      
      // Clear validation error if user is typing
      if (validationErrors.email) {
        setValidationErrors(prev => ({
          ...prev,
          email: ''
        }))
      }
      
      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (value && !emailRegex.test(value)) {
        setValidationErrors(prev => ({
          ...prev,
          email: 'Please enter a valid email address'
        }))
      } else if (value && emailRegex.test(value)) {
        // Only validate uniqueness if format is valid
        validateEmail(value)
      }
      return
    }
    
    // For other fields, update normally
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

    if (name === 'enrollment_number' && value) {
      validateEnrollmentNumber(value)
    } else if (name === 'transaction_id' && value) {
      validateTransactionId(value)
    }
  }

  const handlePaymentMethodChange = (method) => {
    setFormData(prev => {
      const newFormData = {
        ...prev,
        payment_method: method
      }
      
      if (method === 'cash') {
        // Auto-fill transaction_id and amount_paid for cash payment
        newFormData.transaction_id = 'CASH'
        newFormData.amount_paid = calculateTotalPrice().toFixed(2)
      } else {
        // Clear fields for online payment
        newFormData.transaction_id = ''
        newFormData.amount_paid = ''
      }
      
      return newFormData
    })
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

  // Handle combo selection with automatic event removal (single combo only)
  const handleComboChange = (comboId, checked) => {
    setFormData(prev => {
      const combo = combos.find(c => c.id === comboId)
      if (!combo) return prev

      let newFormData = { ...prev }
      
      if (checked) {
        // Allow only one combo at a time
        newFormData.selected_combos = [comboId]
        
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
        // Deselect all combos when unchecking
        newFormData.selected_combos = []
      }
      
      return newFormData
    })
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      setUploadingPhoto(true)
      
      // Validate the image file first
      validateImage(file)
      
      const photoUrl = await uploadImage(file)
      setFormData(prev => ({
        ...prev,
        photo_url: photoUrl
      }))
    } catch (error) {
      console.error('Error uploading photo:', error)
      alert(`Error uploading photo: ${error.message}`)
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handlePayPhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      setUploadingPayPhoto(true)
      setUploadProgress(0)
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + Math.random() * 15
        })
      }, 200)
      
      // Validate the image file first
      validateImage(file)
      
      const payPhotoUrl = await uploadImage(file)
      
      // Complete the progress
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      setFormData(prev => ({
        ...prev,
        pay_photo: payPhotoUrl
      }))

      // Reset progress after a short delay
      setTimeout(() => {
        setUploadProgress(0)
      }, 1000)
    } catch (error) {
      console.error('Error uploading payment photo:', error)
      alert(`Error uploading payment photo: ${error.message}`)
      setUploadProgress(0)
    } finally {
      setUploadingPayPhoto(false)
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

  const hasSelectedCombo = () => {
    return (formData.selected_combos?.length || 0) > 0
  }

  const isFormValid = () => {
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const isEmailValid = formData.email && emailRegex.test(formData.email)
    
    // Phone number validation (exactly 10 digits)
    const isPhoneValid = formData.phone && formData.phone.length === 10 && /^\d{10}$/.test(formData.phone)
    
    return (
      formData.name &&
      isEmailValid &&
      isPhoneValid &&
      formData.enrollment_number &&
      formData.college_id &&
      formData.field_id &&
      formData.semester &&
      formData.payment_method &&
      formData.transaction_id &&
      formData.amount_paid &&
      formData.pay_photo &&
      !validationErrors.email &&
      !validationErrors.phone &&
      !validationErrors.enrollment_number &&
      !validationErrors.transaction_id &&
      !isValidating.email &&
      !isValidating.phone &&
      !isValidating.enrollment_number &&
      !isValidating.transaction_id &&
      hasSelectedCombo()
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
          photo_url: formData.photo_url,
          pay_photo: formData.pay_photo
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

      // Send WhatsApp notification
      try {
        const whatsappResult = await sendRegistrationSuccessMessage({
          name: formData.name,
          phone: formData.phone,
          email: formData.email
        })
        
        if (whatsappResult.success) {
          console.log('WhatsApp notification sent successfully')
        } else {
          console.warn('WhatsApp notification failed:', whatsappResult.error)
        }
      } catch (whatsappError) {
        console.error('Error sending WhatsApp notification:', whatsappError)
        // Don't fail the registration if WhatsApp fails
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
        payment_method: 'online',
        transaction_id: '',
        amount_paid: '',
        pay_photo: ''
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
      <style dangerouslySetInnerHTML={{
        __html: `
          select option {
            background-color: #0B1536 !important;
            color: #F6F9FF !important;
          }
          select option:hover {
            background-color: #C96F63 !important;
          }
          select:focus option:checked {
            background-color: #C96F63 !important;
          }
          
          @keyframes fallingStar {
            0% {
              transform: translateY(-20px) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(100vh) rotate(360deg);
              opacity: 0;
            }
          }
          
          @keyframes sparkleBurst {
            0% {
              transform: scale(0) rotate(0deg);
              opacity: 0;
            }
            50% {
              transform: scale(1) rotate(180deg);
              opacity: 1;
            }
            100% {
              transform: scale(0) rotate(360deg);
              opacity: 0;
            }
          }
          
          @keyframes starRain {
            0% {
              transform: translateY(-10px);
              opacity: 0;
            }
            10% {
              opacity: 1;
            }
            90% {
              opacity: 1;
            }
            100% {
              transform: translateY(100vh);
              opacity: 0;
            }
          }
        `
      }} />
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* INNOSTRA Theme Background */}
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          {/* Starfield Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#07021A] via-[#0B1536] to-[#0B0412] opacity-95"></div>
          
          {/* Animated Starfield Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#07021A]/80 via-[#0B1536]/60 to-[#0B0412]/90"></div>
          
          {/* Nebula Effects */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-gradient-radial from-[#C96F63]/20 via-transparent to-transparent rounded-full animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-gradient-radial from-[#1E3A8A]/15 via-transparent to-transparent rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-0 w-48 h-48 bg-gradient-radial from-[#FFCC66]/10 via-transparent to-transparent rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
          
          {/* Floating Particles */}
          <div className="absolute top-20 left-20 w-2 h-2 bg-[#C96F63] rounded-full animate-ping opacity-60"></div>
          <div className="absolute top-40 right-32 w-1 h-1 bg-[#FFCC66] rounded-full animate-ping opacity-40" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute bottom-32 left-1/3 w-1.5 h-1.5 bg-[#1E3A8A] rounded-full animate-ping opacity-50" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-[#C96F63] rounded-full animate-ping opacity-30" style={{ animationDelay: '1.5s' }}></div>
          <div className="absolute bottom-20 right-20 w-2 h-2 bg-[#FFCC66] rounded-full animate-ping opacity-60" style={{ animationDelay: '2s' }}></div>
          </div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block align-bottom bg-gradient-to-br from-[#07021A] via-[#0B1536] to-[#0B0412] rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full w-full mx-4 border border-[#C96F63]/30 relative backdrop-blur-sm">
          {/* Glassmorphic Border Effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#C96F63]/10 via-transparent to-[#1E3A8A]/10 rounded-2xl"></div>
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-[#C96F63] via-[#FFCC66] to-[#1E3A8A]"></div>
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-[#1E3A8A] via-[#FFCC66] to-[#C96F63]"></div>
                    {/* INNOSTRA Success Animation Overlay */}
          {showSuccess && (
            <div className="absolute inset-0 bg-[#07021A]/95 flex items-center justify-center z-50 backdrop-blur-sm">
              {/* Star Rain Animation */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                  {/* Star Rain Layer 1 - Fast */}
                  <div className="absolute inset-0">
                    {[...Array(20)].map((_, i) => (
                      <div
                        key={`star1-${i}`}
                        className="absolute w-1 h-1 bg-[#C96F63] rounded-full"
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: '-10px',
                          animationDelay: `${Math.random() * 2}s`,
                          animationDuration: '1.5s',
                          animationIterationCount: 'infinite',
                          animationName: 'starRain'
                        }}
                      />
                    ))}
          </div>
                  
                  {/* Star Rain Layer 2 - Medium */}
                  <div className="absolute inset-0">
                    {[...Array(15)].map((_, i) => (
                      <div
                        key={`star2-${i}`}
                        className="absolute w-1.5 h-1.5 bg-[#FFCC66] rounded-full"
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: '-10px',
                          animationDelay: `${Math.random() * 3}s`,
                          animationDuration: '2s',
                          animationIterationCount: 'infinite',
                          animationName: 'starRain'
                        }}
                      />
                    ))}
          </div>
          
                  {/* Star Rain Layer 3 - Slow */}
                  <div className="absolute inset-0">
                    {[...Array(10)].map((_, i) => (
                      <div
                        key={`star3-${i}`}
                        className="absolute w-2 h-2 bg-[#1E3A8A] rounded-full"
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: '-10px',
                          animationDelay: `${Math.random() * 4}s`,
                          animationDuration: '2.5s',
                          animationIterationCount: 'infinite',
                          animationName: 'starRain'
                        }}
                      />
                    ))}
          </div>
                
                {/* Falling Stars with Trails */}
                <div className="absolute inset-0">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={`falling-${i}`}
                      className="absolute"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: '-20px',
                        animationDelay: `${Math.random() * 2}s`,
                        animationDuration: '3s',
                        animationIterationCount: 'infinite',
                        animationName: 'fallingStar'
                      }}
                    >
                      <div className="w-2 h-2 bg-[#C96F63] rounded-full shadow-lg shadow-[#C96F63]/50"></div>
                      <div className="w-1 h-8 bg-gradient-to-b from-[#C96F63] to-transparent ml-0.5"></div>
          </div>
                  ))}
          </div>
                
                {/* Sparkle Bursts */}
                <div className="absolute inset-0">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={`sparkle-${i}`}
                      className="absolute"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 3}s`,
                        animationDuration: '2s',
                        animationIterationCount: 'infinite',
                        animationName: 'sparkleBurst'
                      }}
                    >
                      <div className="w-3 h-3 bg-[#FFCC66] rounded-full animate-ping"></div>
                      <div className="absolute inset-0 w-6 h-6 border border-[#FFCC66]/30 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
          </div>
                  ))}
          </div>
        </div>
        
              <div className="text-center relative z-10">
                {/* Stellar Success Elements */}
                <div className="absolute inset-0 bg-gradient-radial from-[#C96F63]/20 via-transparent to-transparent rounded-full animate-pulse"></div>
                
                <div className="mb-8 relative z-10">
                  <div className="flex justify-center space-x-4 mb-6">
                    <div className="h-16 w-16 bg-gradient-to-br from-[#C96F63] to-[#C96F63]/80 rounded-full animate-bounce flex items-center justify-center">
                      <Star className="w-8 h-8 text-white" />
                    </div>
                    <div className="h-16 w-16 bg-gradient-to-br from-[#FFCC66] to-[#FFCC66]/80 rounded-full animate-bounce flex items-center justify-center" style={{ animationDelay: '0.3s' }}>
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <div className="h-16 w-16 bg-gradient-to-br from-[#1E3A8A] to-[#1E3A8A]/80 rounded-full animate-bounce flex items-center justify-center" style={{ animationDelay: '0.6s' }}>
                      <Zap className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
                
                <h3 className="text-4xl font-black text-[#F6F9FF] mb-4 animate-pulse relative z-10" style={{ 
                  textShadow: '0 0 30px rgba(255,255,255,0.8), 0 0 60px rgba(201, 111, 99, 0.6)'
                }}>
                  Welcome to INNOSTRA!
                </h3>
                <p className="text-[#F6F9FF]/80 text-xl mb-6 relative z-10">
                  Registration successful! You're now part of the galaxy of innovation
                </p>
                
                {/* Stellar Particle Effects */}
                <div className="mt-8 flex justify-center space-x-4 relative z-10">
                  <div className="w-4 h-4 bg-[#C96F63] rounded-full animate-ping"></div>
                  <div className="w-4 h-4 bg-[#FFCC66] rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-4 h-4 bg-[#1E3A8A] rounded-full animate-ping" style={{ animationDelay: '0.4s' }}></div>
                  <div className="w-4 h-4 bg-[#C96F63] rounded-full animate-ping" style={{ animationDelay: '0.6s' }}></div>
                  <div className="w-4 h-4 bg-[#FFCC66] rounded-full animate-ping" style={{ animationDelay: '0.8s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-[#07021A] via-[#0B1536] to-[#0B0412] px-4 pt-4 pb-3 md:px-6 md:pt-6 md:pb-4 lg:p-8 lg:pb-6 relative">
            {/* Header Background Effects */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-[#C96F63] via-[#FFCC66] to-[#1E3A8A]"></div>
            
            <div className="flex justify-between items-center mb-6 relative">
              <div className="flex items-center space-x-2 md:space-x-3">
                <div className="relative">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-[#C96F63] to-[#C96F63]/80 rounded-full flex items-center justify-center animate-pulse">
                    <Star className="w-4 h-4 md:w-6 md:h-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-[#FFCC66] rounded-full animate-ping"></div>
                </div>
                <div className="relative">
                  <h3 className="text-lg md:text-2xl font-bold text-[#F6F9FF]">
                    <span className="text-[#C96F63]">Register</span> Participant
                  </h3>
                  <p className="text-[#F6F9FF]/60 text-xs md:text-sm">Join the galaxy of innovation at INNOSTRA'25</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-[#F6F9FF]/60 hover:text-[#C96F63] transition-colors p-1 md:p-2 rounded-full hover:bg-[#C96F63]/20"
              >
                <X className="h-5 w-5 md:h-6 md:w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#F6F9FF]">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full border border-[#C96F63]/30 rounded-md px-3 py-2 focus:outline-none focus:ring-[#C96F63] focus:border-[#C96F63] bg-[#0B1536]/50 text-[#F6F9FF] placeholder-[#F6F9FF]/40 backdrop-blur-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#F6F9FF]">
                    Email *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter your email address"
                      className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-[#C96F63] focus:border-[#C96F63] bg-[#0B1536]/50 text-[#F6F9FF] placeholder-[#F6F9FF]/40 backdrop-blur-sm ${
                        validationErrors.email ? 'border-red-500' : 'border-[#C96F63]/30'
                      }`}
                    />
                    {isValidating.email && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#C96F63]"></div>
                      </div>
                    )}
                    {validationErrors.email && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      </div>
                    )}
                    {formData.email && !validationErrors.email && !isValidating.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <Check className="h-4 w-4 text-green-500" />
                      </div>
                    )}
                  </div>
                  {validationErrors.email && (
                    <p className="mt-1 text-sm text-red-400">{validationErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#F6F9FF]">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter 10-digit phone number"
                      maxLength="10"
                      className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-[#C96F63] focus:border-[#C96F63] bg-[#0B1536]/50 text-[#F6F9FF] placeholder-[#F6F9FF]/40 backdrop-blur-sm ${
                        validationErrors.phone ? 'border-red-500' : 'border-[#C96F63]/30'
                      }`}
                    />
                    {isValidating.phone && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#C96F63]"></div>
                      </div>
                    )}
                    {validationErrors.phone && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      </div>
                    )}
                    {formData.phone && formData.phone.length === 10 && !validationErrors.phone && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <Check className="h-4 w-4 text-green-500" />
                      </div>
                    )}
                  </div>
                  {validationErrors.phone && (
                    <p className="mt-1 text-sm text-red-400">{validationErrors.phone}</p>
                  )}
                  {formData.phone && formData.phone.length > 0 && formData.phone.length < 10 && (
                    <p className="mt-1 text-sm text-[#FFCC66]">
                      {10 - formData.phone.length} digits remaining
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#F6F9FF]">
                    Enrollment Number *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="enrollment_number"
                      value={formData.enrollment_number}
                      onChange={handleInputChange}
                      required
                      className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-[#C96F63] focus:border-[#C96F63] bg-[#0B1536]/50 text-[#F6F9FF] placeholder-[#F6F9FF]/40 backdrop-blur-sm ${
                        validationErrors.enrollment_number ? 'border-red-500' : 'border-[#C96F63]/30'
                      }`}
                    />
                    {isValidating.enrollment_number && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#C96F63]"></div>
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
                  <label className="block text-sm font-medium text-[#F6F9FF]">
                    College *
                  </label>
                  <select
                    name="college_id"
                    value={formData.college_id}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full border border-[#C96F63]/30 rounded-md px-3 py-2 focus:outline-none focus:ring-[#C96F63] focus:border-[#C96F63] bg-[#0B1536]/50 text-[#F6F9FF] backdrop-blur-sm"
                    style={{
                      colorScheme: 'dark'
                    }}
                  >
                    <option value="" className="bg-[#0B1536] text-[#F6F9FF]">Select College</option>
                    {colleges.map(college => (
                      <option key={college.id} value={college.id} className="bg-[#0B1536] text-[#F6F9FF]">
                        {college.name}
                      </option>
                    ))}
                  </select>
                </div>

                                <div>
                    <label className="block text-sm font-medium text-[#F6F9FF]">
                    Field *
                  </label>
                  <select
                    name="field_id"
                    value={formData.field_id}
                    onChange={handleInputChange}
                    required
                      className="mt-1 block w-full border border-[#C96F63]/30 rounded-md px-3 py-2 focus:outline-none focus:ring-[#C96F63] focus:border-[#C96F63] bg-[#0B1536]/50 text-[#F6F9FF] backdrop-blur-sm"
                      style={{
                        colorScheme: 'dark'
                      }}
                  >
                      <option value="" className="bg-[#0B1536] text-[#F6F9FF]">Select Field</option>
                    {fields.map(field => (
                        <option key={field.id} value={field.id} className="bg-[#0B1536] text-[#F6F9FF]">
                        {field.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#F6F9FF]">
                    Semester *
                  </label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full border border-[#C96F63]/30 rounded-md px-3 py-2 focus:outline-none focus:ring-[#C96F63] focus:border-[#C96F63] bg-[#0B1536]/50 text-[#F6F9FF] backdrop-blur-sm"
                    style={{
                      colorScheme: 'dark'
                    }}
                  >
                    <option value="" className="bg-[#0B1536] text-[#F6F9FF]">Select Semester</option>
                    {semesterOptions.map(semester => (
                      <option key={semester.value} value={semester.value} className="bg-[#0B1536] text-[#F6F9FF]">
                        {semester.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#F6F9FF]">
                  Upload ID Card OR Photo
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
                        className={`cursor-pointer inline-flex items-center px-4 py-2 border border-[#C96F63]/30 rounded-md shadow-sm text-sm font-medium text-[#F6F9FF] bg-[#0B1536]/50 hover:bg-[#0B1536]/70 transition-colors backdrop-blur-sm ${
                          uploadingPhoto ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                      {uploadingPhoto ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#C96F63] mr-2"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload ID Card OR Photo
                        </>
                      )}
                    </label>
                  </div>
                  {formData.photo_url && (
                    <img
                      src={formData.photo_url}
                      alt="Profile Preview"
                      className="mt-2 h-20 w-20 object-cover rounded-md border border-[#C96F63]/30"
                    />
                  )}
                </div>
              </div>

              {/* Events, Workshops and Combos Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Combos - First Priority */}
                <div>
                  <label className="block text-sm font-medium text-[#F6F9FF] mb-2">
                    Combos ({formData.selected_combos.length} selected)
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-[#C96F63]/30 rounded-md p-3 bg-[#0B1536]/30 backdrop-blur-sm">
                    {combos.map(combo => (
                                            <label key={combo.id} className="flex items-center space-x-3 py-2 hover:bg-[#0B1536]/50 rounded px-2 cursor-pointer">
                        <input
                          type="radio"
                          name="combo"
                          checked={formData.selected_combos[0] === combo.id}
                          onChange={(e) => handleComboChange(combo.id, e.target.checked)}
                          className="h-4 w-4 text-[#C96F63] focus:ring-[#C96F63] border-[#C96F63]/30"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-[#F6F9FF]">
                            {combo.name}
                          </span>
                          <span className="text-sm text-[#C96F63] ml-2">
                            ₹{combo.price || 0}
                          </span>
                          {combo.combo_items?.some(ci => ci.target_type === 'event' && ci.target_name?.toLowerCase().includes('food')) && (
                            <span className="ml-2 text-xs text-[#FFCC66]">Includes Food</span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Technical Events */}
                <div>
                  <label className="block text-sm font-medium text-[#F6F9FF] mb-2">
                    Technical Events ({formData.selected_tech_events.length} selected)
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-[#C96F63]/30 rounded-md p-3 bg-[#0B1536]/30 backdrop-blur-sm">
                    {events.filter(e => e.category === 'tech').map(event => {
                      const reason = getEventDisableReason(event.id)
                      const isDisabled = !!reason
                      return (
                        <label key={event.id} className={`flex items-center space-x-3 py-2 rounded px-2 ${
                          isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#0B1536]/50 cursor-pointer'
                        }`}>
                          <input
                            type="checkbox"
                            checked={formData.selected_tech_events.includes(event.id)}
                            onChange={(e) => handleEventChange(event.id, 'tech', e.target.checked)}
                            disabled={isDisabled}
                            className="h-4 w-4 text-[#C96F63] focus:ring-[#C96F63] border-[#C96F63]/30 rounded"
                          />
                          {reason === 'excluded' && (
                            <span className="text-xs text-[#F6F9FF]/60 ml-2">Game are no Avaliable in this combo</span>
                          )}
                          {reason === 'included' && (
                            <span className="text-xs text-[#F6F9FF]/60 ml-2">(Part of selected combo)</span>
                          )}
                          <div className="flex-1">
                            <span className="text-sm font-medium text-[#F6F9FF]">
                              {event.name}
                            </span>
                            <span className="text-sm text-[#C96F63] ml-2">
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
                  <label className="block text-sm font-medium text-[#F6F9FF] mb-2">
                    Non-Technical Events ({formData.selected_non_tech_events.length} selected)
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-[#FFCC66]/30 rounded-md p-3 bg-[#0B1536]/30 backdrop-blur-sm">
                    {events.filter(e => e.category === 'non-tech').map(event => {
                      const reason = getEventDisableReason(event.id)
                      const isDisabled = !!reason
                      return (
                        <label key={event.id} className={`flex items-center space-x-3 py-2 rounded px-2 ${
                          isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#0B1536]/50 cursor-pointer'
                        }`}>
                          <input
                            type="checkbox"
                            checked={formData.selected_non_tech_events.includes(event.id)}
                            onChange={(e) => handleEventChange(event.id, 'non-tech', e.target.checked)}
                            disabled={isDisabled}
                            className="h-4 w-4 text-[#FFCC66] focus:ring-[#FFCC66] border-[#FFCC66]/30 rounded"
                          />
                          {reason === 'excluded' && (
                            <span className="text-xs text-[#F6F9FF]/60 ml-2">Game are no Avaliable in this combo</span>
                          )}
                          {reason === 'included' && (
                            <span className="text-xs text-[#F6F9FF]/60 ml-2">(Part of selected combo)</span>
                          )}
                          <div className="flex-1">
                            <span className="text-sm font-medium text-[#F6F9FF]">
                              {event.name}
                            </span>
                            <span className="text-sm text-[#FFCC66] ml-2">
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
                  <label className="block text-sm font-medium text-[#F6F9FF] mb-2">
                    Workshops ({formData.selected_workshops.length} selected)
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-[#1E3A8A]/30 rounded-md p-3 bg-[#0B1536]/30 backdrop-blur-sm">
                    {workshops.map(workshop => {
                      const isDisabled = isWorkshopInSelectedCombo(workshop.id)
                      return (
                        <label key={workshop.id} className={`flex items-center space-x-3 py-2 rounded px-2 ${
                          isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#0B1536]/50 cursor-pointer'
                        }`}>
                          <input
                            type="checkbox"
                            checked={formData.selected_workshops.includes(workshop.id)}
                            onChange={(e) => handleWorkshopChange(workshop.id, e.target.checked)}
                            disabled={isDisabled}
                            className="h-4 w-4 text-[#1E3A8A] focus:ring-[#1E3A8A] border-[#1E3A8A]/30 rounded"
                          />
                          {isDisabled && (
                            <span className="text-xs text-[#F6F9FF]/60 ml-2">
                              (Part of selected combo)
                            </span>
                          )}
                          <div className="flex-1">
                            <span className="text-sm font-medium text-[#F6F9FF]">
                              {workshop.title}
                            </span>
                            <span className="text-sm text-[#1E3A8A] ml-2">
                              ₹{workshop.fee || 0}
                            </span>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Selection Summary */}
              <div>
                <label className="block text-sm font-medium text-[#F6F9FF] mb-2">
                  Selection Summary
                </label>
                {!hasSelectedCombo() && (
                  <p className="mb-2 text-sm text-red-400">Select at least one combo to continue.</p>
                )}
                <div className="p-3 bg-[#0B1536]/30 rounded-md border border-[#C96F63]/30 backdrop-blur-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-[#C96F63]">Combos:</span>
                      <ul className="mt-1 space-y-1">
                        {formData.selected_combos.map(comboId => {
                          const combo = combos.find(c => c.id === comboId)
                          const comboDetails = getComboDetails(comboId)
                          return combo ? (
                            <li key={comboId} className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-[#F6F9FF] font-medium">{combo.name}</span>
                                <span className="font-medium text-[#C96F63]">₹{combo.price || 0}</span>
                              </div>
                              {(comboDetails.events.length > 0 || comboDetails.workshops.length > 0) && (
                                <ul className="ml-4 space-y-1 text-xs">
                                  {comboDetails.events.map(event => (
                                    <li key={event.id} className="flex justify-between text-[#F6F9FF]/60">
                                      <span>• {event.name}</span>
                                      <span className="text-[#F6F9FF]/40">(included)</span>
                                    </li>
                                  ))}
                                  {comboDetails.workshops.map(workshop => (
                                    <li key={workshop.id} className="flex justify-between text-[#F6F9FF]/60">
                                      <span>• {workshop.title}</span>
                                      <span className="text-[#F6F9FF]/40">(included)</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          ) : null
                        })}
                      </ul>
                    </div>
                    <div>
                      <span className="font-medium text-[#C96F63]">Technical Events:</span>
                      <ul className="mt-1 space-y-1">
                        {formData.selected_tech_events.map(eventId => {
                          const event = events.find(e => e.id === eventId)
                          return event ? (
                            <li key={eventId} className="flex justify-between">
                              <span className="text-[#F6F9FF]">{event.name}</span>
                              <span className="font-medium text-[#C96F63]">₹{event.price || 0}</span>
                            </li>
                          ) : null
                        })}
                      </ul>
                    </div>
                    <div>
                      <span className="font-medium text-[#FFCC66]">Non-Technical Events:</span>
                      <ul className="mt-1 space-y-1">
                        {formData.selected_non_tech_events.map(eventId => {
                          const event = events.find(e => e.id === eventId)
                          return event ? (
                            <li key={eventId} className="flex justify-between">
                              <span className="text-[#F6F9FF]">{event.name}</span>
                              <span className="font-medium text-[#FFCC66]">₹{event.price || 0}</span>
                            </li>
                          ) : null
                        })}
                      </ul>
                    </div>
                    <div>
                      <span className="font-medium text-[#1E3A8A]">Workshops:</span>
                      <ul className="mt-1 space-y-1">
                        {formData.selected_workshops.map(workshopId => {
                          const workshop = workshops.find(w => w.id === workshopId)
                          return workshop ? (
                            <li key={workshopId} className="flex justify-between">
                              <span className="text-[#F6F9FF]">{workshop.title}</span>
                              <span className="font-medium text-[#1E3A8A]">₹{workshop.fee || 0}</span>
                            </li>
                          ) : null
                        })}
                      </ul>
                    </div>
                              </div>
                                    <div className="border-t border-[#C96F63]/30 pt-2 mt-2">
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-[#FFCC66]">Total:</span>
                      <span className="text-[#FFCC66]">₹{calculateTotalPrice().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="space-y-6">
                {/* Payment Method Selection */}
                <div>
                  <label className="block text-sm font-medium text-[#F6F9FF] mb-3">
                    Payment Method *
                  </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all ${
                      formData.payment_method === 'online' 
                        ? 'border-[#C96F63] bg-[#0B1536]/50' 
                        : 'border-[#C96F63]/30 bg-[#0B1536]/30'
                    } backdrop-blur-sm`}>
                      <input
                        type="radio"
                        name="payment_method"
                        value="online"
                        checked={formData.payment_method === 'online'}
                        onChange={() => handlePaymentMethodChange('online')}
                        className="sr-only"
                      />
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          formData.payment_method === 'online' 
                            ? 'border-[#C96F63] bg-[#C96F63]' 
                            : 'border-[#C96F63]/30'
                        }`}>
                          {formData.payment_method === 'online' && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                    </div>
                <div>
                          <div className="font-medium text-[#F6F9FF]">Online Payment</div>
                          <div className="text-sm text-[#F6F9FF]/60">Pay via UPI/Net Banking</div>
                  </div>
                    </div>
                    </label>

                  </div>
                </div>

                {/* QR Code for Online Payment */}
                {formData.payment_method === 'online' && (
                  <div className="bg-[#0B1536]/30 rounded-lg border border-[#C96F63]/30 p-6 backdrop-blur-sm">
                    <div className="text-center">
                      <h4 className="text-lg font-medium text-[#F6F9FF] mb-3">Scan QR Code On Desk to Pay</h4>
                      <p className="text-sm text-[#F6F9FF]/60 mb-4">
                        Amount: ₹{calculateTotalPrice().toFixed(2)}
                      </p>
                      <div className="flex justify-center">
                       
                      </div>
                      <p className="text-xs text-[#F6F9FF]/60 mt-3">
                        After payment, enter the transaction ID or Phone Number(IF Cash) below
                      </p>
                      {formData.email && (
                        <p className="text-xs text-[#F6F9FF]/40 mt-2">
                          Note: Payment includes your email for verification
                        </p>
                      )}
                      
                    </div>
                  </div>
                )}

                {/* Transaction Details */}
                <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-[#F6F9FF]">
                    Transaction ID / IF Cash Then Phone Number *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="transaction_id"
                      value={formData.transaction_id}
                      onChange={handleInputChange}
                      required
                        className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-[#C96F63] focus:border-[#C96F63] bg-[#0B1536]/50 text-[#F6F9FF] placeholder-[#F6F9FF]/40 backdrop-blur-sm ${
                          validationErrors.transaction_id ? 'border-red-500' : 'border-[#C96F63]/30'
                      }`}
                    />
                    {isValidating.transaction_id && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#C96F63]"></div>
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
                    <label className="block text-sm font-medium text-[#F6F9FF]">
                    Amount Paid *
                  </label>
                  <input
                    type="number"
                    name="amount_paid"
                    value={calculateTotalPrice().toFixed(2)}
                    onChange={handleInputChange}
                    required
                    disabled
                    className="mt-1 block w-full border border-[#C96F63]/30 rounded-md px-3 py-2 focus:outline-none bg-[#0B1536]/50 text-[#F6F9FF] placeholder-[#F6F9FF]/40 backdrop-blur-sm"
                  />
                  <p className="mt-1 text-xs text-[#FFCC66]">
                    Expected total: ₹{calculateTotalPrice().toFixed(2)}
                  </p>
                </div>

                {/* Payment Photo Upload */}
                <div>
                  <label className="block text-sm font-medium text-[#F6F9FF]">
                    Payment Screenshot/Receipt *
                  </label>
                  <div className="mt-1 flex items-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePayPhotoUpload}
                      className="hidden"
                      id="pay-photo-upload"
                    />
                    <label
                      htmlFor="pay-photo-upload"
                      className={`cursor-pointer inline-flex items-center px-4 py-2 border border-[#C96F63]/30 rounded-md shadow-sm text-sm font-medium text-[#F6F9FF] bg-[#0B1536]/50 hover:bg-[#0B1536]/70 transition-colors backdrop-blur-sm ${
                        uploadingPayPhoto ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {uploadingPayPhoto ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#C96F63]"></div>
                          <span>Uploading... {Math.round(uploadProgress)}%</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Upload className="h-4 w-4" />
                          <span>Upload Payment Screenshot</span>
                        </div>
                      )}
                    </label>
                    {uploadingPayPhoto && (
                      <div className="ml-3 w-32">
                        <div className="w-full bg-[#0B1536]/30 rounded-full h-2">
                          <div 
                            className="bg-[#C96F63] h-2 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    {formData.pay_photo && !uploadingPayPhoto && (
                      <div className="ml-3 flex items-center space-x-2">
                        <Check className="h-4 w-4 text-green-400" />
                        <span className="text-sm text-green-400">Payment photo uploaded</span>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, pay_photo: '' }))}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[#F6F9FF]/60">
                    Upload a screenshot or photo of your payment confirmation
                  </p>
                </div>
                </div>
                </div>
              </div>
            </form>
          </div>

                    <div className="bg-[#0B1536]/90 px-4 py-3 md:px-6 md:py-4 lg:px-8 sm:flex sm:flex-row-reverse border-t border-[#C96F63]/30 relative backdrop-blur-sm">
            {/* Footer Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#C96F63]/10 via-transparent to-[#1E3A8A]/10"></div>
            
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={!isFormValid() || loading}
              className={`relative w-full inline-flex justify-center rounded-lg border border-transparent shadow-lg px-4 py-2 md:px-6 md:py-3 text-sm md:text-base font-bold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto transition-all transform hover:scale-105 ${
                isFormValid() && !loading
                  ? 'bg-gradient-to-r from-[#C96F63] via-[#FFCC66] to-[#1E3A8A] hover:from-[#C96F63]/90 hover:via-[#FFCC66]/90 hover:to-[#1E3A8A]/90 focus:ring-[#C96F63] shadow-[#C96F63]/50'
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
              className="mt-3 w-full inline-flex justify-center rounded-lg border-2 border-[#C96F63]/30 shadow-sm px-4 py-2 md:px-6 md:py-3 bg-[#0B1536]/50 text-sm md:text-base font-medium text-[#F6F9FF] hover:bg-[#0B1536]/70 hover:border-[#C96F63]/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C96F63] sm:mt-0 sm:ml-3 sm:w-auto transition-all transform hover:scale-105 backdrop-blur-sm"
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
