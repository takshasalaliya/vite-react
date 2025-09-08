import { useState, useEffect } from 'react'
import { supabase, STORAGE_BUCKETS, uploadFile, validateFile } from '../lib/supabase'
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Edit, 
  Trash2, 
  Eye,
  UserPlus
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { uploadImage, validateImage } from '../utils/imageUpload'

const Users = () => {
	const [users, setUsers] = useState([])
	const [loading, setLoading] = useState(true)
	const [errorMsg, setErrorMsg] = useState('')
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedRole, setSelectedRole] = useState('')
	const [selectedCollege, setSelectedCollege] = useState('')
	const [selectedSemester, setSelectedSemester] = useState('')
	const [selectedField, setSelectedField] = useState('')
	const [showModal, setShowModal] = useState(false)
	const [editingUser, setEditingUser] = useState(null)
	const [colleges, setColleges] = useState([])
	const [fields, setFields] = useState([])
	const [currentPage, setCurrentPage] = useState(1)
	const [totalPages, setTotalPages] = useState(1)
	const [filteredTotal, setFilteredTotal] = useState(0)
	const [pageSize] = useState(10)

	const [formData, setFormData] = useState({
		name: '',
		email: '',
		phone: '',
		enrollment_number: '',
		college_id: '',
		semester: '',
		field_id: '',
		role: 'participant',
		photo_url: ''
	})

	const roles = [
		{ value: 'admin', label: 'Admin' },
		{ value: 'event_manager', label: 'Event Manager' },
		{ value: 'event_handler', label: 'Event Handler' },
		{ value: 'registration_committee', label: 'Registration Committee' },
		{ value: 'participant', label: 'Participant' }
	]

	useEffect(() => {
		fetchUsers()
		fetchColleges()
		fetchFields()
	}, [currentPage, searchTerm, selectedRole, selectedCollege, selectedSemester, selectedField])

	// Reset to first page whenever filters/search change
	useEffect(() => {
		setCurrentPage(1)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchTerm, selectedRole, selectedCollege, selectedSemester, selectedField])

	const fetchUsers = async () => {
		try {
			setLoading(true)
			setErrorMsg('')
			let query = supabase
				.from('users')
				.select(`
					id, name, email, phone, enrollment_number, college_id, semester, field_id, role, photo_url, created_at,
					colleges(name),
					fields(name)
				`, { count: 'exact' })
				.order('created_at', { ascending: false })

			if (searchTerm) {
				query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,enrollment_number.ilike.%${searchTerm}%`)
			}

			if (selectedRole) {
				query = query.eq('role', selectedRole)
			}

			if (selectedCollege) {
				query = query.eq('college_id', selectedCollege)
			}

			if (selectedSemester) {
				query = query.eq('semester', selectedSemester)
			}

			if (selectedField) {
				query = query.eq('field_id', selectedField)
			}

			const from = (currentPage - 1) * pageSize
			const to = from + pageSize - 1

			const { data, error, count } = await query.range(from, to)

			if (error) {
				// Handle Range Not Satisfiable (416) by resetting to first page
				const msg = (error?.message || '').toLowerCase()
				if (error.status === 416 || msg.includes('range not satisfiable') || msg.includes('range') ) {
					setCurrentPage(1)
					return
				}
				throw error
			}

			setUsers(data || [])
			setFilteredTotal(count || 0)
			const pages = Math.max(1, Math.ceil((count || 0) / pageSize))
			setTotalPages(pages)
			// If current page exceeds available pages after filter, bring it back within bounds
			if (currentPage > pages) {
				setCurrentPage(1)
			}
		} catch (error) {
			console.error('Error fetching users:', error)
			setErrorMsg(error.message || 'Failed to load users')
		} finally {
			setLoading(false)
		}
	}

	const fetchColleges = async () => {
		try {
			const { data, error } = await supabase
				.from('colleges')
				.select('*')
				.order('name')
			if (error) throw error
			setColleges(data || [])
		} catch (error) {
			console.error('Error fetching colleges:', error)
		}
	}

	const fetchFields = async () => {
		try {
			const { data, error } = await supabase
				.from('fields')
				.select('*')
				.order('name')
			if (error) throw error
			setFields(data || [])
		} catch (error) {
			console.error('Error fetching fields:', error)
		}
	}

	const handleSubmit = async (e) => {
		e.preventDefault()
		try {
			// Clean up empty string values for UUID fields
			const userDataToSave = {
				...formData,
				college_id: formData.college_id || null,
				field_id: formData.field_id || null
			}

			if (editingUser) {
				const { error } = await supabase
					.from('users')
					.update(userDataToSave)
					.eq('id', editingUser.id)
				if (error) throw error
			} else {
				const { error } = await supabase
					.from('users')
					.insert([userDataToSave])
				if (error) throw error
			}
			setShowModal(false)
			setEditingUser(null)
			resetForm()
			fetchUsers()
		} catch (error) {
			console.error('Error saving user:', error)
			alert('Error saving user: ' + error.message)
		}
	}

	const handleEdit = (user) => {
		setEditingUser(user)
		setFormData({
			name: user.name || '',
			email: user.email || '',
			phone: user.phone || '',
			enrollment_number: user.enrollment_number || '',
			college_id: user.college_id || '',
			semester: user.semester || '',
			field_id: user.field_id || '',
			role: user.role || 'participant',
			photo_url: user.photo_url || ''
		})
		setShowModal(true)
	}

	const handleDelete = async (userId) => {
		if (!confirm('Are you sure you want to delete this user?')) return
		try {
			const { error } = await supabase
				.from('users')
				.delete()
				.eq('id', userId)
			if (error) throw error
			fetchUsers()
		} catch (error) {
			console.error('Error deleting user:', error)
			alert('Error deleting user: ' + error.message)
		}
	}

	const handlePhotoUpload = async (e) => {
		const file = e.target.files[0]
		if (!file) return
		try {
			validateImage(file)
			const photoUrl = await uploadImage(file)
			setFormData(prev => ({ ...prev, photo_url: photoUrl }))
		} catch (error) {
			alert(error.message)
		}
	}

	const resetForm = () => {
		setFormData({
			name: '',
			email: '',
			phone: '',
			enrollment_number: '',
			college_id: '',
			semester: '',
			field_id: '',
			role: 'participant',
			photo_url: ''
		})
	}

	const exportToCSV = () => {
		const ws = XLSX.utils.json_to_sheet(users.map(user => ({
			Name: user.name,
			Email: user.email,
			Phone: user.phone,
			'Enrollment Number': user.enrollment_number,
			College: user.colleges?.name || '',
			Semester: user.semester,
			Field: user.fields?.name || '',
			Role: user.role,
			'Created At': new Date(user.created_at).toLocaleDateString()
		})))
		const wb = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(wb, ws, 'Users')
		XLSX.writeFile(wb, 'users-export.xlsx')
	}

	const importFromCSV = (e) => {
		const file = e.target.files[0]
		if (!file) return
		const reader = new FileReader()
		reader.onload = async (event) => {
			try {
				const workbook = XLSX.read(event.target.result, { type: 'binary' })
				const sheetName = workbook.SheetNames[0]
				const worksheet = workbook.Sheets[sheetName]
				const data = XLSX.utils.sheet_to_json(worksheet)
				for (const row of data) {
					const userData = {
						name: row.Name,
						email: row.Email,
						phone: row.Phone,
						'enrollment_number': row['Enrollment Number'],
						semester: row.Semester,
						role: row.Role || 'participant'
					}
					if (row.College) {
						const college = colleges.find(c => c.name.toLowerCase() === row.College.toLowerCase())
						if (college) userData.college_id = college.id
					}
					if (row.Field) {
						const field = fields.find(f => f.name.toLowerCase() === row.Field.toLowerCase())
						if (field) userData.field_id = field.id
					}
					await supabase.from('users').insert([userData])
				}
				alert(`Successfully imported ${data.length} users`)
				fetchUsers()
			} catch (error) {
				console.error('Error importing CSV:', error)
				alert('Error importing CSV: ' + error.message)
			}
		}
		reader.readAsBinaryString(file)
	}

	// Loading state
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
					<h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users Management</h1>
					<p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
						Manage all users in the system
					</p>
				</div>
				<button
					onClick={() => setShowModal(true)}
					className="btn-primary flex items-center space-x-2"
				>
					<UserPlus className="h-5 w-5" />
					<span>Add User</span>
				</button>
			</div>

			{/* Error banner */}
			{errorMsg && (
				<div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
					{errorMsg}
				</div>
			)}

			{/* Filters and search */}
			<div className="card p-4">
				<div className="flex flex-col sm:flex-row gap-4">
					<div className="flex-1">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
							<input
								type="text"
								placeholder="Search users..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="input-field pl-10"
							/>
						</div>
					</div>
					<div className="flex gap-2 flex-wrap items-center">
						<select
							value={selectedRole}
							onChange={(e) => setSelectedRole(e.target.value)}
							className="input-field"
						>
							<option value="">All Roles</option>
							{roles.map(role => (
								<option key={role.value} value={role.value}>{role.label}</option>
							))}
						</select>
						<select
							value={selectedCollege}
							onChange={(e) => setSelectedCollege(e.target.value)}
							className="input-field"
						>
							<option value="">All Colleges</option>
							{colleges.map(college => (
								<option key={college.id} value={college.id}>{college.name}</option>
							))}
						</select>
						<select
							value={selectedSemester}
							onChange={(e) => setSelectedSemester(e.target.value)}
							className="input-field"
						>
							<option value="">All Semesters</option>
							{Array.from({ length: 8 }, (_, i) => (i + 1).toString()).map(sem => (
								<option key={sem} value={sem}>Sem {sem}</option>
							))}
						</select>
						<select
							value={selectedField}
							onChange={(e) => setSelectedField(e.target.value)}
							className="input-field"
						>
							<option value="">All Fields</option>
							{fields.map(field => (
								<option key={field.id} value={field.id}>{field.name}</option>
							))}
						</select>
						<button
							onClick={exportToCSV}
							className="btn-secondary flex items-center space-x-2"
						>
							<Download className="h-5 w-5" />
							<span>Export</span>
						</button>
						<label className="btn-secondary flex items-center space-x-2 cursor-pointer">
							<Upload className="h-5 w-5" />
							<span>Import</span>
							<input
								type="file"
								accept=".xlsx,.xls,.csv"
								onChange={importFromCSV}
								className="hidden"
							/>
						</label>
						<span className="text-sm text-gray-600 dark:text-gray-300 ml-auto">Total: {filteredTotal}</span>
					</div>
				</div>
			</div>

			{/* Users table */}
			<div className="card overflow-hidden">
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
						<thead className="bg-gray-50 dark:bg-gray-800">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
									User
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
									Contact
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
									Academic
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
									Role
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
									Actions
								</th>
							</tr>
						</thead>
						<tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
							{users.map((user) => (
								<tr key={user.id}>
									<td className="px-6 py-4 whitespace-nowrap">
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
														<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
															{user.name?.charAt(0)?.toUpperCase()}
														</span>
													</div>
												)}
											</div>
											<div className="ml-4">
												<div className="text-sm font-medium text-gray-900 dark:text-white">
													{user.name}
												</div>
												<div className="text-sm text-gray-500 dark:text-gray-400">
													{user.enrollment_number}
												</div>
											</div>
										</div>
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<div className="text-sm text-gray-900 dark:text-white">{user.email}</div>
										<div className="text-sm text-gray-500 dark:text-gray-400">{user.phone}</div>
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<div className="text-sm text-gray-900 dark:text-white">{user.colleges?.name}</div>
										<div className="text-sm text-gray-500 dark:text-gray-400">
											{user.fields?.name} • Sem {user.semester}
										</div>
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
											user.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
											user.role === 'event_manager' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
											user.role === 'event_handler' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
											user.role === 'registration_committee' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
											'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
										}` }>
											{roles.find(r => r.value === user.role)?.label || user.role}
										</span>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
										<div className="flex space-x-2">
											<button
													onClick={() => handleEdit(user)}
													className="text-primary-600 hover:text-primary-900 dark:hover:text-primary-400"
											>
												<Edit className="h-4 w-4" />
											</button>
											<button
												onClick={() => handleDelete(user.id)}
												className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
											>
												<Trash2 className="h-4 w-4" />
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{/* Empty state */}
				{!errorMsg && users.length === 0 && (
					<div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
						No users found.
					</div>
				)}

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
								<p className="text-sm text-gray-700 dark;text-gray-300">
									Showing page <span className="font-medium">{currentPage}</span> of{' '}
									<span className="font-medium">{totalPages}</span> · Total <span className="font-medium">{filteredTotal}</span>
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

			{/* Add/Edit User Modal */}
			{showModal && (
				<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
					<div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
						<div className="mt-3">
							<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
								{editingUser ? 'Edit User' : 'Add New User'}
							</h3>
							<form onSubmit={handleSubmit} className="space-y-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
										Name
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
										Email
									</label>
									<input
										type="email"
										required
										value={formData.email}
										onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
										className="input-field"
									/>
								</div>
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
										Enrollment Number
									</label>
									<input
										type="text"
										value={formData.enrollment_number}
										onChange={(e) => setFormData(prev => ({ ...prev, enrollment_number: e.target.value }))}
										className="input-field"
									/>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
											College
										</label>
										<select
											value={formData.college_id}
											onChange={(e) => setFormData(prev => ({ ...prev, college_id: e.target.value }))}
											className="input-field"
										>
											<option value="">Select College</option>
											{colleges.map(college => (
												<option key={college.id} value={college.id}>{college.name}</option>
											))}
										</select>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
											Field
										</label>
										<select
											value={formData.field_id}
											onChange={(e) => setFormData(prev => ({ ...prev, field_id: e.target.value }))}
											className="input-field"
										>
											<option value="">Select Field</option>
											{fields.map(field => (
												<option key={field.id} value={field.id}>{field.name}</option>
											))}
										</select>
									</div>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
											Semester
										</label>
										<input
											type="number"
											min="1"
											max="8"
											value={formData.semester}
											onChange={(e) => setFormData(prev => ({ ...prev, semester: e.target.value }))}
											className="input-field"
										/>
									</div>
									<div>
										<label className="block text sm font-medium text-gray-700 dark:text-gray-300">
											Role
										</label>
										<select
											value={formData.role}
											onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
											className="input-field"
										>
											{roles.map(role => (
												<option key={role.value} value={role.value}>{role.label}</option>
											))}
										</select>
									</div>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
										Profile Photo
									</label>
									<input
										type="file"
										accept="image/*"
										onChange={handlePhotoUpload}
										className="input-field"
									/>
									{formData.photo_url && (
										<img
											src={formData.photo_url}
											alt="Preview"
											className="mt-2 h-20 w-20 rounded-lg object-cover"
										/>
									)}
								</div>
								<div className="flex justify-end space-x-3 pt-4">
									<button
										type="button"
										onClick={() => {
											setShowModal(false)
											setEditingUser(null)
											resetForm()
										}}
										className="btn-secondary"
									>
										Cancel
									</button>
									<button type="submit" className="btn-primary">
										{editingUser ? 'Update' : 'Create'} User
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

export default Users 
