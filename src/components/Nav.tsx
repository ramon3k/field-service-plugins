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
  const [pluginTabs, setPluginTabs] = useState<Array<{pluginId: string, id: string, label: string, icon?: string, componentId: string, roles?: string[]}>>([])

  // Fetch plugin nav tabs on mount
  useEffect(() => {
    const fetchPluginTabs = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/plugins/nav-tabs`, {
          headers: getHeaders()
        })
        if (response.ok) {
          const data = await response.json()
          setPluginTabs(data.tabs || [])
        }
      } catch (error) {
        console.error('Failed to fetch plugin nav tabs:', error)
      }
    }
    
    if (currentUser) {
      fetchPluginTabs()
    }
  }, [currentUser])

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
    let coreTabs: string[] = []
    
    if (currentUser.role === 'SystemAdmin') {
      // SystemAdmin can see everything
      coreTabs = ['Tickets','Map','Calendar','Reports','Closed','Requests','Users','Plugins','Activity','Customers','Sites','Licenses','Vendors']
    } else if (currentUser.role === 'Admin') {
      // Admin can see everything including Plugins
      coreTabs = ['Tickets','Map','Calendar','Reports','Closed','Requests','Users','Plugins','Activity','Customers','Sites','Licenses','Vendors']
    } else if (currentUser.role === 'Coordinator') {
      coreTabs = ['Tickets','Map','Calendar','Reports','Closed','Requests','Activity','Customers','Sites','Licenses','Vendors']
    } else if (currentUser.role === 'Technician') {
      coreTabs = ['Tickets','Map','Calendar']
    } else {
      coreTabs = baseTabs
    }
    
    // Add plugin tabs that match user's role
    const userRole = currentUser.role
    const allowedPluginTabs = pluginTabs
      .filter(pluginTab => {
        // If no roles specified, tab is available to everyone
        if (!pluginTab.roles || pluginTab.roles.length === 0) return true
        // Otherwise check if user's role is in the allowed roles
        return pluginTab.roles.includes(userRole)
      })
      .map(pluginTab => pluginTab.label) // Use the label as the tab name
    
    return [...coreTabs, ...allowedPluginTabs]
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
