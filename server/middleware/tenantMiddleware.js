// server/middleware/tenantMiddleware.js
const jwt = require('jsonwebtoken');
const sql = require('mssql');
const crypto = require('crypto');

// Rate limiting for tenant lookup attempts
const tenantLookupAttempts = new Map();
const MAX_TENANT_LOOKUP_ATTEMPTS = 5;
const TENANT_LOOKUP_WINDOW = 15 * 60 * 1000; // 15 minutes

// Tenant registry database connection
const tenantRegistryConfig = {
    user: process.env.TENANT_DB_USER || 'sa',
    password: process.env.TENANT_DB_PASSWORD || '',
    server: process.env.TENANT_DB_SERVER || 'localhost',
    database: process.env.TENANT_DB_NAME || 'TenantRegistry',
    options: {
        encrypt: process.env.NODE_ENV === 'production',
        trustServerCertificate: process.env.NODE_ENV !== 'production'
    }
};

// Connection pool for tenant registry
let tenantRegistryPool;

async function initializeTenantRegistry() {
    try {
        tenantRegistryPool = await sql.connect(tenantRegistryConfig);
        console.log('Connected to Tenant Registry database');
    } catch (err) {
        console.error('Failed to connect to Tenant Registry:', err);
        throw err;
    }
}

// Encryption helper functions
function encryptConnectionString(connectionString) {
    const algorithm = 'aes-256-gcm';
    const secret = process.env.CONNECTION_STRING_SECRET || 'your-secret-key-here';
    const key = crypto.scryptSync(secret, 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    cipher.setAAD(Buffer.from('connection-string', 'utf8'));
    
    let encrypted = cipher.update(connectionString, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

function decryptConnectionString(encryptedString) {
    const algorithm = 'aes-256-gcm';
    const secret = process.env.CONNECTION_STRING_SECRET || 'your-secret-key-here';
    const key = crypto.scryptSync(secret, 'salt', 32);
    
    const parts = encryptedString.split(':');
    if (parts.length !== 3) throw new Error('Invalid encrypted string format');
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipher(algorithm, key);
    decipher.setAuthTag(authTag);
    decipher.setAAD(Buffer.from('connection-string', 'utf8'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
}

// Cache for tenant database connections
const tenantConnections = new Map();

// Get tenant information by tenant code
async function getTenantByCode(tenantCode) {
    try {
        const request = tenantRegistryPool.request();
        request.input('TenantCode', sql.NVarChar(50), tenantCode);
        
        const result = await request.execute('sp_GetTenantByCode');
        
        if (result.recordset.length === 0) {
            return null;
        }
        
        const tenant = result.recordset[0];
        
        // Decrypt connection string
        tenant.ConnectionString = decryptConnectionString(tenant.ConnectionStringEncrypted);
        delete tenant.ConnectionStringEncrypted;
        
        return tenant;
    } catch (err) {
        console.error('Error getting tenant by code:', err);
        throw err;
    }
}

// Get or create tenant database connection
async function getTenantConnection(tenantId) {
    if (tenantConnections.has(tenantId)) {
        const connection = tenantConnections.get(tenantId);
        if (connection.connected) {
            return connection;
        } else {
            tenantConnections.delete(tenantId);
        }
    }
    
    // Get tenant info
    const request = tenantRegistryPool.request();
    request.input('TenantID', sql.UniqueIdentifier, tenantId);
    
    const result = await request.query(`
        SELECT ConnectionStringEncrypted, DatabaseType, IsHealthy
        FROM TenantDatabases 
        WHERE TenantID = @TenantID AND IsHealthy = 1
    `);
    
    if (result.recordset.length === 0) {
        throw new Error('Tenant database not found or unhealthy');
    }
    
    const tenantDb = result.recordset[0];
    const connectionString = decryptConnectionString(tenantDb.ConnectionStringEncrypted);
    
    // Parse connection string and create config
    const config = parseConnectionString(connectionString);
    
    try {
        const pool = await sql.connect(config);
        tenantConnections.set(tenantId, pool);
        
        // Update last health check
        await updateDatabaseHealthCheck(tenantId, true);
        
        return pool;
    } catch (err) {
        // Mark database as unhealthy
        await updateDatabaseHealthCheck(tenantId, false);
        throw err;
    }
}

// Parse connection string to config object
function parseConnectionString(connectionString) {
    const parts = connectionString.split(';');
    const config = {
        options: {
            encrypt: true,
            trustServerCertificate: false
        }
    };
    
    parts.forEach(part => {
        const [key, value] = part.split('=');
        if (!key || !value) return;
        
        const cleanKey = key.trim().toLowerCase();
        const cleanValue = value.trim();
        
        switch (cleanKey) {
            case 'server':
            case 'data source':
                config.server = cleanValue;
                break;
            case 'database':
            case 'initial catalog':
                config.database = cleanValue;
                break;
            case 'user id':
            case 'uid':
                config.user = cleanValue;
                break;
            case 'password':
            case 'pwd':
                config.password = cleanValue;
                break;
            case 'encrypt':
                config.options.encrypt = cleanValue.toLowerCase() === 'true';
                break;
            case 'trustservercertificate':
                config.options.trustServerCertificate = cleanValue.toLowerCase() === 'true';
                break;
        }
    });
    
    return config;
}

// Update database health check
async function updateDatabaseHealthCheck(tenantId, isHealthy) {
    try {
        const request = tenantRegistryPool.request();
        request.input('TenantID', sql.UniqueIdentifier, tenantId);
        request.input('IsHealthy', sql.Bit, isHealthy);
        request.input('LastHealthCheck', sql.DateTime2, new Date());
        
        await request.query(`
            UPDATE TenantDatabases 
            SET IsHealthy = @IsHealthy, LastHealthCheck = @LastHealthCheck
            WHERE TenantID = @TenantID
        `);
    } catch (err) {
        console.error('Error updating database health check:', err);
    }
}

// Middleware to extract and validate tenant context
async function tenantMiddleware(req, res, next) {
    try {
        // Rate limiting for tenant lookups to prevent enumeration attacks
        const clientIp = req.ip || req.connection.remoteAddress;
        const now = Date.now();
        
        if (tenantLookupAttempts.has(clientIp)) {
            const attempts = tenantLookupAttempts.get(clientIp);
            const recentAttempts = attempts.filter(time => now - time < TENANT_LOOKUP_WINDOW);
            
            if (recentAttempts.length >= MAX_TENANT_LOOKUP_ATTEMPTS) {
                return res.status(429).json({
                    error: 'Too many tenant lookup attempts. Please try again later.',
                    code: 'RATE_LIMITED',
                    retryAfter: Math.ceil(TENANT_LOOKUP_WINDOW / 1000)
                });
            }
            
            tenantLookupAttempts.set(clientIp, [...recentAttempts, now]);
        } else {
            tenantLookupAttempts.set(clientIp, [now]);
        }
        
        // Get tenant code from various sources
        let tenantCode = req.headers['x-tenant-code'] || 
                        req.query.tenant || 
                        req.body.tenant ||
                        req.subdomain; // If using subdomains
        
        // For authentication endpoints, tenant might be in request body
        if (!tenantCode && req.path === '/api/auth/login' && req.body.tenantCode) {
            tenantCode = req.body.tenantCode;
        }
        
        if (!tenantCode) {
            return res.status(400).json({ 
                error: 'Company code is required',
                code: 'TENANT_CODE_MISSING'
            });
        }
        
        // Validate tenant code format (alphanumeric, 3-50 chars)
        if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{2,49}$/.test(tenantCode)) {
            return res.status(400).json({
                error: 'Invalid company code format',
                code: 'INVALID_TENANT_CODE_FORMAT'
            });
        }
        
        // Get tenant information
        const tenant = await getTenantByCode(tenantCode);
        
        if (!tenant) {
            // Log failed tenant lookup attempt for security monitoring
            console.warn(`Failed tenant lookup attempt: ${tenantCode} from IP: ${clientIp}`);
            
            return res.status(404).json({ 
                error: 'Company not found',
                code: 'TENANT_NOT_FOUND'
            });
        }
        
        if (tenant.Status !== 'Active') {
            return res.status(403).json({ 
                error: 'Company account is not active',
                code: 'TENANT_INACTIVE',
                status: tenant.Status
            });
        }
        
        // Add tenant context to request
        req.tenant = tenant;
        req.tenantCode = tenantCode;
        
        next();
    } catch (err) {
        console.error('Tenant middleware error:', err);
        res.status(500).json({ 
            error: 'Internal server error',
            code: 'TENANT_MIDDLEWARE_ERROR'
        });
    }
}

// Middleware to get tenant database connection
async function tenantDatabaseMiddleware(req, res, next) {
    if (!req.tenant) {
        return res.status(400).json({ 
            error: 'Tenant context not found',
            code: 'TENANT_CONTEXT_MISSING'
        });
    }
    
    try {
        req.tenantDb = await getTenantConnection(req.tenant.TenantID);
        next();
    } catch (err) {
        console.error('Tenant database middleware error:', err);
        res.status(500).json({ 
            error: 'Failed to connect to tenant database',
            code: 'TENANT_DB_CONNECTION_ERROR'
        });
    }
}

// Authentication middleware that works with tenant context
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ 
            error: 'Access token required',
            code: 'TOKEN_MISSING'
        });
    }
    
    jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret', (err, user) => {
        if (err) {
            return res.status(403).json({ 
                error: 'Invalid or expired token',
                code: 'TOKEN_INVALID'
            });
        }
        
        // Verify token belongs to current tenant
        if (user.tenantId !== req.tenant.TenantID) {
            return res.status(403).json({ 
                error: 'Token does not match tenant context',
                code: 'TENANT_TOKEN_MISMATCH'
            });
        }
        
        req.user = user;
        next();
    });
}

// Feature flag middleware
function requireFeature(featureName) {
    return async (req, res, next) => {
        if (!req.tenant) {
            return res.status(400).json({ 
                error: 'Tenant context required',
                code: 'TENANT_CONTEXT_MISSING'
            });
        }
        
        try {
            const request = tenantRegistryPool.request();
            request.input('TenantID', sql.UniqueIdentifier, req.tenant.TenantID);
            request.input('FeatureName', sql.NVarChar(100), featureName);
            
            const result = await request.query(`
                SELECT dbo.fn_IsTenantFeatureEnabled(@TenantID, @FeatureName) as IsEnabled
            `);
            
            const isEnabled = result.recordset[0].IsEnabled;
            
            if (!isEnabled) {
                return res.status(403).json({ 
                    error: `Feature '${featureName}' is not enabled for this tenant`,
                    code: 'FEATURE_NOT_ENABLED',
                    feature: featureName
                });
            }
            
            next();
        } catch (err) {
            console.error('Feature check error:', err);
            res.status(500).json({ 
                error: 'Failed to check feature access',
                code: 'FEATURE_CHECK_ERROR'
            });
        }
    };
}

// Audit logging middleware
async function auditLog(action, entityType = null, entityId = null, details = null) {
    return async (req, res, next) => {
        try {
            const request = tenantRegistryPool.request();
            request.input('TenantID', sql.UniqueIdentifier, req.tenant?.TenantID);
            request.input('UserID', sql.UniqueIdentifier, req.user?.userId);
            request.input('Action', sql.NVarChar(100), action);
            request.input('EntityType', sql.NVarChar(100), entityType);
            request.input('EntityID', sql.NVarChar(255), entityId);
            request.input('Details', sql.NVarChar(sql.MAX), details ? JSON.stringify(details) : null);
            request.input('IpAddress', sql.NVarChar(45), req.ip || req.connection.remoteAddress);
            request.input('UserAgent', sql.NVarChar(500), req.headers['user-agent']);
            
            await request.query(`
                INSERT INTO TenantAuditLog (
                    TenantID, UserID, Action, EntityType, EntityID, 
                    Details, IpAddress, UserAgent
                )
                VALUES (
                    @TenantID, @UserID, @Action, @EntityType, @EntityID,
                    @Details, @IpAddress, @UserAgent
                )
            `);
        } catch (err) {
            console.error('Audit log error:', err);
            // Don't fail the request if audit logging fails
        }
        
        next();
    };
}

// Cleanup function for graceful shutdown
async function cleanup() {
    try {
        // Close all tenant connections
        for (const [tenantId, connection] of tenantConnections) {
            try {
                await connection.close();
            } catch (err) {
                console.error(`Error closing connection for tenant ${tenantId}:`, err);
            }
        }
        tenantConnections.clear();
        
        // Close tenant registry connection
        if (tenantRegistryPool) {
            await tenantRegistryPool.close();
        }
        
        // Clear rate limiting cache
        tenantLookupAttempts.clear();
        
        console.log('All database connections closed and caches cleared');
    } catch (err) {
        console.error('Error during cleanup:', err);
    }
}

// Periodic cleanup of rate limiting cache
setInterval(() => {
    const now = Date.now();
    for (const [ip, attempts] of tenantLookupAttempts.entries()) {
        const recentAttempts = attempts.filter(time => now - time < TENANT_LOOKUP_WINDOW);
        if (recentAttempts.length === 0) {
            tenantLookupAttempts.delete(ip);
        } else {
            tenantLookupAttempts.set(ip, recentAttempts);
        }
    }
}, 5 * 60 * 1000); // Clean up every 5 minutes

module.exports = {
    initializeTenantRegistry,
    tenantMiddleware,
    tenantDatabaseMiddleware,
    authenticateToken,
    requireFeature,
    auditLog,
    getTenantByCode,
    getTenantConnection,
    encryptConnectionString,
    decryptConnectionString,
    cleanup
};