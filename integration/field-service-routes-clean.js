// field-service-routes.js - Field Service routes for integration with existing App Service
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const sql = require('mssql');

// Tenant registry and database pools
const tenantRegistry = new Map();
const tenantPools = new Map();

// Helper function to create tenant database pool
async function createTenantPool(tenantCode, config) {
  try {
    const poolConfig = {
      server: config.host,
      port: parseInt(config.port),
      database: config.database,
      options: {
        encrypt: false,
        trustServerCertificate: true,
        requestTimeout: 30000
      }
    };

    if (config.useWindowsAuth) {
      poolConfig.authentication = {
        type: 'ntlm',
        options: { domain: '', userName: '', password: '' }
      };
    } else {
      poolConfig.user = config.username;
      poolConfig.password = config.password;
    }

    const pool = new sql.ConnectionPool(poolConfig);
    await pool.connect();
    
    tenantPools.set(tenantCode, pool);
    console.log(`✅ Field Service: Database pool created for tenant: ${tenantCode}`);
    
    return pool;
  } catch (error) {
    console.error(`❌ Field Service: Failed to create pool for tenant ${tenantCode}:`, error.message);
    throw error;
  }
}

// Tenant middleware for field service routes
const fieldServiceTenantMiddleware = async (req, res, next) => {
  // Skip tenant validation for registration and validation endpoints
  if (req.path.includes('/tenant/register') || req.path.includes('/tenant/validate') || req.path === '/health') {
    return next();
  }

  const tenantCode = req.headers['x-tenant-code'];
  
  if (!tenantCode) {
    return res.status(400).json({
      success: false,
      error: 'Tenant code required for field service operations'
    });
  }

  try {
    req.tenantCode = tenantCode;
    
    // Get or create tenant pool
    if (!tenantPools.has(tenantCode)) {
      const tenantConfig = tenantRegistry.get(tenantCode);
      if (!tenantConfig) {
        throw new Error(`Tenant ${tenantCode} not found`);
      }
      if (!tenantConfig.isActive) {
        throw new Error(`Tenant ${tenantCode} is inactive`);
      }
      await createTenantPool(tenantCode, tenantConfig.databaseConfig);
    }
    
    req.tenantPool = tenantPools.get(tenantCode);
    next();
  } catch (error) {
    console.error('Field Service tenant middleware error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Apply tenant middleware to all field service routes
router.use(fieldServiceTenantMiddleware);

// Health check for field service
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'field-service',
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      tenant: req.tenantCode || 'none',
      registeredTenants: tenantRegistry.size
    }
  });
});

// Tenant registration
router.post('/tenant/register', async (req, res) => {
  try {
    const { tenantCode, companyName, adminUser, databaseConfig } = req.body;
    
    if (!tenantCode || !companyName || !adminUser || !databaseConfig) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields for tenant registration'
      });
    }

    // Check if tenant already exists
    if (tenantRegistry.has(tenantCode.toUpperCase())) {
      return res.status(409).json({
        success: false,
        error: 'Company code already exists'
      });
    }

    // Test database connection
    try {
      await createTenantPool(tenantCode.toUpperCase(), databaseConfig);
    } catch (dbError) {
      return res.status(400).json({
        success: false,
        error: `Database connection failed: ${dbError.message}`
      });
    }

    // Store tenant configuration
    tenantRegistry.set(tenantCode.toUpperCase(), {
      tenantCode: tenantCode.toUpperCase(),
      companyName,
      databaseConfig,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Create admin user in tenant's database
    const pool = tenantPools.get(tenantCode.toUpperCase());
    const hashedPassword = await bcrypt.hash(adminUser.password, 10);
    
    await pool.request()
      .input('username', sql.NVarChar(50), adminUser.username)
      .input('password', sql.NVarChar(255), hashedPassword)
      .input('email', sql.NVarChar(100), adminUser.email)
      .input('firstName', sql.NVarChar(50), adminUser.firstName)
      .input('lastName', sql.NVarChar(50), adminUser.lastName)
      .input('role', sql.NVarChar(20), 'Admin')
      .input('isActive', sql.Bit, 1)
      .query(`
        INSERT INTO Users (username, password, email, firstName, lastName, role, isActive, createdAt)
        VALUES (@username, @password, @email, @firstName, @lastName, @role, @isActive, GETDATE())
      `);

    console.log(`✅ Field Service: Tenant registered: ${tenantCode.toUpperCase()}`);

    res.json({
      success: true,
      data: {
        tenantCode: tenantCode.toUpperCase(),
        message: 'Field service tenant registered successfully'
      }
    });

  } catch (error) {
    console.error('Field Service tenant registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Tenant registration failed: ' + error.message
    });
  }
});

// Field service authentication
router.post('/auth/login', async (req, res) => {
  try {
    const { tenantCode, username, password } = req.body;
    
    if (!tenantCode || !username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing credentials'
      });
    }

    const normalizedTenantCode = tenantCode.toUpperCase();
    
    // Validate tenant
    const tenant = tenantRegistry.get(normalizedTenantCode);
    if (!tenant || !tenant.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Invalid company code'
      });
    }

    // Get tenant's database
    const pool = tenantPools.get(normalizedTenantCode);
    
    // Find user
    const result = await pool.request()
      .input('username', sql.NVarChar(50), username)
      .query('SELECT * FROM Users WHERE username = @username AND isActive = 1');
    
    if (result.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const user = result.recordset[0];
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate JWT with field service context
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username,
        role: user.role,
        tenantCode: normalizedTenantCode,
        service: 'field-service'  // Identify this as field service token
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remove password from response
    const { password: _, ...userResponse } = user;

    res.json({
      success: true,
      data: {
        token,
        user: userResponse,
        tenant: {
          code: normalizedTenantCode,
          name: tenant.companyName
        }
      }
    });

  } catch (error) {
    console.error('Field Service login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// Authentication middleware for data routes
const requireFieldServiceAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Ensure this is a field service token (optional check)
    if (decoded.service && decoded.service !== 'field-service') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token for field service'
      });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

// Apply auth to data routes
router.use('/customers', requireFieldServiceAuth);
router.use('/tickets', requireFieldServiceAuth);
router.use('/users', requireFieldServiceAuth);

// Customers routes
router.get('/customers', async (req, res) => {
  try {
    const pool = req.tenantPool;
    const result = await pool.request().query('SELECT * FROM Customers ORDER BY companyName');
    
    res.json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customers'
    });
  }
});

router.post('/customers', async (req, res) => {
  try {
    const pool = req.tenantPool;
    const { companyName, contactName, email, phone, address } = req.body;
    
    const result = await pool.request()
      .input('companyName', sql.NVarChar(100), companyName)
      .input('contactName', sql.NVarChar(100), contactName)
      .input('email', sql.NVarChar(100), email)
      .input('phone', sql.NVarChar(20), phone)
      .input('address', sql.NVarChar(255), address)
      .query(`
        INSERT INTO Customers (companyName, contactName, email, phone, address, createdAt)
        OUTPUT INSERTED.*
        VALUES (@companyName, @contactName, @email, @phone, @address, GETDATE())
      `);
    
    res.json({
      success: true,
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create customer'
    });
  }
});

// Export the router for integration
module.exports = router;