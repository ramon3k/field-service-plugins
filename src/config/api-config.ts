// Production API Configuration
// Update this file after deploying your API to production

export const API_CONFIG = {
  // Development (local)
  development: {
    apiBaseUrl: 'http://localhost:3001/api',
    frontendUrl: 'http://localhost:5173'
  },
  
  // Production (hosted)
  production: {
    apiBaseUrl: 'https://your-api-domain.azurewebsites.net/api',  // Update after Azure deployment
    frontendUrl: 'https://your-frontend-domain.com'
  }
};

// Auto-detect environment
const isProduction = process.env.NODE_ENV === 'production' || 
                     window.location.hostname !== 'localhost';

export const currentConfig = isProduction ? API_CONFIG.production : API_CONFIG.development;

// Usage in your services:
// const apiUrl = `${currentConfig.apiBaseUrl}/endpoint`;

console.log('🔧 API Configuration:', {
  environment: isProduction ? 'production' : 'development',
  apiBaseUrl: currentConfig.apiBaseUrl,
  frontendUrl: currentConfig.frontendUrl
});