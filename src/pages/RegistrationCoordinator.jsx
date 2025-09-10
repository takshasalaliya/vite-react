import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { 
  Search, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Users,
  Calendar,
  DollarSign,
  Eye,
  UserPlus,
  Download,
  QrCode,
  Filter,
  RefreshCw
} from 'lucide-react'
import { uploadImage } from '../utils/imageUpload'
import { sendAttendanceConfirmationMessage } from '../lib/whatsappService'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { Html5QrcodeScanType } from 'html5-qrcode'

const RegistrationCoordinator = () => {
  // State variables
  const { isScannerCommittee } = useAuth()
  const [users, setUsers] = useState([])
  const [events, setEvents] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [scanners, setScanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('users')
  const [showUserModal, setShowUserModal] = useState(false)
  const [showScannerModal, setShowScannerModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [editingScanner, setEditingScanner] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [colleges, setColleges] = useState([])
  const [fields, setFields] = useState([])
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [collegeFilter, setCollegeFilter] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('')
  const [fieldFilter, setFieldFilter] = useState('')
  const [workshops, setWorkshops] = useState([]);
  const [combos, setCombos] = useState([]);

  // Scanner view state (for scanner_committee role)
  const [scannerSelectedTargets, setScannerSelectedTargets] = useState([]) // [{id, type}]
  const [scannerAttendanceLogs, setScannerAttendanceLogs] = useState([])
  
  // QR Scanner state
  const [scanning, setScanning] = useState(false)
  const [processingScan, setProcessingScan] = useState(false)
  const [showScanModal, setShowScanModal] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const qrScannerRef = useRef(null)
  const [lastAttendanceTime, setLastAttendanceTime] = useState(null)
  
  // Single target selection for scanner (only one event/workshop at a time)
  const [selectedTarget, setSelectedTarget] = useState(null) // {id, type, name}
  
  // Form data
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    phone: '',
    enrollment_number: '',
    college_id: '',
    semester: '',
    field_id: '',
    role: 'participant',
    photo_url: '',
    selected_tech_events: [],
    selected_non_tech_events: [],
    selected_workshops: [],
    selected_combos: [],
    transaction_id: '',
    amount_paid: ''
  })
  
  const [scannerFormData, setScannerFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'scanner_committee',
    college_id: '',
    semester: '',
    roll_number: '',
    photo_url: '',
    photo_file: null
  })

  // Fetch data on component mount
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        await Promise.all([
          fetchUsers(),
          fetchEvents(),
          fetchColleges(),
          fetchFields(),
          fetchScanners(),
          fetchWorkshops(),
    fetchCombos()
        ]);
        // preload live list if scanner tab is default
        if (activeTab === 'attendance') {
          await refreshScannerParticipants()
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };
    
    fetchAllData();
  }, [searchTerm, paymentFilter])

  // Handle URL-based navigation
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/users')) {
      setActiveTab('users');
    } else if (path.includes('/events')) {
      setActiveTab('events');
    } else if (path.includes('/attendance')) {
      setActiveTab('attendance');
      // when navigating to attendance, refresh live list
      setTimeout(() => {
        refreshScannerParticipants()
      }, 0)
    }
  }, [window.location.pathname]);

  // Real-time subscription for attendance updates
  useEffect(() => {
    if (activeTab === 'attendance' && selectedTarget) {
      const subscription = supabase
        .channel('attendance_updates')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'attendance' 
          }, 
          (payload) => {
            console.log('Attendance update received:', payload);
            // Refresh the participants list when attendance changes
            refreshScannerParticipants();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [activeTab, selectedTarget]);

  // Debug selected target changes
  useEffect(() => {
    console.log('Selected target changed:', selectedTarget)
  }, [selectedTarget])

  // Fetch users with registrations
  const fetchUsers = async () => {
    try {
      setLoading(true)
      console.log('RegistrationCoordinator: Fetching users...')
      
      // Reduce payload size and avoid N+1 queries to prevent timeouts
      let query = supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          pay_photo,
          phone,
          enrollment_number,
          college_id,
          field_id,
          semester,
          created_at,
          registrations(
            id,
            target_type,
            target_id,
            payment_status,
            transaction_id,
            amount_paid,
            created_at
          )
        `)
        .eq('role', 'participant')
        .order('created_at', { ascending: false })
        .limit(500)

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,enrollment_number.ilike.%${searchTerm}%`)
      }

      const { data, error } = await query
      
      if (error) {
        console.error('Error fetching users:', error)
        return
      }
      
      // Already have registrations from the nested select; no per-user fetch needed
      console.log('RegistrationCoordinator: Users fetched:', (data || []).length)
      setUsers(data || [])
    } catch (error) {
      console.error('Error in fetchUsers:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch events
  const fetchEvents = async () => {
    try {
      console.log('RegistrationCoordinator: Fetching events...');
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (eventsError) {
        console.error('Error fetching events:', eventsError);
        return;
      }

      if (!eventsData || eventsData.length === 0) {
        console.log('RegistrationCoordinator: No events found.');
        setEvents([]);
        return;
      }

      const eventIds = eventsData.map((e) => e.id);

      const { data: registrationsData, error: registrationsError } = await supabase
        .from('registrations')
        .select('*')
        .in('target_id', eventIds)
        .eq('target_type', 'event');

      if (registrationsError) {
        console.error('Error fetching event registrations:', registrationsError);
        const eventsWithEmptyRegistrations = eventsData.map(event => ({
          ...event,
          registrations: [],
        }));
        setEvents(eventsWithEmptyRegistrations);
        return;
      }

      const eventsWithRegistrations = eventsData.map(event => ({
        ...event,
        registrations: registrationsData.filter(r => r.target_id === event.id),
      }));

      console.log('RegistrationCoordinator: Events fetched:', eventsWithRegistrations.length);
      setEvents(eventsWithRegistrations);
    } catch (error) {
      console.error('Error in fetchEvents:', error);
    }
  };

  // Fetch colleges for dropdown
  const fetchColleges = async () => {
    try {
      const { data, error } = await supabase
        .from('colleges')
        .select('id, name')
        .order('name')
      
      if (error) {
        console.error('Error fetching colleges:', error)
        return
      }
      
      setColleges(data)
    } catch (error) {
      console.error('Error in fetchColleges:', error)
    }
  }

  // Fetch fields for dropdown
  const fetchFields = async () => {
    try {
      const { data, error } = await supabase
        .from('fields')
        .select('id, name')
        .order('name')
      
      if (error) {
        console.error('Error fetching fields:', error)
        return
      }
      
      setFields(data)
    } catch (error) {
      console.error('Error in fetchFields:', error)
    }
  }

  // Fetch scanner committee members
  const fetchScanners = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'scanner_committee')
        .order('name')
      
      if (error) {
        console.error('Error fetching scanners:', error)
        return
      }
      
      setScanners(data)
    } catch (error) {
      console.error('Error in fetchScanners:', error)
    }
  }

  const fetchWorkshops = async () => {
    try {
      console.log('RegistrationCoordinator: Starting to fetch workshops...');
      const { data, error } = await supabase
        .from('workshops')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching workshops:', error);
        return;
      }

      if (!data || data.length === 0) {
        console.log('RegistrationCoordinator: No workshops found.');
        setWorkshops([]);
        return;
      }

      const workshopIds = data.map((w) => w.id);

      const { data: registrationsData, error: registrationsError } = await supabase
        .from('registrations')
        .select('*')
        .in('target_id', workshopIds)
        .eq('target_type', 'workshop');

      if (registrationsError) {
        console.error('Error fetching workshop registrations:', registrationsError);
        const workshopsWithEmptyRegistrations = data.map(workshop => ({
          ...workshop,
          registrations: [],
        }));
        setWorkshops(workshopsWithEmptyRegistrations);
        return;
      }

      const workshopsWithRegistrations = data.map(workshop => ({
        ...workshop,
        registrations: registrationsData.filter(r => r.target_id === workshop.id),
      }));
      
      console.log('RegistrationCoordinator: Workshops fetched:', workshopsWithRegistrations.length);
      console.log('RegistrationCoordinator: Workshops data:', workshopsWithRegistrations);
      setWorkshops(workshopsWithRegistrations);
    } catch (error) {
      console.error('Error in fetchWorkshops:', error);
    }
  };

  // Refresh live list for scanner panel
  const refreshScannerParticipants = async () => {
    try {
      if (!selectedTarget) {
        setScannerAttendanceLogs([])
        return
      }

      // Live Participants (recent scans): read attendance directly for selected target
      const { data: logs, error } = await supabase
        .from('attendance')
        .select('user_id, target_id, target_type, scan_time, users(name,email,phone)')
        .eq('target_id', selectedTarget.id)
        .eq('target_type', selectedTarget.type)
        .order('scan_time', { ascending: false })
        .limit(100)

      if (error) throw error

      const results = (logs || []).map(a => ({
        user_id: a.user_id,
        target_id: a.target_id,
        target_type: a.target_type,
        name: a.users?.name || 'User',
        email: a.users?.email || '',
        phone: a.users?.phone || '',
        attended: true,
        time: new Date(a.scan_time).toLocaleString(),
        targetName: selectedTarget?.name || (selectedTarget?.type === 'event' ? 'Event' : 'Workshop')
      }))

      setScannerAttendanceLogs(results)
    } catch (e) {
      console.error('Error refreshing scanner participants:', e)
    }
  }

  // QR Code Scanner Functions
  const startScanning = () => {
    if (!selectedTarget) {
      alert('Please select one target (event/workshop) to scan for')
      return
    }

    console.log('Starting scanner with target:', selectedTarget)
    setShowScanModal(true)
    setScanning(true)

    // Initialize QR scanner after modal is rendered
    setTimeout(() => {
      try {
        // Clear any existing scanner
        if (qrScannerRef.current) {
          qrScannerRef.current.clear()
        }
        
        // Create new scanner instance with proper camera permissions
        qrScannerRef.current = new Html5QrcodeScanner(
          "qr-reader",
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
          },
          false
        )
        
        console.log('QR Scanner initialized, rendering...')
        qrScannerRef.current.render(onScanSuccess, onScanFailure)
        
        // Force camera permission request
        setTimeout(() => {
          const videoElement = document.querySelector('#qr-reader video')
          if (videoElement) {
            videoElement.play().catch(error => {
              console.error('Camera permission error:', error)
              setScanResult({
                success: false,
                message: 'Camera permission denied. Please allow camera access and try again.'
              })
            })
          }
        }, 1000)
        
      } catch (error) {
        console.error('Error initializing QR scanner:', error)
        setScanResult({
          success: false,
          message: 'Failed to initialize camera: ' + error.message
        })
      }
    }, 500) // Increased timeout to ensure modal is fully rendered
  }

  const stopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.clear()
      qrScannerRef.current = null
    }
    setScanning(false)
    setShowScanModal(false)
    setScanResult(null)
  }

  const onScanSuccess = async (decodedText, decodedResult) => {
    console.log('QR Code scanned:', decodedText)
    console.log('Current scanning state:', { scanning, processingScan })
    
    // Prevent multiple simultaneous scans - only check processingScan, not scanning
    if (processingScan) {
      console.log('Scan blocked - already processing')
      return
    }
    
    // Set processing state to prevent multiple scans
    setProcessingScan(true)
    setScanning(false)
    console.log('Processing scan started')
    
    try {
      // Check for 20-second cooldown after last attendance
      if (lastAttendanceTime) {
        const timeSinceLastAttendance = Date.now() - lastAttendanceTime
        if (timeSinceLastAttendance < 20000) { // 20 seconds = 20000ms
          const remainingTime = Math.ceil((20000 - timeSinceLastAttendance) / 1000)
          setScanResult({
            success: false,
            message: `Please wait ${remainingTime} seconds before scanning next attendance`
          })
          setProcessingScan(false)
          setScanning(true)
          return
        }
      }
      
      // Parse QR code data
      let qrData
      try {
        qrData = JSON.parse(decodedText)
      } catch {
        qrData = { user_id: decodedText }
      }

      const userId = qrData.user_id || qrData.userId
      console.log('Parsed user ID:', userId)
      if (!userId) {
        throw new Error('Invalid QR code format')
      }

      console.log('Selected target:', selectedTarget)
      
      // Check if user has approved registration for selected target (direct)
      const { data: directRegs, error: directErr } = await supabase
        .from('registrations')
        .select('id')
        .eq('user_id', userId)
        .eq('target_id', selectedTarget.id)
        .eq('target_type', selectedTarget.type)
        .eq('payment_status', 'approved')
      if (directErr) throw directErr

      console.log('Direct registrations found:', directRegs)
      let isApprovedForTarget = (directRegs && directRegs.length > 0)

      // If no direct approval, check if user has an approved combo that includes this target
      if (!isApprovedForTarget) {
        const { data: items, error: itemsErr } = await supabase
          .from('combo_items')
          .select('combo_id')
          .eq('target_type', selectedTarget.type)
          .eq('target_id', selectedTarget.id)
        if (itemsErr) throw itemsErr

        const comboIds = Array.from(new Set((items || []).map(i => i.combo_id)))
        if (comboIds.length > 0) {
          const { data: comboRegs, error: comboErr } = await supabase
            .from('registrations')
            .select('id')
            .eq('user_id', userId)
            .eq('target_type', 'combo')
            .in('target_id', comboIds)
            .eq('payment_status', 'approved')
          if (comboErr) throw comboErr
          isApprovedForTarget = (comboRegs && comboRegs.length > 0)
        }
      }

      console.log('User approved for target:', isApprovedForTarget)
      
      if (!isApprovedForTarget) {
        console.log('User not approved for target')
        setScanResult({
          success: false,
          message: 'User not registered for selected target or payment not approved'
        })
        setProcessingScan(false)
        setScanning(true)
        return
      }

      // Check if already attended (with double-check to prevent race conditions)
      const { data: existingAttendance } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', userId)
        .eq('target_id', selectedTarget.id)
        .eq('target_type', selectedTarget.type)

      console.log('Existing attendance check:', existingAttendance)

      if (existingAttendance && existingAttendance.length > 0) {
        console.log('User already attended')
        setScanResult({
          success: false,
          message: 'User already attended this target'
        })
        setProcessingScan(false)
        setScanning(true)
        return
      }

      // Get current user for scanned_by
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      const currentUserId = currentUser?.id

      // Record attendance for selected target with duplicate prevention
      const attendanceRecord = {
        user_id: userId,
        target_type: selectedTarget.type,
        target_id: selectedTarget.id,
        scanned_by: currentUserId,
        scan_time: new Date().toISOString()
      }

      console.log('Inserting attendance record:', attendanceRecord)

      const { error: attendanceError } = await supabase
        .from('attendance')
        .insert([attendanceRecord])

      if (attendanceError) {
        console.error('Attendance insertion error:', attendanceError)
        // Handle duplicate key error (unique constraint violation)
        if (attendanceError.code === '23505') {
          setScanResult({
            success: false,
            message: 'User already attended this target'
          })
          setProcessingScan(false)
          setScanning(true)
          return
        }
        throw attendanceError
      }

      console.log('Attendance recorded successfully!')
      
      // Set the last attendance time for cooldown
      setLastAttendanceTime(Date.now())

      // Get user details for success message
      const { data: userData } = await supabase
        .from('users')
        .select('name, email, phone')
        .eq('id', userId)
        .single()

      setScanResult({
        success: true,
        message: 'Attendance recorded successfully',
        user: userData?.name || 'User'
      })

      // Send WhatsApp attendance confirmation
      if (userData?.phone) {
        try {
          const whatsappResult = await sendAttendanceConfirmationMessage(
            {
              name: userData.name,
              phone: userData.phone
            },
            {
              eventName: selectedTarget.name,
              timestamp: new Date().toISOString()
            }
          )
          
          if (whatsappResult.success) {
            console.log('WhatsApp attendance confirmation sent successfully')
          } else {
            console.warn('WhatsApp attendance confirmation failed:', whatsappResult.error)
          }
        } catch (whatsappError) {
          console.error('Error sending WhatsApp attendance confirmation:', whatsappError)
          // Don't fail the attendance if WhatsApp fails
        }
      }

      // Refresh the participants list
      await refreshScannerParticipants()

      // Keep scanner open for multiple scans; briefly show success then resume
      // Add 2-second cooldown after scanning to prevent rapid successive scans
      setTimeout(() => {
        setScanResult(null)
        setProcessingScan(false)
        setScanning(true)
      }, 2000) // Increased from 1500ms to 2000ms for 2-second cooldown

    } catch (error) {
      console.error('Error processing scan:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      setScanResult({
        success: false,
        message: 'Error processing scan: ' + error.message
      })
      
      // Add 2-second cooldown after error to prevent rapid successive scans
      setTimeout(() => {
        setScanResult(null)
        setProcessingScan(false)
        setScanning(true)
      }, 2000)
    }
  }

  const onScanFailure = (error) => {
    // Handle scan failure silently
    console.log('QR scan failed:', error)
  }

  const fetchCombos = async () => {
    try {
      const { data, error } = await supabase
        .from('combos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching combos:', error);
        return;
      }

      // Fetch combo items for each combo
      const combosWithDetails = await Promise.all(
        (data || []).map(async (combo) => {
          try {
            const { data: comboItems } = await supabase
              .from('combo_items')
              .select('*')
              .eq('combo_id', combo.id)
              .order('position');

            // Fetch event/workshop details for each combo item
            const itemsWithDetails = await Promise.all(
              (comboItems || []).map(async (item) => {
                if (item.target_type === 'event') {
                  const { data: eventData } = await supabase
                    .from('events')
                    .select('id, name, price, category')
                    .eq('id', item.target_id)
                    .single();
                  return { ...item, event: eventData };
                } else if (item.target_type === 'workshop') {
                  const { data: workshopData } = await supabase
                    .from('workshops')
                    .select('id, title, fee')
                    .eq('id', item.target_id)
                    .single();
                  return { ...item, workshop: workshopData };
                }
                return item;
              })
            );

            return {
              ...combo,
              combo_items: itemsWithDetails
            };
          } catch (error) {
            console.error('Error fetching combo details:', error);
            return { ...combo, combo_items: [] };
          }
        })
      );

      setCombos(combosWithDetails);
    } catch (error) {
      console.error('Error in fetchCombos:', error);
    }
  };

  // Calculate total price for selected items
  const calculateTotalPrice = () => {
    let total = 0;
    
    // Get all combo items to avoid double-counting
    const comboItemIds = new Set();
    userFormData.selected_combos.forEach(comboId => {
      const combo = combos.find(c => c.id === comboId);
      if (combo && combo.combo_items) {
        combo.combo_items.forEach(item => {
          comboItemIds.add(item.target_id);
        });
      }
    });
    
    // Add prices for selected tech events (only if not part of selected combos)
    userFormData.selected_tech_events.forEach(eventId => {
      if (!comboItemIds.has(eventId)) {
        const event = events.find(e => e.id === eventId);
        if (event) total += event.price || 0;
      }
    });
    
    // Add prices for selected non-tech events (only if not part of selected combos)
    userFormData.selected_non_tech_events.forEach(eventId => {
      if (!comboItemIds.has(eventId)) {
        const event = events.find(e => e.id === eventId);
        if (event) total += event.price || 0;
      }
    });
    
    // Add prices for selected workshops (only if not part of selected combos)
    userFormData.selected_workshops.forEach(workshopId => {
      if (!comboItemIds.has(workshopId)) {
        const workshop = workshops.find(w => w.id === workshopId);
        if (workshop) total += workshop.fee || 0;
      }
    });
    
    // Add prices for selected combos
    userFormData.selected_combos.forEach(comboId => {
      const combo = combos.find(c => c.id === comboId);
      if (combo) total += combo.price || 0;
    });
    
    return total;
  };

  // Handle combo selection and show combo details
  const handleComboSelection = (comboId) => {
    const combo = combos.find(c => c.id === comboId);
    if (combo) {
      console.log('Selected combo:', combo.name);
      console.log('Combo items:', combo.combo_items);
    }
  };

  // State for validation
  const [validationErrors, setValidationErrors] = useState({
    email: '',
    phone: '',
    transaction_id: ''
  });
  const [isValidating, setIsValidating] = useState({
    email: false,
    phone: false,
    transaction_id: false
  });

  // Handle user form input changes
  const handleUserFormChange = (e) => {
    const { name, value } = e.target
    
    setUserFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Real-time validation for email, phone, and transaction_id
    if (name === 'email' && value) {
      validateEmail(value);
    } else if (name === 'phone' && value) {
      validatePhone(value);
    } else if (name === 'transaction_id' && value) {
      validateTransactionId(value);
    }
  }

  // Handle checkbox changes for events
  const handleCheckboxChange = (fieldName, itemId, checked) => {
    setUserFormData(prev => {
      const currentArray = prev[fieldName] || [];
      let newArray;
      
      if (checked) {
        newArray = [...currentArray, itemId];
      } else {
        newArray = currentArray.filter(id => id !== itemId);
      }
      
      return {
        ...prev,
        [fieldName]: newArray
      };
    });
  }

  // Handle combo selection with automatic event removal
  const handleComboCheckboxChange = (comboId, checked) => {
    setUserFormData(prev => {
      const combo = combos.find(c => c.id === comboId);
      if (!combo) return prev;

      let newFormData = { ...prev };
      
      if (checked) {
        // Add combo to selected combos
        newFormData.selected_combos = [...prev.selected_combos, comboId];
        
        // Remove individual events that are part of this combo
        const eventsToRemove = [];
        const workshopsToRemove = [];
        
        combo.combo_items?.forEach(item => {
          if (item.target_type === 'event') {
            eventsToRemove.push(item.target_id);
          } else if (item.target_type === 'workshop') {
            workshopsToRemove.push(item.target_id);
          }
        });
        
        // Remove from tech events
        newFormData.selected_tech_events = prev.selected_tech_events.filter(
          eventId => !eventsToRemove.includes(eventId)
        );
        
        // Remove from non-tech events
        newFormData.selected_non_tech_events = prev.selected_non_tech_events.filter(
          eventId => !eventsToRemove.includes(eventId)
        );
        
        // Remove from workshops
        newFormData.selected_workshops = prev.selected_workshops.filter(
          workshopId => !workshopsToRemove.includes(workshopId)
        );
        
      } else {
        // Remove combo from selected combos
        newFormData.selected_combos = prev.selected_combos.filter(id => id !== comboId);
      }
      
      return newFormData;
    });
  }

  // Check if an event is part of any selected combo
  const isEventInSelectedCombo = (eventId) => {
    return userFormData.selected_combos.some(comboId => {
      const combo = combos.find(c => c.id === comboId);
      return combo?.combo_items?.some(item => 
        item.target_type === 'event' && item.target_id === eventId
      );
    });
  }

  // Check if a workshop is part of any selected combo
  const isWorkshopInSelectedCombo = (workshopId) => {
    return userFormData.selected_combos.some(comboId => {
      const combo = combos.find(c => c.id === comboId);
      return combo?.combo_items?.some(item => 
        item.target_type === 'workshop' && item.target_id === workshopId
      );
    });
  }

  // Validate email uniqueness
  const validateEmail = async (email) => {
    if (!email) return;
    
    setIsValidating(prev => ({ ...prev, email: true }));
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', email)
        .neq('id', editingUser?.id || '00000000-0000-0000-0000-000000000000'); // Exclude current user if editing
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setValidationErrors(prev => ({
          ...prev,
          email: 'This email is already registered'
        }));
      } else {
        setValidationErrors(prev => ({
          ...prev,
          email: ''
        }));
      }
    } catch (error) {
      console.error('Error validating email:', error);
    } finally {
      setIsValidating(prev => ({ ...prev, email: false }));
    }
  };

  // Validate phone uniqueness
  const validatePhone = async (phone) => {
    if (!phone) return;
    
    setIsValidating(prev => ({ ...prev, phone: true }));
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, phone')
        .eq('phone', phone)
        .neq('id', editingUser?.id || '00000000-0000-0000-0000-000000000000'); // Exclude current user if editing
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setValidationErrors(prev => ({
          ...prev,
          phone: 'This phone number is already registered'
        }));
      } else {
        setValidationErrors(prev => ({
          ...prev,
          phone: ''
        }));
      }
    } catch (error) {
      console.error('Error validating phone:', error);
    } finally {
      setIsValidating(prev => ({ ...prev, phone: false }));
    }
  };

  // Validate transaction ID uniqueness
  const validateTransactionId = async (transactionId) => {
    if (!transactionId) return;
    
    setIsValidating(prev => ({ ...prev, transaction_id: true }));
    
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('id, transaction_id, user_id')
        .eq('transaction_id', transactionId)
        .neq('user_id', editingUser?.id || '00000000-0000-0000-0000-000000000000'); // Exclude current user if editing
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setValidationErrors(prev => ({
          ...prev,
          transaction_id: 'This transaction ID is already used'
        }));
      } else {
        setValidationErrors(prev => ({
          ...prev,
          transaction_id: ''
        }));
      }
    } catch (error) {
      console.error('Error validating transaction ID:', error);
    } finally {
      setIsValidating(prev => ({ ...prev, transaction_id: false }));
    }
  };

  // Handle multiselect change with better UX
  const handleMultiSelectChange = (fieldName, selectedValues) => {
    setUserFormData(prev => ({
      ...prev,
      [fieldName]: selectedValues
    }));
    
    // If combo is selected, log the details
    if (fieldName === 'selected_combos') {
      selectedValues.forEach(comboId => handleComboSelection(comboId));
    }
  }

  // Handle scanner form input changes
  const handleScannerFormChange = (e) => {
    const { name, value } = e.target
    setScannerFormData({
      ...scannerFormData,
      [name]: value
    })
  }

  // Handle scanner photo upload
  const handleScannerPhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const photoUrl = await uploadImage(file, 'profile-photos')
      setScannerFormData({
        ...scannerFormData,
        photo_url: photoUrl
      })
    } catch (error) {
      console.error('Error uploading scanner photo:', error)
    }
  }

  // Handle user photo upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const photoUrl = await uploadImage(file, 'profile-photos')
      setUserFormData({
        ...userFormData,
        photo_url: photoUrl
      })
    } catch (error) {
      console.error('Error uploading photo:', error)
    }
  }

  // Open user modal for editing
  const handleEditUser = async (user) => {
    setEditingUser(user)
    
    // Refresh events, workshops, and combos data to ensure we have the latest prices
    try {
      await Promise.all([
        fetchEvents(),
        fetchWorkshops(),
        fetchCombos()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
    
    // Fetch user's registrations to populate the form
    try {
      // Fetch all registrations for the user (including combo items)
      const { data: registrations, error } = await supabase
        .from('registrations')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error fetching user registrations:', error);
        // Set empty form data if fetch fails
    setUserFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      enrollment_number: user.enrollment_number || '',
      college_id: user.college_id || '',
      semester: user.semester || '',
      field_id: user.field_id || '',
      role: user.role || 'participant',
          photo_url: user.photo_url || '',
          selected_tech_events: [],
          selected_non_tech_events: [],
          selected_workshops: [],
          selected_combos: [],
          transaction_id: '',
          amount_paid: ''
        });
      } else {
        // Process registrations and categorize them
        const selectedTechEvents = [];
        const selectedNonTechEvents = [];
        const selectedWorkshops = [];
        const selectedCombos = [];
        let transactionId = '';
        let amountPaid = 0;
        
        if (registrations) {
          registrations.forEach(reg => {
            if (reg.target_type === 'event') {
              // We'll determine category based on the events array we already have
              const event = events.find(e => e.id === reg.target_id);
              if (event) {
                if (event.category === 'tech') {
                  selectedTechEvents.push(reg.target_id);
                } else {
                  selectedNonTechEvents.push(reg.target_id);
                }
              }
            } else if (reg.target_type === 'workshop') {
              selectedWorkshops.push(reg.target_id);
            } else if (reg.target_type === 'combo') {
              selectedCombos.push(reg.target_id);
            }
            
            if (!transactionId && reg.transaction_id) {
              transactionId = reg.transaction_id;
            }
            if (reg.amount_paid > 0) {
              amountPaid += reg.amount_paid;
            }
          });
          
          // Now we need to handle the case where combo items are registered individually
          // If a user has combo registrations, we should also check for individual item registrations
          // and mark them as part of combos (disabled in UI)
          const comboItemIds = new Set();
          userFormData.selected_combos.forEach(comboId => {
            const combo = combos.find(c => c.id === comboId);
            if (combo && combo.combo_items) {
              combo.combo_items.forEach(item => {
                comboItemIds.add(item.target_id);
              });
            }
          });
          
          // Remove combo items from individual selections to avoid duplication
          // This ensures the UI shows the correct state
          userFormData.selected_tech_events = userFormData.selected_tech_events.filter(id => !comboItemIds.has(id));
          userFormData.selected_non_tech_events = userFormData.selected_non_tech_events.filter(id => !comboItemIds.has(id));
          userFormData.selected_workshops = userFormData.selected_workshops.filter(id => !comboItemIds.has(id));
        }
        
        setUserFormData({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          enrollment_number: user.enrollment_number || '',
          college_id: user.college_id || '',
          semester: user.semester || '',
          field_id: user.field_id || '',
          role: user.role || 'participant',
          photo_url: user.photo_url || '',
          selected_tech_events: selectedTechEvents,
          selected_non_tech_events: selectedNonTechEvents,
          selected_workshops: selectedWorkshops,
          selected_combos: selectedCombos,
          transaction_id: transactionId,
          amount_paid: amountPaid.toString()
        });
      }
    } catch (error) {
      console.error('Error in handleEditUser:', error);
      // Fallback to basic user data if registration fetch fails
      setUserFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        enrollment_number: user.enrollment_number || '',
        college_id: user.college_id || '',
        semester: user.semester || '',
        field_id: user.field_id || '',
        role: user.role || 'participant',
        photo_url: user.photo_url || '',
        selected_tech_events: [],
        selected_non_tech_events: [],
        selected_workshops: [],
        selected_combos: [],
        transaction_id: '',
        amount_paid: ''
      });
    }
    
    setShowUserModal(true);
  }

  // Open scanner modal for editing
  const handleEditScanner = (scanner) => {
    setEditingScanner(scanner)
    setScannerFormData({
      name: scanner.name || '',
      email: scanner.email || '',
      phone: scanner.phone || '',
      role: 'scanner_committee',
      college_id: scanner.college_id || '',
      semester: scanner.semester || '',
      roll_number: (scanner.metadata && scanner.metadata.roll_number) || '',
      photo_url: scanner.photo_url || ''
    })
    setShowScannerModal(true)
  }

  // Submit user form
  const handleUserSubmit = async (e) => {
    e.preventDefault()
     
     // Check for validation errors
     if (validationErrors.email || validationErrors.phone || validationErrors.transaction_id) {
       alert('Please fix the validation errors before submitting.');
       return;
     }
     
     // Check if any validation is still in progress
     if (isValidating.email || isValidating.phone || isValidating.transaction_id) {
       alert('Please wait for validation to complete.');
       return;
     }
     
     // Validate that total amount matches selected items
     const calculatedTotal = calculateTotalPrice();
     const enteredAmount = parseFloat(userFormData.amount_paid) || 0;
     
     if (Math.abs(calculatedTotal - enteredAmount) > 0.01) { // Allow small rounding differences
       alert(`Total amount paid (₹${enteredAmount.toFixed(2)}) does not match the sum of selected items (₹${calculatedTotal.toFixed(2)}). Please adjust the amount or selections.`);
       return;
     }
     
           try {
       let userId;
       
      if (editingUser) {
        // Update existing user
        const { error } = await supabase
          .from('users')
          .update({
            name: userFormData.name,
            email: userFormData.email,
            phone: userFormData.phone,
            enrollment_number: userFormData.enrollment_number,
            college_id: userFormData.college_id || null,
            semester: userFormData.semester,
            field_id: userFormData.field_id || null,
            photo_url: userFormData.photo_url,
            updated_at: new Date()
          })
          .eq('id', editingUser.id)
        
        if (error) throw error
         userId = editingUser.id
        console.log('User updated successfully')
      } else {
        // Create new user
         const { data, error } = await supabase
          .from('users')
          .insert([
            {
              name: userFormData.name,
              email: userFormData.email,
              phone: userFormData.phone,
              enrollment_number: userFormData.enrollment_number,
              college_id: userFormData.college_id || null,
              semester: userFormData.semester,
              field_id: userFormData.field_id || null,
              role: 'participant',
              photo_url: userFormData.photo_url
            }
          ])
           .select()
        
        if (error) throw error
         userId = data[0].id
        console.log('User created successfully')
      }
       
       // Handle registrations
       if (userId) {
         // Delete existing registrations for this user (if editing)
         if (editingUser) {
           const { error: deleteError } = await supabase
             .from('registrations')
             .delete()
             .eq('user_id', userId)
           
           if (deleteError) {
             console.error('Error deleting existing registrations:', deleteError)
           }
         }
         
                   // Create new registrations for selected items
          const registrationsToInsert = [];
          
          // Use actual event prices, not proportional amounts
          // Add tech events with actual price
          userFormData.selected_tech_events.forEach(eventId => {
            const event = events.find(e => e.id === eventId);
            const eventPrice = event?.price || 0;
            
            registrationsToInsert.push({
              user_id: userId,
              target_type: 'event',
              target_id: eventId,
              transaction_id: userFormData.transaction_id || null,
              amount_paid: eventPrice, // Use actual event price
              payment_status: 'pending'
            });
          });
          
          // Add non-tech events with actual price
          userFormData.selected_non_tech_events.forEach(eventId => {
            const event = events.find(e => e.id === eventId);
            const eventPrice = event?.price || 0;
            
            registrationsToInsert.push({
              user_id: userId,
              target_type: 'event',
              target_id: eventId,
              transaction_id: userFormData.transaction_id || null,
              amount_paid: eventPrice, // Use actual event price
              payment_status: 'pending'
            });
          });
          
          // Add workshops with actual fee
          userFormData.selected_workshops.forEach(workshopId => {
            const workshop = workshops.find(w => w.id === workshopId);
            const workshopFee = workshop?.fee || 0;
            
            registrationsToInsert.push({
              user_id: userId,
              target_type: 'workshop',
              target_id: workshopId,
              transaction_id: userFormData.transaction_id || null,
              amount_paid: workshopFee, // Use actual workshop fee
              payment_status: 'pending'
            });
          });
          
          // Add combos with combo price AND individual item registrations for participant tracking
          userFormData.selected_combos.forEach(comboId => {
            const combo = combos.find(c => c.id === comboId);
            if (!combo) return;
            
            // First, add the main combo registration
            registrationsToInsert.push({
              user_id: userId,
              target_type: 'combo',
              target_id: comboId,
              transaction_id: userFormData.transaction_id || null,
              amount_paid: combo.price || 0, // Use combo price
              payment_status: 'pending'
            });
            
            // Then, add individual registrations for each combo item (with 0 amount_paid to avoid double-charging)
            // This ensures participants are visible in individual event/workshop lists
            if (combo.combo_items) {
              combo.combo_items.forEach(comboItem => {
                if (comboItem.target_type === 'event') {
                  registrationsToInsert.push({
                    user_id: userId,
                    target_type: 'event',
                    target_id: comboItem.target_id,
                    transaction_id: userFormData.transaction_id || null,
                    amount_paid: 0, // 0 amount since already paid via combo
                    payment_status: 'pending',
                    parent_registration_id: null // Link to combo registration if needed
                  });
                } else if (comboItem.target_type === 'workshop') {
                  registrationsToInsert.push({
                    user_id: userId,
                    target_type: 'workshop',
                    target_id: comboItem.target_id,
                    transaction_id: userFormData.transaction_id || null,
                    amount_paid: 0, // 0 amount since already paid via combo
                    payment_status: 'pending',
                    parent_registration_id: null // Link to combo registration if needed
                  });
                }
              });
            }
          });
         
         // Insert registrations if any
         if (registrationsToInsert.length > 0) {
           const { error: regError } = await supabase
             .from('registrations')
             .insert(registrationsToInsert)
           
           if (regError) {
             console.error('Error creating registrations:', regError)
           } else {
             console.log('Registrations created successfully')
           }
         }
      }
      
      // Reset form and close modal
      setUserFormData({
        name: '',
        email: '',
        phone: '',
        enrollment_number: '',
        college_id: '',
        semester: '',
        field_id: '',
        role: 'participant',
         photo_url: '',
         selected_tech_events: [],
         selected_non_tech_events: [],
         selected_workshops: [],
         selected_combos: [],
         transaction_id: '',
         amount_paid: ''
       })
       // Clear validation errors
       setValidationErrors({
         email: '',
         phone: '',
         transaction_id: ''
      })
      setEditingUser(null)
      setShowUserModal(false)
      fetchUsers()
    } catch (error) {
      console.error('Error submitting user form:', error)
    }
  }

  // Submit scanner form
  const handleScannerSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (editingScanner) {
        // Update existing scanner
        const { error } = await supabase
          .from('users')
          .update({
            name: scannerFormData.name,
            email: scannerFormData.email,
            phone: scannerFormData.phone,
            role: 'scanner_committee',
            college_id: scannerFormData.college_id,
            semester: scannerFormData.semester,
            photo_url: scannerFormData.photo_url,
            metadata: {
              ...(editingScanner?.metadata || {}),
              roll_number: scannerFormData.roll_number || null
            },
            updated_at: new Date()
          })
          .eq('id', editingScanner.id)
        
        if (error) throw error
        console.log('Scanner updated successfully')
      } else {
        // Create new scanner
        const { error } = await supabase
          .from('users')
          .insert([
            {
              name: scannerFormData.name,
              email: scannerFormData.email,
              phone: scannerFormData.phone,
              role: 'scanner_committee',
              college_id: scannerFormData.college_id,
              semester: scannerFormData.semester,
              photo_url: scannerFormData.photo_url,
              metadata: {
                roll_number: scannerFormData.roll_number || null
              }
            }
          ])
        
        if (error) throw error
        console.log('Scanner created successfully')
      }
      
      // Reset form and close modal
      setScannerFormData({
        name: '',
        email: '',
        phone: '',
                        role: 'scanner_committee',
                        college_id: '',
                        semester: '',
                        roll_number: '',
                        photo_url: '',
                        photo_file: null
      })
      setEditingScanner(null)
      setShowScannerModal(false)
      fetchScanners()
    } catch (error) {
      console.error('Error submitting scanner form:', error)
    }
  }

  // Delete user
  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)
      
      if (error) throw error
      console.log('User deleted successfully')
      fetchUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }

  // Delete scanner
  const handleDeleteScanner = async (scannerId) => {
    if (!confirm('Are you sure you want to delete this scanner?')) return
    
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', scannerId)
      
      if (error) throw error
      console.log('Scanner deleted successfully')
      fetchScanners()
    } catch (error) {
      console.error('Error deleting scanner:', error)
    }
  }

  // Update payment status
  const handleUpdatePaymentStatus = async (registrationId, status) => {
    try {
      // First, get the registration details to check if it's a combo
      const { data: registration, error: fetchError } = await supabase
        .from('registrations')
        .select('*')
        .eq('id', registrationId)
        .single()
      
      if (fetchError) throw fetchError
      
      // Update the main registration
      const { error: updateError } = await supabase
        .from('registrations')
        .update({ payment_status: status, updated_at: new Date() })
        .eq('id', registrationId)
      
      if (updateError) throw updateError
      
      // If this is a combo registration, also update all related individual registrations
      if (registration.target_type === 'combo') {
        const combo = combos.find(c => c.id === registration.target_id)
        if (combo && combo.combo_items) {
          // Get all combo item IDs
          const comboItemIds = combo.combo_items.map(item => item.target_id)
          console.log('Combo items to update:', comboItemIds)
          console.log('User ID:', registration.user_id)
          
          // Update all individual registrations for combo items
          // We need to update both events and workshops separately since Supabase doesn't support OR with .eq()
          const { error: eventUpdateError } = await supabase
            .from('registrations')
            .update({ payment_status: status, updated_at: new Date() })
            .in('target_id', comboItemIds)
            .eq('user_id', registration.user_id)
            .eq('target_type', 'event')
          
          const { error: workshopUpdateError } = await supabase
            .from('registrations')
            .update({ payment_status: status, updated_at: new Date() })
            .in('target_id', comboItemIds)
            .eq('user_id', registration.user_id)
            .eq('target_type', 'workshop')
          
          if (eventUpdateError) {
            console.warn('Warning: Could not update event registrations:', eventUpdateError)
          } else {
            console.log('Successfully updated event registrations for combo items')
          }
          if (workshopUpdateError) {
            console.warn('Warning: Could not update workshop registrations:', workshopUpdateError)
          } else {
            console.log('Successfully updated workshop registrations for combo items')
          }
        }
      }
      
      // Update local state instead of re-fetching all data
      setUsers(prevUsers => 
        prevUsers.map(user => ({
          ...user,
          registrations: user.registrations.map(reg => 
            reg.id === registrationId 
              ? { ...reg, payment_status: status }
              : reg
          )
        }))
      )
      
      // Also update registrations state for event participants modal
      setRegistrations(prevRegistrations => 
        prevRegistrations.map(reg => 
          reg.id === registrationId 
            ? { ...reg, payment_status: status }
            : reg
        )
      )
      
      console.log(`Payment status updated to ${status}`)
    } catch (error) {
      console.error('Error updating payment status:', error)
    }
  }

  // Bulk approve all payments for a user
  const handleBulkApprovePayments = async (userId) => {
    try {
      // Get all pending registrations for the user
      const { data: pendingRegistrations, error: fetchError } = await supabase
        .from('registrations')
        .select('*')
        .eq('user_id', userId)
        .eq('payment_status', 'pending')
      
      if (fetchError) throw fetchError
      
      if (!pendingRegistrations || pendingRegistrations.length === 0) {
        console.log('No pending payments found for this user')
        return
      }
      
      // Update all pending registrations to approved
      const { error: updateError } = await supabase
        .from('registrations')
        .update({ payment_status: 'approved', updated_at: new Date() })
        .eq('user_id', userId)
        .eq('payment_status', 'pending')
      
      if (updateError) throw updateError
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? {
                ...user,
                registrations: user.registrations.map(reg => 
                  reg.payment_status === 'pending'
                    ? { ...reg, payment_status: 'approved' }
                    : reg
                )
              }
            : user
        )
      )
      
      console.log(`Bulk approved ${pendingRegistrations.length} payments for user ${userId}`)
    } catch (error) {
      console.error('Error bulk approving payments:', error)
    }
  }

  // Bulk approve multiple registrations at once
  const handleBulkApproveRegistrations = async (registrationIds) => {
    try {
      if (!registrationIds || registrationIds.length === 0) {
        console.log('No registrations to approve')
        return
      }
      
      // Update all registrations to approved
      const { error: updateError } = await supabase
        .from('registrations')
        .update({ payment_status: 'approved', updated_at: new Date() })
        .in('id', registrationIds)
      
      if (updateError) throw updateError
      
      // Update local state for users
      setUsers(prevUsers => 
        prevUsers.map(user => ({
          ...user,
          registrations: user.registrations.map(reg => 
            registrationIds.includes(reg.id)
              ? { ...reg, payment_status: 'approved' }
              : reg
          )
        }))
      )
      
      // Update local state for registrations (event participants modal)
      setRegistrations(prevRegistrations => 
        prevRegistrations.map(reg => 
          registrationIds.includes(reg.id)
            ? { ...reg, payment_status: 'approved' }
            : reg
        )
      )
      
      console.log(`Bulk approved ${registrationIds.length} registrations`)
    } catch (error) {
      console.error('Error bulk approving registrations:', error)
    }
  }

  // View event participants
  const handleViewEventParticipants = async (eventId) => {
    try {
      setLoading(true)
      
      // Get direct registrations for this event
      const { data: directRegistrations, error: directError } = await supabase
        .from('registrations')
        .select('*, users(*)')
        .eq('target_type', 'event')
        .eq('target_id', eventId)
      
      if (directError) throw directError
      
      // Get all combo registrations
      const { data: comboRegistrations, error: comboError } = await supabase
        .from('registrations')
        .select('*, users(*)')
        .eq('target_type', 'combo')
      
      if (comboError) throw comboError
      
      // Get combo items to find which combos include this event
      const { data: comboItems, error: itemsError } = await supabase
        .from('combo_items')
        .select('*')
        .eq('target_type', 'event')
        .eq('target_id', eventId)
      
      if (itemsError) throw itemsError
      
      // Find combo IDs that include this event
      const relevantComboIds = comboItems.map(item => item.combo_id)
      
      console.log('Debug - Event ID:', eventId)
      console.log('Debug - Combo items found:', comboItems)
      console.log('Debug - Relevant combo IDs:', relevantComboIds)
      console.log('Debug - All combo registrations:', comboRegistrations)
      
      // Filter combo registrations to only include those that have this event
      const relevantComboRegistrations = comboRegistrations.filter(reg => 
        relevantComboIds.includes(reg.target_id)
      )
      
      console.log('Debug - Relevant combo registrations:', relevantComboRegistrations)
      console.log('Debug - Direct registrations:', directRegistrations)
      
      // Add registration type to each registration
      const directWithType = directRegistrations.map(reg => ({ ...reg, registrationType: 'Direct' }))
      const comboWithType = relevantComboRegistrations.map(reg => ({ ...reg, registrationType: 'Combo' }))
      
      // Combine both direct and combo registrations
      const allRegistrations = [...directWithType, ...comboWithType]
      
      // Remove duplicates based on user_id (keep the first occurrence)
      const uniqueRegistrations = allRegistrations.filter((reg, index, self) => 
        index === self.findIndex(r => r.user_id === reg.user_id)
      )
      
      setRegistrations(uniqueRegistrations)
      setSelectedEvent(events.find(e => e.id === eventId))
      setActiveTab('eventParticipants')
    } catch (error) {
      console.error('Error fetching event participants:', error)
    } finally {
      setLoading(false)
    }
  }

  // View workshop participants
  const handleViewWorkshopParticipants = async (workshopId) => {
    try {
      setLoading(true)
      
      // Get direct registrations for this workshop
      const { data: directRegistrations, error: directError } = await supabase
        .from('registrations')
        .select('*, users(*)')
        .eq('target_type', 'workshop')
        .eq('target_id', workshopId)
      
      if (directError) throw directError
      
      // Get all combo registrations
      const { data: comboRegistrations, error: comboError } = await supabase
        .from('registrations')
        .select('*, users(*)')
        .eq('target_type', 'combo')
      
      if (comboError) throw comboError
      
      // Get combo items to find which combos include this workshop
      const { data: comboItems, error: itemsError } = await supabase
        .from('combo_items')
        .select('*')
        .eq('target_type', 'workshop')
        .eq('target_id', workshopId)
      
      if (itemsError) throw itemsError
      
      // Find combo IDs that include this workshop
      const relevantComboIds = comboItems.map(item => item.combo_id)
      
      console.log('Debug - Workshop ID:', workshopId)
      console.log('Debug - Workshop combo items found:', comboItems)
      console.log('Debug - Workshop relevant combo IDs:', relevantComboIds)
      console.log('Debug - Workshop all combo registrations:', comboRegistrations)
      
      // Filter combo registrations to only include those that have this workshop
      const relevantComboRegistrations = comboRegistrations.filter(reg => 
        relevantComboIds.includes(reg.target_id)
      )
      
      console.log('Debug - Workshop relevant combo registrations:', relevantComboRegistrations)
      console.log('Debug - Workshop direct registrations:', directRegistrations)
      
      // Add registration type to each registration
      const directWithType = directRegistrations.map(reg => ({ ...reg, registrationType: 'Direct' }))
      const comboWithType = relevantComboRegistrations.map(reg => ({ ...reg, registrationType: 'Combo' }))
      
      // Combine both direct and combo registrations
      const allRegistrations = [...directWithType, ...comboWithType]
      
      // Remove duplicates based on user_id (keep the first occurrence)
      const uniqueRegistrations = allRegistrations.filter((reg, index, self) => 
        index === self.findIndex(r => r.user_id === reg.user_id)
      )
      
      setRegistrations(uniqueRegistrations)
      setSelectedEvent(workshops.find(w => w.id === workshopId))
      setActiveTab('eventParticipants')
    } catch (error) {
      console.error('Error fetching workshop participants:', error)
    } finally {
      setLoading(false)
    }
  }

  // Export participants as CSV
  const handleExportParticipants = () => {
    try {
      let csvContent = 'Name,Email,Phone,Enrollment Number,College,Payment Status\n'
      
      registrations.forEach(reg => {
        const user = reg.users
        const college = colleges.find(c => c.id === user.college_id)?.name || ''
        csvContent += `"${user.name}","${user.email}","${user.phone || ''}","${user.enrollment_number || ''}","${college}","${reg.payment_status}"\n`
      })
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `${selectedEvent.name}-participants.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error exporting participants:', error)
    }
  }



  // Filter users by payment status
  const filteredUsers = users.filter(user => {
    if (paymentFilter === 'all') return true
    
    const hasRegistrations = user.registrations && user.registrations.length > 0
    if (!hasRegistrations) return false
    
    return user.registrations.some(reg => reg.payment_status === paymentFilter)
  })

  // CSV Export helper
  const csvEscape = (value) => {
    if (value === null || value === undefined) return ''
    const str = String(value)
    if (str.includes('"') || str.includes(',') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"'
    }
    return str
  }

  const getRegistrationTargetName = (reg) => {
    if (!reg) return ''
    if (reg.target_type === 'combo') {
      const combo = combos.find(c => c.id === reg.target_id)
      return combo ? combo.title : 'Combo'
    }
    if (reg.target_type === 'event') {
      const ev = events.find(e => e.id === reg.target_id)
      return ev ? ev.title : 'Event'
    }
    if (reg.target_type === 'workshop') {
      const ws = workshops.find(w => w.id === reg.target_id)
      return ws ? ws.title : 'Workshop'
    }
    return ''
  }

  const exportRegistrationsCSV = async () => {
    try {
      setLoading(true)
      
      // Fetch ALL users that match current filters (not just paginated ones)
      let query = supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          phone,
          enrollment_number,
          college_id,
          field_id,
          semester,
          created_at,
          registrations(
            id,
            target_type,
            target_id,
            payment_status,
            transaction_id,
            amount_paid,
            created_at
          )
        `)
        .order('created_at', { ascending: false })

      // Apply college filter
      if (collegeFilter) {
        query = query.eq('college_id', collegeFilter)
      }

      // Apply semester filter
      if (semesterFilter) {
        query = query.eq('semester', semesterFilter)
      }

      // Apply field filter
      if (fieldFilter) {
        query = query.eq('field_id', fieldFilter)
      }

      // Apply search filter
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,enrollment_number.ilike.%${searchTerm}%`)
      }

      const { data: allUsers, error } = await query

      if (error) {
        console.error('Error fetching users for export:', error)
        alert('Error fetching users for export. Please try again.')
        return
      }

      console.log('Export: Fetched users count:', allUsers?.length || 0)

      // Filter users by payment status (same logic as filteredUsers)
      const exportUsers = allUsers.filter(user => {
        if (paymentFilter === 'all') return true
        
        const hasRegistrations = user.registrations && user.registrations.length > 0
        if (!hasRegistrations) return false
        
        return user.registrations.some(reg => reg.payment_status === paymentFilter)
      })

      console.log('Export: Filtered users count:', exportUsers.length)
      console.log('Export: Payment filter:', paymentFilter)

      // Build rows: one per user (merged registrations)
      const headers = ['Name', 'Email', 'Transaction ID', 'Mobile', 'Payment Status', 'Event/Combo']
      const rows = [headers]
      
      exportUsers.forEach(user => {
        const regs = (user.registrations || []).filter(reg => paymentFilter === 'all' || reg.payment_status === paymentFilter)
        if (regs.length === 0) return

        // If any combo registrations, show only combo name(s)
        const comboRegs = regs.filter(r => r.target_type === 'combo')
        let label = ''
        if (comboRegs.length > 0) {
          const comboNames = Array.from(new Set(comboRegs.map(r => getRegistrationTargetName(r)).filter(Boolean)))
          label = comboNames.join(' | ')
        } else {
          // Merge events and workshops titles
          const names = Array.from(new Set(regs.map(r => getRegistrationTargetName(r)).filter(Boolean)))
          label = names.join(' | ')
        }

        // Merge transaction IDs
        const transactionIds = Array.from(new Set(regs.map(r => r.transaction_id).filter(Boolean)))
        const transactionIdMerged = transactionIds.join(' | ')

        // Merge payment status
        const statuses = Array.from(new Set(regs.map(r => r.payment_status).filter(Boolean)))
        const paymentStatusMerged = statuses.length === 1 ? statuses[0] : 'mixed'

        rows.push([
          csvEscape(user.name || ''),
          csvEscape(user.email || ''),
          csvEscape(transactionIdMerged),
          csvEscape(user.phone || ''),
          csvEscape(paymentStatusMerged),
          csvEscape(label)
        ])
      })
      
      console.log('Export: Final CSV rows count:', rows.length - 1) // -1 for header
      
      const csvContent = rows.map(r => r.join(',')).join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `registrations_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error exporting CSV:', err)
      alert('Error exporting CSV. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          {activeTab === 'users' && (
            <button
               onClick={async () => {
                 // Refresh data to ensure we have latest prices
                 try {
                   await Promise.all([
                     fetchEvents(),
                     fetchWorkshops(),
                     fetchCombos()
                   ]);
                 } catch (error) {
                   console.error('Error refreshing data:', error);
                 }
                 setShowUserModal(true);
               }}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full sm:w-auto"
            >
              <UserPlus className="mr-2 h-5 w-5" />
              Add User
            </button>
          )}
          {activeTab === 'users' && (
            <button
              onClick={exportRegistrationsCSV}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 w-full sm:w-auto"
            >
              <Download className="mr-2 h-5 w-5" />
              Export CSV
            </button>
          )}
          {activeTab === 'eventParticipants' && (
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <button
                onClick={() => setActiveTab('events')}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 w-full sm:w-auto"
              >
                <Calendar className="mr-2 h-5 w-5" />
                Back to Events
              </button>
              <button
                onClick={handleExportParticipants}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 w-full sm:w-auto"
              >
                <Download className="mr-2 h-5 w-5" />
                Export CSV
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex flex-wrap space-x-4 md:space-x-8">
          {!isScannerCommittee && (
          <button
             onClick={() => {
               setActiveTab('users');
               window.history.pushState({}, '', '/registration-committee/users');
             }}
            className={`${activeTab === 'users' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'} whitespace-nowrap py-3 md:py-4 px-2 md:px-1 border-b-2 font-medium text-xs md:text-sm flex items-center`}
          >
            <Users className="mr-1 md:mr-2 h-4 w-4 md:h-5 md:w-5" />
            <span className="hidden sm:inline">User Management</span>
            <span className="sm:hidden">Users</span>
          </button>
          )}
          {!isScannerCommittee && (
          <button
             onClick={() => {
               setActiveTab('events');
               window.history.pushState({}, '', '/registration-committee/events');
             }}
            className={`${activeTab === 'events' || activeTab === 'eventParticipants' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'} whitespace-nowrap py-3 md:py-4 px-2 md:px-1 border-b-2 font-medium text-xs md:text-sm flex items-center`}
          >
            <Calendar className="mr-1 md:mr-2 h-4 w-4 md:h-5 md:w-5" />
            <span className="hidden sm:inline">Event Management</span>
            <span className="sm:hidden">Events</span>
          </button>
          )}
          <button
             onClick={() => {
               setActiveTab('attendance');
               window.history.pushState({}, '', '/registration-committee/attendance');
             }}
            className={`${activeTab === 'attendance' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'} whitespace-nowrap py-3 md:py-4 px-2 md:px-1 border-b-2 font-medium text-xs md:text-sm flex items-center`}
          >
            <QrCode className="mr-1 md:mr-2 h-4 w-4 md:h-5 md:w-5" />
            <span className="hidden sm:inline">{isScannerCommittee ? 'Scanner' : 'Attendance Management'}</span>
            <span className="sm:hidden">{isScannerCommittee ? 'Scanner' : 'Attendance'}</span>
          </button>
        </nav>
      </div>

      {/* Search and Filter */}
      {!isScannerCommittee && (activeTab === 'users' || activeTab === 'events') && (
        <div className="flex flex-col space-y-4 mb-6">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={`Search ${activeTab === 'users' ? 'users' : 'events'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md w-full focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
          
          {activeTab === 'users' && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                  className="flex-1 sm:flex-none border border-gray-300 dark:border-gray-600 rounded-md py-2 pl-3 pr-10 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="all">All Payments</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="declined">Declined</option>
                <option value="not_required">Not Required</option>
              </select>
              </div>
              <button
                 onClick={async () => {
                   try {
                     await Promise.all([
                       fetchUsers(),
                       fetchEvents(),
                       fetchWorkshops(),
                       fetchCombos()
                     ]);
                   } catch (error) {
                     console.error('Error refreshing data:', error);
                   }
                 }}
                className="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 w-full sm:w-auto flex items-center justify-center"
                 title="Refresh All Data"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                <span className="sm:hidden">Refresh Data</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Content based on active tab */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <>
          {/* User Management Tab */}
          {activeTab === 'users' && (
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <li key={user.id} className="px-4 md:px-6 py-4">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {user.photo_url ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={user.photo_url}
                                alt={user.name}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                <span className="text-gray-600 dark:text-gray-300 text-sm font-medium">
                                  {user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {user.email}
                            </div>
                            {user.phone && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {user.phone}
                              </div>
                            )}
                            {user.enrollment_number && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Enrollment: {user.enrollment_number}
                              </div>
                            )}
                          </div>
                        </div>
                        
                           {/* Registration Details */}
                          {user.registrations && user.registrations.length > 0 && (
                          <div className="lg:flex lg:flex-col lg:items-end">
                               <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                Registrations: {user.registrations.length}
                              </div>
                               
                               {/* Registration Details */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 w-full lg:max-w-md">
                                 <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                   Selected Items:
                                 </div>
                                 <div className="space-y-1">
                                                                      {user.registrations.map(reg => {
                                     let itemName = '';
                                     let itemPrice = 0;
                                     
                                     if (reg.target_type === 'event' && reg.events) {
                                       itemName = reg.events.name;
                                       itemPrice = reg.events.price || 0;
                                     } else if (reg.target_type === 'workshop' && reg.workshops) {
                                       itemName = reg.workshops.title;
                                       itemPrice = reg.workshops.fee || 0;
                                     } else if (reg.target_type === 'combo' && reg.combos) {
                                       itemName = reg.combos.name;
                                       itemPrice = reg.combos.price || 0;
                                     } else {
                                       // Fallback when nested data is not available
                                       if (reg.target_type === 'event') {
                                         const event = events.find(e => e.id === reg.target_id);
                                         if (event) {
                                           itemName = event.name;
                                           itemPrice = event.price || 0;
                                         } else {
                                           itemName = `Event ${reg.target_id}`;
                                           itemPrice = 0;
                                         }
                                       } else if (reg.target_type === 'workshop') {
                                         const workshop = workshops.find(w => w.id === reg.target_id);
                                         if (workshop) {
                                           itemName = workshop.title;
                                           itemPrice = workshop.fee || 0;
                                         } else {
                                           itemName = `Workshop ${reg.target_id}`;
                                           itemPrice = 0;
                                         }
                                       } else if (reg.target_type === 'combo') {
                                         const combo = combos.find(c => c.id === reg.target_id);
                                         if (combo) {
                                           itemName = combo.name;
                                           itemPrice = combo.price || 0;
                                         } else {
                                           itemName = `Combo ${reg.target_id}`;
                                           itemPrice = 0;
                                         }
                                       }
                                     }
                                     
                                     return (
                                       <div key={reg.id} className="flex justify-between items-center text-xs">
                                         <div className="flex-1">
                                           <span className="text-gray-900 dark:text-white font-medium">
                                             {itemName}
                                           </span>
                                           <span className="text-gray-500 dark:text-gray-400 ml-1">
                                             ({reg.target_type})
                                           </span>
                                         </div>
                                         <div className="flex items-center space-x-2">
                                           <span className="text-gray-600 dark:text-gray-300">
                                             ₹{reg.amount_paid || 0}
                                           </span>
                                           <div className="flex space-x-1">
                                    <button
                                      onClick={() => handleUpdatePaymentStatus(reg.id, 'approved')}
                                               className={`p-1 rounded ${reg.payment_status === 'approved' ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' : 'text-gray-400 hover:text-green-600 dark:hover:text-green-300'}`}
                                      title="Approve Payment"
                                    >
                                               <Check className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={() => handleUpdatePaymentStatus(reg.id, 'declined')}
                                               className={`p-1 rounded ${reg.payment_status === 'declined' ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300' : 'text-gray-400 hover:text-red-600 dark:hover:text-red-300'}`}
                                      title="Decline Payment"
                                    >
                                               <X className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={() => handleUpdatePaymentStatus(reg.id, 'pending')}
                                               className={`p-1 rounded ${reg.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300' : 'text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-300'}`}
                                      title="Mark as Pending"
                                    >
                                               <DollarSign className="h-3 w-3" />
                                    </button>
                                  </div>
                                         </div>
                                       </div>
                                     );
                                   })}
                                 </div>
                                 
                                 {/* Transaction Summary */}
                                 {user.registrations.length > 0 && (
                                   <div className="border-t pt-2 mt-2">
                                     <div className="flex justify-between text-xs font-medium">
                                       <span className="text-gray-700 dark:text-gray-300">Transaction ID:</span>
                                       <span className="text-gray-900 dark:text-white">
                                         {user.registrations[0]?.transaction_id || 'N/A'}
                                       </span>
                                     </div>
                                     <div className="flex justify-between text-xs font-medium mt-1">
                                       <span className="text-gray-700 dark:text-gray-300">Total Paid:</span>
                                       <span className="text-green-600 dark:text-green-400">
                                         ₹{user.registrations.reduce((sum, reg) => sum + (reg.amount_paid || 0), 0).toFixed(2)}
                                       </span>
                                     </div>
                                     {user.pay_photo && (
                                       <div className="flex items-center justify-between text-xs font-medium mt-2">
                                         <span className="text-gray-700 dark:text-gray-300">Payment Photo:</span>
                                         <a href={user.pay_photo} target="_blank" rel="noreferrer" className="ml-2">
                                           <img
                                             src={user.pay_photo}
                                             alt="Payment"
                                             className="h-10 w-10 rounded object-cover border border-gray-200 dark:border-gray-600"
                                           />
                                         </a>
                                       </div>
                                     )}
                                   </div>
                                 )}
                              </div>
                            </div>
                          )}
                          
                          {/* User Actions */}
                          <div className="flex flex-wrap gap-2 mt-4 lg:mt-0">
                            {/* Bulk Approval Button */}
                            {user.registrations && user.registrations.some(reg => reg.payment_status === 'pending') && (
                              <button
                                onClick={() => handleBulkApprovePayments(user.id)}
                                className="p-2 rounded-md text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400"
                                title="Approve All Pending Payments"
                              >
                                <Check className="h-5 w-5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleEditUser(user)}
                              className="p-2 rounded-md text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                              title="Edit User"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-2 rounded-md text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                              title="Delete User"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="px-4 md:px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No users found. Try adjusting your search or filter.
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Event Management Tab */}
          {activeTab === 'events' && (
            <div className="space-y-6">
              {/* Events Section */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Events</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {events.length > 0 ? (
                events.map(event => (
                  <div key={event.id} className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                    <div className="p-4 md:p-5">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-2 sm:space-y-0">
                        <div className="font-bold text-lg md:text-xl mb-2 text-gray-900 dark:text-white">{event.name}</div>
                        <div className={`px-2 py-1 text-xs rounded-full ${event.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'} self-start`}>
                          {event.is_active ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm mb-4">
                        {event.description ? (
                          event.description.length > 100 ? 
                            `${event.description.substring(0, 100)}...` : 
                            event.description
                        ) : 'No description available'}
                      </p>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          <div>Price: ₹{event.price}</div>
                          <div>Category: {event.category === 'tech' ? 'Technical' : 'Non-Technical'}</div>
                          <div>Registrations: {event.registrations ? event.registrations.length : 0}</div>
                        </div>
                        <button
                          onClick={() => handleViewEventParticipants(event.id)}
                          className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-200 dark:hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full sm:w-auto"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Participants
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-12">
                      No events found.
                </div>
              )}
                </div>
              </div>

              {/* Workshops Section */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Workshops</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {workshops.length > 0 ? (
                    workshops.map(workshop => (
                      <div key={workshop.id} className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                          <div className="flex justify-between">
                            <div className="font-bold text-xl mb-2 text-gray-900 dark:text-white">{workshop.title}</div>
                            <div className={`px-2 py-1 text-xs rounded-full ${workshop.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                              {workshop.is_active ? 'Active' : 'Inactive'}
                            </div>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 text-sm mb-4">
                            {workshop.description ? (
                              workshop.description.length > 100 ? 
                                `${workshop.description.substring(0, 100)}...` : 
                                workshop.description
                            ) : 'No description available'}
                          </p>
                                                     <div className="flex justify-between items-center">
                             <div className="text-sm text-gray-500 dark:text-gray-400">
                               <div>Fee: ₹{workshop.fee || 0}</div>
                               <div>Capacity: {workshop.capacity || 'Unlimited'}</div>
                               <div>Duration: {workshop.start_time && workshop.end_time ? `${workshop.start_time} - ${workshop.end_time}` : 'TBD'}</div>
                               <div>Registrations: {workshop.registrations ? workshop.registrations.length : 0}</div>
                             </div>
                             <div className="flex items-center space-x-2">
                               <button
                                 onClick={() => handleViewWorkshopParticipants(workshop.id)}
                                 className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                               >
                                 <Eye className="-ml-0.5 mr-2 h-4 w-4" />
                                 View Participants
                               </button>
                               <div className="px-3 py-1 text-xs rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                 Workshop
                               </div>
                             </div>
                           </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-12">
                      No workshops found.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Event Participants Tab */}
          {activeTab === 'eventParticipants' && selectedEvent && (
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <div className="flex justify-between items-center">
                  <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  Participants for: {selectedEvent.name}
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                  Total Registrations: {registrations.length}
                </p>
                  </div>
                  {/* Bulk Approval Button for Event */}
                  {registrations.some(reg => reg.payment_status === 'pending') && (
                    <button
                      onClick={() => {
                        const pendingRegistrationIds = registrations
                          .filter(reg => reg.payment_status === 'pending')
                          .map(reg => reg.id)
                        handleBulkApproveRegistrations(pendingRegistrationIds)
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve All Pending
                    </button>
                  )}
                </div>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Email
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Enrollment
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Registration Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Payment Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {registrations.length > 0 ? (
                      registrations.map(reg => (
                        <tr key={reg.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {reg.users.photo_url ? (
                                  <img className="h-10 w-10 rounded-full" src={reg.users.photo_url} alt="" />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                    <span className="text-gray-600 dark:text-gray-300 text-sm font-medium">
                                      {reg.users.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {reg.users.name}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {reg.users.phone}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {reg.users.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {reg.users.enrollment_number || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              reg.registrationType === 'Combo' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                              'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            }`}>
                              {reg.registrationType || 'Direct'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              reg.payment_status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                              reg.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                              reg.payment_status === 'declined' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {reg.payment_status.charAt(0).toUpperCase() + reg.payment_status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleUpdatePaymentStatus(reg.id, 'approved')}
                                className={`p-1 rounded-md ${reg.payment_status === 'approved' ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' : 'text-gray-400 hover:text-green-600 dark:hover:text-green-300'}`}
                                title="Approve Payment"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleUpdatePaymentStatus(reg.id, 'declined')}
                                className={`p-1 rounded-md ${reg.payment_status === 'declined' ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300' : 'text-gray-400 hover:text-red-600 dark:hover:text-red-300'}`}
                                title="Decline Payment"
                              >
                                <X className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleUpdatePaymentStatus(reg.id, 'pending')}
                                className={`p-1 rounded-md ${reg.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300' : 'text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-300'}`}
                                title="Mark as Pending"
                              >
                                <DollarSign className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                          No participants found for this event.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Attendance / Scanner Tab */}
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              {/* Scanner Management Header */}
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Scanner Management</h2>
                <button
                  onClick={() => setShowScannerModal(true)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <UserPlus className="h-5 w-5" />
                  <span>Add Scanner</span>
                </button>
              </div>

              {/* Target selection: Tech / Non-Tech events and Workshops */}
              <div className="card p-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Select targets to monitor</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Technical Events</h4>
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {events.filter(e => e.category === 'tech').map(event => {
                        const selected = selectedTarget && selectedTarget.id === event.id && selectedTarget.type === 'event'
                        return (
                          <label key={event.id} className="flex items-center space-x-2 text-sm">
                            <input 
                              type="radio" 
                              name="tech_event"
                              checked={selected} 
                              onChange={() => {
                                console.log(`Tech event ${event.name} selected`)
                                setSelectedTarget({ id: event.id, type: 'event', name: event.name })
                                setScannerSelectedTargets([{ id: event.id, type: 'event' }])
                              }} 
                            />
                            <span>{event.name}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Non-Technical Events</h4>
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {events.filter(e => e.category === 'non-tech').map(event => {
                        const selected = selectedTarget && selectedTarget.id === event.id && selectedTarget.type === 'event'
                        return (
                          <label key={event.id} className="flex items-center space-x-2 text-sm">
                            <input 
                              type="radio" 
                              name="non_tech_event"
                              checked={selected} 
                              onChange={() => {
                                console.log(`Non-tech event ${event.name} selected`)
                                setSelectedTarget({ id: event.id, type: 'event', name: event.name })
                                setScannerSelectedTargets([{ id: event.id, type: 'event' }])
                              }} 
                            />
                            <span>{event.name}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Food</h4>
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {events.filter(e => e.category === 'food').map(event => {
                        const selected = selectedTarget && selectedTarget.id === event.id && selectedTarget.type === 'event'
                        return (
                          <label key={event.id} className="flex items-center space-x-2 text-sm">
                            <input 
                              type="radio" 
                              name="food_event"
                              checked={selected} 
                              onChange={() => {
                                console.log(`Food event ${event.name} selected`)
                                setSelectedTarget({ id: event.id, type: 'event', name: event.name })
                                setScannerSelectedTargets([{ id: event.id, type: 'event' }])
                              }} 
                            />
                            <span>{event.name}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Workshops</h4>
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {workshops.map(workshop => {
                        const selected = selectedTarget && selectedTarget.id === workshop.id && selectedTarget.type === 'workshop'
                        return (
                          <label key={workshop.id} className="flex items-center space-x-2 text-sm">
                            <input 
                              type="radio" 
                              name="workshop"
                              checked={selected} 
                              onChange={() => {
                                console.log(`Workshop ${workshop.title} selected`)
                                setSelectedTarget({ id: workshop.id, type: 'workshop', name: workshop.title })
                                setScannerSelectedTargets([{ id: workshop.id, type: 'workshop' }])
                              }} 
                            />
                            <span>{workshop.title}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Scanner List */}
              <div className="card p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Scanner Committee Members</h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Total: {scanners.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {scanners.length > 0 ? (
                    scanners.map(scanner => (
                      <div key={scanner.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {scanner.photo_url ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={scanner.photo_url}
                                alt={scanner.name}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                <span className="text-gray-600 dark:text-gray-300 text-sm font-medium">
                                  {scanner.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {scanner.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {scanner.email}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              {scanner.phone || 'No phone'}
                            </p>
                          </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => {
                                setEditingScanner(scanner)
                                setScannerFormData({
                                  name: scanner.name,
                                  email: scanner.email,
                                  phone: scanner.phone || '',
                                  role: 'scanner_committee',
                                  college_id: scanner.college_id || '',
                                  semester: scanner.semester || '',
                                  roll_number: scanner.metadata?.roll_number || '',
                                  photo_url: scanner.photo_url || '',
                                  photo_file: null
                                })
                                setShowScannerModal(true)
                              }}
                              className="p-1 rounded-md text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                              title="Edit Scanner"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteScanner(scanner.id)}
                              className="p-1 rounded-md text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                              title="Delete Scanner"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8">
                      <div className="text-gray-400 dark:text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-3" />
                        <p className="text-sm">No scanner committee members found</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Click "Add Scanner" to add new members
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Live participant list */}
              <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Live Participants</h3>
                  <button onClick={() => refreshScannerParticipants()} className="btn-secondary">Refresh</button>
                          </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Phone</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Target</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Attended</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {scannerAttendanceLogs.map(row => (
                        <tr key={`${row.user_id}-${row.target_type}-${row.target_id}`}>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{row.name}</td>
                          <td className="px-4 py-2 text-sm text-gray-500">{row.email}</td>
                          <td className="px-4 py-2 text-sm text-gray-500">{row.phone || '-'}</td>
                          <td className="px-4 py-2 text-sm text-gray-500">{row.targetName}</td>
                          <td className="px-4 py-2 text-sm">
                            {row.attended ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Yes</span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500">{row.time || '-'}</td>
                        </tr>
                      ))}
                      {scannerAttendanceLogs.length === 0 && (
                        <tr>
                          <td className="px-4 py-6 text-center text-gray-500 dark:text-gray-400" colSpan="6">Select targets to view participants</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Start Scanning Button */}
              <div className="card p-4">
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={() => {
                      console.log('Start Scanning clicked. Current target:', selectedTarget)
                      startScanning()
                    }}
                    disabled={!selectedTarget}
                    className={`btn-primary flex items-center space-x-2 ${
                      !selectedTarget 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:bg-indigo-700'
                    }`}
                  >
                    <QrCode className="h-5 w-5" />
                    <span>Start Scanning</span>
                  </button>
                  
                  {selectedTarget && (
                    <button
                      onClick={() => {
                        setSelectedTarget(null)
                        setScannerSelectedTargets([])
                        setScannerAttendanceLogs([])
                      }}
                      className="btn-secondary"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>
                <div className="text-center mt-3">
                  {!selectedTarget ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Select one target to start scanning
                    </p>
                  ) : (
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                      ✓ Target selected: {selectedTarget.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75 dark:bg-gray-900 dark:opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleUserSubmit}>
                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                             <div className="flex justify-between items-center">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                        {editingUser ? 'Edit User' : 'Add New User'}
                      </h3>
                         <button
                           type="button"
                           onClick={() => {
                             setUserFormData(prev => ({
                               ...prev,
                               selected_tech_events: [],
                               selected_non_tech_events: [],
                               selected_workshops: [],
                               selected_combos: []
                             }));
                           }}
                           className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                         >
                           Clear All Selections
                         </button>
                                                </div>
                         
                         {/* Selection Summary */}
                         {(userFormData.selected_tech_events.length > 0 || 
                           userFormData.selected_non_tech_events.length > 0 || 
                           userFormData.selected_workshops.length > 0 || 
                           userFormData.selected_combos.length > 0) && (
                           <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                             <div className="flex justify-between items-center text-sm">
                               <span className="text-blue-800 dark:text-blue-200 font-medium">
                                 Selected Items Summary:
                               </span>
                               <span className="text-blue-600 dark:text-blue-400">
                                 {userFormData.selected_tech_events.length + 
                                  userFormData.selected_non_tech_events.length + 
                                  userFormData.selected_workshops.length + 
                                  userFormData.selected_combos.length} items
                               </span>
                             </div>
                             <div className="mt-2 flex flex-wrap gap-2 text-xs">
                               {userFormData.selected_tech_events.length > 0 && (
                                 <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                                   {userFormData.selected_tech_events.length} Tech Events
                                 </span>
                               )}
                               {userFormData.selected_non_tech_events.length > 0 && (
                                 <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                                   {userFormData.selected_non_tech_events.length} Non-Tech Events
                                 </span>
                               )}
                               {userFormData.selected_workshops.length > 0 && (
                                 <span className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded">
                                   {userFormData.selected_workshops.length} Workshops
                                 </span>
                               )}
                               {userFormData.selected_combos.length > 0 && (
                                 <span className="px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded">
                                   {userFormData.selected_combos.length} Combos
                                 </span>
                               )}
                             </div>
                           </div>
                         )}
                         
                      <div className="mt-4 space-y-4">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Name
                          </label>
                          <input
                            type="text"
                            name="name"
                            id="name"
                            required
                            value={userFormData.name}
                            onChange={handleUserFormChange}
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Email
                          </label>
                           <div className="relative">
                          <input
                            type="email"
                            name="email"
                            id="email"
                            required
                            value={userFormData.email}
                            onChange={handleUserFormChange}
                               className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white ${
                                 validationErrors.email 
                                   ? 'border-red-300 dark:border-red-600' 
                                   : 'border-gray-300 dark:border-gray-600'
                               }`}
                             />
                             {isValidating.email && (
                               <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
                               </div>
                             )}
                           </div>
                           {validationErrors.email && (
                             <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                               {validationErrors.email}
                             </p>
                           )}
                        </div>
                        <div>
                          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Phone
                          </label>
                           <div className="relative">
                          <input
                            type="text"
                            name="phone"
                            id="phone"
                            value={userFormData.phone || ''}
                            onChange={handleUserFormChange}
                               className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white ${
                                 validationErrors.phone 
                                   ? 'border-red-300 dark:border-red-600' 
                                   : 'border-gray-300 dark:border-gray-600'
                               }`}
                             />
                             {isValidating.phone && (
                               <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
                               </div>
                             )}
                           </div>
                           {validationErrors.phone && (
                             <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                               {validationErrors.phone}
                             </p>
                           )}
                        </div>
                        <div>
                          <label htmlFor="enrollment_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Enrollment Number
                          </label>
                          <input
                            type="text"
                            name="enrollment_number"
                            id="enrollment_number"
                            value={userFormData.enrollment_number || ''}
                            onChange={handleUserFormChange}
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <label htmlFor="college_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            College
                          </label>
                          <select
                            name="college_id"
                            id="college_id"
                            value={userFormData.college_id || ''}
                            onChange={handleUserFormChange}
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                          >
                            <option value="">Select College</option>
                            {colleges.map(college => (
                              <option key={college.id} value={college.id}>{college.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label htmlFor="semester" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Semester
                          </label>
                          <input
                            type="text"
                            name="semester"
                            id="semester"
                            value={userFormData.semester || ''}
                            onChange={handleUserFormChange}
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <label htmlFor="field_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Field
                          </label>
                          <select
                            name="field_id"
                            id="field_id"
                            value={userFormData.field_id || ''}
                            onChange={handleUserFormChange}
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                          >
                            <option value="">Select Field</option>
                            {fields.map(field => (
                              <option key={field.id} value={field.id}>{field.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                             Technical Events ({userFormData.selected_tech_events.length} selected)
                          </label>
                           <div className="mt-1 max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-gray-50 dark:bg-gray-800">
                            {events.filter(e => e.category === 'tech').map(event => {
                              const isDisabled = isEventInSelectedCombo(event.id);
                              return (
                                <label key={event.id} className={`flex items-center space-x-3 py-2 rounded px-2 ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'}`}>
                                  <input
                                    type="checkbox"
                                    checked={userFormData.selected_tech_events.includes(event.id)}
                                    onChange={(e) => handleCheckboxChange('selected_tech_events', event.id, e.target.checked)}
                                    disabled={isDisabled}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                  />
                                  {isDisabled && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                      (Part of selected combo)
                                    </span>
                                  )}
                                  <div className="flex-1">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                      {event.name}
                                    </span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                                      ₹{event.price || 0}
                                    </span>
                                  </div>
                                </label>
                              );
                            })}
                             {events.filter(e => e.category === 'tech').length === 0 && (
                               <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                 No technical events available
                               </p>
                             )}
                           </div>
                           {userFormData.selected_tech_events.length > 0 && (
                             <button
                               type="button"
                               onClick={() => setUserFormData(prev => ({ ...prev, selected_tech_events: [] }))}
                               className="mt-2 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                             >
                               Clear All
                             </button>
                           )}
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                             Non-Technical Events ({userFormData.selected_non_tech_events.length} selected)
                          </label>
                           <div className="mt-1 max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-gray-50 dark:bg-gray-800">
                            {events.filter(e => e.category === 'non-tech').map(event => {
                              const isDisabled = isEventInSelectedCombo(event.id);
                              return (
                                <label key={event.id} className={`flex items-center space-x-3 py-2 rounded px-2 ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'}`}>
                                  <input
                                    type="checkbox"
                                    checked={userFormData.selected_non_tech_events.includes(event.id)}
                                    onChange={(e) => handleCheckboxChange('selected_non_tech_events', event.id, e.target.checked)}
                                    disabled={isDisabled}
                                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                  />
                                  {isDisabled && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                      (Part of selected combo)
                                    </span>
                                  )}
                                  <div className="flex-1">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                      {event.name}
                                    </span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                                      ₹{event.price || 0}
                                    </span>
                                  </div>
                                </label>
                              );
                            })}
                             {events.filter(e => e.category === 'non-tech').length === 0 && (
                               <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                 No non-technical events available
                               </p>
                             )}
                           </div>
                           {userFormData.selected_non_tech_events.length > 0 && (
                             <button
                               type="button"
                               onClick={() => setUserFormData(prev => ({ ...prev, selected_non_tech_events: [] }))}
                               className="mt-2 text-xs text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                             >
                               Clear All
                             </button>
                           )}
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                             Workshops ({userFormData.selected_workshops.length} selected)
                          </label>
                           <div className="mt-1 max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-gray-50 dark:bg-gray-800">
                            {workshops.map(workshop => {
                              const isDisabled = isWorkshopInSelectedCombo(workshop.id);
                              return (
                                <label key={workshop.id} className={`flex items-center space-x-3 py-2 rounded px-2 ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'}`}>
                                  <input
                                    type="checkbox"
                                    checked={userFormData.selected_workshops.includes(workshop.id)}
                                    onChange={(e) => handleCheckboxChange('selected_workshops', workshop.id, e.target.checked)}
                                    disabled={isDisabled}
                                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                  />
                                  {isDisabled && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                      (Part of selected combo)
                                    </span>
                                  )}
                                  <div className="flex-1">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                      {workshop.name}
                                    </span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                                      ₹{workshop.price || 0}
                                    </span>
                                  </div>
                                </label>
                              );
                            })}
                             {workshops.length === 0 && (
                               <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                 No workshops available
                               </p>
                             )}
                           </div>
                           {userFormData.selected_workshops.length > 0 && (
                             <button
                               type="button"
                               onClick={() => setUserFormData(prev => ({ ...prev, selected_workshops: [] }))}
                               className="mt-2 text-xs text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
                             >
                               Clear All
                             </button>
                           )}
                        </div>
                        
                        {/* Combo Selections */}
                        <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                             Combos ({userFormData.selected_combos.length} selected)
                          </label>
                           <div className="mt-1 max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-gray-50 dark:bg-gray-800">
                            {combos.map(combo => (
                              <label key={combo.id} className="flex items-center space-x-3 py-2 rounded px-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={userFormData.selected_combos.includes(combo.id)}
                                    onChange={(e) => handleComboCheckboxChange(combo.id, e.target.checked)}
                                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                  />
                                 <div className="flex-1">
                                   <span className="text-sm font-medium text-gray-900 dark:text-white">
                                     {combo.name}
                                   </span>
                                   <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                                     ₹{combo.price || 0}
                                   </span>
                                 </div>
                               </label>
                             ))}
                             {combos.length === 0 && (
                               <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                 No combos available
                               </p>
                             )}
                           </div>
                           {userFormData.selected_combos.length > 0 && (
                             <button
                               type="button"
                               onClick={() => setUserFormData(prev => ({ ...prev, selected_combos: [] }))}
                               className="mt-2 text-xs text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300"
                             >
                               Clear All
                             </button>
                           )}
                                    </div>
                        
                        {/* Transaction Details */}
                        <div>
                          <label htmlFor="transaction_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Transaction ID
                          </label>
                           <div className="relative">
                          <input
                            type="text"
                            name="transaction_id"
                            id="transaction_id"
                              value={userFormData.transaction_id || ''}
                            onChange={handleUserFormChange}
                               className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white ${
                                 validationErrors.transaction_id 
                                   ? 'border-red-300 dark:border-red-600' 
                                   : 'border-gray-300 dark:border-gray-600'
                               }`}
                             />
                             {isValidating.transaction_id && (
                               <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
                               </div>
                             )}
                           </div>
                           {validationErrors.transaction_id && (
                             <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                               {validationErrors.transaction_id}
                             </p>
                           )}
                        </div>
                        
                        <div>
                          <label htmlFor="amount_paid" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Amount Paid (₹)
                          </label>
                          <input
                            type="number"
                            name="amount_paid"
                            id="amount_paid"
                            step="0.01"
                            value={userFormData.amount_paid || ''}
                            onChange={handleUserFormChange}
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                          />
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Calculated total: ₹{calculateTotalPrice().toFixed(2)}
                           </p>
                        </div>
                        
                        {/* Photo Upload */}
                        <div>
                          <label htmlFor="photo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Photo
                          </label>
                          <input
                            type="file"
                            id="photo"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {editingUser ? 'Update User' : 'Add User'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserModal(false)
                      setEditingUser(null)
                      setUserFormData({
                        name: '',
                        email: '',
                        phone: '',
                        enrollment_number: '',
                        college_id: '',
                        semester: '',
                        field_id: '',
                        role: 'participant',
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
                         transaction_id: ''
                      })
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Scanner Modal */}
      {showScannerModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75 dark:bg-gray-900 dark:opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleScannerSubmit}>
                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                        {editingScanner ? 'Edit Scanner' : 'Add New Scanner'}
                      </h3>
                      <div className="mt-4 space-y-4">
                        <div>
                          <label htmlFor="scanner_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Name
                          </label>
                          <input
                            type="text"
                            name="name"
                            id="scanner_name"
                            required
                            value={scannerFormData.name}
                            onChange={handleScannerFormChange}
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <label htmlFor="scanner_email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Email
                          </label>
                          <input
                            type="email"
                            name="email"
                            id="scanner_email"
                            required
                            value={scannerFormData.email}
                            onChange={handleScannerFormChange}
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <label htmlFor="scanner_phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Phone
                          </label>
                          <input
                            type="text"
                            name="phone"
                            id="scanner_phone"
                            value={scannerFormData.phone || ''}
                            onChange={handleScannerFormChange}
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <label htmlFor="scanner_college_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            College
                          </label>
                          <select
                            name="college_id"
                            id="scanner_college_id"
                            value={scannerFormData.college_id || ''}
                            onChange={handleScannerFormChange}
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                          >
                            <option value="">Select College</option>
                            {colleges.map(college => (
                              <option key={college.id} value={college.id}>{college.name}</option>
                            ))}
                          </select>
                      </div>
                        <div>
                          <label htmlFor="scanner_semester" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Semester
                          </label>
                          <input
                            type="text"
                            name="semester"
                            id="scanner_semester"
                            value={scannerFormData.semester || ''}
                            onChange={handleScannerFormChange}
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                          />
                    </div>
                        <div>
                          <label htmlFor="scanner_roll_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Roll Number
                          </label>
                          <input
                            type="text"
                            name="roll_number"
                            id="scanner_roll_number"
                            value={scannerFormData.roll_number || ''}
                            onChange={handleScannerFormChange}
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <label htmlFor="scanner_photo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Photo
                          </label>
                          <input
                            type="file"
                            id="scanner_photo"
                            accept="image/*"
                            onChange={handleScannerPhotoUpload}
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {editingScanner ? 'Update Scanner' : 'Add Scanner'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowScannerModal(false)
                      setEditingScanner(null)
                      setScannerFormData({
                        name: '',
                        email: '',
                        phone: '',
                        role: 'scanner_committee',
                        college_id: '',
                        semester: '',
                        roll_number: '',
                        photo_url: '',
                        photo_file: null
                      })
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {showScanModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75 dark:bg-gray-900 dark:opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      QR Code Scanner
                    </h3>
                    <div className="mt-4">
                      <div id="qr-reader" className="w-full"></div>
                    {scanResult && (
                        <div className={`mt-4 p-3 rounded-md ${
                        scanResult.success 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                          {scanResult.message}
                      </div>
                    )}
                    </div>
                    </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={stopScanning}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Stop Scanning
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

export default RegistrationCoordinator;
