import type { Vendor } from './types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

class VendorApiService {
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    const authToken = localStorage.getItem('authToken')
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`
    }

    // Include tenant and user context so the API can scope vendors correctly
    const sqlUserStr = localStorage.getItem('sqlUser')
    if (sqlUserStr) {
      try {
        const sqlUser = JSON.parse(sqlUserStr)
        if (sqlUser?.id) {
          headers['x-user-id'] = sqlUser.id
          if (sqlUser.username || sqlUser.fullName) {
            headers['x-user-name'] = sqlUser.username || sqlUser.fullName
          }
          if (sqlUser.role) {
            headers['x-user-role'] = sqlUser.role
          }
          if (sqlUser.companyCode) {
            headers['x-company-code'] = sqlUser.companyCode
          }
          if (sqlUser.companyName) {
            headers['x-company-name'] = sqlUser.companyName
          }
        }
      } catch (err) {
        console.warn('VendorApiService: Failed to parse sqlUser from localStorage')
      }
    }

    return headers
  }

  async getVendors(): Promise<Vendor[]> {
    try {
      console.log('🏗️ Fetching vendors...')
      const response = await fetch(`${API_BASE_URL}/vendors`, {
        headers: this.getHeaders()
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const vendors = await response.json()
      console.log(`✅ Retrieved ${vendors.length} vendors`)
      return vendors
    } catch (error) {
      console.error('❌ Error fetching vendors:', error)
      throw error
    }
  }

  async createVendor(vendorData: Partial<Vendor>): Promise<Vendor> {
    try {
      console.log('🏗️ Creating vendor:', vendorData.Name)
      const response = await fetch(`${API_BASE_URL}/vendors`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(vendorData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const vendor = await response.json()
      console.log('✅ Vendor created:', vendor.VendorID)
      return vendor
    } catch (error) {
      console.error('❌ Error creating vendor:', error)
      throw error
    }
  }

  async updateVendor(vendorId: string, vendorData: Partial<Vendor>): Promise<Vendor> {
    try {
      console.log('🏗️ Updating vendor:', vendorId)
      const response = await fetch(`${API_BASE_URL}/vendors/${vendorId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(vendorData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const vendor = await response.json()
      console.log('✅ Vendor updated:', vendor.VendorID)
      return vendor
    } catch (error) {
      console.error('❌ Error updating vendor:', error)
      throw error
    }
  }

  async deleteVendor(vendorId: string): Promise<void> {
    try {
      console.log('🏗️ Deleting vendor:', vendorId)
      const response = await fetch(`${API_BASE_URL}/vendors/${vendorId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      console.log('✅ Vendor deleted:', vendorId)
    } catch (error) {
      console.error('❌ Error deleting vendor:', error)
      throw error
    }
  }
}

export const vendorApiService = new VendorApiService()