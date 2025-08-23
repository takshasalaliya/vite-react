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

  const statCards = [
    { name: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-blue-500' },
    { name: 'Total Events', value: stats.totalEvents, icon: Calendar, color: 'bg-green-500' },
    { name: 'Total Workshops', value: stats.totalWorkshops, icon: BookOpen, color: 'bg-purple-500' },
    { name: 'Total Combos', value: stats.totalCombos, icon: Package, color: 'bg-orange-500' },
    { name: 'Total Registrations', value: stats.totalRegistrations, icon: ClipboardList, color: 'bg-indigo-500' },
    { name: 'Payments Received', value: `$${stats.totalPayments.toLocaleString()}`, icon: DollarSign, color: 'bg-emerald-500' },
    { name: 'Attendees Today', value: stats.attendeesToday, icon: TrendingUp, color: 'bg-pink-500' }
  ]

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Overview of your event management system
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.name} className="card p-5">
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-3 rounded-md ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    {stat.name}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {stat.value}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registrations by Event */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Registrations by Event
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={registrationsByEvent}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="registrations" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payments Over Time */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Payments Over Time
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={paymentsOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h3>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Dashboard refreshed at {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard 