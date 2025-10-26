// Enhanced JSON API Service with localStorage persistence
import type { Ticket, Customer, Site, Asset, Vendor } from '../types'

const STORAGE_KEY = 'fieldservice_data'

// Data will be loaded from JSON file first, then localStorage
let allData: any = null
let tickets: Ticket[] = []
let customers: Customer[] = []
let sites: Site[] = []
let assets: Asset[] = []
let vendors: Vendor[] = []

// Load data from localStorage or fallback to JSON file
async function loadDataFromStorage() {
  try {
    // First try to load from localStorage
    const savedData = localStorage.getItem(STORAGE_KEY)
    if (savedData) {
      console.log('JsonApiService: Loading data from localStorage...')
      allData = JSON.parse(savedData)
    } else {
      // Fallback to original JSON file
      console.log('JsonApiService: Loading data from /data.json...')
      const response = await fetch('/data.json')
      if (!response.ok) {
        throw new Error(`Failed to load data: ${response.status}`)
      }
      allData = await response.json()
    }
    
    // Extract data arrays
    tickets = allData.tickets || []
    customers = allData.customers || []
    sites = allData.sites || []
    assets = allData.assets || []
    vendors = allData.vendors || []
    
    console.log('JsonApiService: Loaded data:', {
      tickets: tickets.length,
      customers: customers.length,
      sites: sites.length,
      assets: assets.length,
      vendors: vendors.length,
      source: savedData ? 'localStorage' : 'JSON file'
    })
    
    return allData
  } catch (error) {
    console.error('JsonApiService: Error loading data:', error)
    
    // Fallback to empty arrays
    tickets = []
    customers = []
    sites = []
    assets = []
    vendors = []
    
    return { tickets, customers, sites, assets, vendors }
  }
}

// Save data to localStorage
function saveDataToStorage() {
  try {
    const dataToSave = {
      tickets,
      customers,
      sites,
      assets,
      vendors,
      lastUpdated: new Date().toISOString()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
    console.log('JsonApiService: Data saved to localStorage')
  } catch (error) {
    console.error('JsonApiService: Error saving to localStorage:', error)
  }
}

// Delay function
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const jsonApiService = {
  async getTickets(): Promise<Ticket[]> {
    console.log('JsonApiService.getTickets: Fetching tickets...')
    
    if (!allData) {
      await loadDataFromStorage()
    }
    
    await delay(100)
    console.log('JsonApiService.getTickets: Returning', tickets.length, 'tickets')
    return [...tickets]
  },

  async createTicket(ticketData: Partial<Ticket>): Promise<Ticket> {
    console.log('JsonApiService.createTicket: Creating ticket:', ticketData)
    
    if (!allData) {
      await loadDataFromStorage()
    }
    
    await delay(200)
    
    const newTicket: Ticket = {
      TicketID: ticketData.TicketID || `TKT-${Date.now()}`,
      Title: ticketData.Title || '',
      Status: ticketData.Status || 'New',
      Priority: ticketData.Priority || 'Normal',
      Customer: ticketData.Customer || '',
      Site: ticketData.Site || '',
      AssetIDs: ticketData.AssetIDs || '',
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
      CoordinatorNotes: ticketData.CoordinatorNotes || [],
      AuditTrail: ticketData.AuditTrail || []
    }

    tickets.push(newTicket)
    saveDataToStorage() // Save to localStorage
    console.log('JsonApiService.createTicket: Successfully created ticket:', newTicket.TicketID)
    return newTicket
  },

  async updateTicket(ticketId: string, updates: Partial<Ticket>): Promise<Ticket> {
    console.log('JsonApiService.updateTicket: Updating ticket', ticketId, 'with:', updates)
    
    if (!allData) {
      await loadDataFromStorage()
    }
    
    await delay(200)
    
    const ticketIndex = tickets.findIndex(t => t.TicketID === ticketId)
    if (ticketIndex === -1) {
      throw new Error(`Ticket ${ticketId} not found`)
    }

    // Update the ticket
    const updatedTicket: Ticket = {
      ...tickets[ticketIndex],
      ...updates,
      UpdatedAt: new Date().toISOString()
    }

    tickets[ticketIndex] = updatedTicket
    saveDataToStorage() // Save to localStorage
    console.log('JsonApiService.updateTicket: Successfully updated ticket:', ticketId)
    return updatedTicket
  },

  async deleteTicket(ticketId: string): Promise<void> {
    console.log('JsonApiService.deleteTicket: Deleting ticket:', ticketId)
    
    if (!allData) {
      await loadDataFromStorage()
    }
    
    await delay(100)
    
    const ticketIndex = tickets.findIndex(t => t.TicketID === ticketId)
    if (ticketIndex === -1) {
      throw new Error(`Ticket ${ticketId} not found`)
    }

    tickets.splice(ticketIndex, 1)
    saveDataToStorage() // Save to localStorage
    console.log('JsonApiService.deleteTicket: Successfully deleted ticket:', ticketId)
  },

  // Reset data to original JSON file
  async resetData(): Promise<void> {
    console.log('JsonApiService.resetData: Clearing localStorage and reloading from JSON...')
    localStorage.removeItem(STORAGE_KEY)
    allData = null
    await loadDataFromStorage()
  },

  // Customer methods (basic implementation)
  async getCustomers(): Promise<Customer[]> {
    if (!allData) await loadDataFromStorage()
    await delay(50)
    return [...customers]
  },

  async createCustomer(customerData: Partial<Customer>): Promise<Customer> {
    if (!allData) await loadDataFromStorage()
    await delay(100)
    
    const newCustomer: Customer = {
      Customer: customerData.Customer || `CUST-${Date.now()}`,
      ContactEmail: customerData.ContactEmail || '',
      ContactPhone: customerData.ContactPhone || '',
      Phone: customerData.Phone || '',
      Email: customerData.Email || '',
      Address: customerData.Address || '',
      Notes: customerData.Notes || '',
      CreatedAt: new Date().toISOString()
    }
    
    customers.push(newCustomer)
    saveDataToStorage()
    return newCustomer
  },

  // Site methods (basic implementation)
  async getSites(): Promise<Site[]> {
    if (!allData) await loadDataFromStorage()
    await delay(50)
    return [...sites]
  },

  async createSite(siteData: Partial<Site>): Promise<Site> {
    if (!allData) await loadDataFromStorage()
    await delay(100)
    
    const newSite: Site = {
      Site: siteData.Site || `SITE-${Date.now()}`,
      Customer: siteData.Customer || '',
      Address: siteData.Address || '',
      ContactName: siteData.ContactName || '',
      ContactPhone: siteData.ContactPhone || '',
      GeoLocation: siteData.GeoLocation || '',
      Notes: siteData.Notes || '',
      CreatedAt: new Date().toISOString()
    }
    
    sites.push(newSite)
    saveDataToStorage()
    return newSite
  },

  // Asset methods (basic implementation)
  async getAssets(): Promise<Asset[]> {
    if (!allData) await loadDataFromStorage()
    await delay(50)
    return [...assets]
  },

  async createAsset(assetData: Partial<Asset>): Promise<Asset> {
    if (!allData) await loadDataFromStorage()
    await delay(100)
    
    const newAsset: Asset = {
      AssetID: assetData.AssetID || `ASSET-${Date.now()}`,
      Site: assetData.Site || '',
      Customer: assetData.Customer || '',
      Type: assetData.Type || '',
      Model: assetData.Model || '',
      SerialNumber: assetData.SerialNumber || '',
      InstallDate: assetData.InstallDate || '',
      WarrantyExpires: assetData.WarrantyExpires || '',
      Status: assetData.Status || 'Active',
      Notes: assetData.Notes || '',
      CreatedAt: new Date().toISOString()
    }
    
    assets.push(newAsset)
    saveDataToStorage()
    return newAsset
  },

  // Vendor methods (basic implementation)
  async getVendors(): Promise<Vendor[]> {
    if (!allData) await loadDataFromStorage()
    await delay(50)
    return [...vendors]
  },

  async createVendor(vendorData: Partial<Vendor>): Promise<Vendor> {
    if (!allData) await loadDataFromStorage()
    await delay(100)
    
    const newVendor: Vendor = {
      VendorID: vendorData.VendorID || `VENDOR-${Date.now()}`,
      Name: vendorData.Name || '',
      Contact: vendorData.Contact || '',
      Phone: vendorData.Phone || '',
      Email: vendorData.Email || '',
      ServiceAreas: vendorData.ServiceAreas || [],
      Specialties: vendorData.Specialties || [],
      Rating: vendorData.Rating || 0,
      ServicesTexas: vendorData.ServicesTexas || false,
      Notes: vendorData.Notes || '',
      CreatedAt: new Date().toISOString()
    }
    
    vendors.push(newVendor)
    saveDataToStorage()
    return newVendor
  }
}