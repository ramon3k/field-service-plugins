import type { Site } from './types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

class SiteApiService {
  private getHeaders(): Record<string, string> {
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

  async getSites(): Promise<Site[]> {
    try {
      console.log('🏢 Fetching sites...')
      const response = await fetch(`${API_BASE_URL}/sites`, {
        headers: this.getHeaders()
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const sites = await response.json()
      console.log(`✅ Retrieved ${sites.length} sites`)
      return sites
    } catch (error) {
      console.error('❌ Error fetching sites:', error)
      throw error
    }
  }

  async createSite(siteData: Partial<Site>): Promise<Site> {
    try {
      console.log('🏢 Creating site:', siteData.Site)
      const response = await fetch(`${API_BASE_URL}/sites`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(siteData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const site = await response.json()
      console.log('✅ Site created:', site.SiteID)
      return site
    } catch (error) {
      console.error('❌ Error creating site:', error)
      throw error
    }
  }

  async updateSite(siteId: string, siteData: Partial<Site>): Promise<Site> {
    try {
      console.log('🏢 Updating site:', siteId)
      const response = await fetch(`${API_BASE_URL}/sites/${siteId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(siteData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const site = await response.json()
      console.log('✅ Site updated:', site.SiteID)
      return site
    } catch (error) {
      console.error('❌ Error updating site:', error)
      throw error
    }
  }

  async deleteSite(siteId: string): Promise<void> {
    try {
      console.log('🏢 Deleting site:', siteId)
      const response = await fetch(`${API_BASE_URL}/sites/${siteId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      console.log('✅ Site deleted:', siteId)
    } catch (error) {
      console.error('❌ Error deleting site:', error)
      throw error
    }
  }
}

export const siteApiService = new SiteApiService()