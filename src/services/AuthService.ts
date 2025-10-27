// src/services/AuthService.ts
import type { User, LoginCredentials, AuthUser } from '../types'

// Simple hash function for demo purposes (in production, use proper server-side hashing)
function simpleHash(password: string): string {
  // This is NOT secure - just for demo purposes
  return btoa(password + 'salt123')
}

function verifyPassword(password: string, hash: string): boolean {
  return simpleHash(password) === hash
}

export class AuthService {
  private currentUser: AuthUser | null = null
  private readonly AUTH_KEY = 'fieldservice_auth_user'
  
  constructor() {
    // Try to restore session on startup
    this.restoreSession()
  }

  async login(credentials: LoginCredentials): Promise<AuthUser> {
    console.log('AuthService.login: Attempting SQL-based login for:', credentials.username)
    
    try {
      // Call the backend SQL authentication API
      const response = await fetch('http://127.0.0.1:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Login failed' }))
        throw new Error(errorData.error || 'Login failed')
      }

      const data = await response.json()
      
      console.log('🔍 AuthService.login: Raw server response:', data)
      
      if (!data.success || !data.user) {
        throw new Error('Invalid response from server')
      }

      console.log('🔍 AuthService.login: User ID from server:', data.user.id)

      // Create auth user from server response
      const authUser: AuthUser = {
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        fullName: data.user.fullName,
        role: data.user.role,
        isActive: true,
        permissions: data.user.permissions || [],
        companyCode: data.user.companyCode,
        companyName: data.user.companyName,
        companyDisplayName: data.user.companyDisplayName
      }
      
      console.log('✅ AuthService.login: Login successful, authUser created:', authUser)
      console.log('🔍 AuthService.login: authUser.id =', authUser.id)
      
      // Store session
      this.currentUser = authUser
      const jsonString = JSON.stringify(authUser)
      console.log('🔍 AuthService.login: Storing in localStorage:', jsonString)
      localStorage.setItem(this.AUTH_KEY, jsonString)
      
      // Verify it was stored
      const verification = localStorage.getItem(this.AUTH_KEY)
      console.log('🔍 AuthService.login: Verification read from localStorage:', verification)
      
      return authUser
    } catch (error) {
      console.error('❌ AuthService.login: Error during SQL login:', error)
      throw error
    }
  }

  logout(): void {
    console.log('AuthService.logout: Logging out user:', this.currentUser?.username)
    this.currentUser = null
    localStorage.removeItem(this.AUTH_KEY)
  }

  setUser(user: AuthUser): void {
    this.currentUser = user
    localStorage.setItem(this.AUTH_KEY, JSON.stringify(user))
    console.log('AuthService.setUser: User set:', user.username)
  }

  getCurrentUser(): AuthUser | null {
    console.log('🔍 getCurrentUser called, returning:', this.currentUser)
    console.log('🔍 getCurrentUser - user ID:', this.currentUser?.id)
    return this.currentUser
  }

  isLoggedIn(): boolean {
    return this.currentUser !== null
  }

  hasRole(role: string): boolean {
    return this.currentUser?.role === role
  }

  hasPermission(permission: string): boolean {
    if (!this.currentUser) return false
    if (this.currentUser.role === 'Admin') return true // Admins have all permissions
    return this.currentUser.permissions?.includes(permission) || false
  }

  private restoreSession(): void {
    try {
      const stored = localStorage.getItem(this.AUTH_KEY)
      console.log('🔍 AuthService: Raw localStorage value:', stored)
      if (stored) {
        this.currentUser = JSON.parse(stored)
        console.log('✅ AuthService: Session restored for user:', this.currentUser?.username)
        console.log('🔍 AuthService: User ID from storage:', this.currentUser?.id)
        console.log('🔍 AuthService: Full user object:', this.currentUser)
      } else {
        console.log('⚠️ AuthService: No stored session found')
      }
    } catch (error) {
      console.error('❌ AuthService: Error restoring session:', error)
      localStorage.removeItem(this.AUTH_KEY)
    }
  }

  private async getUsers(): Promise<User[]> {
    // For self-hosted mode, use local user data instead of API
    const localUsers: User[] = [
      {
        id: 'admin-001',
        username: 'admin',
        email: 'admin@company.com',
        fullName: 'System Administrator',
        role: 'Admin',
        isActive: true,
        permissions: ['read', 'write', 'delete', 'admin'],
        createdAt: '2024-01-01T00:00:00.000Z'
      },
      {
        id: 'coordinator-001',
        username: 'coordinator',
        email: 'coordinator@company.com',
        fullName: 'Field Coordinator',
        role: 'Coordinator',
        isActive: true,
        permissions: ['read', 'write'],
        createdAt: '2024-01-01T00:00:00.000Z'
      },
      {
        id: 'tech-001',
        username: 'technician',
        email: 'tech@company.com',
        fullName: 'Field Technician',
        role: 'Technician',
        isActive: true,
        permissions: ['read'],
        createdAt: '2024-01-01T00:00:00.000Z'
      }
    ]
    
    console.log('AuthService: Using local user data for self-hosted mode');
    console.log('AuthService: Available users:', localUsers.map(u => u.username));
    return localUsers
  }

  private async logLoginActivity(user: User): Promise<void> {
    // For self-hosted mode, just log to console instead of API
    console.log('AuthService: Login activity logged for user:', user.username);
    console.log('AuthService: Login time:', new Date().toISOString());
    // In a real self-hosted system, you might log to a local file or database
  }

  // Admin and Coordinator functions for user management
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'passwordHash'> & { password: string }): Promise<User> {
    if (!this.hasRole('Admin') && !this.hasRole('Coordinator')) {
      throw new Error('Insufficient permissions')
    }

    const newUser: User = {
      id: `user_${Date.now()}`,
      username: userData.username,
      email: userData.email,
      fullName: userData.fullName,
      role: userData.role,
      passwordHash: simpleHash(userData.password),
      isActive: userData.isActive,
      createdAt: new Date().toISOString(),
      permissions: userData.permissions
    }

    console.log('AuthService: User created:', newUser.username)
    return newUser
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    if (!this.hasRole('Admin') && !this.hasRole('Coordinator')) {
      throw new Error('Insufficient permissions')
    }

    console.log('AuthService: User updated:', userId)
    // In a real app, this would update the server
    throw new Error('User update not implemented in JSON mode')
  }

  async changePassword(userId: string, newPassword: string): Promise<void> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    // Optional bearer token if present
    const token = localStorage.getItem('authToken')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    // Prefer the stored SQL user context for multi-tenant headers
    const sqlUserStr = localStorage.getItem('sqlUser')
    if (sqlUserStr) {
      try {
        const sqlUser = JSON.parse(sqlUserStr)
        if (sqlUser?.id) {
          headers['x-user-id'] = sqlUser.id
          headers['x-user-name'] = sqlUser.username || sqlUser.fullName || ''
          if (sqlUser.role) headers['x-user-role'] = sqlUser.role
          if (sqlUser.companyCode) headers['x-company-code'] = sqlUser.companyCode
          if (sqlUser.companyName) headers['x-company-name'] = sqlUser.companyName
        }
      } catch (parseErr) {
        console.warn('AuthService: Failed to parse sqlUser for password change headers', parseErr)
      }
    }

    // Fallback to the currently cached auth service user
    if (!headers['x-user-id']) {
      const currentUser = this.getCurrentUser()
      if (currentUser?.id) {
        headers['x-user-id'] = currentUser.id
        if (currentUser.fullName) headers['x-user-name'] = currentUser.fullName
        if (currentUser.role) headers['x-user-role'] = currentUser.role
      }
    }

    if (!headers['x-user-id']) {
      throw new Error('Not authenticated - please login first')
    }

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId,
          newPassword
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password')
      }

      console.log('AuthService: Password reset successfully for user:', data.targetUser)
    } catch (error) {
      console.error('AuthService: Password reset failed:', error)
      throw error
    }
  }
}

// Export singleton instance
export const authService = new AuthService()