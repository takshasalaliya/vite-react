import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Settings as SettingsIcon, 
  Shield, 
  Database, 
  FileText, 
  Code,
  Copy,
  CheckCircle
} from 'lucide-react'

const Settings = () => {
  const [activeTab, setActiveTab] = useState('audit')
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState('')

  useEffect(() => {
    fetchAuditLogs()
  }, [])

  const fetchAuditLogs = async () => {
    try {
      setLoading(true)
      // In a real implementation, you would have an audit_logs table
      // For now, we'll show sample data
      const sampleLogs = [
        {
          id: 1,
          action: 'CREATE',
          table_name: 'users',
          record_id: 'uuid-1',
          user_id: 'admin-user',
          details: 'Created new user: John Doe',
          timestamp: new Date().toISOString()
        },
        {
          id: 2,
          action: 'UPDATE',
          table_name: 'events',
          record_id: 'uuid-2',
          user_id: 'admin-user',
          details: 'Updated event: Tech Conference 2024',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 3,
          action: 'DELETE',
          table_name: 'workshops',
          record_id: 'uuid-3',
          user_id: 'admin-user',
          details: 'Deleted workshop: React Basics',
          timestamp: new Date(Date.now() - 7200000).toISOString()
        }
      ]
      
      setAuditLogs(sampleLogs)
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(''), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const rlsExamples = {
    users: `-- Users table RLS
CREATE POLICY "Users can read their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can read all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert/update/delete users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );`,

    events: `-- Events table RLS
CREATE POLICY "Event managers can manage their events" ON events
  FOR ALL USING (
    manager_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Event handlers can update assigned events" ON events
  FOR UPDATE USING (
    handler_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );`,

    registrations: `-- Registrations table RLS
CREATE POLICY "Users can read their own registrations" ON registrations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins and managers can read all registrations" ON registrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'event_manager')
    )
  );

CREATE POLICY "Admins can manage all registrations" ON registrations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );`
  }

  const tabs = [
    { id: 'audit', label: 'Audit Logs', icon: FileText },
    { id: 'rls', label: 'RLS Examples', icon: Shield },
    { id: 'config', label: 'Configuration', icon: SettingsIcon }
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings & Configuration</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          System configuration, security policies, and audit logs
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'audit' && (
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Audit Logs
            </h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Table
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          log.action === 'CREATE' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          log.action === 'UPDATE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {log.table_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {log.details}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {log.user_id}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'rls' && (
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Row Level Security (RLS) Examples
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                These are example RLS policies you can implement in your Supabase database to secure your data.
              </p>
            </div>

            {Object.entries(rlsExamples).map(([table, policy]) => (
              <div key={table} className="card p-6">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                  {table.charAt(0).toUpperCase() + table.slice(1)} Table Policies
                </h4>
                
                <div className="relative">
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{policy}</code>
                  </pre>
                  
                  <button
                    onClick={() => copyToClipboard(policy, table)}
                    className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 hover:text-white transition-colors"
                  >
                    {copied === table ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'config' && (
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                System Configuration
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Environment Variables
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <code className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                        VITE_SUPABASE_URL=your_supabase_url
                      </code>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      <code className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                        VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
                      </code>
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Storage Buckets
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• <code className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">profile-photos</code> - User profile images</li>
                      <li>• <code className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">event-photos</code> - Event images</li>
                      <li>• <code className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">workshop-photos</code> - Workshop images</li>
                      <li>• <code className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">combo-photos</code> - Combo package images</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    File Upload Limits
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Maximum file size: <strong>1MB</strong><br />
                      Allowed formats: <strong>JPEG, JPG, PNG</strong>
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Database Extensions
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Required: <code className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">pgcrypto</code> for UUID generation
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Setup Instructions
              </h3>
              
              <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
                <div>
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">1. Database Setup</h4>
                  <p>Run the provided SQL migration file to create all tables, triggers, and indexes.</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">2. Storage Buckets</h4>
                  <p>Create the required storage buckets in Supabase with appropriate RLS policies.</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">3. RLS Policies</h4>
                  <p>Implement the RLS policies shown above to secure your data.</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">4. First Admin User</h4>
                  <p>Create your first admin user through Supabase Auth, then manually set their role to 'admin' in the users table.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Settings 