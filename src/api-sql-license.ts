import { sqlApiService } from './services/SqlApiService'
import type { License } from './types'

// License management functions for SQL database
export async function listLicenses(): Promise<License[]> {
  console.log('api-sql-license.listLicenses: Fetching licenses from SQL database')
  return await sqlApiService.getLicenses()
}

export async function getLicense(licenseId: string): Promise<License> {
  console.log('api-sql-license.getLicense: Fetching license:', licenseId)
  return await sqlApiService.getLicense(licenseId)
}

export async function createLicense(licenseData: Partial<License>): Promise<License> {
  console.log('api-sql-license.createLicense: Creating license with data:', licenseData)
  return await sqlApiService.createLicense(licenseData)
}

export async function updateLicense(licenseId: string, updates: Partial<License>): Promise<License> {
  console.log('api-sql-license.updateLicense: Updating license:', licenseId, updates)
  return await sqlApiService.updateLicense(licenseId, updates)
}

export async function deleteLicense(licenseId: string): Promise<void> {
  console.log('api-sql-license.deleteLicense: Deleting license:', licenseId)
  return await sqlApiService.deleteLicense(licenseId)
}

export async function getLicensesBySite(customer: string, site: string): Promise<License[]> {
  console.log('api-sql-license.getLicensesBySite: Fetching licenses for:', customer, site)
  return await sqlApiService.getLicensesBySite(customer, site)
}