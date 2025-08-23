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
  Filter
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { useAuth } from '../contexts/AuthContext'

const Attendance = () => {
  const [attendanceLogs, setAttendanceLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
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
  
  const scannerRef = useRef(null)
  const qrScannerRef = useRef(null)
  const { user: authUser, isScannerCommittee } = useAuth()

  useEffect(() => {
    fetchAttendanceLogs()
    fetchTargets()

    // realtime subscription for attendance table
    const channel = supabase
      .channel('attendance_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => {
        fetchAttendanceLogs()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentPage, searchTerm, dateRange])

  const fetchAttendanceLogs = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('attendance')
        .select(`
          *,
          users!inner(name, email, enrollment_number),
          events!inner(name),
          workshops!inner(title)
        `, { count: 'exact' })
        .order('scan_time', { ascending: false })

      if (searchTerm) {
        query = query.or(`users.name.ilike.%${searchTerm}%,users.email.ilike.%${searchTerm}%,users.enrollment_number.ilike.%${searchTerm}%`)
      }

      if (dateRange.start) {
        query = query.gte('scan_time', dateRange.start)
      }

      if (dateRange.end) {
        query = query.lte('scan_time', dateRange.end + 'T23:59:59')
      }

      const from = (currentPage - 1) * pageSize
      const to = from + pageSize - 1

      const { data, error, count } = await query.range(from, to)

      if (error) throw error

      // Process data to get target names
      const processedLogs = data?.map(log => {
        let targetName = ''
        if (log.target_type === 'event' && log.events) {
          targetName = log.events.name
        } else if (log.target_type === 'workshop' && log.workshops) {
          targetName = log.workshops.title
        }

        return {
          ...log,
          targetName
        }
      }) || []

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
          .select('id, name')
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
    
    // Initialize QR scanner
    setTimeout(() => {
      if (qrScannerRef.current) {
        qrScannerRef.current = new Html5QrcodeScanner(
          "qr-reader",
          { fps: 10, qrbox: { width: 250, height: 250 } },
          false
        )

        qrScannerRef.current.render(onScanSuccess, onScanFailure)
      }
    }, 100)
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
      if (!userId) {
        throw new Error('Invalid QR code format')
      }

      // Validate user has registration for selected targets
      const registrations = await validateUserRegistrations(userId)
      
      if (registrations.length === 0) {
        setScanResult({
          success: false,
          message: 'User not registered for any selected targets'
        })
        return
      }

      // Record attendance for each valid registration, prevent duplicates
      const currentUserId = authUser?.id || null

      for (const reg of registrations) {
        // Skip if already present
        const { data: existing } = await supabase
          .from('attendance')
          .select('id')
          .eq('user_id', userId)
          .eq('target_type', reg.target_type)
          .eq('target_id', reg.target_id)
          .limit(1)
        if (existing && existing.length > 0) {
          continue
        }

        await supabase
          .from('attendance')
          .insert([{ user_id: userId, target_type: reg.target_type, target_id: reg.target_id, scanned_by: currentUserId }])
      }

      setScanResult({
        success: true,
        message: `Attendance recorded for ${registrations.length} target(s)`,
        user: registrations[0].user_name
      })

      // Refresh attendance logs
      fetchAttendanceLogs()

      // Stop scanning after successful scan
      setTimeout(() => {
        stopScanning()
      }, 2000)

    } catch (error) {
      console.error('Error processing scan:', error)
      setScanResult({
        success: false,
        message: error.message
      })
    }
  }

  const onScanFailure = (error) => {
    // Handle scan failure silently
    console.log('QR scan failed:', error)
  }

  const validateUserRegistrations = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select(`*, users(name), events(name), workshops(title)`) // fetch minimal details
        .eq('user_id', userId)
        .eq('payment_status', 'approved')

      if (error) throw error

      const allowedPairs = new Set(selectedTargets.map(t => `${t.type}:${t.id}`))

      return (data || [])
        .filter(reg => allowedPairs.has(`${reg.target_type}:${reg.target_id}`))
        .map(reg => ({
          target_type: reg.target_type,
          target_id: reg.target_id,
          user_name: reg.users?.name || 'User',
          target_name: reg.target_type === 'event' ? reg.events?.name : reg.workshops?.title
        }))
    } catch (error) {
      console.error('Error validating registrations:', error)
      return []
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

  const exportToCSV = () => {
    const ws = XLSX.utils.json_to_sheet(attendanceLogs.map(log => ({
      'User Name': log.users.name,
      'Email': log.users.email,
      'Enrollment Number': log.users.enrollment_number,
      'Target Type': log.target_type,
      'Target Name': log.targetName,
      'Scan Time': new Date(log.scan_time).toLocaleString(),
      'Scanned By': log.scanned_by || 'System'
    })))
    
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance')
    XLSX.writeFile(wb, 'attendance-export.xlsx')
  }

  const clearFilters = () => {
    setSearchTerm('')
    setDateRange({ start: '', end: '' })
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
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Selected:</strong> {selectedTargets.length} target(s) - Scanning mode active
              </p>
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
      </div>

      {/* Attendance Logs Table */}
      <div className="card overflow-hidden">
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
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                QR Code Scanner
              </h3>
              
              {scanResult && (
                <div className={`mb-4 p-3 rounded-md ${
                  scanResult.success 
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                }`}>
                  <p className={`text-sm ${
                    scanResult.success 
                      ? 'text-green-800 dark:text-green-200' 
                      : 'text-red-800 dark:text-red-200'
                  }`}>
                    {scanResult.message}
                    {scanResult.user && ` - ${scanResult.user}`}
                  </p>
                </div>
              )}
              
              <div id="qr-reader" className="mb-4"></div>
              
              <div className="flex justify-end space-x-3">
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
      )}
    </div>
  )
}

export default Attendance 