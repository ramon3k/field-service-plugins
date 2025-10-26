// src/api-json.ts - Simple JSON-based API replacement
// Smart routing layer: automatically uses TenantApiService in SaaS mode, JsonApiService in self-hosted mode
import { jsonApiService } from './services/JsonApiService'
import { tenantApiService } from './services/TenantApiService'
import type { Ticket, Customer, Site, Asset, Vendor } from './types'

// Detect if we're in SaaS mode by checking if tenant session exists
function isSaasMode(): boolean {
  try {
    const session = localStorage.getItem('tenant_session');
    return session !== null;
  } catch {
    return false;
  }
}

// ===== TICKETS =====
export async function listTickets(): Promise<Ticket[]> {
  if (isSaasMode()) {
    console.log('api-json.listTickets: SaaS mode detected, using TenantApiService')
    const response = await tenantApiService.getTickets()
    return response.success && response.data ? response.data : []
  }
  console.log('api-json.listTickets: Self-hosted mode, using JsonApiService')
  return await jsonApiService.getTickets()
}

export async function createTicket(ticketData: Partial<Ticket>): Promise<Ticket> {
  console.log('api-json.createTicket: Creating ticket with data:', ticketData)
  return await jsonApiService.createTicket(ticketData)
}

export async function updateTicket(ticketId: string, updates: Partial<Ticket>): Promise<Ticket> {
  console.log('api-json.updateTicket: Updating ticket', ticketId, 'with:', updates)
  return await jsonApiService.updateTicket(ticketId, updates)
}

export async function deleteTicket(ticketId: string): Promise<void> {
  console.log('api-json.deleteTicket: Deleting ticket:', ticketId)
  return await jsonApiService.deleteTicket(ticketId)
}

// ===== CUSTOMERS =====
export async function listCustomers(): Promise<Customer[]> {
  if (isSaasMode()) {
    console.log('api-json.listCustomers: SaaS mode detected, using TenantApiService')
    const response = await tenantApiService.getCustomers()
    return response.success && response.data ? response.data : []
  }
  console.log('api-json.listCustomers: Self-hosted mode, using JsonApiService')
  return await jsonApiService.getCustomers()
}

export async function createCustomer(customerData: Partial<Customer>): Promise<Customer> {
  console.log('api-json.createCustomer: Creating customer:', customerData)
  return await jsonApiService.createCustomer(customerData)
}

// ===== SITES =====
export async function listSites(): Promise<Site[]> {
  if (isSaasMode()) {
    console.log('api-json.listSites: SaaS mode detected, using TenantApiService')
    const response = await tenantApiService.getSites()
    return response.success && response.data ? response.data : []
  }
  console.log('api-json.listSites: Self-hosted mode, using JsonApiService')
  return await jsonApiService.getSites()
}

export async function createSite(siteData: Partial<Site>): Promise<Site> {
  console.log('api-json.createSite: Creating site:', siteData)
  return await jsonApiService.createSite(siteData)
}

export async function updateSite(siteKey: string, siteData: Partial<Site>): Promise<Site> {
  console.log('api-json.updateSite: Updating site:', siteKey, siteData)
  return await jsonApiService.updateSite(siteKey, siteData)
}

// ===== ASSETS =====
export async function listAssets(): Promise<Asset[]> {
  if (isSaasMode()) {
    console.log('api-json.listAssets: SaaS mode detected, using TenantApiService')
    const response = await tenantApiService.getAssets()
    return response.success && response.data ? response.data : []
  }
  console.log('api-json.listAssets: Self-hosted mode, using JsonApiService')
  return await jsonApiService.getAssets()
}

export async function createAsset(assetData: Partial<Asset>): Promise<Asset> {
  console.log('api-json.createAsset: Creating asset:', assetData)
  return await jsonApiService.createAsset(assetData)
}

// ===== VENDORS =====
export async function listVendors(): Promise<Vendor[]> {
  console.log('api-json.listVendors: Fetching vendors...')
  return await jsonApiService.getVendors()
}

export async function createVendor(vendorData: Partial<Vendor>): Promise<Vendor> {
  console.log('api-json.createVendor: Creating vendor:', vendorData)
  return await jsonApiService.createVendor(vendorData)
}

export async function updateVendor(vendorId: string, updates: Partial<Vendor>): Promise<Vendor> {
  console.log('api-json.updateVendor: Updating vendor:', vendorId, 'with:', updates)
  return await jsonApiService.updateVendor(vendorId, updates)
}

export async function upsertVendor(vendorData: Partial<Vendor>): Promise<Vendor> {
  console.log('api-json.upsertVendor: Upserting vendor:', vendorData)
  if (vendorData.VendorID) {
    return await updateVendor(vendorData.VendorID, vendorData)
  } else {
    return await createVendor(vendorData)
  }
}

// ===== UTILITIES =====
export async function exportAllData() {
  console.log('api-json.exportAllData: Exporting all data for backup/hosting...')
  return await jsonApiService.exportData()
}

export async function importAllData(data: any) {
  console.log('api-json.importAllData: Importing data...')
  return await jsonApiService.importData(data)
}

// ===== UTILITY FUNCTIONS =====
export async function fixTicketGeolocations(): Promise<number> {
  console.log('api-json.fixTicketGeolocations: JSON data should already have proper geolocations')
  // In JSON mode, we assume the data is already correct
  return 0
}