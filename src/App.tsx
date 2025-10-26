import React, { useEffect, useState } from 'react'
import TicketList from './components/TicketList'
import TicketForm from './components/TicketForm'
import TicketEditModal from './components/TicketEditModal'
import OperationsMap from './components/OperationsMap'
import DispatchCalendar from './components/DispatchCalendar'
import ReportsPage from './components/ReportsPage'
import ClosedTicketsPage from './components/ClosedTicketsPage'
import UserManagementPage from './components/UserManagementPage'
import ActivityLogPage from './components/ActivityLogPage'
import { CompanyManagementPage } from './components/CompanyManagementPage'
import Nav from './components/Nav'
import CustomersPage from './components/CustomersPage'
import SitesPage from './components/SitesPage'
import LicensesPage from './components/LicensesPage'
import VendorsPage from './components/VendorsPage'
import ServiceRequestsPage from './components/ServiceRequestsPage'
import TechnicianInterface from './components/TechnicianInterface'
import { TenantLogin } from './components/TenantLogin'

import MapOnlyApp from './MapOnlyApp'
import { listTickets, createTicket, updateTicket, listSites } from './api-sql'
import { sqlApiService } from './services/SqlApiService'
import { tenantApiService } from './services/TenantApiService'
import type { Ticket, AuthUser } from './types'

interface TenantInfo {
  id: string;
  code: string;
  name: string;
  tier: string;
  maxUsers: number;
}

export default function App() {
  // All hooks must be called before any conditional returns
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [sites, setSites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editTicket, setEditTicket] = useState<Ticket|undefined>(undefined)
  const [isNewTicket, setIsNewTicket] = useState(false)
  const [error, setError] = useState<string|undefined>(undefined)
  const [tab, setTab] = useState<'Tickets'|'Map'|'Calendar'|'Reports'|'Closed'|'Users'|'Companies'|'Activity'|'Customers'|'Sites'|'Licenses'|'Vendors'|'Requests'>('Tickets')
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [currentTenant, setCurrentTenant] = useState<TenantInfo | null>(null)
  const [companyDisplayName, setCompanyDisplayName] = useState<string>('DCPSP Field Service') // Dynamic company branding
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState<string>('')
  const [mapRefreshTrigger, setMapRefreshTrigger] = useState(0)
  const [newRequestsCount, setNewRequestsCount] = useState(0) // Count from ServiceRequestsPage

  // Update page title when company name changes
  useEffect(() => {
    document.title = companyDisplayName
  }, [companyDisplayName])

  // Fetch initial request count when authenticated
  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      console.log('🔴 Count fetch skipped:', { isAuthenticated, hasUser: !!currentUser })
      return
    }

    console.log('🟢 Fetching initial request count...')
    
    const fetchCount = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
        const companyCode = currentUser.companyCode || localStorage.getItem('companyCode') || ''
        
        // Build headers with user context (same as ServiceRequestsPage)
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
        
        console.log('📡 Fetching from:', `${API_BASE_URL}/service-requests?status=New&companyCode=${companyCode}`)
        const response = await fetch(`${API_BASE_URL}/service-requests?status=New&companyCode=${companyCode}`, {
          headers
        })
        if (response.ok) {
          const requests = await response.json()
          console.log('✅ Got request count:', requests.length)
          setNewRequestsCount(requests.length)
        } else {
          console.error('❌ Request failed:', response.status, response.statusText)
        }
      } catch (error) {
        console.error('Failed to fetch initial request count:', error)
      }
    }

    fetchCount()
    // Refresh count every 60 seconds
    const interval = setInterval(fetchCount, 60000)
    return () => clearInterval(interval)
  }, [isAuthenticated, currentUser])

  // Initialize authentication state on mount - check for existing session
  useEffect(() => {
    const initializeAuth = () => {
      console.log('🔐 Initializing authentication...');
      console.log('📦 LocalStorage contents:', {
        sqlUser: !!localStorage.getItem('sqlUser'),
        authToken: !!localStorage.getItem('authToken'),
        userRole: localStorage.getItem('userRole'),
        userName: localStorage.getItem('userName')
      });
      
      // Check for sqlUser in localStorage (tenant-based auth)
      const sqlUserStr = localStorage.getItem('sqlUser');
      const authToken = localStorage.getItem('authToken');
      
      console.log('🔍 Checking authentication:', { hasSqlUser: !!sqlUserStr, hasToken: !!authToken });
      
      if (sqlUserStr && authToken) {
        try {
          const sqlUser = JSON.parse(sqlUserStr);
          console.log('👤 Found stored user:', sqlUser.username, 'Company:', sqlUser.companyCode);
          
          setCurrentUser(sqlUser);
          setIsAuthenticated(true);
          
          // Set company branding
          if (sqlUser.companyDisplayName) {
            setCompanyDisplayName(sqlUser.companyDisplayName);
          } else if (sqlUser.companyName) {
            setCompanyDisplayName(sqlUser.companyName);
          }
          
          console.log('✅ User authenticated from localStorage - isAuthenticated will be set to TRUE');
          // Data will be loaded by the useEffect that watches [tab, isAuthenticated]
          return;
        } catch (error) {
          console.error('🔄 Invalid sqlUser data, clearing session:', error);
          localStorage.removeItem('sqlUser');
          localStorage.removeItem('authToken');
        }
      }
      
      // No valid session - show login
      console.log('📋 No valid session - ready for login');
      setIsAuthenticated(false);
    };
    
    initializeAuth();
  }, []); // Run once on mount

  // Tenant authentication handlers
  const handleTenantLogin = async (tenantCode: string, username: string, password: string) => {
    setLoginLoading(true);
    setLoginError('');
    
    try {
      const result = await tenantApiService.login(tenantCode, username, password);
      
      if (result.success && result.data) {
        // CRITICAL: Store authentication token
        if (result.data.token) {
          localStorage.setItem('authToken', result.data.token);
          console.log('✅ Stored auth token');
        }
        
        // CRITICAL: Store complete user object for data isolation headers
        if (result.data.user) {
          localStorage.setItem('sqlUser', JSON.stringify(result.data.user));
          localStorage.setItem('userRole', result.data.user.role);
          localStorage.setItem('userName', result.data.user.fullName || result.data.user.username);
          localStorage.setItem('userId', result.data.user.id);
          console.log('✅ Stored SQL user for data isolation:', result.data.user.id, 'Company:', result.data.user.companyCode);
        }
        
        setCurrentUser(result.data.user);
        setCurrentTenant({
          id: tenantCode,
          code: result.data.tenant.code,
          name: result.data.tenant.name,
          tier: 'Standard',
          maxUsers: 100
        });
        
        // Set company display name for app branding
        if (result.data.user.companyDisplayName) {
          setCompanyDisplayName(result.data.user.companyDisplayName);
        } else if (result.data.user.companyName) {
          setCompanyDisplayName(result.data.user.companyName);
        } else if (result.data.tenant.name) {
          setCompanyDisplayName(result.data.tenant.name);
        }
        
        setIsAuthenticated(true);
        await refresh();
      } else {
        throw new Error(result.error || 'Login failed');
      }
    } catch (error: any) {
      setLoginError(error.message || 'Login failed. Please try again.');
      throw error;
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    // Tenant-based logout (single database, multi-tenant)
    await tenantApiService.logout();
    
    setCurrentUser(null);
    setCurrentTenant(null);
    setIsAuthenticated(false);
    setTickets([]);
    setSites([]);
    setTab('Tickets');
  }

  // Define functions that will be used in useEffect
  async function refresh() {
    if (!['Tickets', 'Reports', 'Closed'].includes(tab)) return
    console.log('App.refresh: Starting refresh...');
    console.log('App.refresh: Loading data from SQL API');
    setLoading(true)
    setError(undefined)
    try {
      // Always use SqlApiService (single-database multi-tenant)
      console.log('App.refresh: Using SqlApiService');
      const [ticketsData, sitesData] = await Promise.all([
        listTickets(),
        listSites()
      ])
      
      console.log('App.refresh: Received from SQL database -', ticketsData.length, 'tickets and', sitesData.length, 'sites');
      setTickets(ticketsData)
      setSites(sitesData)
      
      console.log('App.refresh: Updated state with tickets and sites');
      
      // Trigger map refresh
      setMapRefreshTrigger(prev => prev + 1)
    } catch (e:any) {
      console.error('App.refresh: Error during refresh:', e);
      setError(`Database connection failed: ${e.message}`)
      setTickets([])
      setSites([])
    } finally {
      setLoading(false)
    }
  }

  // useEffect must also be before conditional returns
  useEffect(() => { 
    if (isAuthenticated) {
      refresh() 
    }
  }, [tab, isAuthenticated])
  
  // Check if this is a map-only popup window
  const urlParams = new URLSearchParams(window.location.search)
  const isMapOnly = urlParams.get('map-only') === 'true'
  
  if (isMapOnly) {
    return <MapOnlyApp />
  }

  // Show technician interface for technician users
  if (currentUser?.role === 'Technician') {
    const handleTechnicianTicketUpdate = async (updatedTicket: Ticket) => {
      try {
        await updateTicket(updatedTicket.TicketID, updatedTicket, currentUser)
        await refresh()
        // Data is automatically saved to localStorage in refresh()
      } catch (error) {
        console.error('Error updating ticket:', error)
        throw error
      }
    }
    
    return <TechnicianInterface 
      tickets={tickets} 
      currentUser={currentUser}
      onTicketUpdate={handleTechnicianTicketUpdate}
      onLogout={handleLogout}
    />
  }

  async function handleCreate(data: Partial<Ticket>) {
    await createTicket(data, currentUser)
    setIsNewTicket(false)
    setEditTicket(undefined)
    await refresh()
    // Data is automatically saved to localStorage in refresh()
  }

  async function handleStatusChange(id: string, status: string) {
    await updateTicket(id, { Status: status }, currentUser)
    await refresh()
    // Data is automatically saved to localStorage in refresh()
  }

  async function handleEditSave(patch: Partial<Ticket>) {
    try {
      if (isNewTicket) {
        await createTicket(patch, currentUser)
        setIsNewTicket(false)
        setEditTicket(undefined)
      } else if (editTicket) {
        await updateTicket(editTicket.TicketID, patch, currentUser)
        setEditTicket(undefined)
      }
      await refresh()
      // Data is automatically saved to localStorage in refresh()
    } catch (error) {
      console.error('Error saving ticket:', error);
      alert('Error saving ticket: ' + (error as any).message);
    }
  }

  // Create blank ticket for new ticket modal
  const createBlankTicket = (): Ticket => {
    const now = new Date()
    const slaDate = new Date(now.getTime() + (72 * 60 * 60 * 1000)) // 72 hours for Normal priority
    
    return {
      TicketID: `TKT-TEMP-${Date.now()}`, // Temporary ID, server will assign proper sequential ID
      Title: '',
      Status: 'New',
      Priority: 'Normal',
      Customer: '',
      Site: '',
      LicenseIDs: '',
      Category: '',
      Description: '',
      ScheduledStart: '',
      ScheduledEnd: '',
      AssignedTo: '',
      SLA_Due: slaDate.toISOString(),
      Resolution: '',
      ClosedBy: '',
      ClosedDate: '',
      GeoLocation: '',
      Tags: '',
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
      CoordinatorNotes: []
    }
  }

  const handleNewTicket = () => {
    setEditTicket(createBlankTicket())
    setIsNewTicket(true)
  }

  const handleReopenTicket = async (ticket: Ticket & { reopenReason?: string }) => {
    try {
      const auditEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        user: currentUser?.fullName || 'Unknown User',
        action: 'Ticket Reopened',
        field: 'Status',
        oldValue: ticket.Status,
        newValue: 'New',
        notes: ticket.reopenReason || 'Ticket reopened from closed status'
      }

      await updateTicket(ticket.TicketID, { 
        Status: 'New',
        ClosedBy: '',
        ClosedDate: '',
        AuditTrail: [...(ticket.AuditTrail || []), auditEntry]
      }, currentUser)
      await refresh()
    } catch (error) {
      console.error('Error reopening ticket:', error)
      alert('Error reopening ticket: ' + (error as any).message)
    }
  }

  const handleEditTicket = async (ticket: Ticket) => {
    try {
      // Fetch complete ticket data including audit trail
      const completeTicket = await sqlApiService.getTicket(ticket.TicketID)
      setEditTicket(completeTicket)
      setIsNewTicket(false)
    } catch (error) {
      console.error('Error loading complete ticket data:', error)
      // Fallback to basic ticket data if fetch fails
      setEditTicket(ticket)
      setIsNewTicket(false)
    }
  }

  const handleViewHistory = async (ticket: Ticket) => {
    try {
      // Fetch complete ticket data including audit trail
      const completeTicket = await sqlApiService.getTicket(ticket.TicketID)
      setEditTicket(completeTicket)
      setIsNewTicket(false)
    } catch (error) {
      console.error('Error loading complete ticket data:', error)
      // Fallback to basic ticket data if fetch fails
      setEditTicket(ticket)
      setIsNewTicket(false)
    }
  }

  const handleCloseModal = () => {
    setEditTicket(undefined)
    setIsNewTicket(false)
  }

  // Debug: Log render state
  console.log('🔍 App Render State:', {
    isAuthenticated,
    hasUser: !!currentUser,
    userCompany: currentUser?.companyCode
  });

  return (
    <div className="container">
      {/* Tenant Login - Show when not authenticated */}
      {!isAuthenticated && (
        <TenantLogin
          onLogin={handleTenantLogin}
        />
      )}

      {/* Main Application - Show when authenticated */}
      {isAuthenticated && (
        <>
          <div className="row" style={{marginBottom: 12}}>
            <div style={{flex:1}}>
              <h1>🔧 {companyDisplayName}</h1>
              <div className="muted">
                Multi-Tenant Field Service Management Platform
                {currentTenant && (
                  <span style={{ marginLeft: '16px', fontWeight: 500, color: '#3b82f6' }}>
                    • {currentTenant.name} ({currentTenant.tier})
                  </span>
                )}
              </div>
            </div>
            <div className="toolbar">
              {tab==='Tickets' && <button className="ghost" onClick={refresh}>Refresh</button>}
              {tab==='Tickets' && <button className="primary" onClick={handleNewTicket}>New Ticket</button>}
            </div>
          </div>

          <Nav
            tab={tab}
            setTab={(t)=>setTab(t as any)}
            currentUser={currentUser}
            onLogout={handleLogout}
            newRequestsCount={newRequestsCount}
          />          {tab==='Tickets' && (
            <>
              {error && <div className="card" style={{borderColor:'#ff5470', color:'#ffb3bf'}}>Error: {error}</div>}
              <TicketList 
                items={tickets.filter(ticket => ticket.Status !== 'Closed')} 
                onStatusChange={handleStatusChange} 
                onEdit={handleEditTicket} 
                loading={loading} 
              />
            </>
          )}

          {tab==='Map' && <OperationsMap tickets={tickets} refreshTrigger={mapRefreshTrigger} />}
          {tab==='Calendar' && <DispatchCalendar tickets={tickets} currentUser={currentUser} onTicketSelect={setEditTicket} />}
          {tab==='Reports' && <ReportsPage tickets={tickets} sites={sites} />}
          {tab==='Closed' && (
            <ClosedTicketsPage 
              tickets={tickets} 
              onViewHistory={(ticket) => setEditTicket(ticket)}
              onReopen={handleReopenTicket}
            />
          )}
          {tab==='Users' && <UserManagementPage currentUser={currentUser} />}
          {tab==='Companies' && <CompanyManagementPage />}
          {tab==='Activity' && <ActivityLogPage />}
          {tab==='Customers' && <CustomersPage />}
          {tab==='Sites' && <SitesPage />}
          {tab==='Licenses' && <LicensesPage />}
          {tab==='Vendors' && <VendorsPage />}
          {tab==='Requests' && <ServiceRequestsPage onLogout={handleLogout} onCountChange={setNewRequestsCount} />}

          {/* Global Ticket Edit Modal - available from any tab */}
          {editTicket && (
            <TicketEditModal 
              ticket={editTicket} 
              onClose={handleCloseModal} 
              onSave={handleEditSave} 
              readonly={editTicket.Status === 'Closed'}
              companyName={companyDisplayName}
            />
          )}
        </>
      )}
    </div>
  )
}
