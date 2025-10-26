// API service for connecting React to local Node.js server with SQL database
import type { Ticket, License, User } from '../types'
import { authService } from './AuthService'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Helper function to handle API responses
async function handleResponse(response: Response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Network error' }))
    throw new Error(errorData.error || `HTTP ${response.status}`)
  }
  return response.json()
}

// Build common headers including auth and user context
function buildHeaders(contentType?: string): HeadersInit {
  const headers: Record<string, string> = {}

  if (contentType) {
    headers['Content-Type'] = contentType
  }

  // Auth token (if any)
  const token = localStorage.getItem('authToken')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Try to get user ID from SQL-based login first
  const sqlUserStr = localStorage.getItem('sqlUser')
  if (sqlUserStr) {
    try {
      const sqlUser = JSON.parse(sqlUserStr)
      if (sqlUser.id) {
        headers['x-user-id'] = sqlUser.id
        headers['x-user-name'] = sqlUser.username || sqlUser.fullName || ''
        headers['x-user-role'] = sqlUser.role || ''
        if (sqlUser.companyCode) {
          headers['x-company-code'] = sqlUser.companyCode
        }
        if (sqlUser.companyName) {
          headers['x-company-name'] = sqlUser.companyName
        }
        console.log('✅ Using SQL user ID for headers:', sqlUser.id, 'Company:', sqlUser.companyCode)
        return headers
      }
    } catch (e) {
      console.warn('Failed to parse sqlUser from localStorage')
    }
  }

  // Fallback to auth service (for legacy users)
  const currentUser = authService.getCurrentUser()
  if (currentUser) {
    if (currentUser.role) headers['x-user-role'] = currentUser.role
    if (currentUser.fullName) headers['x-user-name'] = currentUser.fullName
    if ((currentUser as any).id) headers['x-user-id'] = (currentUser as any).id
  }

  return headers
}

export const sqlApiService = {
  // Test API connection
  async testConnection() {
    console.log('SqlApiService.testConnection: Testing API connection...')
    try {
      const response = await fetch(`${API_BASE_URL}/test`)
      const result = await handleResponse(response)
      console.log('SqlApiService.testConnection: Success -', result)
      return result
    } catch (error) {
      console.error('SqlApiService.testConnection: Failed -', error)
      throw error
    }
  },

  // Get all tickets
  async getTickets(): Promise<Ticket[]> {
    console.log('SqlApiService.getTickets: Fetching tickets from database...')
    try {
      const headers = buildHeaders()
      console.log('SqlApiService.getTickets: Making request to', `${API_BASE_URL}/tickets`)
      const response = await fetch(`${API_BASE_URL}/tickets`, { headers })
      console.log('SqlApiService.getTickets: Response status:', response.status, response.statusText)
      
      const tickets = await handleResponse(response)
      console.log(`SqlApiService.getTickets: Retrieved ${tickets.length} tickets:`, tickets)
      
      // Convert date strings and ensure required fields
      const processedTickets = tickets.map((ticket: any) => ({
        ...ticket,
        CoordinatorNotes: ticket.CoordinatorNotes || [],
        AuditTrail: ticket.AuditTrail || [],
        CreatedAt: ticket.CreatedAt || new Date().toISOString(),
        UpdatedAt: ticket.UpdatedAt || new Date().toISOString()
      }))
      
      console.log(`SqlApiService.getTickets: Processed ${processedTickets.length} tickets for return`)
      return processedTickets
    } catch (error) {
      console.error('SqlApiService.getTickets: Error -', error)
      throw error
    }
  },

  // Get single ticket
  async getTicket(ticketId: string): Promise<Ticket> {
    console.log(`SqlApiService.getTicket: Fetching ticket ${ticketId}`)
    try {
      // Fetch the ticket data (includes CoordinatorNotes and AuditTrail)
      const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}`, { headers: buildHeaders() })
      const ticket = await handleResponse(response)
      
      // The API already returns CoordinatorNotes and AuditTrail as part of the ticket
      console.log(`SqlApiService.getTicket: Retrieved ticket ${ticketId} with ${ticket.AuditTrail?.length || 0} audit entries and ${ticket.CoordinatorNotes?.length || 0} notes`)
      
      return {
        ...ticket,
        CoordinatorNotes: ticket.CoordinatorNotes || [],
        AuditTrail: ticket.AuditTrail || []
      }
    } catch (error) {
      console.error(`SqlApiService.getTicket: Error fetching ${ticketId} -`, error)
      throw error
    }
  },

  // Create new ticket
  async createTicket(ticketData: Partial<Ticket>, currentUser?: any): Promise<Ticket> {
    console.log('SqlApiService.createTicket: Creating ticket -', ticketData.TicketID)
    try {
      // Get current user for activity logging
      const user = currentUser || authService.getCurrentUser()
      
      // Ensure required fields are present, but let server handle TicketID generation
      const ticketToCreate = {
        // Don't include TicketID - let server generate sequential ID
        Title: ticketData.Title || '',
        Status: ticketData.Status || 'New',
        Priority: ticketData.Priority || 'Normal',
        Customer: ticketData.Customer || '',
        Site: ticketData.Site || '',
        LicenseIDs: ticketData.LicenseIDs || '',
        Category: ticketData.Category || '',
        Description: ticketData.Description || '',
        ScheduledStart: ticketData.ScheduledStart || '',
        ScheduledEnd: ticketData.ScheduledEnd || '',
        AssignedTo: ticketData.AssignedTo || '',
        Owner: ticketData.Owner || 'Operations Coordinator',
        SLA_Due: ticketData.SLA_Due || '',
        Resolution: ticketData.Resolution || '',
        ClosedBy: ticketData.ClosedBy || '',
        ClosedDate: ticketData.ClosedDate || '',
        GeoLocation: ticketData.GeoLocation || '',
        Tags: ticketData.Tags || '',
        CreatedAt: ticketData.CreatedAt || new Date().toISOString(),
        UpdatedAt: new Date().toISOString(),
        // Add current user for activity logging
        _currentUser: user
      }

      const response = await fetch(`${API_BASE_URL}/tickets`, {
        method: 'POST',
        headers: buildHeaders('application/json'),
        body: JSON.stringify(ticketToCreate)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json() // Get server response with ticketId
      console.log(`SqlApiService.createTicket: Successfully created ${result.ticketId}`)
      
      // Return the created ticket by fetching it back using the server-assigned ID
      return await this.getTicket(result.ticketId)
    } catch (error) {
      console.error('SqlApiService.createTicket: Error -', error)
      throw error
    }
  },

  // Update ticket
  async updateTicket(ticketId: string, updates: Partial<Ticket>, currentUser?: any): Promise<Ticket> {
    console.log(`SqlApiService.updateTicket: Updating ticket ${ticketId} -`, updates)
    try {
      // Get the current ticket to compare notes
      const currentTicket = await this.getTicket(ticketId)
      const currentNotes = currentTicket.CoordinatorNotes || []
      
      // Extract audit trail and notes data before removing them
      const { CoordinatorNotes, AuditTrail, CreatedAt, ...updateData } = updates

      // Use provided currentUser or fallback to authService
      const userInfo = currentUser || authService.getCurrentUser()
      const requestData = {
        ...updateData,
        _currentUser: userInfo
      }

      // Update the ticket first
      const baseHeaders = buildHeaders('application/json') as Record<string, string>
      // Preserve explicit user headers expected by API while including tenant/auth
      baseHeaders['x-user-id'] = userInfo?.id || ''
      baseHeaders['x-user-fullname'] = userInfo?.fullName || ''
      baseHeaders['x-user-role'] = userInfo?.role || ''
      const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}`, {
        method: 'PUT',
        headers: baseHeaders,
        body: JSON.stringify(requestData)
      })

      await handleResponse(response)
      
      // Save audit trail entries if present
      if (AuditTrail && AuditTrail.length > 0) {
        console.log(`SqlApiService.updateTicket: Saving ${AuditTrail.length} audit entries`)
        const auditResponse = await fetch(`${API_BASE_URL}/tickets/${ticketId}/audit`, {
          method: 'POST',
          headers: buildHeaders('application/json'),
          body: JSON.stringify(AuditTrail)
        })
        await handleResponse(auditResponse)
      }
      
      // Save new coordinator notes if present
      if (CoordinatorNotes && CoordinatorNotes.length > currentNotes.length) {
        const newNotes = CoordinatorNotes.slice(currentNotes.length)
        console.log(`SqlApiService.updateTicket: Saving ${newNotes.length} new coordinator notes`)
        
        for (const note of newNotes) {
          await fetch(`${API_BASE_URL}/tickets/${ticketId}/coordinator-notes`, {
            method: 'POST',
            headers: buildHeaders('application/json'),
            body: JSON.stringify({
              note: note.Note,
              createdBy: note.CoordinatorName || userInfo?.fullName || 'Unknown'
            })
          })
        }
      }

      console.log(`SqlApiService.updateTicket: Successfully updated ${ticketId}`)
      
      // Return the updated ticket by fetching it back
      return await this.getTicket(ticketId)
    } catch (error) {
      console.error(`SqlApiService.updateTicket: Error updating ${ticketId} -`, error)
      throw error
    }
  },

  // Delete ticket
  async deleteTicket(ticketId: string): Promise<void> {
    console.log(`SqlApiService.deleteTicket: Deleting ticket ${ticketId}`)
    try {
      const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}`, {
        method: 'DELETE',
        headers: buildHeaders()
      })

      await handleResponse(response)
      console.log(`SqlApiService.deleteTicket: Successfully deleted ${ticketId}`)
    } catch (error) {
      console.error(`SqlApiService.deleteTicket: Error deleting ${ticketId} -`, error)
      throw error
    }
  },

  // Get users (for authentication)
  async getUsers(): Promise<User[]> {
    console.log('SqlApiService.getUsers: Fetching users from database...')
    try {
      const response = await fetch(`${API_BASE_URL}/users`, { headers: buildHeaders() })
      const users = await handleResponse(response)
      console.log(`SqlApiService.getUsers: Retrieved ${users.length} users`)

      // Normalize to User shape expected by frontend components
      return users.map((user: any) => ({
        id: user.id ?? user.ID ?? user.Username,
        username: user.username ?? user.Username,
        email: user.email ?? user.Email ?? '',
        fullName: user.fullName ?? user.FullName ?? '',
        role: user.role ?? user.Role,
        vendor: user.vendor ?? user.Vendor ?? '',
        isActive: user.isActive ?? user.IsActive ?? true,
        createdAt: user.createdAt ?? user.CreatedAt ?? new Date().toISOString(),
        permissions: user.permissions ?? []
      }))
    } catch (error) {
      console.error('SqlApiService.getUsers: Error -', error)
      throw error
    }
  },

  // ======= LICENSE METHODS =======

  // Get all licenses
  async getLicenses(): Promise<License[]> {
    console.log('SqlApiService.getLicenses: Fetching licenses from database...')
    try {
      const response = await fetch(`${API_BASE_URL}/licenses`, { headers: buildHeaders() })
      const licenses = await handleResponse(response)
      console.log(`SqlApiService.getLicenses: Retrieved ${licenses.length} licenses`)
      return licenses
    } catch (error) {
      console.error('SqlApiService.getLicenses: Error -', error)
      throw error
    }
  },

  // Get single license
  async getLicense(licenseId: string): Promise<License> {
    console.log(`SqlApiService.getLicense: Fetching license ${licenseId}`)
    try {
      const response = await fetch(`${API_BASE_URL}/licenses/${licenseId}`, { headers: buildHeaders() })
      const license = await handleResponse(response)
      console.log(`SqlApiService.getLicense: Retrieved license ${licenseId}`)
      return license
    } catch (error) {
      console.error(`SqlApiService.getLicense: Error fetching ${licenseId} -`, error)
      throw error
    }
  },

  // Create new license
  async createLicense(licenseData: Partial<License>): Promise<License> {
    console.log('SqlApiService.createLicense: Creating license -', licenseData.SoftwareName)
    try {
      // Ensure required fields are present, but let server handle LicenseID generation
      const licenseToCreate = {
        // Don't include LicenseID - let server generate ID
        Customer: licenseData.Customer || '',
        Site: licenseData.Site || '',
        SoftwareName: licenseData.SoftwareName || '',
        SoftwareVersion: licenseData.SoftwareVersion || '',
        LicenseType: licenseData.LicenseType || 'Subscription',
        LicenseKey: licenseData.LicenseKey || '',
        LicenseCount: licenseData.LicenseCount || 1,
        UsedCount: licenseData.UsedCount || 0,
        ExpirationDate: licenseData.ExpirationDate || '',
        ServicePlan: licenseData.ServicePlan || '',
        ServicePlanExpiration: licenseData.ServicePlanExpiration || '',
        Vendor: licenseData.Vendor || '',
        PurchaseDate: licenseData.PurchaseDate || '',
        PurchasePrice: licenseData.PurchasePrice || 0,
        RenewalDate: licenseData.RenewalDate || '',
        RenewalPrice: licenseData.RenewalPrice || 0,
        ContactEmail: licenseData.ContactEmail || '',
        Status: licenseData.Status || 'Active',
        InstallationPath: licenseData.InstallationPath || '',
        LastUpdated: licenseData.LastUpdated || '',
        ComplianceNotes: licenseData.ComplianceNotes || '',
        Notes: licenseData.Notes || '',
        CreatedAt: licenseData.CreatedAt || new Date().toISOString(),
        UpdatedAt: new Date().toISOString()
      }

      const response = await fetch(`${API_BASE_URL}/licenses`, {
        method: 'POST',
        headers: buildHeaders('application/json'),
        body: JSON.stringify(licenseToCreate)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json() // Get server response with licenseId
      console.log(`SqlApiService.createLicense: Successfully created ${result.licenseId}`)
      
      // Return the created license by fetching it back using the server-assigned ID
      return await this.getLicense(result.licenseId)
    } catch (error) {
      console.error('SqlApiService.createLicense: Error -', error)
      throw error
    }
  },

  // Update license
  async updateLicense(licenseId: string, updates: Partial<License>): Promise<License> {
    console.log(`SqlApiService.updateLicense: Updating license ${licenseId} -`, updates)
    try {
      const response = await fetch(`${API_BASE_URL}/licenses/${licenseId}`, {
        method: 'PUT',
        headers: buildHeaders('application/json'),
        body: JSON.stringify(updates)
      })

      await handleResponse(response)
      console.log(`SqlApiService.updateLicense: Successfully updated ${licenseId}`)
      
      // Return the updated license
      return await this.getLicense(licenseId)
    } catch (error) {
      console.error(`SqlApiService.updateLicense: Error updating ${licenseId} -`, error)
      throw error
    }
  },

  // Delete license
  async deleteLicense(licenseId: string): Promise<void> {
    console.log(`SqlApiService.deleteLicense: Deleting license ${licenseId}`)
    try {
      const response = await fetch(`${API_BASE_URL}/licenses/${licenseId}`, {
        method: 'DELETE',
        headers: buildHeaders()
      })

      await handleResponse(response)
      console.log(`SqlApiService.deleteLicense: Successfully deleted ${licenseId}`)
    } catch (error) {
      console.error(`SqlApiService.deleteLicense: Error deleting ${licenseId} -`, error)
      throw error
    }
  },

  // Get licenses by customer and site (for ticket forms)
  async getLicensesBySite(customer: string, site: string): Promise<License[]> {
    console.log(`SqlApiService.getLicensesBySite: Fetching licenses for ${customer} - ${site}`)
    try {
      const response = await fetch(`${API_BASE_URL}/licenses/by-site/${encodeURIComponent(customer)}/${encodeURIComponent(site)}`, { headers: buildHeaders() })
      const licenses = await handleResponse(response)
      console.log(`SqlApiService.getLicensesBySite: Retrieved ${licenses.length} licenses for ${customer} - ${site}`)
      return licenses
    } catch (error) {
      console.error(`SqlApiService.getLicensesBySite: Error fetching licenses for ${customer} - ${site} -`, error)
      throw error
    }
  },

  // ======= CUSTOMER METHODS =======
  async getCustomers(): Promise<any[]> {
    console.log('SqlApiService.getCustomers: Fetching customers from database...')
    try {
      const response = await fetch(`${API_BASE_URL}/customers`, { headers: buildHeaders() })
      const customers = await handleResponse(response)
      console.log(`SqlApiService.getCustomers: Retrieved ${customers.length} customers`)
      return customers
    } catch (error) {
      console.error('SqlApiService.getCustomers: Error -', error)
      throw error
    }
  },

  async createCustomer(customerData: any): Promise<any> {
    console.log('SqlApiService.createCustomer: Creating customer...')
    try {
      const response = await fetch(`${API_BASE_URL}/customers`, {
        method: 'POST',
        headers: buildHeaders('application/json'),
        body: JSON.stringify(customerData)
      })
      return await handleResponse(response)
    } catch (error) {
      console.error('SqlApiService.createCustomer: Error -', error)
      throw error
    }
  },

  // ======= SITE METHODS =======
  async getSites(): Promise<any[]> {
    console.log('SqlApiService.getSites: Fetching sites from database...')
    try {
      const response = await fetch(`${API_BASE_URL}/sites`, { headers: buildHeaders() })
      const sites = await handleResponse(response)
      console.log(`SqlApiService.getSites: Retrieved ${sites.length} sites`)
      return sites
    } catch (error) {
      console.error('SqlApiService.getSites: Error -', error)
      throw error
    }
  },

  async createSite(siteData: any): Promise<any> {
    console.log('SqlApiService.createSite: Creating site...')
    try {
      const response = await fetch(`${API_BASE_URL}/sites`, {
        method: 'POST',
        headers: buildHeaders('application/json'),
        body: JSON.stringify(siteData)
      })
      return await handleResponse(response)
    } catch (error) {
      console.error('SqlApiService.createSite: Error -', error)
      throw error
    }
  },

  async updateSite(siteId: string, siteData: any): Promise<any> {
    console.log('SqlApiService.updateSite: Updating site', siteId, 'with data:', siteData)
    try {
      const response = await fetch(`${API_BASE_URL}/sites/${siteId}`, {
        method: 'PUT',
        headers: buildHeaders('application/json'),
        body: JSON.stringify(siteData)
      })
      const result = await handleResponse(response)
      console.log('SqlApiService.updateSite: Site updated successfully, result:', result)
      return result
    } catch (error) {
      console.error('SqlApiService.updateSite: Error -', error)
      throw error
    }
  },

  async deleteSite(siteId: string): Promise<void> {
    console.log('SqlApiService.deleteSite: Deleting site', siteId)
    try {
      const response = await fetch(`${API_BASE_URL}/sites/${siteId}`, {
        method: 'DELETE',
        headers: buildHeaders()
      })
      await handleResponse(response)
      console.log('SqlApiService.deleteSite: Site deleted successfully')
    } catch (error) {
      console.error('SqlApiService.deleteSite: Error -', error)
      throw error
    }
  },

  // ======= VENDOR METHODS =======
  async getVendors(): Promise<any[]> {
    console.log('SqlApiService.getVendors: Fetching vendors from database...')
    try {
      const response = await fetch(`${API_BASE_URL}/vendors`, { headers: buildHeaders() })
      const vendors = await handleResponse(response)
      console.log(`SqlApiService.getVendors: Retrieved ${vendors.length} vendors`)
      return vendors
    } catch (error) {
      console.error('SqlApiService.getVendors: Error -', error)
      throw error
    }
  },

  async deleteVendor(vendorId: string): Promise<void> {
    console.log('SqlApiService.deleteVendor: Deleting vendor', vendorId)
    try {
      const response = await fetch(`${API_BASE_URL}/vendors/${vendorId}`, {
        method: 'DELETE',
        headers: buildHeaders()
      })
      await handleResponse(response)
      console.log('SqlApiService.deleteVendor: Vendor deleted successfully')
    } catch (error) {
      console.error('SqlApiService.deleteVendor: Error -', error)
      throw error
    }
  },

  // ======= ACTIVITY LOG METHODS =======
  async getActivityLog(): Promise<any[]> {
    console.log('SqlApiService.getActivityLog: Fetching activity log from database...')
    try {
      const response = await fetch(`${API_BASE_URL}/activity-log`, { headers: buildHeaders() })
      const activityLog = await handleResponse(response)
      console.log(`SqlApiService.getActivityLog: Retrieved ${activityLog.length} activity log entries`)
      return activityLog
    } catch (error) {
      console.error('SqlApiService.getActivityLog: Error -', error)
      throw error
    }
  }
}
