import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Download, 
  FileText, 
  Users, 
  Calendar, 
  BookOpen, 
  Package,
  BarChart3,
  TrendingUp,
  DollarSign
} from 'lucide-react'
import * as XLSX from 'xlsx'

const Reports = () => {
  const [loading, setLoading] = useState(false)
  const [reportType, setReportType] = useState('users')
  const [filters, setFilters] = useState({
    college: '',
    field: '',
    target: '',
    paymentStatus: '',
    dateRange: { start: '', end: '' }
  })
  const [colleges, setColleges] = useState([])
  const [fields, setFields] = useState([])
  const [events, setEvents] = useState([])
  const [workshops, setWorkshops] = useState([])
  const [combos, setCombos] = useState([])

  useEffect(() => {
    fetchFilterOptions()
  }, [])

  const fetchFilterOptions = async () => {
    try {
      const [collegesData, fieldsData, eventsData, workshopsData, combosData] = await Promise.all([
        supabase.from('colleges').select('id, name').order('name'),
        supabase.from('fields').select('id, name').order('name'),
        supabase.from('events').select('id, name').eq('is_active', true).order('name'),
        supabase.from('workshops').select('id, title').eq('is_active', true).order('title'),
        supabase.from('combos').select('id, name').eq('is_active', true).order('name')
      ])

      setColleges(collegesData.data || [])
      setFields(fieldsData.data || [])
      setEvents(eventsData.data || [])
      setWorkshops(workshopsData.data || [])
      setCombos(combosData.data || [])
    } catch (error) {
      console.error('Error fetching filter options:', error)
    }
  }

  const generateReport = async () => {
    setLoading(true)
    
    try {
      let data = []
      
      switch (reportType) {
        case 'users':
          data = await generateUsersReport()
          break
        case 'registrations':
          data = await generateRegistrationsReport()
          break
        case 'attendance':
          data = await generateAttendanceReport()
          break
        case 'financial':
          data = await generateFinancialReport()
          break
        default:
          throw new Error('Invalid report type')
      }

      if (data.length === 0) {
        alert('No data found for the selected filters')
        return
      }

      exportToExcel(data, reportType)
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Error generating report: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const generateUsersReport = async () => {
    let query = supabase
      .from('users')
      .select(`
        *,
        colleges!inner(name),
        fields!inner(name)
      `)
      .order('created_at', { ascending: false })

    if (filters.college) {
      query = query.eq('college_id', filters.college)
    }

    if (filters.field) {
      query = query.eq('field_id', filters.field)
    }

    const { data, error } = await query
    if (error) throw error

    return data?.map(user => ({
      'Name': user.name,
      'Email': user.email,
      'Phone': user.phone || '',
      'Enrollment Number': user.enrollment_number || '',
      'College': user.colleges?.name || '',
      'Semester': user.semester || '',
      'Field': user.fields?.name || '',
      'Role': user.role,
      'Created At': new Date(user.created_at).toLocaleDateString()
    })) || []
  }

  const generateRegistrationsReport = async () => {
    let query = supabase
      .from('registrations')
      .select(`
        *,
        users!inner(name, email, enrollment_number),
        events!inner(name),
        workshops!inner(title),
        combos!inner(name)
      `)
      .order('created_at', { ascending: false })

    if (filters.target) {
      const [type, id] = filters.target.split(':')
      query = query.eq('target_type', type).eq('target_id', id)
    }

    if (filters.paymentStatus) {
      query = query.eq('payment_status', filters.paymentStatus)
    }

    if (filters.dateRange.start) {
      query = query.gte('created_at', filters.dateRange.start)
    }

    if (filters.dateRange.end) {
      query = query.lte('created_at', filters.dateRange.end + 'T23:59:59')
    }

    const { data, error } = await query
    if (error) throw error

    return data?.map(reg => {
      let targetName = ''
      if (reg.target_type === 'event' && reg.events) {
        targetName = reg.events.name
      } else if (reg.target_type === 'workshop' && reg.workshops) {
        targetName = reg.workshops.title
      } else if (reg.target_type === 'combo' && reg.combos) {
        targetName = reg.combos.name
      }

      return {
        'User Name': reg.users.name,
        'Email': reg.users.email,
        'Enrollment Number': reg.users.enrollment_number || '',
        'Target Type': reg.target_type,
        'Target Name': targetName,
        'Amount Paid': reg.amount_paid || 0,
        'Transaction ID': reg.transaction_id || '',
        'Payment Status': reg.payment_status,
        'Selected': reg.selected ? 'Yes' : 'No',
        'Created At': new Date(reg.created_at).toLocaleDateString()
      }
    }) || []
  }

  const generateAttendanceReport = async () => {
    let query = supabase
      .from('attendance')
      .select(`
        *,
        users!inner(name, email, enrollment_number),
        events!inner(name),
        workshops!inner(title)
      `)
      .order('scan_time', { ascending: false })

    if (filters.target) {
      const [type, id] = filters.target.split(':')
      query = query.eq('target_type', type).eq('target_id', id)
    }

    if (filters.dateRange.start) {
      query = query.gte('scan_time', filters.dateRange.start)
    }

    if (filters.dateRange.end) {
      query = query.lte('scan_time', filters.dateRange.end + 'T23:59:59')
    }

    const { data, error } = await query
    if (error) throw error

    return data?.map(log => {
      let targetName = ''
      if (log.target_type === 'event' && log.events) {
        targetName = log.events.name
      } else if (log.target_type === 'workshop' && log.workshops) {
        targetName = log.workshops.title
      }

      return {
        'User Name': log.users.name,
        'Email': log.users.email,
        'Enrollment Number': log.users.enrollment_number || '',
        'Target Type': log.target_type,
        'Target Name': targetName,
        'Scan Time': new Date(log.scan_time).toLocaleString(),
        'Scanned By': log.scanned_by || 'System'
      }
    }) || []
  }

  const generateFinancialReport = async () => {
    const { data, error } = await supabase
      .from('registrations')
      .select(`
        *,
        events!inner(name),
        workshops!inner(title),
        combos!inner(name)
      `)
      .eq('payment_status', 'approved')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Group by date and calculate totals
    const dailyTotals = data?.reduce((acc, reg) => {
      const date = new Date(reg.created_at).toLocaleDateString()
      if (!acc[date]) {
        acc[date] = {
          date,
          total: 0,
          eventRevenue: 0,
          workshopRevenue: 0,
          comboRevenue: 0,
          count: 0
        }
      }
      
      acc[date].total += reg.amount_paid || 0
      acc[date].count += 1
      
      if (reg.target_type === 'event') {
        acc[date].eventRevenue += reg.amount_paid || 0
      } else if (reg.target_type === 'workshop') {
        acc[date].workshopRevenue += reg.amount_paid || 0
      } else if (reg.target_type === 'combo') {
        acc[date].comboRevenue += reg.amount_paid || 0
      }
      
      return acc
    }, {}) || {}

    return Object.values(dailyTotals).map(day => ({
      'Date': day.date,
      'Total Revenue': day.total,
      'Event Revenue': day.eventRevenue,
      'Workshop Revenue': day.workshopRevenue,
      'Combo Revenue': day.comboRevenue,
      'Transaction Count': day.count
    }))
  }

  const exportToExcel = (data, reportName) => {
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, reportName.charAt(0).toUpperCase() + reportName.slice(1))
    XLSX.writeFile(wb, `${reportName}-report-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const clearFilters = () => {
    setFilters({
      college: '',
      field: '',
      target: '',
      paymentStatus: '',
      dateRange: { start: '', end: '' }
    })
  }

  const reportTypes = [
    { value: 'users', label: 'Users Report', icon: Users, description: 'Export user data with filters' },
    { value: 'registrations', label: 'Registrations Report', icon: Calendar, description: 'Export registration data with payment status' },
    { value: 'attendance', label: 'Attendance Report', icon: BookOpen, description: 'Export attendance logs with filters' },
    { value: 'financial', label: 'Financial Report', icon: DollarSign, description: 'Export revenue and payment data' }
  ]

  const paymentStatuses = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'declined', label: 'Declined' },
    { value: 'not_required', label: 'Not Required' }
  ]

  const allTargets = [
    ...events.map(e => ({ id: e.id, type: 'event', name: e.name })),
    ...workshops.map(w => ({ id: w.id, type: 'workshop', name: w.title })),
    ...combos.map(c => ({ id: c.id, type: 'combo', name: c.name }))
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Generate and export various reports from your event management system
        </p>
      </div>

      {/* Report Type Selection */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Select Report Type
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setReportType(type.value)}
              className={`p-4 rounded-lg border-2 text-left transition-colors ${
                reportType === type.value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  reportType === type.value
                    ? 'bg-primary-100 dark:bg-primary-800'
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  <type.icon className={`h-5 w-5 ${
                    reportType === type.value
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`} />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {type.label}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {type.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Report Filters
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportType === 'users' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  College
                </label>
                <select
                  value={filters.college}
                  onChange={(e) => setFilters(prev => ({ ...prev, college: e.target.value }))}
                  className="input-field"
                >
                  <option value="">All Colleges</option>
                  {colleges.map(college => (
                    <option key={college.id} value={college.id}>{college.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Field
                </label>
                <select
                  value={filters.field}
                  onChange={(e) => setFilters(prev => ({ ...prev, field: e.target.value }))}
                  className="input-field"
                >
                  <option value="">All Fields</option>
                  {fields.map(field => (
                    <option key={field.id} value={field.id}>{field.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {(reportType === 'registrations' || reportType === 'attendance') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target
              </label>
              <select
                value={filters.target}
                onChange={(e) => setFilters(prev => ({ ...prev, target: e.target.value }))}
                className="input-field"
              >
                <option value="">All Targets</option>
                {allTargets.map(target => (
                  <option key={`${target.type}:${target.id}`} value={`${target.type}:${target.id}`}>
                    {target.name} ({target.type})
                  </option>
                ))}
              </select>
            </div>
          )}

          {reportType === 'registrations' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment Status
              </label>
              <select
                value={filters.paymentStatus}
                onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value }))}
                className="input-field"
              >
                <option value="">All Statuses</option>
                {paymentStatuses.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>
          )}

          {(reportType === 'registrations' || reportType === 'attendance') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, start: e.target.value } }))}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, end: e.target.value } }))}
                  className="input-field"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex justify-between items-center mt-6">
          <button
            onClick={clearFilters}
            className="btn-secondary"
          >
            Clear Filters
          </button>

          <button
            onClick={generateReport}
            disabled={loading}
            className="btn-primary flex items-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>{loading ? 'Generating...' : 'Generate Report'}</span>
          </button>
        </div>
      </div>

      {/* Report Preview */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Report Preview
        </h3>
        
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-6 w-6 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Report Type:</strong> {reportTypes.find(t => t.value === reportType)?.label}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Filters Applied:</strong> {
                  Object.entries(filters)
                    .filter(([key, value]) => {
                      if (key === 'dateRange') {
                        return value.start || value.end
                      }
                      return value
                    })
                    .map(([key, value]) => {
                      if (key === 'dateRange') {
                        return `Date: ${value.start || 'Any'} to ${value.end || 'Any'}`
                      }
                      return `${key}: ${value}`
                    })
                    .join(', ') || 'None'
                }
              </p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Click "Generate Report" to create and download the Excel file with your selected filters.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reports 