import React, { useEffect, useState } from 'react'
import type { AuthUser } from '../types'
import { authService } from '../services/AuthService'

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

interface NavProps {
  currentUser: AuthUser | null
  tab: string
  setTab: (tab: string) => void
  onLogout: () => void
  newRequestsCount: number // Count passed from ServiceRequestsPage
}

export default function Nav({ currentUser, tab, setTab, onLogout, newRequestsCount }: NavProps) {
  // No longer need to fetch count - it's passed as a prop from ServiceRequestsPage

  const handleChangePassword = async () => {
    if (!currentUser) return
    
    const newPassword = prompt('Enter your new password:')
    if (!newPassword) return
    
    const confirmPassword = prompt('Confirm your new password:')
    if (!confirmPassword) return
    
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match!')
      return
    }
    
    try {
      await authService.changePassword(currentUser.id, newPassword)
      alert('Password changed successfully!')
    } catch (error) {
      alert(`Failed to change password: ${error}`)
    }
  }

  // Filter tabs based on user role
  const getAvailableTabs = () => {
    if (!currentUser) return []
    
    const baseTabs = ['Tickets', 'Map']
    
    if (currentUser.role === 'SystemAdmin') {
      // SystemAdmin can see everything including Companies management (multi-tenant super admin)
      return ['Tickets','Map','Calendar','Reports','Closed','Requests','Users','Companies','Activity','Customers','Sites','Licenses','Vendors']
    } else if (currentUser.role === 'Admin') {
      // Company Admin can see everything except Companies management
      return ['Tickets','Map','Calendar','Reports','Closed','Requests','Users','Activity','Customers','Sites','Licenses','Vendors']
    } else if (currentUser.role === 'Coordinator') {
      return ['Tickets','Map','Calendar','Reports','Closed','Requests','Activity','Customers','Sites','Licenses','Vendors']
    } else if (currentUser.role === 'Technician') {
      return ['Tickets','Map','Calendar']
    }
    
    return baseTabs
  }
  
  const tabs = getAvailableTabs()
  
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <div className="row" style={{ margin: 0 }}>
        {tabs.map(t => (
          <button key={t}
            className={tab===t? 'primary' : 'ghost'}
            onClick={()=>setTab(t)}
            style={{ position: 'relative' }}
          >
            {t}
            {t === 'Requests' && newRequestsCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                backgroundColor: '#e74c3c',
                color: 'white',
                borderRadius: '10px',
                padding: '2px 6px',
                fontSize: '11px',
                fontWeight: 'bold',
                minWidth: '20px',
                textAlign: 'center'
              }}>
                {newRequestsCount}
              </span>
            )}
          </button>
        ))}
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ color: '#666', fontSize: '0.9rem' }}>
          Welcome, {currentUser?.fullName} ({currentUser?.role})
        </span>
        <button className="ghost" onClick={handleChangePassword} style={{ padding: '0.5rem 1rem' }}>
          Change Password
        </button>
        <button className="ghost" onClick={onLogout} style={{ padding: '0.5rem 1rem' }}>
          Logout
        </button>
      </div>
    </div>
  )
}
