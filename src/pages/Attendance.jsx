import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { 
  Search, 
  Download, 
  QrCode, 
  Users, 
  Calendar,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  Plus,
  User,
  X
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { useAuth } from '../contexts/AuthContext'
import UserQRCode from '../components/UserQRCode'

const Attendance = () => {
  const [attendanceLogs, setAttendanceLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [processingScan, setProcessingScan] = useState(false)
  const [selectedTargets, setSelectedTargets] = useState([])
  const [events, setEvents] = useState([])
  const [workshops, setWorkshops] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize] = useState(10)
  const [scanResult, setScanResult] = useState(null)
  const [showScanModal, setShowScanModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [users, setUsers] = useState([])
  const [searchUser, setSearchUser] = useState('')
  const [scanSessionCount, setScanSessionCount] = useState(0)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [lastAttendanceTime, setLastAttendanceTime] = useState(null)
  
  const scannerRef = useRef(null)
  const qrScannerRef = useRef(null)
  const { user: authUser, isScannerCommittee } = useAuth()

  useEffect(() => {
    fetchAttendanceLogs()
    fetchTargets()
    fetchUsers()

         // realtime subscription for attendance table
     const channel = supabase
       .channel('attendance_changes')
       .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => {
         fetchAttendanceLogs()
         setLastUpdate(new Date())
       })
       .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentPage, searchTerm, dateRange, selectedTargets])

  // Initialize scanner when modal opens
  useEffect(() => {
    if (showScanModal && scanning) {
      const timer = setTimeout(() => {
        try {
          if (qrScannerRef.current) {
            qrScannerRef.current = new Html5QrcodeScanner(
              "qr-reader",
              { fps: 10, qrbox: { width: 250, height: 250 } },
              false
            )
            qrScannerRef.current.render(onScanSuccess, onScanFailure)
          }
        } catch (error) {
          console.error('Error initializing scanner:', error)
          setScanResult({
            success: false,
            message: 'Failed to initialize scanner. Please try again.'
          })
        }
      }, 500) // Give modal time to render

      return () => clearTimeout(timer)
    }
  }, [showScanModal, scanning])

  const fetchAttendanceLogs = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('attendance')
        .select(`
          id, user_id, target_type, target_id, scan_time, scanned_by
        `, { count: 'exact' })
        .order('scan_time', { ascending: false })

      if (dateRange.start) {
        query = query.gte('scan_time', dateRange.start)
      }

      if (dateRange.end) {
        query = query.lte('scan_time', dateRange.end + 'T23:59:59')
      }

      // If a specific target selection is made, constrain by those target IDs and types
      if (selectedTargets && selectedTargets.length > 0) {
        // For now, we'll filter on the client side after fetching the data
        // This ensures we get all the data we need for proper filtering
      }

      const from = (currentPage - 1) * pageSize
      const to = from + pageSize - 1

      const { data, error, count } = await query.range(from, to)

      if (error) throw error

      // Fetch target names
      const eventIds = Array.from(new Set((data || []).filter(l => l.target_type === 'event').map(l => l.target_id)))
      const workshopIds = Array.from(new Set((data || []).filter(l => l.target_type === 'workshop').map(l => l.target_id)))
      const userIds = Array.from(new Set((data || []).map(l => l.user_id)))

      const [eventsRes, workshopsRes, usersRes] = await Promise.all([
        eventIds.length ? supabase.from('events').select('id, name').in('id', eventIds) : Promise.resolve({ data: [] }),
        workshopIds.length ? supabase.from('workshops').select('id, title').in('id', workshopIds) : Promise.resolve({ data: [] }),
        userIds.length ? supabase.from('users').select(`
          id, name, email, enrollment_number, phone, semester,
          college_id, field_id,
          colleges!college_id(name),
          fields!field_id(name)
        `).in('id', userIds) : Promise.resolve({ data: [] })
      ])

      const eventsMap = new Map((eventsRes.data || []).map(e => [e.id, e.name]))
      const workshopsMap = new Map((workshopsRes.data || []).map(w => [w.id, w.title]))
      const usersMap = new Map((usersRes.data || []).map(u => [u.id, u]))

      let processedLogs = (data || []).map(log => ({
          ...log,
        users: usersMap.get(log.user_id) || null,
        targetName: log.target_type === 'event' ? (eventsMap.get(log.target_id) || '') : (workshopsMap.get(log.target_id) || '')
      }))

      // Client-side search
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        processedLogs = processedLogs.filter(l => (
          (l.users?.name || '').toLowerCase().includes(term) ||
          (l.users?.email || '').toLowerCase().includes(term) ||
          (l.users?.enrollment_number || '').toLowerCase().includes(term)
        ))
      }

      // Client-side target filtering
      if (selectedTargets && selectedTargets.length > 0) {
        processedLogs = processedLogs.filter(l => 
          selectedTargets.some(target => 
            target.id === l.target_id && target.type === l.target_type
          )
        )
      }

      setAttendanceLogs(processedLogs)
      setTotalPages(Math.ceil((count || 0) / pageSize))
    } catch (error) {
      console.error('Error fetching attendance logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTargets = async () => {
    try {
      const [eventsData, workshopsData] = await Promise.all([
        supabase
          .from('events')
          .select('id, name, category')
          .eq('is_active', true)
          .order('name'),
        supabase
          .from('workshops')
          .select('id, title')
          .eq('is_active', true)
          .order('title')
      ])

      setEvents(eventsData.data || [])
      setWorkshops(workshopsData.data || [])
    } catch (error) {
      console.error('Error fetching targets:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, photo_url, enrollment_number')
        .eq('role', 'participant')
        .order('name')

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const startScanning = () => {
    if (!isScannerCommittee) {
      alert('Only Scanner Committee users can scan QR codes.')
      return
    }
    if (selectedTargets.length === 0) {
      alert('Please select at least one target (event/workshop) to scan for')
      return
    }

    setShowScanModal(true)
    setScanning(true)
    setProcessingScan(false)
    setScanResult(null) // Clear previous results
    setScanSessionCount(0) // Reset session count
  }

  const openQRGenerator = () => {
    setShowQRModal(true)
    setSelectedUser(null)
  }

  const selectUserForQR = (user) => {
    setSelectedUser(user)
  }

  const generateBulkQRCodes = () => {
    // This would generate QR codes for all users
    // For now, we'll just show a message
    alert('Bulk QR code generation feature coming soon!')
  }

  const stopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.clear()
      qrScannerRef.current = null
    }
    setScanning(false)
    setProcessingScan(false)
    setShowScanModal(false)
    setScanResult(null)
  }

  const onScanSuccess = async (decodedText, decodedResult) => {
    console.log('Attendance: QR Code scanned:', decodedText)
    console.log('Attendance: Current scanning state:', { scanning, processingScan })
    
    // Prevent multiple simultaneous scans - only check processingScan, not scanning
    if (processingScan) {
      console.log('Attendance: Scan blocked - already processing')
      return
    }
    
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
    
    // Set processing state to prevent multiple scans
    setProcessingScan(true)
    setScanning(false)
    
    try {
      // Parse QR code data
      let qrData
      try {
        qrData = JSON.parse(decodedText)
      } catch {
        // If not JSON, try to extract user_id from text
        qrData = { user_id: decodedText }
      }

      const userId = qrData.user_id || qrData.userId
      console.log('Attendance: Parsed user ID:', userId)
      if (!userId) {
        throw new Error('Invalid QR code format')
      }

      // Validate user has registration for selected targets
      let registrations
      try {
        registrations = await validateUserRegistrations(userId)
      } catch (validationError) {
        console.log('Attendance: Validation error:', validationError.message)
        setScanResult({
          success: false,
          message: validationError.message
        })
        setProcessingScan(false)
        setScanning(true)
        return
      }
      
      console.log('Attendance: Valid registrations found:', registrations.length)
      
      if (registrations.length === 0) {
        console.log('Attendance: No valid registrations')
        setScanResult({
          success: false,
          message: 'User not eligible: No approved registrations for selected targets or event not currently active'
        })
        setProcessingScan(false)
        setScanning(true)
        return
      }

      // Record attendance for each valid registration, prevent duplicates
      const currentUserId = authUser?.id || null
      let attendanceRecorded = 0
      let alreadyAttended = 0
      let errors = []

      for (const reg of registrations) {
        try {
          // First check if attendance already exists (double-check)
          const { data: existingAttendance, error: checkError } = await supabase
            .from('attendance')
            .select('id')
            .eq('user_id', userId)
            .eq('target_type', reg.target_type)
            .eq('target_id', reg.target_id)
            .limit(1)

          if (checkError) {
            errors.push(`Failed to check existing attendance for ${reg.target_name}: ${checkError.message}`)
            continue
          }

          if (existingAttendance && existingAttendance.length > 0) {
            alreadyAttended++
            continue
          }

          // Double-check again after a small delay to prevent race conditions
          await new Promise(resolve => setTimeout(resolve, 100))

          const { data: doubleCheck, error: doubleCheckError } = await supabase
            .from('attendance')
            .select('id')
            .eq('user_id', userId)
            .eq('target_type', reg.target_type)
            .eq('target_id', reg.target_id)
            .limit(1)

          if (doubleCheckError) {
            errors.push(`Failed to double-check existing attendance for ${reg.target_name}: ${doubleCheckError.message}`)
            continue
          }

          if (doubleCheck && doubleCheck.length > 0) {
            alreadyAttended++
            continue
          }

          // Insert new attendance record
          const { data, error } = await supabase
            .from('attendance')
            .insert([{ 
              user_id: userId, 
              target_type: reg.target_type, 
              target_id: reg.target_id, 
              scanned_by: currentUserId,
              scan_time: new Date().toISOString()
            }])

          if (error) {
            if (error.code === '23505') { // Unique constraint violation (fallback)
              alreadyAttended++
            } else {
              errors.push(`Failed to record attendance for ${reg.target_name}: ${error.message}`)
            }
          } else if (data && data.length > 0) {
            attendanceRecorded++
            // Set the last attendance time for cooldown
            setLastAttendanceTime(Date.now())
          }
        } catch (insertError) {
          if (insertError.code === '23505') { // Unique constraint violation
            alreadyAttended++
          } else {
            errors.push(`Failed to record attendance for ${reg.target_name}: ${insertError.message}`)
          }
        }
      }

      // Prepare result message
      let message = ''
      if (attendanceRecorded > 0 && alreadyAttended > 0) {
        message = `Attendance recorded for ${attendanceRecorded} target(s), ${alreadyAttended} already attended`
      } else if (attendanceRecorded > 0) {
        message = `Attendance recorded for ${attendanceRecorded} target(s)`
      } else if (alreadyAttended > 0) {
        message = `User already attended ${alreadyAttended} target(s)`
      }

      if (errors.length > 0) {
        message += `. Errors: ${errors.join(', ')}`
      }

             setScanResult({
         success: attendanceRecorded > 0,
         message: message,
         user: registrations[0].user_name
       })

       // Increment session count if attendance was recorded
       if (attendanceRecorded > 0) {
         setScanSessionCount(prev => prev + 1)
       }

       // Refresh attendance logs
       fetchAttendanceLogs()

       // Keep scanner open for multiple scans, just reset the result after showing
       // Add 2-second cooldown after scanning to prevent rapid successive scans
       setTimeout(() => {
         setScanResult(null)
         setProcessingScan(false)
         setScanning(true) // Re-enable scanning for next user
       }, 2000) // Show result for 2 seconds then reset

    } catch (error) {
      console.error('Error processing scan:', error)
      setScanResult({
        success: false,
        message: error.message
      })
      
      // Add 2-second cooldown after error to prevent rapid successive scans
      setTimeout(() => {
        setScanResult(null)
        setProcessingScan(false)
        setScanning(true) // Re-enable scanning for next attempt
      }, 2000)
    }
  }

  const onScanFailure = (error) => {
    // Handle scan failure silently
    console.log('QR scan failed:', error)
  }

  const validateUserRegistrations = async (userId) => {
    try {
      // First, get user details
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, email, role, is_active')
        .eq('id', userId)
        .single()

      if (userError || !userData) {
        throw new Error('User not found')
      }

      if (!userData.is_active) {
        throw new Error('User account is deactivated')
      }

      if (userData.role !== 'participant') {
        throw new Error('User is not a participant')
      }

      // Get all registrations for user (events, workshops, combos)
      const { data: regs, error } = await supabase
        .from('registrations')
        .select(`id, target_type, target_id, payment_status`)
        .eq('user_id', userId)

      if (error) throw error

      const allowedPairs = new Set(selectedTargets.map(t => `${t.type}:${t.id}`))

      const approvedRegs = (regs || []).filter(r => r.payment_status === 'approved')

      // Separate direct and combo registrations
      const directRegs = approvedRegs.filter(r => r.target_type === 'event' || r.target_type === 'workshop')
      const comboRegs = approvedRegs.filter(r => r.target_type === 'combo')

      // Expand combos into their included items
      let expandedFromCombos = []
      if (comboRegs.length > 0) {
        const comboIds = Array.from(new Set(comboRegs.map(r => r.target_id)))
        const { data: comboItems, error: ciErr } = await supabase
          .from('combo_items')
          .select('combo_id, target_type, target_id')
          .in('combo_id', comboIds)
        if (ciErr) throw ciErr
        expandedFromCombos = comboItems || []
      }

      // Collect all target ids to fetch details for validation
      const eventIds = Array.from(new Set([
        ...directRegs.filter(r => r.target_type === 'event').map(r => r.target_id),
        ...expandedFromCombos.filter(i => i.target_type === 'event').map(i => i.target_id),
      ]))
      const workshopIds = Array.from(new Set([
        ...directRegs.filter(r => r.target_type === 'workshop').map(r => r.target_id),
        ...expandedFromCombos.filter(i => i.target_type === 'workshop').map(i => i.target_id),
      ]))

      const [eventsRes, workshopsRes] = await Promise.all([
        eventIds.length ? supabase.from('events').select('id, name, is_active, start_time, end_time').in('id', eventIds) : Promise.resolve({ data: [] }),
        workshopIds.length ? supabase.from('workshops').select('id, title, is_active, start_time, end_time').in('id', workshopIds) : Promise.resolve({ data: [] })
      ])
      const eventsMap = new Map((eventsRes.data || []).map(e => [e.id, e]))
      const workshopsMap = new Map((workshopsRes.data || []).map(w => [w.id, w]))

          const now = new Date()
      const provisional = []

      // Add direct regs if match selected targets and valid timing/active
      for (const r of directRegs) {
        const pair = `${r.target_type}:${r.target_id}`
        if (!allowedPairs.has(pair)) continue
        if (r.target_type === 'event') {
          const e = eventsMap.get(r.target_id)
          if (!e || !e.is_active) continue
          const startTime = e.start_time ? new Date(e.start_time) : null
          const endTime = e.end_time ? new Date(e.end_time) : null
          if (startTime && endTime && (now < startTime || now > endTime)) continue
          provisional.push({ target_type: 'event', target_id: r.target_id, target_name: e.name, payment_status: r.payment_status })
        } else if (r.target_type === 'workshop') {
          const w = workshopsMap.get(r.target_id)
          if (!w || !w.is_active) continue
          const startTime = w.start_time ? new Date(w.start_time) : null
          const endTime = w.end_time ? new Date(w.end_time) : null
          if (startTime && endTime && (now < startTime || now > endTime)) continue
          provisional.push({ target_type: 'workshop', target_id: r.target_id, target_name: w.title, payment_status: r.payment_status })
        }
      }

      // Add combo-expanded items if match selected targets and valid timing/active
      for (const i of expandedFromCombos) {
        const pair = `${i.target_type}:${i.target_id}`
        if (!allowedPairs.has(pair)) continue
        if (i.target_type === 'event') {
          const e = eventsMap.get(i.target_id)
          // For combo-derived access, be lenient on timing/active
          if (!e) continue
          provisional.push({ target_type: 'event', target_id: i.target_id, target_name: e.name, payment_status: 'approved' })
        } else if (i.target_type === 'workshop') {
          const w = workshopsMap.get(i.target_id)
          if (!w) continue
          provisional.push({ target_type: 'workshop', target_id: i.target_id, target_name: w.title, payment_status: 'approved' })
        }
      }

      // If nothing matched but combo is approved and selected targets intersect combo items,
      // allow those items even if metadata couldn't be fetched
      if (provisional.length === 0 && expandedFromCombos.length > 0) {
        for (const i of expandedFromCombos) {
          const pair = `${i.target_type}:${i.target_id}`
          if (!allowedPairs.has(pair)) continue
          provisional.push({
            target_type: i.target_type,
            target_id: i.target_id,
            target_name: i.target_type === 'event' ? 'Event' : 'Workshop',
            payment_status: 'approved'
          })
        }
      }

      // Dedupe by target_type + target_id
      const dedupMap = new Map()
      for (const p of provisional) {
        const key = `${p.target_type}:${p.target_id}`
        if (!dedupMap.has(key)) dedupMap.set(key, p)
      }

      return Array.from(dedupMap.values())
    } catch (error) {
      console.error('Error validating registrations:', error)
      throw error
    }
  }

  const toggleTargetSelection = (target) => {
    setSelectedTargets(prev => {
      const exists = prev.find(t => t.id === target.id && t.type === target.type)
      if (exists) {
        return prev.filter(t => !(t.id === target.id && t.type === target.type))
      } else {
        return [...prev, target]
      }
    })
  }

  const exportToCSV = async () => {
    try {
      setLoading(true)
      
      // Fetch ALL attendance records (not just paginated ones)
      let query = supabase
        .from('attendance')
        .select(`
          id, user_id, target_type, target_id, scan_time, scanned_by
        `)
        .order('scan_time', { ascending: false })

      // Apply same filters as the main query
      if (dateRange.start) {
        query = query.gte('scan_time', dateRange.start)
      }

      if (dateRange.end) {
        query = query.lte('scan_time', dateRange.end + 'T23:59:59')
      }

      const { data: allAttendanceData, error } = await query

      if (error) {
        console.error('Error fetching attendance data for export:', error)
        alert('Error fetching attendance data. Please try again.')
        return
      }

      console.log('Export: Fetched attendance records count:', allAttendanceData?.length || 0)

      // Fetch target names and user details for all records
      const eventIds = Array.from(new Set((allAttendanceData || []).filter(l => l.target_type === 'event').map(l => l.target_id)))
      const workshopIds = Array.from(new Set((allAttendanceData || []).filter(l => l.target_type === 'workshop').map(l => l.target_id)))
      const userIds = Array.from(new Set((allAttendanceData || []).map(l => l.user_id)))

      const [eventsRes, workshopsRes, usersRes] = await Promise.all([
        eventIds.length ? supabase.from('events').select('id, name').in('id', eventIds) : Promise.resolve({ data: [] }),
        workshopIds.length ? supabase.from('workshops').select('id, title').in('id', workshopIds) : Promise.resolve({ data: [] }),
        userIds.length ? supabase.from('users').select(`
          id, name, email, enrollment_number, phone, semester,
          college_id, field_id,
          colleges!college_id(name),
          fields!field_id(name)
        `).in('id', userIds) : Promise.resolve({ data: [] })
      ])

      const eventsMap = new Map((eventsRes.data || []).map(e => [e.id, e.name]))
      const workshopsMap = new Map((workshopsRes.data || []).map(w => [w.id, w.title]))
      const usersMap = new Map((usersRes.data || []).map(u => [u.id, u]))

      // Process all attendance records
      let processedLogs = (allAttendanceData || []).map(log => ({
        ...log,
        users: usersMap.get(log.user_id) || null,
        targetName: log.target_type === 'event' ? (eventsMap.get(log.target_id) || '') : (workshopsMap.get(log.target_id) || '')
      }))

      // Apply client-side search filter if active
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        processedLogs = processedLogs.filter(l => (
          (l.users?.name || '').toLowerCase().includes(term) ||
          (l.users?.email || '').toLowerCase().includes(term) ||
          (l.users?.enrollment_number || '').toLowerCase().includes(term)
        ))
      }

      // Apply client-side target filtering if active
      if (selectedTargets && selectedTargets.length > 0) {
        processedLogs = processedLogs.filter(l => 
          selectedTargets.some(target => 
            target.id === l.target_id && target.type === l.target_type
          )
        )
      }

      console.log('Export: Final processed records count:', processedLogs.length)

      // Create Excel file
      const ws = XLSX.utils.json_to_sheet(processedLogs.map(log => ({
        'User Name': log.users?.name || 'N/A',
        'College': log.users?.colleges?.name || 'N/A',
        'Field': log.users?.fields?.name || 'N/A',
        'Semester': log.users?.semester || 'N/A',
        'Enrollment Number': log.users?.enrollment_number || 'N/A',
        'Phone Number': log.users?.phone || 'N/A',
        'Attendance Status': 'Present',
        'Event Name': log.targetName || 'N/A',
        'Target Type': log.target_type,
        'Scan Time': new Date(log.scan_time).toLocaleString(),
        'Scanned By': log.scanned_by || 'System'
      })))
      
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Attendance')
      XLSX.writeFile(wb, `attendance-export-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.xlsx`)
      
    } catch (error) {
      console.error('Error exporting attendance data:', error)
      alert('Error exporting attendance data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setDateRange({ start: '', end: '' })
    setSelectedTargets([])
    setCurrentPage(1)
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance Management</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Scan QR codes and manage attendance logs
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportToCSV}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="h-5 w-5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={openQRGenerator}
            className="btn-secondary flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Generate QR Code</span>
          </button>
          <button
            onClick={generateBulkQRCodes}
            className="btn-secondary flex items-center space-x-2"
          >
            <Users className="h-5 w-5" />
            <span>Bulk QR Codes</span>
          </button>
          <button
            onClick={startScanning}
            className="btn-primary flex items-center space-x-2"
          >
            <QrCode className="h-5 w-5" />
            <span>Start Scanning</span>
          </button>
        </div>
      </div>

      {/* Target Selection */}
      <div className="card p-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Select Targets for Scanning
        </h3>
        
        <div className="space-y-4">
          {/* Food Category */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Food</h4>
            <div className="flex flex-wrap gap-2">
              {events.filter(e => e.category === 'food').map(event => {
                const isSelected = selectedTargets.some(t => t.id === event.id && t.type === 'event')
                return (
                  <button
                    key={event.id}
                    onClick={() => toggleTargetSelection({ id: event.id, type: 'event' })}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      isSelected
                        ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {event.name}
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Events</h4>
            <div className="flex flex-wrap gap-2">
              {events.map(event => {
                const isSelected = selectedTargets.some(t => t.id === event.id && t.type === 'event')
                return (
                  <button
                    key={event.id}
                    onClick={() => toggleTargetSelection({ id: event.id, type: 'event' })}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      isSelected
                        ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {event.name}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Workshops</h4>
            <div className="flex flex-wrap gap-2">
              {workshops.map(workshop => {
                const isSelected = selectedTargets.some(t => t.id === workshop.id && t.type === 'workshop')
                return (
                  <button
                    key={workshop.id}
                    onClick={() => toggleTargetSelection({ id: workshop.id, type: 'workshop' })}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      isSelected
                        ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {workshop.title}
                  </button>
                )
              })}
            </div>
          </div>

          {selectedTargets.length > 0 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <div className="flex justify-between items-center">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Selected:</strong> {selectedTargets.length} target(s) - Scanning mode active
              </p>
                <button
                  onClick={() => setSelectedTargets([])}
                  className="text-xs text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100 underline"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}
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
                placeholder="Search by name, email, or enrollment number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="input-field"
              placeholder="Start Date"
            />

            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="input-field"
              placeholder="End Date"
            />

            <button
              onClick={clearFilters}
              className="btn-secondary"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Filter Status */}
        {(searchTerm || dateRange.start || dateRange.end || selectedTargets.length > 0) && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-blue-800 dark:text-blue-200">
                <Filter className="w-4 h-4" />
                <span><strong>Active Filters:</strong></span>
                {searchTerm && <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded text-xs">Search: "{searchTerm}"</span>}
                {dateRange.start && <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded text-xs">From: {dateRange.start}</span>}
                {dateRange.end && <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded text-xs">To: {dateRange.end}</span>}
                {selectedTargets.length > 0 && <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded text-xs">{selectedTargets.length} Target(s)</span>}
              </div>
              <button
                onClick={clearFilters}
                className="text-xs text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100 underline"
              >
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>

             {/* Attendance Logs Table */}
       <div className="card overflow-hidden">
         <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
           <h3 className="text-lg font-medium text-gray-900 dark:text-white">Attendance Logs</h3>
           <div className="flex items-center space-x-4">
             <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
               <span>Live Updates</span>
               <span>•</span>
               <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
             </div>
             <button
               onClick={() => {
                 fetchAttendanceLogs()
                 setLastUpdate(new Date())
               }}
               className="btn-secondary text-sm px-3 py-1"
               disabled={loading}
             >
               {loading ? 'Refreshing...' : 'Refresh'}
             </button>
           </div>
         </div>
         <div className="overflow-x-auto">
           <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Scan Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  QR Code
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {attendanceLogs.map((log) => (
                <tr key={log.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {log.users.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {log.users.email}
                      </div>
                      <div className="text-xs text-gray-400">
                        {log.users.enrollment_number}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {log.targetName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {log.target_type}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {new Date(log.scan_time).toLocaleString()}
                    </div>
                  </td>
                                     <td className="px-6 py-4 whitespace-nowrap">
                     <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                       <CheckCircle className="h-3 w-3 mr-1" />
                       Present
                     </span>
                     <div className="text-xs text-gray-500 mt-1">
                       {new Date(log.scan_time).toLocaleTimeString()}
                     </div>
                   </td>
                                     <td className="px-6 py-4 whitespace-nowrap">
                     <div className="flex space-x-2">
                       <button
                         onClick={() => {
                           setSelectedUser({
                             id: log.users.id,
                             name: log.users.name,
                             email: log.users.email,
                             photo_url: log.users.photo_url
                           })
                           setShowQRModal(true)
                         }}
                         className="flex items-center space-x-2 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-md hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                       >
                         <QrCode className="w-4 h-4" />
                         <span className="text-sm">View QR</span>
                       </button>
                       <button
                         onClick={() => {
                           const url = `${window.location.origin}/attendance/${log.users.id}`
                           navigator.clipboard.writeText(url)
                           alert('Attendance link copied to clipboard!')
                         }}
                         className="flex items-center space-x-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                         title="Copy attendance link for user"
                       >
                         <Eye className="w-4 h-4" />
                         <span className="text-sm">Share</span>
                       </button>
                     </div>
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white dark:bg-gray-900 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="btn-secondary disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="btn-secondary disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                          : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* QR Scanner Modal */}
      {showScanModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
                             <div className="flex justify-between items-center mb-4">
                 <div>
                   <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                     QR Code Scanner
                   </h3>
                   {scanSessionCount > 0 && (
                     <p className="text-sm text-gray-500 dark:text-gray-400">
                       Session: {scanSessionCount} user(s) scanned
                     </p>
                   )}
                 </div>
                 <button
                   onClick={stopScanning}
                   className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                 >
                   <X className="w-5 w-5" />
                 </button>
               </div>
              
              {scanResult && (
                <div className={`mb-4 p-3 rounded-md ${
                  scanResult.success 
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-start space-x-2">
                    {scanResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        scanResult.success 
                          ? 'text-green-800 dark:text-green-200' 
                          : 'text-red-800 dark:text-red-200'
                      }`}>
                        {scanResult.message}
                      </p>
                      {scanResult.user && (
                        <p className={`text-xs mt-1 ${
                          scanResult.success 
                            ? 'text-green-700 dark:text-green-300' 
                            : 'text-red-700 dark:text-red-300'
                        }`}>
                          User: {scanResult.user}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
                             <div id="qr-reader" className="mb-4 min-h-[300px] flex items-center justify-center">
                 {!scanning && (
                   <div className="text-center text-gray-500">
                     {processingScan ? (
                       <div className="text-center">
                         <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-2"></div>
                         <p className="text-sm font-medium">Processing Scan...</p>
                         <p className="text-xs text-gray-400">Please wait, checking attendance...</p>
                       </div>
                     ) : scanResult ? (
                       <div className="text-center">
                         <div className="w-16 h-16 mx-auto mb-2">
                           {scanResult.success ? (
                             <CheckCircle className="w-16 h-16 text-green-500" />
                           ) : (
                             <XCircle className="w-16 h-16 text-red-500" />
                           )}
                         </div>
                         <p className="text-sm font-medium">Scan Complete</p>
                         <p className="text-xs text-gray-400">Ready for next scan in a few seconds...</p>
                       </div>
                     ) : (
                       <div className="text-center">
                         <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-2"></div>
                         <p>Initializing scanner...</p>
                       </div>
                     )}
                   </div>
                 )}
                 {scanning && !processingScan && !scanResult && (
                   <div className="text-center text-green-600">
                     <div className="w-16 h-16 mx-auto mb-2">
                       <QrCode className="w-16 h-16 text-green-500" />
                     </div>
                     <p className="text-sm font-medium">Ready to Scan</p>
                     <p className="text-xs text-gray-400">Point camera at QR code</p>
                   </div>
                 )}
               </div>
              
                             <div className="flex justify-between items-center">
                 <div className="text-sm text-gray-500 dark:text-gray-400">
                   {scanSessionCount > 0 && (
                     <span>Total scanned: {scanSessionCount}</span>
                   )}
                 </div>
                 <div className="flex space-x-3">
                   {scanResult && (
                     <button
                       onClick={() => {
                         setScanResult(null)
                         setProcessingScan(false)
                         setScanning(true)
                       }}
                       className="btn-primary text-sm px-3 py-1"
                     >
                       New Scan
                     </button>
                   )}
                   <button
                     onClick={stopScanning}
                     className="btn-secondary"
                   >
                     Stop Scanning
                   </button>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Generation Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-medium text-gray-900 dark:text-white">
                  Generate Attendance QR Code
                </h3>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Selection */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Search Users
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by name, email, or enrollment number..."
                        value={searchUser}
                        onChange={(e) => setSearchUser(e.target.value)}
                        className="input-field pl-10"
                      />
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
                    {users
                      .filter(user => 
                        user.name?.toLowerCase().includes(searchUser.toLowerCase()) ||
                        user.email?.toLowerCase().includes(searchUser.toLowerCase()) ||
                        user.enrollment_number?.toLowerCase().includes(searchUser.toLowerCase())
                      )
                      .map(user => (
                        <div
                          key={user.id}
                          onClick={() => selectUserForQR(user)}
                          className={`p-3 border-b border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                            selectedUser?.id === user.id ? 'bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              {user.photo_url ? (
                                <img
                                  src={user.photo_url}
                                  alt={user.name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                  <User className="w-5 h-5 text-purple-500" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.name}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {user.email}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500">
                                ID: {user.id}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                                 {/* QR Code Display */}
                 <div className="flex items-center justify-center">
                   {selectedUser ? (
                     <div className="text-center">
                       <UserQRCode
                         userId={selectedUser.id}
                         userName={selectedUser.name}
                         userEmail={selectedUser.email}
                         userPhoto={selectedUser.photo_url}
                       />
                       <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                         <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                           Share this attendance link with the user:
                         </p>
                         <div className="flex items-center space-x-2">
                           <input
                             type="text"
                             value={`${window.location.origin}/attendance/${selectedUser.id}`}
                             readOnly
                             className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
                           />
                           <button
                             onClick={() => {
                               const url = `${window.location.origin}/attendance/${selectedUser.id}`
                               navigator.clipboard.writeText(url)
                               alert('Attendance link copied to clipboard!')
                             }}
                             className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                           >
                             Copy
                           </button>
                         </div>
                         <p className="text-xs text-blue-600 dark:text-blue-300 mt-2">
                           Users can open this link to show their QR code with real-time attendance updates
                         </p>
                       </div>
                     </div>
                   ) : (
                     <div className="text-center p-8 text-gray-500 dark:text-gray-400">
                       <QrCode className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                       <p>Select a user to generate their QR code</p>
                     </div>
                   )}
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Attendance 
