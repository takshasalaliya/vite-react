import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Download, 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp,
  BarChart3,
  FileText,
  Filter,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react'
import * as XLSX from 'xlsx'

const Reports = () => {
  const [loading, setLoading] = useState(false)
  const [reports, setReports] = useState([])
  const [selectedReport, setSelectedReport] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [dateRange, setDateRange] = useState('all')
  const [reportType, setReportType] = useState('all')

  useEffect(() => {
    generateReports()
  }, [dateRange, reportType])

  const generateReports = async () => {
    setLoading(true)
    try {
      const reportsData = []

      // Event Registrations Report
      if (reportType === 'all' || reportType === 'events') {
        const eventReport = await generateEventReport()
        reportsData.push(eventReport)
      }

      // Workshop Registrations Report
      if (reportType === 'all' || reportType === 'workshops') {
        const workshopReport = await generateWorkshopReport()
        reportsData.push(workshopReport)
      }

      // Combo Registrations Report
      if (reportType === 'all' || reportType === 'combos') {
        const comboReport = await generateComboReport()
        reportsData.push(comboReport)
      }

      // Payment Summary Report
      if (reportType === 'all' || reportType === 'payments') {
        const paymentReport = await generatePaymentReport()
        reportsData.push(paymentReport)
      }

      // User Analytics Report
      if (reportType === 'all' || reportType === 'users') {
        const userReport = await generateUserReport()
        reportsData.push(userReport)
      }

      setReports(reportsData)
    } catch (error) {
      console.error('Error generating reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateEventReport = async () => {
    let query = supabase
      .from('registrations')
      .select(`
        id, payment_status, amount_paid, created_at,
        users(id, name, email, phone, college_id, semester, field_id),
        events(id, name, price, category)
      `)
      .eq('target_type', 'event')

    if (dateRange !== 'all') {
      const startDate = getStartDate(dateRange)
      query = query.gte('created_at', startDate)
    }

    const { data: registrations } = await query

    const totalRegistrations = registrations?.length || 0
    const paidRegistrations = registrations?.filter(r => r.payment_status === 'approved').length || 0
    const pendingRegistrations = registrations?.filter(r => r.payment_status === 'pending').length || 0
    const totalRevenue = registrations?.reduce((sum, r) => sum + (r.amount_paid || 0), 0) || 0

    // Group by event
    const eventStats = {}
    registrations?.forEach(reg => {
      const eventName = reg.events?.name || 'Unknown Event'
      if (!eventStats[eventName]) {
        eventStats[eventName] = {
          total: 0,
          paid: 0,
          pending: 0,
          revenue: 0
        }
      }
      eventStats[eventName].total++
      if (reg.payment_status === 'approved') {
        eventStats[eventName].paid++
        eventStats[eventName].revenue += reg.amount_paid || 0
      } else if (reg.payment_status === 'pending') {
        eventStats[eventName].pending++
      }
    })

    return {
      id: 'event-registrations',
      title: 'Event Registrations',
      type: 'events',
      icon: Calendar,
      summary: {
        totalRegistrations,
        paidRegistrations,
        pendingRegistrations,
        totalRevenue
      },
      details: eventStats,
      rawData: registrations
    }
  }

  const generateWorkshopReport = async () => {
    let query = supabase
      .from('registrations')
      .select(`
        id, payment_status, amount_paid, created_at,
        users(id, name, email, phone, college_id, semester, field_id),
        workshops(id, title, fee, speakers)
      `)
      .eq('target_type', 'workshop')

    if (dateRange !== 'all') {
      const startDate = getStartDate(dateRange)
      query = query.gte('created_at', startDate)
    }

    const { data: registrations } = await query

    const totalRegistrations = registrations?.length || 0
    const paidRegistrations = registrations?.filter(r => r.payment_status === 'approved').length || 0
    const pendingRegistrations = registrations?.filter(r => r.payment_status === 'pending').length || 0
    const totalRevenue = registrations?.reduce((sum, r) => sum + (r.amount_paid || 0), 0) || 0

    // Group by workshop
    const workshopStats = {}
    registrations?.forEach(reg => {
      const workshopTitle = reg.workshops?.title || 'Unknown Workshop'
      if (!workshopStats[workshopTitle]) {
        workshopStats[workshopTitle] = {
          total: 0,
          paid: 0,
          pending: 0,
          revenue: 0
        }
      }
      workshopStats[workshopTitle].total++
      if (reg.payment_status === 'approved') {
        workshopStats[workshopTitle].paid++
        workshopStats[workshopTitle].revenue += reg.amount_paid || 0
      } else if (reg.payment_status === 'pending') {
        workshopStats[workshopTitle].pending++
      }
    })

    return {
      id: 'workshop-registrations',
      title: 'Workshop Registrations',
      type: 'workshops',
      icon: BarChart3,
      summary: {
        totalRegistrations,
        paidRegistrations,
        pendingRegistrations,
        totalRevenue
      },
      details: workshopStats,
      rawData: registrations
    }
  }

  const generateComboReport = async () => {
    let query = supabase
      .from('registrations')
      .select(`
        id, payment_status, amount_paid, created_at,
        users(id, name, email, phone, college_id, semester, field_id),
        combos(id, name, price)
      `)
      .eq('target_type', 'combo')

    if (dateRange !== 'all') {
      const startDate = getStartDate(dateRange)
      query = query.gte('created_at', startDate)
    }

    const { data: registrations } = await query

    const totalRegistrations = registrations?.length || 0
    const paidRegistrations = registrations?.filter(r => r.payment_status === 'approved').length || 0
    const pendingRegistrations = registrations?.filter(r => r.payment_status === 'pending').length || 0
    const totalRevenue = registrations?.reduce((sum, r) => sum + (r.amount_paid || 0), 0) || 0

    // Group by combo
    const comboStats = {}
    registrations?.forEach(reg => {
      const comboName = reg.combos?.name || 'Unknown Combo'
      if (!comboStats[comboName]) {
        comboStats[comboName] = {
          total: 0,
          paid: 0,
          pending: 0,
          revenue: 0
        }
      }
      comboStats[comboName].total++
      if (reg.payment_status === 'approved') {
        comboStats[comboName].paid++
        comboStats[comboName].revenue += reg.amount_paid || 0
      } else if (reg.payment_status === 'pending') {
        comboStats[comboName].pending++
      }
    })

      return {
      id: 'combo-registrations',
      title: 'Combo Registrations',
      type: 'combos',
      icon: TrendingUp,
      summary: {
        totalRegistrations,
        paidRegistrations,
        pendingRegistrations,
        totalRevenue
      },
      details: comboStats,
      rawData: registrations
    }
  }

  const generatePaymentReport = async () => {
    let query = supabase
      .from('registrations')
      .select('*')

    if (dateRange !== 'all') {
      const startDate = getStartDate(dateRange)
      query = query.gte('created_at', startDate)
    }

    const { data: registrations } = await query

    const totalRegistrations = registrations?.length || 0
    const approvedPayments = registrations?.filter(r => r.payment_status === 'approved').length || 0
    const pendingPayments = registrations?.filter(r => r.payment_status === 'pending').length || 0
    const declinedPayments = registrations?.filter(r => r.payment_status === 'declined').length || 0
    const totalRevenue = registrations?.reduce((sum, r) => sum + (r.amount_paid || 0), 0) || 0

    // Payment method breakdown
    const paymentMethods = {}
    registrations?.forEach(reg => {
      const method = reg.payment_method || 'Unknown'
      if (!paymentMethods[method]) {
        paymentMethods[method] = {
          count: 0,
          amount: 0
        }
      }
      paymentMethods[method].count++
      paymentMethods[method].amount += reg.amount_paid || 0
    })

    return {
      id: 'payment-summary',
      title: 'Payment Summary',
      type: 'payments',
      icon: DollarSign,
      summary: {
        totalRegistrations,
        approvedPayments,
        pendingPayments,
        declinedPayments,
        totalRevenue
      },
      details: paymentMethods,
      rawData: registrations
    }
  }

  const generateUserReport = async () => {
    let query = supabase
      .from('users')
      .select('*')

    if (dateRange !== 'all') {
      const startDate = getStartDate(dateRange)
      query = query.gte('created_at', startDate)
    }

    const { data: users } = await query

    const totalUsers = users?.length || 0
    const activeUsers = users?.filter(u => u.is_active !== false).length || 0
    const newUsers = users?.filter(u => {
      const userDate = new Date(u.created_at)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return userDate >= weekAgo
    }).length || 0

    // College distribution
    const collegeStats = {}
    users?.forEach(user => {
      const college = user.college_id || 'Unknown'
      if (!collegeStats[college]) {
        collegeStats[college] = 0
      }
      collegeStats[college]++
    })

      return {
      id: 'user-analytics',
      title: 'User Analytics',
      type: 'users',
      icon: Users,
      summary: {
        totalUsers,
        activeUsers,
        newUsers
      },
      details: collegeStats,
      rawData: users
    }
  }

  const getStartDate = (range) => {
    const now = new Date()
    switch (range) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      case 'month':
        return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString()
      case 'quarter':
        return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()).toISOString()
      default:
        return null
    }
  }

  const exportToExcel = (report) => {
    if (!report.rawData || report.rawData.length === 0) {
      alert('No data to export')
      return
    }

    const worksheet = XLSX.utils.json_to_sheet(report.rawData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, report.title)
    
    const fileName = `${report.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(workbook, fileName)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'declined':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Generating reports...</p>
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Comprehensive insights and data analysis</p>
      </div>
            <button
              onClick={generateReports}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm sm:text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
        </div>
      </div>

      {/* Filters */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Range</label>
                <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="quarter">Last 3 Months</option>
                </select>
              </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Report Type</label>
                <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Reports</option>
                <option value="events">Events</option>
                <option value="workshops">Workshops</option>
                <option value="combos">Combos</option>
                <option value="payments">Payments</option>
                <option value="users">Users</option>
                </select>
              </div>
          </div>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {reports.map((report) => {
            const Icon = report.icon
            return (
              <div key={report.id} className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                <div className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                        <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{report.title}</h3>
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {report.summary.totalRegistrations !== undefined && (
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{report.summary.totalRegistrations}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                      </div>
                    )}
                    {report.summary.totalUsers !== undefined && (
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{report.summary.totalUsers}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Users</p>
                      </div>
                    )}
                    {report.summary.paidRegistrations !== undefined && (
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{report.summary.paidRegistrations}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Paid</p>
                      </div>
                    )}
                    {report.summary.approvedPayments !== undefined && (
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{report.summary.approvedPayments}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Approved</p>
                      </div>
                    )}
                    {report.summary.pendingRegistrations !== undefined && (
                      <div className="text-center">
                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{report.summary.pendingRegistrations}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
            </div>
          )}
                    {report.summary.pendingPayments !== undefined && (
                      <div className="text-center">
                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{report.summary.pendingPayments}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
            </div>
          )}
                    {report.summary.totalRevenue !== undefined && (
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">₹{report.summary.totalRevenue}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Revenue</p>
              </div>
                    )}
                    {report.summary.activeUsers !== undefined && (
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{report.summary.activeUsers}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Active</p>
              </div>
          )}
        </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
                      onClick={() => {
                        setSelectedReport(report)
                        setShowModal(true)
                      }}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-200 dark:hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
          </button>
          <button
                      onClick={() => exportToExcel(report)}
                      className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
              <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {reports.length === 0 && !loading && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No reports</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">No data available for the selected filters.</p>
          </div>
        )}
      </div>

      {/* Report Details Modal */}
      {showModal && selectedReport && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 py-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {selectedReport.title} - Details
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <EyeOff className="h-6 w-6" />
          </button>
        </div>
      </div>

              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Item</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Paid/Approved</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Pending</th>
                        {selectedReport.summary.totalRevenue !== undefined && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Revenue</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {Object.entries(selectedReport.details).map(([key, value]) => (
                        <tr key={key}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {key}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {value.total || value.count || value}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {value.paid || value.approved || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {value.pending || '-'}
                          </td>
                          {selectedReport.summary.totalRevenue !== undefined && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              ₹{value.revenue || value.amount || 0}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {Object.keys(selectedReport.details).length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No details</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">No detailed data available for this report.</p>
            </div>
                )}
          </div>
          
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => exportToExcel(selectedReport)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export to Excel
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Close
                  </button>
                </div>
          </div>
        </div>
      </div>
        </div>
      )}
    </div>
  )
}

export default Reports 