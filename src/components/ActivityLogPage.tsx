// src/components/ActivityLogPage.tsx
import React, { useState, useEffect } from 'react'
import type { ActivityLog } from '../types'
import { arrayToCSV, formatDateForCSV } from '../utils/csvExport'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  
  const authToken = localStorage.getItem('authToken')
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }
  
  // Add user context headers for CompanyCode isolation
  const sqlUserStr = localStorage.getItem('sqlUser')
  if (sqlUserStr) {
    try {
      const sqlUser = JSON.parse(sqlUserStr)
      if (sqlUser.id) {
        headers['x-user-id'] = sqlUser.id
        headers['x-user-name'] = sqlUser.username || sqlUser.fullName || ''
        headers['x-user-role'] = sqlUser.role || ''
      }
    } catch (e) {
      console.warn('Failed to parse sqlUser from localStorage')
    }
  }
  
  return headers
}

export default function ActivityLogPage() {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAction, setSelectedAction] = useState('')
  const [selectedUser, setSelectedUser] = useState('')
  const [hours, setHours] = useState(8)

  // Get unique actions and users for filters
  const uniqueActions = [...new Set(activities.map(activity => activity.action))].sort()
  const uniqueUsers = [...new Set(activities.map(activity => activity.username))].sort()

  useEffect(() => {
    loadActivityLogs()
  }, [])

  async function handleSearch() {
    await loadActivityLogs()
  }

  async function handleRefresh() {
    setSearchTerm('')
    setSelectedAction('')
    setSelectedUser('')
    setHours(8)
    await loadActivityLogs()
  }

  async function loadActivityLogs() {
    try {
      setLoading(true)
      setError('')
      
      // Build query parameters
      const params = new URLSearchParams()
      params.append('hours', hours.toString())
      
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim())
      }
      if (selectedAction) {
        params.append('action', selectedAction)
      }
      if (selectedUser) {
        // Find user ID by username (you might want to improve this)
        params.append('userId', selectedUser)
      }
      
      const response = await fetch(`${API_BASE_URL}/activity-log?${params}`, {
        headers: getHeaders()
      })
      if (!response.ok) {
        throw new Error('Failed to fetch activity logs')
      }
      
      const logs = await response.json()
      setActivities(logs)
    } catch (err) {
      setError('Failed to load activity logs')
      console.error('Error loading activity logs:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    // Timestamp is already in UTC ISO format with 'Z' suffix from backend
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  const getTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)
    
    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
    } else {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    }
  }

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'user login':
        return { bg: '#dbeafe', color: '#1e40af' }
      case 'ticket updated':
        return { bg: '#fef3c7', color: '#d97706' }
      case 'user management':
        return { bg: '#fee2e2', color: '#dc2626' }
      case 'ticket created':
        return { bg: '#dcfce7', color: '#16a34a' }
      default:
        return { bg: '#f3f4f6', color: '#374151' }
    }
  }

  const handleExportCSV = () => {
    const columns = [
      { key: 'id' as keyof ActivityLog, label: 'ID' },
      { key: 'timestamp' as keyof ActivityLog, label: 'Timestamp' },
      { key: 'username' as keyof ActivityLog, label: 'Username' },
      { key: 'action' as keyof ActivityLog, label: 'Action' },
      { key: 'details' as keyof ActivityLog, label: 'Details' },
      { key: 'ip_address' as keyof ActivityLog, label: 'IP Address' },
      { key: 'user_agent' as keyof ActivityLog, label: 'User Agent' }
    ]

    // Prepare data with formatted timestamp
    const exportData = activities.map(activity => ({
      ...activity,
      timestamp: formatDateForCSV(activity.timestamp)
    }))

    arrayToCSV(exportData, columns, 'activity-log')
  }

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
          <div style={{ fontSize: '18px', color: 'var(--muted)' }}>Loading activity logs...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
          Activity Log
        </h1>
        <p style={{ color: 'var(--muted)' }}>
          Monitor system activity and user actions
        </p>
      </div>

      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '6px',
          color: '#dc2626',
          marginBottom: '16px'
        }}>
          {error}
        </div>
      )}

      {/* Filters */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
        padding: '16px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
            Search
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch()
              }
            }}
            placeholder="Search activities..."
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
            Time Range
          </label>
          <select
            value={hours}
            onChange={(e) => setHours(parseInt(e.target.value))}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          >
            <option value={1}>Last 1 hour</option>
            <option value={4}>Last 4 hours</option>
            <option value={8}>Last 8 hours</option>
            <option value={24}>Last 24 hours</option>
            <option value={72}>Last 3 days</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
            Action Type
          </label>
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          >
            <option value="">All Actions</option>
            {uniqueActions.map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
            User
          </label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          >
            <option value="">All Users</option>
            {uniqueUsers.map(user => (
              <option key={user} value={user}>{user}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '24px' 
      }}>
        <button
          onClick={handleSearch}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
        <button
          onClick={handleRefresh}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4a5568',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
        <button
          onClick={handleExportCSV}
          disabled={loading || activities.length === 0}
          style={{
            padding: '10px 20px',
            backgroundColor: '#059669',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: (loading || activities.length === 0) ? 'not-allowed' : 'pointer',
            opacity: (loading || activities.length === 0) ? 0.6 : 1
          }}
          title={`Export ${activities.length} activity log entries to CSV`}
        >
          📊 Export CSV
        </button>
      </div>

      {/* Results Summary */}
      <div style={{ marginBottom: '16px' }}>
        <span style={{ fontSize: '14px', color: 'var(--muted)' }}>
          Showing {activities.length} activities from the last {hours} hours
        </span>
      </div>

      {/* Activity List */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '8px', 
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        {activities.length === 0 ? (
          <div style={{ 
            padding: '48px', 
            textAlign: 'center', 
            color: 'var(--muted)' 
          }}>
            No activities found for the selected filters
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f9fafb' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#374151', textTransform: 'uppercase' }}>Time</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#374151', textTransform: 'uppercase' }}>User</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#374151', textTransform: 'uppercase' }}>Action</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#374151', textTransform: 'uppercase' }}>Details</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#374151', textTransform: 'uppercase' }}>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity, index) => {
                  const actionColors = getActionColor(activity.action)
                  return (
                    <tr key={activity.id} style={{ 
                      borderBottom: index < activities.length - 1 ? '1px solid #e5e7eb' : 'none'
                    }}>
                      <td style={{ padding: '12px', verticalAlign: 'top' }}>
                        <div style={{ fontSize: '14px', color: '#111827' }}>
                          {formatTimestamp(activity.timestamp)}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                          {getTimeAgo(activity.timestamp)}
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ 
                          fontSize: '14px', 
                          fontWeight: '500', 
                          color: '#111827' 
                        }}>
                          {activity.username}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: actionColors.bg,
                          color: actionColors.color
                        }}>
                          {activity.action}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ fontSize: '14px', color: 'var(--muted)' }}>
                          {activity.details || '-'}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ fontSize: '14px', color: 'var(--muted)', fontFamily: 'monospace' }}>
                          {activity.ipAddress || '-'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
