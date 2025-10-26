import type { Ticket, Customer, Site, Asset, Vendor } from './types'
import { SharePointService } from './services/SharePointService'

// SharePoint integration
let sharePointService: SharePointService | null = null

// Initialize SharePoint service
async function getSharePointService(): Promise<SharePointService> {
  console.log('getSharePointService: Initializing SharePoint service...');
  
  if (!sharePointService) {
    const authContext = (window as any).__AUTH_CONTEXT__;
    console.log('getSharePointService: Auth context:', authContext);
    
    if (!authContext?.graphClient) {
      console.error('getSharePointService: No graph client available');
      throw new Error('SharePoint service not available. Please ensure you are logged in.');
    }
    
    console.log('getSharePointService: Graph client available, resolving site ID...');
    
    try {
      // First, get the site ID by resolving the site URL
      const siteResponse = await authContext.graphClient
        .api(`/sites/netorg18831757.sharepoint.com:/sites/DataCenterPhysicalSecurityPrep`)
        .get();
      
      console.log('getSharePointService: Site resolved:', siteResponse);
      const siteId = siteResponse.id;
      
      sharePointService = new SharePointService(authContext.graphClient, siteId);
      console.log('getSharePointService: SharePoint service created with site ID:', siteId);
    } catch (error) {
      console.error('getSharePointService: Error resolving site:', error);
      throw error;
    }
  }
  
  return sharePointService;
}

// Fallback to local JSON data when SharePoint is not available
const BASE_URL = './data.json'

let data: {
  tickets: Ticket[]
  customers: Customer[]
  sites: Site[]
  assets: Asset[]
  vendors: Vendor[]
} | null = null

// Track if we've made in-memory changes
let hasChanges = false

// Geocoding function using free Nominatim service
export async function geocodeAddress(customer: string, siteName: string): Promise<string> {
  try {
    await loadData()
    if (!data) return ''
    
    // Find the site to get its address
    const site = data.sites.find(s => s.Customer === customer && s.Site === siteName)
    if (!site || !site.Address || !site.City || !site.State) {
      console.log(`No complete address found for site: ${siteName}`)
      return ''
    }
    
    // Check if we already have coordinates for this site
    if (site.Latitude && site.Longitude) {
      return `${site.Latitude},${site.Longitude}`
    }
    
    const fullAddress = `${site.Address}, ${site.City}, ${site.State}, ${site.Country || 'USA'}`
    console.log(`Geocoding address: ${fullAddress}`)
    
    // Use Nominatim (OpenStreetMap) geocoding service
    const encodedAddress = encodeURIComponent(fullAddress)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=us`
    )
    
    if (response.ok) {
      const results = await response.json()
      if (results && results.length > 0) {
        const lat = parseFloat(results[0].lat)
        const lng = parseFloat(results[0].lon)
        
        console.log(`Geocoded ${siteName}: ${lat}, ${lng}`)
        
        // Update the site with coordinates for future use
        site.Latitude = lat.toString()
        site.Longitude = lng.toString()
        hasChanges = true
        saveToLocalStorage()
        
        return `${lat},${lng}`
      }
    }
    
    console.log(`Failed to geocode address: ${fullAddress}`)
    return ''
  } catch (error) {
    console.error('Geocoding error:', error)
    return ''
  }
}

// Load data from JSON file
async function loadData() {
  if (!data) {
    try {
      const response = await fetch(BASE_URL)
      if (!response.ok) throw new Error('Failed to load data')
      data = await response.json()
    } catch (error) {
      console.error('Error loading JSON data:', error)
      // Fallback empty data
      data = { tickets: [], customers: [], sites: [], assets: [], vendors: [] }
    }
  }
  return data
}

// Save data to localStorage as backup (since we can't write to JSON file from browser)
function saveToLocalStorage() {
  if (data && hasChanges) {
    localStorage.setItem('field-service-data', JSON.stringify(data))
    hasChanges = false
    console.log('Data saved to localStorage')
  }
}

// Load data from localStorage if available
function loadFromLocalStorage() {
  const stored = localStorage.getItem('field-service-data')
  if (stored) {
    try {
      data = JSON.parse(stored)
      console.log('Data loaded from localStorage')
      return true
    } catch (error) {
      console.error('Error parsing localStorage data:', error)
    }
  }
  return false
}

export async function listTickets(): Promise<Ticket[]> {
  console.log('listTickets: Starting data fetch...');
  try {
    // Try SharePoint first
    console.log('listTickets: Attempting to get SharePoint service...');
    const sharePoint = await getSharePointService();
    console.log('listTickets: SharePoint service obtained, fetching tickets...');
    const tickets = await sharePoint.getTickets();
    console.log('listTickets: Successfully fetched', tickets.length, 'tickets from SharePoint');
    return tickets;
  } catch (error) {
    console.warn('listTickets: SharePoint not available, falling back to local data:', error);
    // Fallback to local JSON data
    const db = await loadData();
    console.log('listTickets: Loaded', db?.tickets?.length || 0, 'tickets from local data');
    return db ? [...db.tickets] : [];
  }
}

export async function createTicket(ticket: Partial<Ticket>): Promise<Ticket> {
  try {
    // Try SharePoint first
    const sharePoint = await getSharePointService();
    
    // Generate ticket ID if not provided
    const newTicket = {
      ...ticket,
      TicketID: ticket.TicketID || `TKT-${Date.now()}`,
      Status: ticket.Status || 'New',
      Priority: ticket.Priority || 'Normal',
      CreatedAt: ticket.CreatedAt || new Date().toISOString()
    };
    
    return await sharePoint.createTicket(newTicket);
  } catch (error) {
    console.warn('SharePoint not available, falling back to local data:', error);
    // Fallback to local JSON creation (existing logic)
    const db = await loadData()
    if (!db) throw new Error('Database not available')
    
    const newTicket: Ticket = {
      TicketID: `TKT-${Date.now()}`,
      Title: ticket.Title || '',
      Status: ticket.Status || 'New',
      Priority: ticket.Priority || 'Normal', 
      Customer: ticket.Customer || '',
      Site: ticket.Site || '',
      AssetIDs: ticket.AssetIDs || '',
      Category: ticket.Category || '',
      Description: ticket.Description || '',
    ScheduledStart: ticket.ScheduledStart || '',
    ScheduledEnd: ticket.ScheduledEnd || '',
    AssignedTo: ticket.AssignedTo || '',
    SLA_Due: ticket.SLA_Due || '',
    Resolution: ticket.Resolution || '',
    ClosedBy: ticket.ClosedBy || '',
    ClosedDate: ticket.ClosedDate || '',
    GeoLocation: ticket.GeoLocation || '',
    Tags: ticket.Tags || '',
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
    CoordinatorNotes: ticket.CoordinatorNotes || []
  }

  // Auto-geocode if we have site info but no geolocation
  if (newTicket.Customer && newTicket.Site && !newTicket.GeoLocation) {
    console.log(`Auto-geocoding new ticket for site: ${newTicket.Site}`)
    const geoLocation = await geocodeAddress(newTicket.Customer, newTicket.Site)
    if (geoLocation) {
      newTicket.GeoLocation = geoLocation
      console.log(`Added geolocation to ticket: ${geoLocation}`)
    }
  }

  db.tickets.push(newTicket)
  
  hasChanges = true
  saveToLocalStorage()
  return newTicket
  } // End of catch block
} // End of function

export async function updateTicket(id: string, patch: Partial<Ticket>): Promise<void> {
  const db = await loadData()
  if (!db) return
  
  const index = db.tickets.findIndex(t => t.TicketID === id)
  if (index >= 0) {
    const updatedTicket = { 
      ...db.tickets[index], 
      ...patch, 
      UpdatedAt: new Date().toISOString() 
    }

    // Auto-geocode if site info changed but no geolocation provided
    if ((patch.Customer || patch.Site) && !patch.GeoLocation && !updatedTicket.GeoLocation) {
      const customer = updatedTicket.Customer
      const site = updatedTicket.Site
      
      if (customer && site) {
        console.log(`Auto-geocoding updated ticket for site: ${site}`)
        const geoLocation = await geocodeAddress(customer, site)
        if (geoLocation) {
          updatedTicket.GeoLocation = geoLocation
          console.log(`Added geolocation to updated ticket: ${geoLocation}`)
        }
      }
    }

    db.tickets[index] = updatedTicket
    hasChanges = true
    saveToLocalStorage()
  }
}

// Function to fix geolocation for existing tickets
export async function fixTicketGeolocations(): Promise<number> {
  const db = await loadData()
  if (!db) return 0
  
  let fixedCount = 0
  
  for (const ticket of db.tickets) {
    if (ticket.Customer && ticket.Site && !ticket.GeoLocation) {
      console.log(`Fixing geolocation for ticket ${ticket.TicketID}`)
      const geoLocation = await geocodeAddress(ticket.Customer, ticket.Site)
      if (geoLocation) {
        ticket.GeoLocation = geoLocation
        fixedCount++
        // Small delay to avoid overwhelming the geocoding service
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  }
  
  if (fixedCount > 0) {
    hasChanges = true
    saveToLocalStorage()
    console.log(`Fixed geolocation for ${fixedCount} tickets`)
  }
  
  return fixedCount
}

export async function listCustomers(): Promise<Customer[]> {
  try {
    // Try SharePoint first
    const sharePoint = await getSharePointService();
    return await sharePoint.getCustomers();
  } catch (error) {
    console.warn('SharePoint not available, falling back to local data:', error);
    // Fallback to local JSON data
    const db = await loadData();
    return db ? [...db.customers] : [];
  }
}

export async function listSites(): Promise<Site[]> {
  try {
    // Try SharePoint first
    const sharePoint = await getSharePointService();
    return await sharePoint.getSites();
  } catch (error) {
    console.warn('SharePoint not available, falling back to local data:', error);
    // Fallback to local JSON data
    const db = await loadData();
    return db ? [...db.sites] : [];
  }
}

export async function listAssets(): Promise<Asset[]> {
  try {
    // Try SharePoint first
    const sharePoint = await getSharePointService();
    return await sharePoint.getAssets();
  } catch (error) {
    console.warn('SharePoint not available, falling back to local data:', error);
    // Fallback to local JSON data
    const db = await loadData();
    return db ? [...db.assets] : [];
  }
}

export async function listVendors(): Promise<Vendor[]> {
  // Vendors are not yet in SharePoint, use local data only
  const db = await loadData()
  return db ? [...db.vendors] : []
}

// Customer management functions
export const upsertCustomer = async (customerData: Partial<Customer>): Promise<void> => {
  const db = await loadData()
  if (!db) throw new Error('Database not available')
  
  const existingIndex = db.customers.findIndex(c => c.Customer === customerData.Customer)
  
  const customer: Customer = {
    Customer: customerData.Customer || '',
    AccountNumber: customerData.AccountNumber || '',
    PrimaryContact: customerData.PrimaryContact || '',
    Email: customerData.Email || '',
    Phone: customerData.Phone || '',
    BillingAddress: customerData.BillingAddress || '',
    Notes: customerData.Notes || '',
    CreatedAt: existingIndex >= 0 ? db.customers[existingIndex].CreatedAt : new Date().toISOString(),
    UpdatedAt: new Date().toISOString()
  }
  
  if (existingIndex >= 0) {
    db.customers[existingIndex] = customer
  } else {
    db.customers.push(customer)
  }
  
  hasChanges = true
  saveToLocalStorage()
}

export const upsertSite = async (siteData: Partial<Site>): Promise<void> => {
  const db = await loadData()
  if (!db) throw new Error('Database not available')
  
  const existingIndex = db.sites.findIndex(s => 
    s.Customer === siteData.Customer && s.Site === siteData.Site
  )
  
  const site: Site = {
    Customer: siteData.Customer || '',
    Site: siteData.Site || '',
    Address: siteData.Address || '',
    City: siteData.City || '',
    State: siteData.State || '',
    PostalCode: siteData.PostalCode || '',
    Country: siteData.Country || 'USA',
    TimeZone: siteData.TimeZone || '',
    Latitude: siteData.Latitude || '',
    Longitude: siteData.Longitude || '',
    Notes: siteData.Notes || '',
    CreatedAt: existingIndex >= 0 ? db.sites[existingIndex].CreatedAt : new Date().toISOString(),
    UpdatedAt: new Date().toISOString()
  }
  
  if (existingIndex >= 0) {
    db.sites[existingIndex] = site
  } else {
    db.sites.push(site)
  }
  
  hasChanges = true
  saveToLocalStorage()
}

export const upsertAsset = async (assetData: Partial<Asset>): Promise<void> => {
  const db = await loadData()
  if (!db) throw new Error('Database not available')
  
  const assetID = assetData.AssetID || `AST-${Date.now()}`
  const existingIndex = db.assets.findIndex(a => a.AssetID === assetID)
  
  const asset: Asset = {
    AssetID: assetID,
    Customer: assetData.Customer || '',
    Site: assetData.Site || '',
    Type: assetData.Type || '',
    Make: assetData.Make || '',
    Model: assetData.Model || '',
    Serial: assetData.Serial || '',
    InstalledAt: assetData.InstalledAt || '',
    LastService: assetData.LastService || '',
    WarrantyEnd: assetData.WarrantyEnd || '',
    Notes: assetData.Notes || '',
    CreatedAt: existingIndex >= 0 ? db.assets[existingIndex].CreatedAt : new Date().toISOString(),
    UpdatedAt: new Date().toISOString()
  }
  
  if (existingIndex >= 0) {
    db.assets[existingIndex] = asset
  } else {
    db.assets.push(asset)
  }
  
  hasChanges = true
  saveToLocalStorage()
}

export const upsertVendor = async (vendorData: Partial<Vendor>): Promise<void> => {
  const db = await loadData()
  if (!db) throw new Error('Database not available')
  
  const vendorID = vendorData.VendorID || `VND-${Date.now()}`
  const existingIndex = db.vendors.findIndex(v => v.VendorID === vendorID || v.Name === vendorData.Name)
  
  const vendor: Vendor = {
    VendorID: vendorID,
    Name: vendorData.Name || '',
    Contact: vendorData.Contact || '',
    Phone: vendorData.Phone || '',
    Email: vendorData.Email || '',
    ServiceAreas: vendorData.ServiceAreas || [],
    Specialties: vendorData.Specialties || [],
    Rating: vendorData.Rating || 5,
    ServicesTexas: vendorData.ServicesTexas !== undefined ? vendorData.ServicesTexas : true,
    Notes: vendorData.Notes || '',
    CreatedAt: existingIndex >= 0 ? db.vendors[existingIndex].CreatedAt : new Date().toISOString()
  }
  
  if (existingIndex >= 0) {
    db.vendors[existingIndex] = vendor
  } else {
    db.vendors.push(vendor)
  }
  
  hasChanges = true
  saveToLocalStorage()
}
