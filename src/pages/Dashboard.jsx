import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Users, 
  Calendar, 
  BookOpen, 
  Package, 
  ClipboardList, 
  DollarSign,
  TrendingUp
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts'

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    totalWorkshops: 0,
    totalCombos: 0,
    totalRegistrations: 0,
    totalPayments: 0,
    attendeesToday: 0
  })
  const [registrationsByEvent, setRegistrationsByEvent] = useState([])
  const [paymentsOverTime, setPaymentsOverTime] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch counts
      const [
        usersCount,
        eventsCount,
        workshopsCount,
        combosCount,
        registrationsCount,
        paymentsSum,
        todayAttendance
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact' }),
        supabase.from('events').select('*', { count: 'exact' }),
        supabase.from('workshops').select('*', { count: 'exact' }),
        supabase.from('combos').select('*', { count: 'exact' }),
        supabase.from('registrations').select('*', { count: 'exact' }),
        supabase.from('registrations').select('amount_paid').eq('payment_status', 'approved'),
        supabase.from('attendance').select('*', { count: 'exact' }).gte('created_at', new Date().toISOString().split('T')[0])
      ])

      // Calculate payments sum
      const paymentsTotal = paymentsSum.data?.reduce((sum, reg) => sum + (reg.amount_paid || 0), 0) || 0

      setStats({
        totalUsers: usersCount.count || 0,
        totalEvents: eventsCount.count || 0,
        totalWorkshops: workshopsCount.count || 0,
        totalCombos: combosCount.count || 0,
        totalRegistrations: registrationsCount.count || 0,
        totalPayments: paymentsTotal,
        attendeesToday: todayAttendance.count || 0
      })

      // Fetch registrations by event
      const { data: eventRegistrations } = await supabase
        .from('registrations')
        .select(`
          *,
          events!inner(name)
        `)
        .eq('target_type', 'event')
        .not('events.name', 'is', null)

      const eventStats = eventRegistrations?.reduce((acc, reg) => {
        const eventName = reg.events.name
        acc[eventName] = (acc[eventName] || 0) + 1
        return acc
      }, {})

      const registrationsChartData = Object.entries(eventStats || {}).map(([name, count]) => ({
        name,
        registrations: count
      }))

      setRegistrationsByEvent(registrationsChartData)

      // Fetch payments over time (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const { data: recentPayments } = await supabase
        .from('registrations')
        .select('amount_paid, created_at')
        .eq('payment_status', 'approved')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at')

      // Group payments by date
      const paymentsByDate = recentPayments?.reduce((acc, payment) => {
        const date = new Date(payment.created_at).toLocaleDateString()
        acc[date] = (acc[date] || 0) + (payment.amount_paid || 0)
        return acc
      }, {})

      const paymentsChartData = Object.entries(paymentsByDate || {}).map(([date, amount]) => ({
        date,
        amount
      }))

      setPaymentsOverTime(paymentsChartData)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Overview of INNOSTRA '25 event management</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-sm sm:text-base font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-sm sm:text-base font-medium text-gray-600 dark:text-gray-400">Total Events</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.totalEvents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-sm sm:text-base font-medium text-gray-600 dark:text-gray-400">Workshops</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.totalWorkshops}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-sm sm:text-base font-medium text-gray-600 dark:text-gray-400">Combo Packages</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCombos}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                <ClipboardList className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-sm sm:text-base font-medium text-gray-600 dark:text-gray-400">Registrations</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.totalRegistrations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-sm sm:text-base font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">₹{stats.totalPayments.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-rose-100 dark:bg-rose-900 rounded-lg">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-sm sm:text-base font-medium text-gray-600 dark:text-gray-400">Today's Attendance</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.attendeesToday}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Registrations by Event */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">Registrations by Event</h3>
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={registrationsByEvent}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#9CA3AF"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="registrations" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payments Over Time */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">Payments Over Time</h3>
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={paymentsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard 