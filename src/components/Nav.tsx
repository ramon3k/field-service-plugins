import React, { useEffect, useState } from 'react'
import type { AuthUser } from '../types'
import { authService } from '../services/AuthService'
import './Nav.css'

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
      // SystemAdmin can see everything
      return ['Tickets','Map','Calendar','Reports','Closed','Requests','Users','Plugins','Activity','Customers','Sites','Licenses','Vendors']
    } else if (currentUser.role === 'Admin') {
      // Admin can see everything including Plugins
      return ['Tickets','Map','Calendar','Reports','Closed','Requests','Users','Plugins','Activity','Customers','Sites','Licenses','Vendors']
    } else if (currentUser.role === 'Coordinator') {
      return ['Tickets','Map','Calendar','Reports','Closed','Requests','Activity','Customers','Sites','Licenses','Vendors']
    } else if (currentUser.role === 'Technician') {
      return ['Tickets','Map','Calendar']
    }
    
    return baseTabs
  }
  
  const tabs = getAvailableTabs()
  
  return (
    <div className="nav-container">
      <div className="nav-tabs">
        {tabs.map(t => (
          <button key={t}
            className={tab===t? 'primary' : 'ghost'}
            onClick={()=>setTab(t)}
          >
            {t}
            {t === 'Requests' && newRequestsCount > 0 && (
              <span className="request-badge">
                {newRequestsCount}
              </span>
            )}
          </button>
        ))}
      </div>
      
      <div className="nav-user-section">
        <span className="nav-user-info">
          Welcome, {currentUser?.fullName} ({currentUser?.role})
        </span>
        <button className="ghost nav-button" onClick={handleChangePassword}>
          Change Password
        </button>
        <button className="ghost nav-button" onClick={onLogout}>
          Logout
        </button>
      </div>
    </div>
  )
}
