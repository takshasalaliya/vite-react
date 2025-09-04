import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Search, 
  Filter, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  Edit,
  DollarSign
} from 'lucide-react'
import * as XLSX from 'xlsx'

const Registrations = () => {
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTargetType, setSelectedTargetType] = useState('')
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize] = useState(10)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedRegistration, setSelectedRegistration] = useState(null)
  const [paymentForm, setPaymentForm] = useState({
    amount_paid: 0,
    transaction_id: '',
    payment_status: 'pending',
    audit_note: ''
  })

  const paymentStatuses = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
    { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    { value: 'declined', label: 'Declined', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
    { value: 'not_required', label: 'Not Required', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' }
  ]

  const targetTypes = [
    { value: 'event', label: 'Event' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'combo', label: 'Combo' }
  ]

  useEffect(() => {
    fetchRegistrations()
  }, [currentPage, selectedTargetType, selectedPaymentStatus, dateRange])

  const fetchRegistrations = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('registrations')
        .select(`
          id, user_id, target_type, target_id, amount_paid, transaction_id, payment_status, created_at,
          users(id, name, email, enrollment_number)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

      if (selectedTargetType) {
        query = query.eq('target_type', selectedTargetType)
      }

      if (selectedPaymentStatus) {
        query = query.eq('payment_status', selectedPaymentStatus)
      }

      if (dateRange.start) {
        query = query.gte('created_at', dateRange.start)
      }

      if (dateRange.end) {
        query = query.lte('created_at', dateRange.end + 'T23:59:59')
      }

      const from = (currentPage - 1) * pageSize
      const to = from + pageSize - 1

      const { data, error, count } = await query.range(from, to)

      if (error) throw error

      // Collect target IDs per type and fetch their names
      const eventIds = Array.from(new Set((data || []).filter(r => r.target_type === 'event').map(r => r.target_id)))
      const workshopIds = Array.from(new Set((data || []).filter(r => r.target_type === 'workshop').map(r => r.target_id)))
      const comboIds = Array.from(new Set((data || []).filter(r => r.target_type === 'combo').map(r => r.target_id)))

      const [eventsRes, workshopsRes, combosRes] = await Promise.all([
        eventIds.length ? supabase.from('events').select('id, name').in('id', eventIds) : Promise.resolve({ data: [] }),
        workshopIds.length ? supabase.from('workshops').select('id, title').in('id', workshopIds) : Promise.resolve({ data: [] }),
        comboIds.length ? supabase.from('combos').select('id, name').in('id', comboIds) : Promise.resolve({ data: [] })
      ])

      const eventsMap = new Map((eventsRes.data || []).map(e => [e.id, e.name]))
      const workshopsMap = new Map((workshopsRes.data || []).map(w => [w.id, w.title]))
      const combosMap = new Map((combosRes.data || []).map(c => [c.id, c.name]))

      let processedRegistrations = (data || []).map(reg => ({
        ...reg,
        targetName:
          reg.target_type === 'event' ? (eventsMap.get(reg.target_id) || '') :
          reg.target_type === 'workshop' ? (workshopsMap.get(reg.target_id) || '') :
          reg.target_type === 'combo' ? (combosMap.get(reg.target_id) || '') : ''
      }))

      // Client-side search filter on current page
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        processedRegistrations = processedRegistrations.filter(r => (
          (r.users?.name || '').toLowerCase().includes(term) ||
          (r.users?.email || '').toLowerCase().includes(term) ||
          (r.users?.enrollment_number || '').toLowerCase().includes(term)
        ))
      }

      setRegistrations(processedRegistrations)
      setTotalPages(Math.ceil((count || 0) / pageSize))
    } catch (error) {
      console.error('Error fetching registrations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentUpdate = async (e) => {
    e.preventDefault()
    
    try {
      const { error } = await supabase
        .from('registrations')
        .update({
          amount_paid: parseFloat(paymentForm.amount_paid) || 0,
          transaction_id: paymentForm.transaction_id,
          payment_status: paymentForm.payment_status,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRegistration.id)
      
      if (error) throw error

      // If this is a combo registration and payment is approved, update child registrations
      if (selectedRegistration.target_type === 'combo' && paymentForm.payment_status === 'approved') {
        await updateChildRegistrations(selectedRegistration.id)
      }

      setShowPaymentModal(false)
      setSelectedRegistration(null)
      setPaymentForm({
        amount_paid: 0,
        transaction_id: '',
        payment_status: 'pending',
        audit_note: ''
      })
      fetchRegistrations()
    } catch (error) {
      console.error('Error updating payment:', error)
      alert('Error updating payment: ' + error.message)
    }
  }

  const updateChildRegistrations = async (parentRegistrationId) => {
    try {
      const { error } = await supabase
        .from('registrations')
        .update({
          payment_status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('parent_registration_id', parentRegistrationId)
      
      if (error) throw error
    } catch (error) {
      console.error('Error updating child registrations:', error)
    }
  }

  const openPaymentModal = (registration) => {
    setSelectedRegistration(registration)
    setPaymentForm({
      amount_paid: registration.amount_paid || 0,
      transaction_id: registration.transaction_id || '',
      payment_status: registration.payment_status || 'pending',
      audit_note: ''
    })
    setShowPaymentModal(true)
  }

  const exportToCSV = () => {
    const ws = XLSX.utils.json_to_sheet(registrations.map(reg => ({
      'User Name': reg.users.name,
      'Email': reg.users.email,
      'Enrollment Number': reg.users.enrollment_number,
      'Target Type': reg.target_type,
      'Target Name': reg.targetName,
      'Amount Paid': reg.amount_paid,
      'Transaction ID': reg.transaction_id,
      'Payment Status': reg.payment_status,
      'Selected': reg.selected ? 'Yes' : 'No',
      'Created At': new Date(reg.created_at).toLocaleDateString()
    })))
    
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Registrations')
    XLSX.writeFile(wb, 'registrations-export.xlsx')
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedTargetType('')
    setSelectedPaymentStatus('')
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Registrations Management</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage all registrations and payment approvals
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="btn-secondary flex items-center space-x-2"
        >
          <Download className="h-5 w-5" />
          <span>Export CSV</span>
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
                placeholder="Search by name, email, or enrollment number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedTargetType}
              onChange={(e) => setSelectedTargetType(e.target.value)}
              className="input-field"
            >
              <option value="">All Types</option>
              {targetTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>

            <select
              value={selectedPaymentStatus}
              onChange={(e) => setSelectedPaymentStatus(e.target.value)}
              className="input-field"
            >
              <option value="">All Statuses</option>
              {paymentStatuses.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>

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

      {/* Registrations table */}
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
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {registrations.map((registration) => (
                <tr key={registration.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {registration.users.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {registration.users.email}
                      </div>
                      <div className="text-xs text-gray-400">
                        {registration.users.enrollment_number}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {registration.targetName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {registration.target_type}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900 dark:text-white">
                        ${registration.amount_paid || 0}
                      </div>
                      {registration.transaction_id && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          ID: {registration.transaction_id}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      paymentStatuses.find(s => s.value === registration.payment_status)?.color || 'bg-gray-100 text-gray-800'
                    }`}>
                      {paymentStatuses.find(s => s.value === registration.payment_status)?.label || registration.payment_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => openPaymentModal(registration)}
                      className="text-primary-600 hover:text-primary-900 dark:hover:text-primary-400 mr-3"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openPaymentModal(registration)}
                      className="text-gray-600 hover:text-gray-900 dark:hover:text-gray-400"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
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

      {/* Payment Update Modal */}
      {showPaymentModal && selectedRegistration && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Update Payment Details
              </h3>
              
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>User:</strong> {selectedRegistration.users.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Target:</strong> {selectedRegistration.targetName} ({selectedRegistration.target_type})
                </p>
              </div>
              
              <form onSubmit={handlePaymentUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Amount Paid
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={paymentForm.amount_paid}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, amount_paid: e.target.value }))}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Transaction ID
                  </label>
                  <input
                    type="text"
                    value={paymentForm.transaction_id}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, transaction_id: e.target.value }))}
                    className="input-field"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Payment Status
                  </label>
                  <select
                    value={paymentForm.payment_status}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_status: e.target.value }))}
                    className="input-field"
                  >
                    {paymentStatuses.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Audit Note
                  </label>
                  <textarea
                    value={paymentForm.audit_note}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, audit_note: e.target.value }))}
                    className="input-field"
                    rows="3"
                    placeholder="Optional note for audit trail"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentModal(false)
                      setSelectedRegistration(null)
                      setPaymentForm({
                        amount_paid: 0,
                        transaction_id: '',
                        payment_status: 'pending',
                        audit_note: ''
                      })
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Update Payment
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

export default Registrations 