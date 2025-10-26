// API Configuration
// Uses environment variable in production, falls back to localhost in development
// Note: VITE_API_URL already includes '/api' in production
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
export const API_ENDPOINTS = {
  BASE: `${API_BASE_URL}`,
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password`,
  },
  HEALTH: `${API_BASE_URL}/health`,
  TEST: `${API_BASE_URL}/test`,
  TICKETS: `${API_BASE_URL}/tickets`,
  CUSTOMERS: `${API_BASE_URL}/customers`,
  SITES: `${API_BASE_URL}/sites`,
  USERS: `${API_BASE_URL}/users`,
  SERVICE_REQUESTS: `${API_BASE_URL}/service-requests`,
  ACTIVITY_LOG: `${API_BASE_URL}/activity-log`,
  ATTACHMENTS: `${API_BASE_URL}/attachments`,
}
