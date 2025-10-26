// src/components/UserManagementPage.tsx
import React, { useState, useEffect } from 'react'
import { authService } from '../services/AuthService'
import type { User, UserRole, AuthUser } from '../types'
import { arrayToCSV } from '../utils/csvExport'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

interface UserManagementPageProps {
  currentUser: AuthUser | null
}

export default function UserManagementPage({ currentUser }: UserManagementPageProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddUser, setShowAddUser] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    fullName: '',
    role: 'Technician' as UserRole,
    vendor: '',
    password: '',
    isActive: true
  })

  useEffect(() => {
    loadUsers()
  }, [])

  function getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    const authToken = localStorage.getItem('authToken')
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`
    }

    // Include tenant context for data isolation
    const sqlUserStr = localStorage.getItem('sqlUser')
    if (sqlUserStr) {
      try {
        const sqlUser = JSON.parse(sqlUserStr)
        if (sqlUser?.id) {
          headers['x-user-id'] = sqlUser.id
          headers['x-user-name'] = sqlUser.username || sqlUser.fullName || ''
          headers['x-user-role'] = sqlUser.role || ''
          if (sqlUser.companyCode) {
            headers['x-company-code'] = sqlUser.companyCode
          }
          if (sqlUser.companyName) {
            headers['x-company-name'] = sqlUser.companyName
          }
        }
      } catch (e) {
        console.warn('Failed to parse sqlUser from localStorage')
      }
    }

    return headers
  }

  async function loadUsers() {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/users?includeInactive=true`, {
        headers: getHeaders()
      })
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      const data = await response.json()
      const users = data.value || data || []
      setUsers(users)
    } catch (err) {
      setError('Failed to load users')
      console.error('Error loading users:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async () => {
    try {
      if (!newUser.username || !newUser.email || !newUser.fullName || !newUser.password) {
        setError('Please fill in all required fields')
        return
      }

      if (newUser.role === 'Technician' && !newUser.vendor) {
        setError('Vendor/Company is required for technicians')
        return
      }

      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(newUser)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create user')
      }

      setShowAddUser(false)
      setNewUser({
        username: '',
        email: '',
        fullName: '',
        role: 'Technician',
        vendor: '',
        password: '',
        isActive: true
      })
      await loadUsers()
      setError('') // Clear any previous errors
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user')
    }
  }

  const toggleUserStatus = async (user: User) => {
    try {
      // Toggle the user's active status
      const updatedStatus = !user.isActive
      
      const response = await fetch(`${API_BASE_URL}/users/${user.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          isActive: updatedStatus
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update user status')
      }

      // Refresh the users list to show the updated status
      await loadUsers()
      setError('') // Clear any previous errors
      
      console.log(`User ${user.username} status updated to: ${updatedStatus ? 'Active' : 'Inactive'}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user status')
    }
  }

  const resetPassword = async (user: User) => {
    try {
      const newPassword = prompt(`Enter new password for ${user.username}:`)
      if (!newPassword) return

      // Get stored authentication token
      const token = localStorage.getItem('authToken')
      
      if (!token) {
        setError('Not authenticated - please login first')
        return
      }

      const headers = getHeaders()
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId: user.id,
          newPassword: newPassword
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reset password')
      }

      alert(`Password reset successfully for ${user.username}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password')
    }
  }

  const deleteUser = async (user: User) => {
    try {
      if (!confirm(`Are you sure you want to delete user "${user.username}"? This will deactivate their account.`)) {
        return
      }

      const response = await fetch(`${API_BASE_URL}/users/${user.id}`, {
        method: 'DELETE',
        headers: getHeaders()
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete user')
      }

      alert(`User ${user.username} has been deleted`)
      await loadUsers() // Reload the user list
      setError('') // Clear any previous errors
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user')
    }
  }

  const handleExportCSV = () => {
    const columns = [
      { key: 'id' as keyof User, label: 'User ID' },
      { key: 'username' as keyof User, label: 'Username' },
      { key: 'fullName' as keyof User, label: 'Full Name' },
      { key: 'email' as keyof User, label: 'Email' },
      { key: 'role' as keyof User, label: 'Role' },
      { key: 'vendor' as keyof User, label: 'Vendor/Company' },
      { key: 'isActive' as keyof User, label: 'Status' }
    ]

    // Prepare data with formatted status
    const exportData = users.map(user => ({
      ...user,
      isActive: user.isActive ? 'Active' : 'Inactive'
    }))

    arrayToCSV(exportData, columns, 'users')
  }

  if (!currentUser || (currentUser.role !== 'Admin' && currentUser.role !== 'SystemAdmin')) {
    return (
      <div className="card">
        <h2>Access Denied</h2>
        <p>You don't have permission to manage users.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>User Management</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="ghost" onClick={handleExportCSV} title={`Export ${users.length} users to CSV`}>
            📊 Export CSV
          </button>
          <button className="primary" onClick={() => setShowAddUser(true)}>
            Add New User
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '1rem',
          borderRadius: '6px',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div>Loading users...</div>
      ) : (
        <div className="card">
          <h3>Current Users</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Username</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Full Name</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Role</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Vendor</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px' }}>{user.username}</td>
                    <td style={{ padding: '12px' }}>{user.fullName}</td>
                    <td style={{ padding: '12px' }}>{user.email}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        backgroundColor: user.role === 'Admin' ? '#dbeafe' : user.role === 'Coordinator' ? '#fef3c7' : '#e0f2fe',
                        color: user.role === 'Admin' ? '#1e40af' : user.role === 'Coordinator' ? '#d97706' : '#0369a1'
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {user.vendor ? (
                        <span style={{ 
                          fontSize: '0.875rem',
                          color: 'var(--muted)'
                        }}>
                          {user.vendor}
                        </span>
                      ) : (
                        <span style={{ 
                          fontSize: '0.875rem',
                          color: 'var(--text-disabled)',
                          fontStyle: 'italic'
                        }}>
                          —
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        backgroundColor: user.isActive ? '#dcfce7' : '#fee2e2',
                        color: user.isActive ? '#16a34a' : '#dc2626'
                      }}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          className="ghost"
                          style={{ fontSize: '0.875rem', padding: '4px 8px' }}
                          onClick={() => toggleUserStatus(user)}
                        >
                          {user.isActive ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          className="ghost"
                          style={{ fontSize: '0.875rem', padding: '4px 8px' }}
                          onClick={() => resetPassword(user)}
                        >
                          Reset Password
                        </button>
                        <button
                          className="ghost"
                          style={{ 
                            fontSize: '0.875rem', 
                            padding: '4px 8px',
                            color: '#dc2626',
                            border: '1px solid #dc2626'
                          }}
                          onClick={() => deleteUser(user)}
                          title="Delete user (deactivates account)"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2>Add New User</h2>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#1f2937' }}>
                Username *
              </label>
              <input
                type="text"
                value={newUser.username}
                onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#1f2937' }}>
                Full Name *
              </label>
              <input
                type="text"
                value={newUser.fullName}
                onChange={(e) => setNewUser(prev => ({ ...prev, fullName: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#1f2937' }}>
                Email *
              </label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#1f2937' }}>
                Role *
              </label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as UserRole }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="Technician">Technician</option>
                <option value="Coordinator">Coordinator</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#1f2937' }}>
                Vendor/Company {newUser.role === 'Technician' ? '*' : '(optional)'}
              </label>
              <input
                type="text"
                value={newUser.vendor}
                onChange={(e) => setNewUser(prev => ({ ...prev, vendor: e.target.value }))}
                placeholder={newUser.role === 'Technician' ? 'e.g. TechCorps Solutions' : 'Company name (optional)'}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#1f2937' }}>
                Password *
              </label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                className="ghost"
                onClick={() => setShowAddUser(false)}
              >
                Cancel
              </button>
              <button
                className="primary"
                onClick={handleCreateUser}
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
