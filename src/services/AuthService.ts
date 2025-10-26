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
    console.log('AuthService.login: Attempting login for:', credentials.username)
    
    // Load users from JSON data
    const users = await this.getUsers()
    
    // Find user by username
    const user = users.find(u => u.username.toLowerCase() === credentials.username.toLowerCase())
    
    if (!user) {
      throw new Error('Invalid username or password')
    }
    
    if (!user.isActive) {
      throw new Error('Account is disabled')
    }
    
    // Verify password - simplified for demo
    // For demo purposes, accept any non-empty password
    console.log('AuthService: Simple password check for user:', user.username);
    console.log('AuthService: Password provided:', credentials.password);
    
    if (!credentials.password || credentials.password.trim() === '') {
      console.log('AuthService: Password verification FAILED - empty password');
      throw new Error('Password cannot be empty')
    }
    
    // For demo: accept "password" or "admin" as valid passwords
    const validPasswords = ['password', 'admin', '123456'];
    if (!validPasswords.includes(credentials.password)) {
      console.log('AuthService: Password verification FAILED - invalid password');
      console.log('AuthService: Valid passwords are:', validPasswords);
      throw new Error('Invalid username or password')
    }
    
    console.log('AuthService: Password verification SUCCESS');
    
    // Create auth user (without password hash)
    const authUser: AuthUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      permissions: user.permissions
    }
    
    // Log login activity
    await this.logLoginActivity(user)
    
    // Store session
    this.currentUser = authUser
    localStorage.setItem(this.AUTH_KEY, JSON.stringify(authUser))
    
    console.log('AuthService.login: Login successful for:', authUser.username)
    return authUser
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
      if (stored) {
        this.currentUser = JSON.parse(stored)
        console.log('AuthService: Session restored for:', this.currentUser?.username)
      }
    } catch (error) {
      console.error('AuthService: Error restoring session:', error)
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