import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Edit, Trash2, Building2 } from 'lucide-react'

const Colleges = () => {
  const [colleges, setColleges] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCollege, setEditingCollege] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    country: '',
    phone: '',
    email: ''
  })

  useEffect(() => {
    fetchColleges()
  }, [])

  const fetchColleges = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('colleges')
        .select('*')
        .order('name')
      
      if (error) throw error
      setColleges(data || [])
    } catch (error) {
      console.error('Error fetching colleges:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (editingCollege) {
        const { error } = await supabase
          .from('colleges')
          .update(formData)
          .eq('id', editingCollege.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('colleges')
          .insert([formData])
        
        if (error) throw error
      }

      setShowModal(false)
      setEditingCollege(null)
      resetForm()
      fetchColleges()
    } catch (error) {
      console.error('Error saving college:', error)
      alert('Error saving college: ' + error.message)
    }
  }

  const handleEdit = (college) => {
    setEditingCollege(college)
    setFormData({
      name: college.name || '',
      address: college.address || '',
      city: college.city || '',
      state: college.state || '',
      country: college.country || '',
      phone: college.phone || '',
      email: college.email || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (collegeId) => {
    if (!confirm('Are you sure you want to delete this college?')) return

    try {
      const { error } = await supabase
        .from('colleges')
        .delete()
        .eq('id', collegeId)
      
      if (error) throw error
      
      fetchColleges()
    } catch (error) {
      console.error('Error deleting college:', error)
      alert('Error deleting college: ' + error.message)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      state: '',
      country: '',
      phone: '',
      email: ''
    })
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Colleges Management</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage colleges and institutions
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add College</span>
        </button>
      </div>

      {/* Colleges grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {colleges.map((college) => (
          <div key={college.id} className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Building2 className="h-8 w-8 text-primary-600" />
                <h3 className="ml-3 text-lg font-medium text-gray-900 dark:text-white">
                  {college.name}
                </h3>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(college)}
                  className="text-primary-600 hover:text-primary-900 dark:hover:text-primary-400"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(college.id)}
                  className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              {college.address && (
                <p><span className="font-medium">Address:</span> {college.address}</p>
              )}
              <p>
                <span className="font-medium">Location:</span> {college.city}, {college.state}, {college.country}
              </p>
              {college.phone && (
                <p><span className="font-medium">Phone:</span> {college.phone}</p>
              )}
              {college.email && (
                <p><span className="font-medium">Email:</span> {college.email}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit College Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {editingCollege ? 'Edit College' : 'Add New College'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    College Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="input-field"
                    rows="3"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      State
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Country
                    </label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingCollege(null)
                      resetForm()
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingCollege ? 'Update' : 'Create'} College
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

export default Colleges 