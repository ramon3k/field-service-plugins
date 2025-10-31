// Multi-Tenant Middleware
// Extracts company code from request and sets up the correct database connection

const connectionManager = require('./tenant-connection-manager');

/**
 * Middleware to extract company code and attach tenant database pool to request
 * 
 * Company code can come from:
 * 1. Query parameter: ?company=DEMO
 * 2. Request header: x-company-code: DEMO
 * 3. JWT token (if using authentication)
 * 4. Subdomain: demo.yourdomain.com
 */
async function tenantMiddleware(req, res, next) {
  try {
    // Extract company code from various sources (in priority order)
    let companyCode = null;

    // 1. Check query parameter (easiest for demos)
    if (req.query.company) {
      companyCode = req.query.company.toUpperCase();
    }
    
    // 2. Check custom header
    if (!companyCode && req.headers['x-company-code']) {
      companyCode = req.headers['x-company-code'].toUpperCase();
    }
    
    // 3. Check subdomain (e.g., demo.fsm.dcpsp.com)
    if (!companyCode && req.hostname) {
      const subdomain = req.hostname.split('.')[0];
      // Only use subdomain if it's not 'www' or the main domain
      if (subdomain && subdomain !== 'www' && subdomain !== 'fsm') {
        companyCode = subdomain.toUpperCase();
      }
    }
    
    // 4. Default to production if no company code specified
    if (!companyCode) {
      companyCode = process.env.DEFAULT_COMPANY_CODE || 'DCPSP';
    }

    // Get the appropriate connection pool for this tenant
    const pool = await connectionManager.getPool(companyCode);
    
    // Attach to request for use in route handlers
    req.tenantPool = pool;
    req.companyCode = companyCode;
    
    // Add company code to response headers for debugging
    res.setHeader('X-Tenant-Code', companyCode);
    
    next();
  } catch (error) {
    console.error('Tenant middleware error:', error);
    
    // Return appropriate error
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Tenant Not Found',
        message: `No configuration found for company code: ${req.query.company || req.headers['x-company-code'] || 'unknown'}`,
        hint: 'Please check your company code or contact support'
      });
    }
    
    return res.status(500).json({
      error: 'Database Connection Error',
      message: 'Unable to connect to tenant database',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Optional: Middleware to enforce tenant isolation (security)
 * This prevents cross-tenant data access
 */
function enforceTenantIsolation(req, res, next) {
  // If user is authenticated, verify their company code matches the request
  const userCompanyCode = req.headers['x-user-company-code'];
  
  if (userCompanyCode && userCompanyCode !== req.companyCode) {
    return res.status(403).json({
      error: 'Access Denied',
      message: 'You do not have access to this tenant\'s data'
    });
  }
  
  next();
}

/**
 * Health check endpoint for tenant connections
 */
function getTenantHealthCheck(req, res) {
  const status = connectionManager.getStatus();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    ...status
  });
}

module.exports = {
  tenantMiddleware,
  enforceTenantIsolation,
  getTenantHealthCheck,
  connectionManager
};
