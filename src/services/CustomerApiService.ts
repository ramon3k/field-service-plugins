// src/services/CustomerApiService.ts
import type { Customer } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function getHeaders(): Record<string, string> {
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

async function handleResponse(response: Response) {
  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || `HTTP ${response.status}`)
  }
  return response.json()
}

export const customerApiService = {
  // Get all customers
  async getCustomers(): Promise<Customer[]> {
    console.log('CustomerApiService.getCustomers: Fetching all customers')
    try {
      const response = await fetch(`${API_BASE_URL}/customers`, {
        headers: getHeaders()
      })
      return await handleResponse(response)
    } catch (error) {
      console.error('CustomerApiService.getCustomers: Error -', error)
      throw error
    }
  },

  // Create new customer
  async createCustomer(customerData: Partial<Customer>): Promise<void> {
    console.log('CustomerApiService.createCustomer: Creating customer -', customerData.Name)
    try {
      const response = await fetch(`${API_BASE_URL}/customers`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(customerData)
      })
      await handleResponse(response)
      console.log('CustomerApiService.createCustomer: Successfully created customer')
    } catch (error) {
      console.error('CustomerApiService.createCustomer: Error -', error)
      throw error
    }
  },

  // Update existing customer
  async updateCustomer(customerID: string, customerData: Partial<Customer>): Promise<void> {
    console.log('CustomerApiService.updateCustomer: Updating customer -', customerID)
    try {
      const response = await fetch(`${API_BASE_URL}/customers/${customerID}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(customerData)
      })
      await handleResponse(response)
      console.log('CustomerApiService.updateCustomer: Successfully updated customer')
    } catch (error) {
      console.error('CustomerApiService.updateCustomer: Error -', error)
      throw error
    }
  }
}