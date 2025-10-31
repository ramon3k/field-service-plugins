// src/api-sql.ts - SQL Database API via Node.js server
// Single-database multi-tenant: always use SqlApiService (tenant handled by CompanyCode in database)
import { sqlApiService } from './services/SqlApiService'
import type { Ticket, Customer, Site, Asset, Vendor } from './types'

// ===== TICKETS =====
export async function listTickets(): Promise<Ticket[]> {
  console.log('api-sql.listTickets: Using SqlApiService')
  return await sqlApiService.getTickets()
}

export async function createTicket(ticketData: Partial<Ticket>, currentUser?: any): Promise<Ticket> {
  console.log('api-sql.createTicket: Creating ticket with data:', ticketData)
  return await sqlApiService.createTicket(ticketData, currentUser)
}

export async function updateTicket(ticketId: string, updates: Partial<Ticket>, currentUser?: any): Promise<Ticket> {
  console.log('api-sql.updateTicket: Updating ticket', ticketId, 'with:', updates)
  return await sqlApiService.updateTicket(ticketId, updates, currentUser)
}

export async function deleteTicket(ticketId: string): Promise<void> {
  console.log('api-sql.deleteTicket: Deleting ticket:', ticketId)
  return await sqlApiService.deleteTicket(ticketId)
}

// ===== CUSTOMERS ===== 
export async function listCustomers(): Promise<Customer[]> {
  console.log('api-sql.listCustomers: Using SqlApiService')
  return await sqlApiService.getCustomers()
}

export async function createCustomer(customerData: Partial<Customer>): Promise<Customer> {
  console.log('api-sql.createCustomer: Creating customer with data:', customerData)
  return await sqlApiService.createCustomer(customerData)
}

// ===== SITES =====
export async function listSites(): Promise<Site[]> {
  console.log('api-sql.listSites: Using SqlApiService')
  return await sqlApiService.getSites()
}

export async function createSite(siteData: Partial<Site>): Promise<Site> {
  console.log('api-sql.createSite: Creating site with data:', siteData)
  return await sqlApiService.createSite(siteData)
}

// ===== ASSETS =====
export async function listAssets(): Promise<Asset[]> {
  console.log('api-sql.listAssets: Assets not yet implemented in SQL API')
  return []
}

export async function createAsset(assetData: Partial<Asset>): Promise<Asset> {
  console.log('api-sql.createAsset: Assets not yet implemented in SQL API')
  throw new Error('Asset management not yet implemented in SQL API')
}

// ===== VENDORS =====
export async function listVendors(): Promise<Vendor[]> {
  console.log('api-sql.listVendors: Fetching vendors from SQL database...')
  return await sqlApiService.getVendors()
}

export async function createVendor(vendorData: Partial<Vendor>): Promise<Vendor> {
  console.log('api-sql.createVendor: Vendor creation not yet implemented in SQL API')
  throw new Error('Vendor creation not yet implemented in SQL API')
}

// ===== LICENSES =====
export async function listLicenses(): Promise<any[]> {
  console.log('api-sql.listLicenses: Fetching licenses from SQL database...')
  return await sqlApiService.getLicenses()
}

// ===== ACTIVITY LOG =====
export async function listActivityLog(): Promise<any[]> {
  console.log('api-sql.listActivityLog: Fetching activity log from SQL database...')
  return await sqlApiService.getActivityLog()
}

// ===== CONNECTION TEST =====
export async function testApiConnection() {
  console.log('api-sql.testApiConnection: Testing API server connection...')
  return await sqlApiService.testConnection()
}

// ===== GEOLOCATION FUNCTIONS =====
export async function fixTicketGeolocations(): Promise<number> {
  console.log('api-sql.fixTicketGeolocations: SQL data should already have proper geolocations')
  // For SQL database, geolocations should already be correct
  // Return 0 to indicate no tickets needed fixing
  return 0
}