// src/services/JsonApiService.ts
import type { Ticket, Customer, Site, Asset, Vendor } from '../types'

// Data will be loaded from the public JSON file
let allData: any = null
let tickets: Ticket[] = []
let customers: Customer[] = []
let sites: Site[] = []
let assets: Asset[] = []
let vendors: Vendor[] = []

// Load data from public JSON file
async function loadDataFromFile() {
  if (allData) return allData // Already loaded
  
  try {
    console.log('JsonApiService: Loading data from /data.json...')
    const response = await fetch('/data.json')
    if (!response.ok) {
      throw new Error(`Failed to load data: ${response.status}`)
    }
    
    allData = await response.json()
    
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
      vendors: vendors.length
    })
    
    return allData
  } catch (error) {
    console.error('JsonApiService: Error loading data from JSON file:', error)
    
    // Fallback to empty arrays
    tickets = []
    customers = []
    sites = []
    assets = []
    vendors = []
    
    throw error
  }
}

// Helper to generate ticket IDs
function generateTicketId(): string {
  return `TKT-${Date.now()}`
}

// Helper to simulate async API calls
function delay(ms: number = 100): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export class JsonApiService {
  // ===== TICKETS =====
  async getTickets(): Promise<Ticket[]> {
    console.log('JsonApiService.getTickets: Starting...');
    
    // Load data from JSON file first
    await loadDataFromFile()
    
    console.log('JsonApiService.getTickets: Returning', tickets.length, 'tickets');
    await delay(100) // Simulate network delay
    return [...tickets] // Return copy to prevent mutation
  }

  async createTicket(ticketData: Partial<Ticket>): Promise<Ticket> {
    console.log('JsonApiService.createTicket: Creating ticket with data:', ticketData);
    
    const newTicket: Ticket = {
      TicketID: generateTicketId(),
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
      SLA_Due: ticketData.SLA_Due || '',
      Resolution: ticketData.Resolution || '',
      ClosedBy: ticketData.ClosedBy || '',
      ClosedDate: ticketData.ClosedDate || '',
      GeoLocation: ticketData.GeoLocation || '',
      Tags: ticketData.Tags || '',
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString()
    }

    await delay(200)
    tickets.push(newTicket)
    console.log('JsonApiService.createTicket: Created ticket:', newTicket.TicketID);
    return newTicket
  }

  async updateTicket(ticketId: string, updates: Partial<Ticket>): Promise<Ticket> {
    console.log('JsonApiService.updateTicket: Updating ticket', ticketId, 'with:', updates);
    
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
    console.log('JsonApiService.updateTicket: Successfully updated ticket:', ticketId);
    return updatedTicket
  }

  async deleteTicket(ticketId: string): Promise<void> {
    console.log('JsonApiService.deleteTicket: Deleting ticket:', ticketId);
    
    await delay(100)
    
    const ticketIndex = tickets.findIndex(t => t.TicketID === ticketId)
    if (ticketIndex === -1) {
      throw new Error(`Ticket ${ticketId} not found`)
    }

    tickets.splice(ticketIndex, 1)
    console.log('JsonApiService.deleteTicket: Successfully deleted ticket:', ticketId);
  }

  // ===== CUSTOMERS =====
  async getCustomers(): Promise<Customer[]> {
    console.log('JsonApiService.getCustomers: Starting...');
    await loadDataFromFile()
    console.log('JsonApiService.getCustomers: Returning', customers.length, 'customers');
    await delay(50)
    return [...customers]
  }

  async createCustomer(customerData: Partial<Customer>): Promise<Customer> {
    console.log('JsonApiService.createCustomer: Creating customer:', customerData);
    
    const newCustomer: Customer = {
      Customer: customerData.Customer || '',
      ContactEmail: customerData.ContactEmail || '',
      ContactPhone: customerData.ContactPhone || '',
      Address: customerData.Address || '',
      Industry: customerData.Industry || '',
      AccountManager: customerData.AccountManager || ''
    }

    await delay(100)
    customers.push(newCustomer)
    console.log('JsonApiService.createCustomer: Created customer:', newCustomer.Customer);
    return newCustomer
  }

  // ===== SITES =====
  async getSites(): Promise<Site[]> {
    console.log('JsonApiService.getSites: Starting...');
    await loadDataFromFile()
    console.log('JsonApiService.getSites: Returning', sites.length, 'sites');
    await delay(50)
    return [...sites]
  }

  async createSite(siteData: Partial<Site>): Promise<Site> {
    console.log('JsonApiService.createSite: Creating site:', siteData);
    
    const newSite: Site = {
      Customer: siteData.Customer || '',
      Site: siteData.Site || '',
      Address: siteData.Address || '',
      ContactName: siteData.ContactName || '',
      ContactPhone: siteData.ContactPhone || '',
      SiteType: siteData.SiteType || '',
      GeoLocation: siteData.GeoLocation || ''
    }

    await delay(100)
    sites.push(newSite)
    console.log('JsonApiService.createSite: Created site:', newSite.Site);
    return newSite
  }

  async updateSite(siteKey: string, siteData: Partial<Site>): Promise<Site> {
    console.log('JsonApiService.updateSite: Updating site:', siteKey, siteData);
    await loadDataFromFile()
    
    // Find site by composite key "Customer|Site"
    const [customer, site] = siteKey.split('|')
    const siteIndex = sites.findIndex(s => s.Customer === customer && s.Site === site)
    
    if (siteIndex === -1) {
      throw new Error(`Site not found: ${siteKey}`)
    }

    // Update the site with new data
    sites[siteIndex] = {
      ...sites[siteIndex],
      ...siteData
    }

    await delay(100)
    console.log('JsonApiService.updateSite: Updated site:', sites[siteIndex].Site);
    return sites[siteIndex]
  }

  // ===== ASSETS =====
  async getAssets(): Promise<Asset[]> {
    console.log('JsonApiService.getAssets: Starting...');
    await loadDataFromFile()
    console.log('JsonApiService.getAssets: Returning', assets.length, 'assets');
    await delay(50)
    return [...assets]
  }

  async createAsset(assetData: Partial<Asset>): Promise<Asset> {
    console.log('JsonApiService.createAsset: Creating asset:', assetData);
    
    const newAsset: Asset = {
      AssetID: assetData.AssetID || `AST-${Date.now()}`,
      Customer: assetData.Customer || '',
      Site: assetData.Site || '',
      Type: assetData.Type || '',
      Make: assetData.Make || '',
      Model: assetData.Model || '',
      SerialNumber: assetData.SerialNumber || '',
      InstallDate: assetData.InstallDate || '',
      WarrantyExpires: assetData.WarrantyExpires || '',
      Status: assetData.Status || 'Active',
      Location: assetData.Location || '',
      IPAddress: assetData.IPAddress || ''
    }

    await delay(100)
    assets.push(newAsset)
    console.log('JsonApiService.createAsset: Created asset:', newAsset.AssetID);
    return newAsset
  }

  // ===== VENDORS =====
  async getVendors(): Promise<Vendor[]> {
    console.log('JsonApiService.getVendors: Starting...');
    await loadDataFromFile()
    console.log('JsonApiService.getVendors: Returning', vendors.length, 'vendors');
    await delay(50)
    return [...vendors]
  }

  async createVendor(vendorData: Partial<Vendor>): Promise<Vendor> {
    console.log('JsonApiService.createVendor: Creating vendor:', vendorData);
    
    const newVendor: Vendor = {
      VendorID: vendorData.VendorID || `VND-${Date.now()}`,
      Name: vendorData.Name || '',
      Contact: vendorData.Contact || '',
      Phone: vendorData.Phone || '',
      Email: vendorData.Email || '',
      ServiceAreas: vendorData.ServiceAreas || [],
      Specialties: vendorData.Specialties || [],
      Rating: vendorData.Rating || 5,
      ServicesTexas: vendorData.ServicesTexas || true,
      Notes: vendorData.Notes || '',
      CreatedAt: vendorData.CreatedAt || new Date().toISOString()
    }

    await delay(100)
    vendors.push(newVendor)
    console.log('JsonApiService.createVendor: Created vendor:', newVendor.VendorID);
    return newVendor
  }

  async updateVendor(vendorId: string, updates: Partial<Vendor>): Promise<Vendor> {
    console.log('JsonApiService.updateVendor: Updating vendor:', vendorId, 'with updates:', updates);
    
    const vendorIndex = vendors.findIndex(v => v.VendorID === vendorId)
    if (vendorIndex === -1) {
      throw new Error(`Vendor with ID ${vendorId} not found`)
    }

    const updatedVendor = {
      ...vendors[vendorIndex],
      ...updates,
      VendorID: vendorId // Preserve the ID
    }

    await delay(150)
    vendors[vendorIndex] = updatedVendor
    console.log('JsonApiService.updateVendor: Updated vendor:', vendorId);
    return updatedVendor
  }

  // ===== DATA EXPORT (for hosting) =====
  async exportData() {
    return {
      tickets,
      customers,
      sites,
      assets,
      vendors,
      exportedAt: new Date().toISOString()
    }
  }

  // ===== DATA IMPORT (for hosting) =====
  async importData(data: any) {
    if (data.tickets) tickets = [...data.tickets]
    if (data.customers) customers = [...data.customers]
    if (data.sites) sites = [...data.sites]  
    if (data.assets) assets = [...data.assets]
    if (data.vendors) vendors = [...data.vendors]
    console.log('JsonApiService: Data imported successfully');
  }
}

// Create and export a singleton instance
export const jsonApiService = new JsonApiService()