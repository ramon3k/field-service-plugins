// src/components/RecentActivityWidget.tsx
import React, { useState, useEffect } from 'react'
import type { ActivityLog } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function RecentActivityWidget() {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  function buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {}

    const authToken = localStorage.getItem('authToken')
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`
    }

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
      } catch (err) {
        console.warn('RecentActivityWidget: Failed to parse sqlUser from localStorage')
      }
    }

    return headers
  }

  useEffect(() => {
    loadRecentActivities()
    const interval = setInterval(loadRecentActivities, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  async function loadRecentActivities() {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/activity-log?hours=8`, {
        headers: buildHeaders()
      })
      if (!response.ok) {
        throw new Error('Failed to fetch activity logs')
      }
      const logs = await response.json()
      setActivities(logs.slice(0, 50)) // Show up to 50 recent activities
    } catch (err) {
      console.error('Error loading recent activities:', err)
      setActivities([])
    } finally {
      setLoading(false)
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${Math.floor(diffHours / 24)}d ago`
  }

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login': return '🔐'
      case 'ticket created': return '🎫'
      case 'ticket updated': return '✏️'
      case 'site created': return '🏢'
      case 'site updated': return '🔧'
      case 'customer created': return '👤'
      case 'customer updated': return '👥'
      case 'password reset': return '🔑'
      case 'service request submitted': return '📝'
      case 'service request dismissed': return '❌'
      case 'service request converted': return '✅'
      default: return '📌'
    }
  }

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login': return '#3b82f6'
      case 'ticket created': return '#10b981'
      case 'ticket updated': return '#f59e0b'
      case 'site created': return '#8b5cf6'
      case 'site updated': return '#6366f1'
      case 'customer created': return '#14b8a6'
      case 'customer updated': return '#06b6d4'
      case 'password reset': return '#ef4444'
      case 'service request submitted': return '#14b8a6'
      case 'service request dismissed': return '#6b7280'
      case 'service request converted': return '#ec4899'
      default: return '#64748b'
    }
  }

  return (
    <div style={{
      background: '#0f1729',
      border: '1px solid #1e2d4a',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid #1e2d4a',
        background: '#0a1120'
      }}>
        <h3 style={{ 
          margin: 0,
          fontSize: '14px',
          fontWeight: 600,
          color: '#f1f5f9'
        }}>
          🔔 Recent Activity Log
        </h3>
        <div style={{ 
          fontSize: '11px', 
          color: '#64748b',
          fontStyle: 'italic'
        }}>
          Auto-refreshes every 30s • Last 8 hours
        </div>
      </div>

      {/* Activity List */}
      {loading && activities.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px 20px',
          color: '#64748b'
        }}>
          Loading recent activity...
        </div>
      ) : activities.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px 20px',
          color: '#64748b'
        }}>
          No recent activity in the last 8 hours
        </div>
      ) : (
        <div style={{ 
          flex: 1,
          overflowY: 'auto',
          padding: 0
        }}>
          {activities.map((activity, index) => (
            <div 
              key={activity.id}
              style={{
                padding: '8px 16px',
                background: index % 2 === 0 ? '#0f1729' : '#0a1120',
                borderLeft: `3px solid ${getActionColor(activity.action)}`,
                transition: 'background 0.1s ease',
                cursor: 'default',
                fontSize: '13px',
                borderBottom: index < activities.length - 1 ? '1px solid #1e2d4a' : 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#1e2d4a'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = index % 2 === 0 ? '#0f1729' : '#0a1120'
              }}
            >
              {/* Single line log format */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '14px', flexShrink: 0, opacity: 0.8 }}>
                  {getActionIcon(activity.action)}
                </span>
                
                <div style={{ 
                  fontSize: '11px',
                  color: '#64748b',
                  minWidth: '65px',
                  flexShrink: 0
                }}>
                  {formatTimeAgo(activity.timestamp)}
                </div>
                
                <div style={{ 
                  fontWeight: 600,
                  color: getActionColor(activity.action),
                  minWidth: '140px',
                  flexShrink: 0
                }}>
                  {activity.action}
                </div>
                
                <div style={{
                  flex: 1,
                  color: '#cbd5e1',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {activity.details}
                </div>
                
                <div style={{
                  fontSize: '12px',
                  color: '#94a3b8',
                  minWidth: '100px',
                  flexShrink: 0,
                  textAlign: 'right'
                }}>
                  {activity.username}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
