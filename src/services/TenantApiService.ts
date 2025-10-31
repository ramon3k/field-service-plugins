// SaaS Multi-Tenant API Configuration
interface TenantConfig {
  tenantCode: string;
  databaseConfig: {
    host: string;
    port: string;
    database: string;
    username: string;
    password: string;
    useWindowsAuth: boolean;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class TenantAwareApiService {
  private baseUrl: string;
  private currentTenant: string | null = null;
  private authToken: string | null = null;

  constructor(baseUrl?: string) {
    // Use environment variable if available, otherwise fall back to parameter or '/api'
    this.baseUrl = baseUrl || import.meta.env.VITE_API_URL || '/api';
    console.log('🔗 TenantApiService initialized with baseUrl:', this.baseUrl);
    this.loadStoredSession();
  }

  private loadStoredSession() {
    try {
      const stored = localStorage.getItem('tenant_session');
      if (stored) {
        const session = JSON.parse(stored);
        this.currentTenant = session.tenantCode;
        this.authToken = session.token;
      }
    } catch (error) {
      console.warn('Failed to load stored session:', error);
    }
  }

  private saveSession(tenantCode: string, token: string) {
    const normalizedCode = tenantCode.trim().toUpperCase();
    try {
      localStorage.setItem('tenant_session', JSON.stringify({
        tenantCode: normalizedCode,
        token,
        timestamp: Date.now()
      }));
      this.currentTenant = normalizedCode;
      this.authToken = token;
    } catch (error) {
      console.warn('Failed to save session:', error);
    }
  }

  private clearSession() {
    // Clear all authentication data
    localStorage.removeItem('tenant_session');
    localStorage.removeItem('sqlUser');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    localStorage.removeItem('tenantCode');
    this.currentTenant = null;
    this.authToken = null;
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Base URL already includes /api, just use the endpoint as-is
  const apiEndpoint = endpoint;
  const lowerEndpoint = apiEndpoint.toLowerCase();
  const isAuthLogin = lowerEndpoint === '/auth/login';
    const url = `${this.baseUrl}${apiEndpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {})
    };

    // Add user ID headers for data isolation (CompanyCode-based)
    if (!isAuthLogin) {
      const sqlUserStr = localStorage.getItem('sqlUser');
      if (sqlUserStr) {
        try {
          const sqlUser = JSON.parse(sqlUserStr);
          if (sqlUser.id) {
            headers['x-user-id'] = sqlUser.id;
            headers['x-user-name'] = sqlUser.username || sqlUser.fullName || '';
            headers['x-user-role'] = sqlUser.role || '';
            if (sqlUser.companyCode) {
              headers['x-company-code'] = sqlUser.companyCode;
            }
            if (sqlUser.companyName) {
              headers['x-company-name'] = sqlUser.companyName;
            }
          }
        } catch (e) {
          console.warn('Failed to parse sqlUser from localStorage');
        }
      }

      if (!headers['x-company-code'] && this.currentTenant) {
        headers['x-company-code'] = this.currentTenant;
      }

      // Add auth token if available
      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Tenant Management
  async registerTenant(tenantData: {
    tenantCode: string;
    companyName: string;
    adminUser: {
      username: string;
      password: string;
      email: string;
      firstName: string;
      lastName: string;
    };
    databaseConfig: any;
  }): Promise<ApiResponse> {
    return this.makeRequest('/tenant/register', {
      method: 'POST',
      body: JSON.stringify(tenantData)
    });
  }

  async validateTenant(tenantCode: string): Promise<ApiResponse<{ exists: boolean; isActive: boolean }>> {
    return this.makeRequest(`/tenant/validate/${encodeURIComponent(tenantCode)}`);
  }

  // Authentication with Tenant Context
  async login(tenantCode: string, username: string, password: string): Promise<ApiResponse<{
    token: string;
    user: any;
    tenant?: any;
  }>> {
    const normalizedCode = tenantCode.trim().toUpperCase();
    const result = await this.makeRequest<any>('/auth/login', {
      method: 'POST',
      headers: {
        'X-Company-Code': normalizedCode
      },
      body: JSON.stringify({ tenantCode: normalizedCode, username, password })
    });

    // API returns {success, user, token} directly, not wrapped in data
    const apiResult = result as any;
    if (apiResult.success && apiResult.token) {
      this.saveSession(normalizedCode, apiResult.token);
      if (apiResult.user && !apiResult.user.companyCode) {
        apiResult.user.companyCode = normalizedCode;
      }
      // Wrap in expected format for consumers
      return {
        success: true,
        data: {
          token: apiResult.token,
          user: apiResult.user,
          tenant: { code: normalizedCode, name: normalizedCode }
        }
      };
    }

    return result;
  }

  async logout(): Promise<void> {
    try {
      if (this.authToken) {
        await this.makeRequest('/auth/logout', { method: 'POST' });
      }
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      this.clearSession();
    }
  }

  async getCurrentUser(): Promise<ApiResponse<any>> {
    return this.makeRequest('/auth/me');
  }

  // Data Access Methods (Tenant-Aware)
  async getCustomers(): Promise<ApiResponse<any[]>> {
    return this.makeRequest('/customers');
  }

  async createCustomer(customer: any): Promise<ApiResponse<any>> {
    return this.makeRequest('/customers', {
      method: 'POST',
      body: JSON.stringify(customer)
    });
  }

  async updateCustomer(id: string, customer: any): Promise<ApiResponse<any>> {
    return this.makeRequest(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customer)
    });
  }

  async deleteCustomer(id: string): Promise<ApiResponse> {
    return this.makeRequest(`/customers/${id}`, {
      method: 'DELETE'
    });
  }

  async getUsers(): Promise<ApiResponse<any[]>> {
    return this.makeRequest('/users');
  }

  async createUser(user: any): Promise<ApiResponse<any>> {
    return this.makeRequest('/users', {
      method: 'POST',
      body: JSON.stringify(user)
    });
  }

  async updateUser(id: string, user: any): Promise<ApiResponse<any>> {
    return this.makeRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(user)
    });
  }

  async deleteUser(id: string): Promise<ApiResponse> {
    return this.makeRequest(`/users/${id}`, {
      method: 'DELETE'
    });
  }

  async getTickets(): Promise<ApiResponse<any[]>> {
    return this.makeRequest('/tickets');
  }

  async getSites(): Promise<ApiResponse<any[]>> {
    return this.makeRequest('/sites');
  }

  async createTicket(ticket: any): Promise<ApiResponse<any>> {
    return this.makeRequest('/tickets', {
      method: 'POST',
      body: JSON.stringify(ticket)
    });
  }

  async updateTicket(id: string, ticket: any): Promise<ApiResponse<any>> {
    return this.makeRequest(`/tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(ticket)
    });
  }

  async deleteTicket(id: string): Promise<ApiResponse> {
    return this.makeRequest(`/tickets/${id}`, {
      method: 'DELETE'
    });
  }

  async getAssets(): Promise<ApiResponse<any[]>> {
    return this.makeRequest('/assets');
  }

  async createAsset(asset: any): Promise<ApiResponse<any>> {
    return this.makeRequest('/assets', {
      method: 'POST',
      body: JSON.stringify(asset)
    });
  }

  async updateAsset(id: string, asset: any): Promise<ApiResponse<any>> {
    return this.makeRequest(`/assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(asset)
    });
  }

  async deleteAsset(id: string): Promise<ApiResponse> {
    return this.makeRequest(`/assets/${id}`, {
      method: 'DELETE'
    });
  }

  async getLicenses(): Promise<ApiResponse<any[]>> {
    return this.makeRequest('/licenses');
  }

  async createLicense(license: any): Promise<ApiResponse<any>> {
    return this.makeRequest('/licenses', {
      method: 'POST',
      body: JSON.stringify(license)
    });
  }

  async updateLicense(id: string, license: any): Promise<ApiResponse<any>> {
    return this.makeRequest(`/licenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(license)
    });
  }

  async deleteLicense(id: string): Promise<ApiResponse> {
    return this.makeRequest(`/licenses/${id}`, {
      method: 'DELETE'
    });
  }

  async getActivityLogs(filters?: {
    startDate?: string;
    endDate?: string;
    userId?: string;
    action?: string;
  }): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    
    const query = params.toString();
    return this.makeRequest(`/activity-logs${query ? `?${query}` : ''}`);
  }

  // Utility Methods
  getCurrentTenant(): string | null {
    return this.currentTenant;
  }

  isAuthenticated(): boolean {
    return !!this.authToken && !!this.currentTenant;
  }

  async testConnection(): Promise<ApiResponse<{ status: string; tenant: string }>> {
    return this.makeRequest('/health');
  }

  // Database Health Check for Tenant
  async checkTenantDatabase(): Promise<ApiResponse<{
    connected: boolean;
    tableCount: number;
    lastBackup?: string;
  }>> {
    return this.makeRequest('/tenant/database/health');
  }
}

// Export singleton instance
export const tenantApiService = new TenantAwareApiService();
export default tenantApiService;
export type { TenantConfig, ApiResponse };