// Multi-Tenant Database Connection Manager
// Manages connection pools for different tenants based on company code

const sql = require('mssql');

class TenantConnectionManager {
  constructor() {
    this.pools = new Map(); // Store connection pools by company code
    this.tenantCache = new Map(); // Cache tenant configurations
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes cache
    
    // Registry database configuration
    this.registryConfig = {
      server: process.env.DB_SERVER || 'customer-portal-sql-server.database.windows.net',
      database: 'TenantRegistry',
      user: process.env.DB_USER || 'sqladmin',
      password: process.env.DB_PASSWORD,
      options: {
        encrypt: true,
        trustServerCertificate: false,
        enableArithAbort: true
      }
    };
  }

  /**
   * Get tenant configuration from registry
   */
  async getTenantConfig(companyCode) {
    // Check cache first
    const cached = this.tenantCache.get(companyCode);
    if (cached && (Date.now() - cached.timestamp < this.cacheExpiry)) {
      return cached.config;
    }

    // Query registry database
    let registryPool;
    try {
      registryPool = await sql.connect(this.registryConfig);
      
      const result = await registryPool.request()
        .input('companyCode', sql.NVarChar(50), companyCode)
        .execute('GetTenantByCode');

      if (result.recordset && result.recordset.length > 0) {
        const tenant = result.recordset[0];
        
        // Cache the result
        this.tenantCache.set(companyCode, {
          config: tenant,
          timestamp: Date.now()
        });
        
        return tenant;
      }
      
      return null;
    } catch (err) {
      console.error(`Error fetching tenant config for ${companyCode}:`, err);
      throw new Error(`Tenant configuration not found for company code: ${companyCode}`);
    } finally {
      if (registryPool) {
        await registryPool.close();
      }
    }
  }

  /**
   * Get or create connection pool for a tenant
   */
  async getPool(companyCode) {
    // Return existing pool if available
    if (this.pools.has(companyCode)) {
      const pool = this.pools.get(companyCode);
      if (pool.connected) {
        return pool;
      }
      // Pool exists but disconnected, remove it
      this.pools.delete(companyCode);
    }

    // Get tenant configuration
    const tenantConfig = await this.getTenantConfig(companyCode);
    if (!tenantConfig) {
      throw new Error(`No tenant configuration found for: ${companyCode}`);
    }

    // Create new pool configuration
    const poolConfig = {
      server: tenantConfig.DatabaseServer,
      database: tenantConfig.DatabaseName,
      user: process.env.DB_USER || 'sqladmin',
      password: process.env.DB_PASSWORD,
      options: {
        encrypt: true,
        trustServerCertificate: false,
        enableArithAbort: true
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
      }
    };

    try {
      const pool = await sql.connect(poolConfig);
      this.pools.set(companyCode, pool);
      console.log(`✅ Created connection pool for tenant: ${companyCode} (${tenantConfig.DatabaseName})`);
      return pool;
    } catch (err) {
      console.error(`Failed to create pool for ${companyCode}:`, err);
      throw err;
    }
  }

  /**
   * Close a specific tenant pool
   */
  async closePool(companyCode) {
    if (this.pools.has(companyCode)) {
      const pool = this.pools.get(companyCode);
      await pool.close();
      this.pools.delete(companyCode);
      console.log(`Closed pool for tenant: ${companyCode}`);
    }
  }

  /**
   * Close all pools
   */
  async closeAll() {
    const closePromises = [];
    for (const [companyCode, pool] of this.pools.entries()) {
      closePromises.push(
        pool.close().then(() => {
          console.log(`Closed pool for tenant: ${companyCode}`);
        }).catch(err => {
          console.error(`Error closing pool for ${companyCode}:`, err);
        })
      );
    }
    await Promise.all(closePromises);
    this.pools.clear();
    console.log('All tenant pools closed');
  }

  /**
   * Clear tenant cache
   */
  clearCache(companyCode) {
    if (companyCode) {
      this.tenantCache.delete(companyCode);
    } else {
      this.tenantCache.clear();
    }
  }

  /**
   * Get active pools status
   */
  getStatus() {
    const status = {
      activePools: this.pools.size,
      cachedConfigs: this.tenantCache.size,
      tenants: []
    };

    for (const [companyCode, pool] of this.pools.entries()) {
      status.tenants.push({
        companyCode,
        connected: pool.connected,
        database: pool.config.database
      });
    }

    return status;
  }
}

// Export singleton instance
const connectionManager = new TenantConnectionManager();

module.exports = connectionManager;
