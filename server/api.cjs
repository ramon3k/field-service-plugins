// SQL Server API for Field Service App
require('dotenv').config();
const express = require('express');
const isLocalDB = (process.env.DB_AUTH || '').toLowerCase() === 'windows';
const sql = isLocalDB ? require('mssql/msnodesqlv8') : require('mssql');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Plugin System Imports
const PluginManager = require('./plugin-manager');
const { initializePluginRoutes } = require('./routes/plugin-routes');

const app = express();
const cors = require('cors');
const PORT = process.env.PORT || 5000;

console.log('?f�� Field Service API startup build: 2025-10-22T18:45Z');

// CORS configuration - allow specific origins and credentials for cookies/auth
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow same-origin/no-origin (mobile apps, curl)
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-User-Role', 'X-User-FullName', 'x-user-role', 'x-user-name', 'x-user-id', 'x-user-timezone',
    'X-Company-Code', 'x-company-code', 'X-Company-Name', 'x-company-name'
  ],
  exposedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.set('trust proxy', 1); // for secure cookies behind proxies
app.use(express.json());

// Ensure uploads directory exists for attachments
const uploadDir = path.join(__dirname, 'uploads');
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Created uploads directory at', uploadDir);
  }
} catch (e) {
  console.warn('Could not create uploads directory:', e && e.message);
}

// Multer storage configuration for attachments
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `${Date.now()}_${Math.random().toString(36).substr(2,8)}_${safeName}`;
    cb(null, filename);
  }
});
const upload = multer({ storage });

// ================================================================
// DATABASE CONFIGURATION - Single Database (FieldServiceDB)
// ================================================================

// SQL Server configuration - supports both local and Azure SQL
const isAzureSQL = process.env.DB_SERVER && process.env.DB_SERVER.includes('database.windows.net');

const windowsServerSetting = process.env.DB_SERVER || 'localhost\\SQLEXPRESS';
const [windowsHost = 'localhost', windowsInstance] = windowsServerSetting.split('\\');
const windowsDatabase = process.env.DB_NAME || 'FieldServiceDB';

const dbConfig = isLocalDB ? {
  // Local SQL Server with Windows Authentication (requires msnodesqlv8)
  server: windowsHost,
  database: windowsDatabase,
  driver: 'msnodesqlv8',
  options: {
    trustedConnection: true,
    enableArithAbort: true,
    trustServerCertificate: true,
    encrypt: false,
    ...(windowsInstance ? { instanceName: windowsInstance } : {})
  }
} : isAzureSQL ? {
  // Azure SQL with SQL authentication
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME || 'FieldServiceDB',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true
  }
} : {
  // Local SQL Express with SQL authentication
  server: process.env.DB_SERVER || 'localhost\\SQLEXPRESS',
  database: process.env.DB_NAME || 'FieldServiceDB',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

// Single connection pool for the application
let pool = null;
let pluginManager = null;

// Initialize database connection
async function initializeDatabase() {
  try {
    console.log('?f�� Connecting to database:', {
      server: dbConfig.server,
      database: dbConfig.database,
      user: dbConfig.user || '(Windows Auth)',
      auth: isLocalDB ? 'Windows' : 'SQL',
      driver: dbConfig.driver || 'default'
    });
    pool = new sql.ConnectionPool(dbConfig);
    await pool.connect();
    console.log(`?�� Connected to database: ${dbConfig.database}`);
  } catch (err) {
    console.error('?�� Failed to connect to database:', err.message);
    if (isLocalDB && err.message.includes('msnodesqlv8')) {
      console.error('?f�� Hint: Install msnodesqlv8 for Windows authentication: npm install msnodesqlv8');
    }
    throw err;
  }
}

// Initialize plugin system
async function initializePluginSystem() {
  try {
    console.log('🔌 Initializing plugin system...');
    pluginManager = new PluginManager(pool);
    
    // For now, initialize with default company code
    // In a real multi-tenant system, you'd load plugins per tenant on demand
    const defaultCompany = 'DCPSP';
    await pluginManager.initialize(defaultCompany);
    
    console.log('✅ Plugin system initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize plugin system:', error);
    console.warn('⚠️ Continuing without plugin system...');
  }
}

// Initialize on startup
initializeDatabase()
  .then(() => initializePluginSystem())
  .then(() => {
    // Initialize plugin routes after plugin system is ready
    initializePluginRoutes(app, pluginManager, pool);
    
    // Start server AFTER all routes are registered (including plugin routes)
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`?f�� Field Service API running on http://127.0.0.1:${PORT}`);
      console.log(`?f�� Database: Azure SQL - ${process.env.DB_SERVER}/${process.env.DB_NAME}`);
      console.log(`?f�� Test the API: http://127.0.0.1:${PORT}/api/test`);
    });
  })
  .catch(err => {
    console.error('Fatal: Could not initialize database connection', err);
    process.exit(1);
  });

// Shared helper to safely record activity log entries with tenant isolation
async function logActivity(req, {
  action,
  details,
  userId,
  username,
  companyCode,
  ipAddress,
  userAgent
}) {
  try {
    const resolvedCompanyCode = companyCode || req.userCompanyCode || req.headers['x-company-code'];
    if (!resolvedCompanyCode) {
      throw new Error(`Missing company code for activity log: ${action}`);
    }

    await pool.request()
      .input('id', sql.NVarChar, uuidv4())
      .input('userId', sql.NVarChar, userId || 'system')
      .input('username', sql.NVarChar, username || 'system')
      .input('action', sql.NVarChar, action)
      .input('details', sql.NVarChar, details || '')
      .input('timestamp', sql.DateTime2, new Date())
      .input('companyCode', sql.VarChar, resolvedCompanyCode)
      .input('ipAddress', sql.NVarChar, ipAddress ?? req.ip ?? '')
      .input('userAgent', sql.NVarChar, userAgent ?? (typeof req.get === 'function' ? req.get('user-agent') : '') ?? '')
      .query(`
        INSERT INTO ActivityLog (ID, UserID, Username, Action, Details, Timestamp, CompanyCode, IPAddress, UserAgent)
        VALUES (@id, @userId, @username, @action, @details, @timestamp, @companyCode, @ipAddress, @userAgent)
      `);
  } catch (activityErr) {
    console.error('? Activity log failed:', activityErr.message);
    console.error('   Action:', action);
    console.error('   CompanyCode:', companyCode);
    console.error('   ResolvedCompanyCode:', companyCode || req.userCompanyCode || req.headers['x-company-code']);
    console.error('   Error stack:', activityErr.stack);
  }
}

// Helper function to validate user ID exists in Users table
async function validateUserId(userId) {
  if (!userId) return 'admin_001'; // Default fallback
  
  try {
    const result = await pool.request()
      .input('userId', sql.NVarChar, userId)
      .query('SELECT ID FROM Users WHERE ID = @userId');
    
    if (result.recordset.length === 0) {
      console.warn(`?��??� User ID ${userId} not found in Users table, using admin_001 as fallback`);
      return 'admin_001';
    }
    
    return userId;
  } catch (err) {
    console.error('Error validating user ID:', err);
    return 'admin_001';
  }
}

// Helper functions
function formatDateForSQL(date) {
  if (!date) return null;
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return null;
  return value.toISOString().slice(0, 19).replace('T', ' ');
}

async function ticketIdExists(ticketId) {
  const result = await pool.request()
    .input('ticketId', sql.NVarChar, ticketId)
    .query('SELECT 1 FROM Tickets WHERE TicketID = @ticketId');
  return result.recordset.length > 0;
}

// Generate sequential ticket ID in format TKT-{COMPANY}-YYYY-MM-NNN, scoped per company
async function generateTicketID(companyCode) {
  if (!companyCode) {
    throw new Error('Company code required when generating ticket IDs');
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const normalizedCompany = companyCode.trim().toUpperCase();
  const companyPrefix = `TKT-${normalizedCompany}-${year}-${month}-`;
  const legacyPrefix = `TKT-${year}-${month}-`;
  
  try {
    // Find the highest ticket number for this month
    const result = await pool.request()
      .input('companyCode', sql.VarChar, normalizedCompany)
      .input('companyPrefix', sql.NVarChar, `${companyPrefix}%`)
      .input('legacyPrefix', sql.NVarChar, `${legacyPrefix}%`)
      .query(`
        SELECT TOP 1 TicketID 
        FROM Tickets 
        WHERE CompanyCode = @companyCode 
          AND (TicketID LIKE @companyPrefix OR TicketID LIKE @legacyPrefix)
        ORDER BY LEN(TicketID) DESC, TicketID DESC
      `);
    
    let nextNumber = 1;
    if (result.recordset && result.recordset.length > 0) {
      // Extract the number from the last ticket (e.g., "TKT-2025-10-004" -> "004")
      const lastTicket = result.recordset[0].TicketID || '';
      const segments = lastTicket.split('-');
      const sequenceSegment = segments[segments.length - 1];
      const lastNumber = parseInt(sequenceSegment, 10);
      if (!Number.isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    while (nextNumber < 10000) {
      const candidate = `${companyPrefix}${String(nextNumber).padStart(3, '0')}`;
      if (!(await ticketIdExists(candidate))) {
        return candidate;
      }
      nextNumber += 1;
    }
    
    // Fallback to timestamp-based ID if sequential allocation failed
    return `TKT-${normalizedCompany}-${Date.now()}`;
  } catch (err) {
    console.error('Error generating ticket ID:', err);
    // Fallback to timestamp-based ID
    return `TKT-${normalizedCompany}-${Date.now()}`;
  }
}

// ================================================================
// COMPANYCODE DATA ISOLATION MIDDLEWARE
// ================================================================

// Middleware to extract and attach CompanyCode from authenticated user
async function attachCompanyCode(req, res, next) {
  // Skip for auth routes and public routes
  if (req.path === '/api/auth/login' || 
      req.path === '/api/health' || 
      req.path === '/api/test') {
    return next();
  }
  
  const headerCompanyCode = req.headers['x-company-code'] || req.headers['x-companycode'];
  const headerCompanyName = req.headers['x-company-name'] || req.headers['x-companyname'];

  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      console.warn('?��??� No user ID in request headers - data isolation may be compromised');
      if (headerCompanyCode) {
        req.userCompanyCode = headerCompanyCode;
        req.userCompanyName = headerCompanyName || null;
      }
      return next(); // Allow request to continue for backward compatibility
    }
    
    // Look up user's CompanyCode from Users table
    const result = await pool.request()
      .input('userId', sql.NVarChar, userId)
      .query('SELECT CompanyCode, Role FROM Users WHERE ID = @userId AND IsActive = 1');
    
    if (result.recordset.length === 0) {
      if (headerCompanyCode) {
        console.warn(`?��??� User ${userId} not found - falling back to provided company header ${headerCompanyCode}`);
        req.userCompanyCode = headerCompanyCode;
        req.userCompanyName = headerCompanyName || null;
        req.userRole = req.headers['x-user-role'] || null;
        return next();
      }
      console.error(`?�� User ${userId} not found or inactive`);
      return res.status(401).json({ error: 'User not found or inactive' });
    }
    
    const user = result.recordset[0];
    req.userCompanyCode = user.CompanyCode || headerCompanyCode || null;
    req.userCompanyName = headerCompanyName || null;
    req.userRole = user.Role;
    
    console.log(`?f�� Data isolation: User ${userId} restricted to company: ${user.CompanyCode} (${user.Role})`);
    
    next();
  } catch (err) {
    console.error('Error in CompanyCode middleware:', err);
    if (headerCompanyCode) {
      req.userCompanyCode = headerCompanyCode;
      req.userCompanyName = headerCompanyName || null;
    }
    // In production, you might want to fail closed:
    // return res.status(500).json({ error: 'Authentication error' });
    // For now, allow the request to continue for backward compatibility
    next();
  }
}

// TEST: Add a route BEFORE middleware to verify synchronous routes work
app.get('/api/sync-test', (req, res) => {
  console.log('🎯 /api/sync-test route HIT!');
  res.json({ message: 'Synchronous route works!' });
});

// REQUEST LOGGER - log all incoming requests
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  next();
});

// Apply the middleware to all routes after this point
app.use(attachCompanyCode);

// Routes

// Health check route for frontend connection testing
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'API is running', 
    timestamp: new Date(),
    database: 'connected'
  });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!', timestamp: new Date() });
});

// Get all tickets (filtered by CompanyCode)
app.get('/api/tickets', async (req, res) => {
  try {
    // CompanyCode isolation - only show tickets for user's company
    const companyCode = req.userCompanyCode;
    
    if (!companyCode) {
      console.warn('?��??� No CompanyCode found for tickets query');
      return res.status(403).json({ error: 'Company access required' });
    }
    
    const query = `
      SELECT 
        t.*,
        s.Contact AS SiteContact,
        s.Phone AS SitePhone,
        s.Address AS SiteAddress,
        u.fullName AS OwnerFullName,
        (
          SELECT cn.NoteID, cn.Note, cn.CreatedBy, 
                 FORMAT(cn.CreatedAt, 'yyyy-MM-ddTHH:mm:ss.fffZ') as CreatedAt,
                 FORMAT(cn.CreatedAt, 'yyyy-MM-ddTHH:mm:ss.fffZ') as Timestamp
          FROM CoordinatorNotes cn 
          WHERE cn.TicketID = t.TicketID
          ORDER BY cn.CreatedAt
          FOR JSON PATH
        ) as CoordinatorNotes,
        (
          SELECT at.AuditID as id, 
                 FORMAT(at.Timestamp, 'yyyy-MM-ddTHH:mm:ss.fffZ') as timestamp,
                 at.UserName as [user], 
                 at.Action as action, 
                 at.Field as field, 
                 at.OldValue as oldValue, 
                 at.NewValue as newValue, 
                 at.Notes as notes
          FROM AuditTrail at 
          WHERE at.TicketID = t.TicketID
          ORDER BY at.Timestamp
          FOR JSON PATH
        ) as AuditTrail
      FROM Tickets t
      LEFT JOIN Sites s ON (t.Site = s.Name OR t.Site = s.SiteID) AND t.Customer = s.Customer
      LEFT JOIN Users u ON t.Owner = u.username OR t.Owner = u.fullName
      WHERE t.CompanyCode = @companyCode
      ORDER BY t.CreatedAt DESC
    `;
    
    const result = await pool.request()
      .input('companyCode', sql.VarChar, companyCode)
      .query(query);
    const rows = result.recordset;
    
    // Parse JSON fields (dates are already formatted by SQL)
    const tickets = rows.map(ticket => ({
      ...ticket,
      Owner: ticket.Owner || '',  // Keep actual Owner from DB
      OwnerFullName: ticket.OwnerFullName || ticket.Owner || '',  // Add OwnerFullName separately
      CoordinatorNotes: ticket.CoordinatorNotes ? JSON.parse(ticket.CoordinatorNotes) : [],
      AuditTrail: ticket.AuditTrail ? JSON.parse(ticket.AuditTrail) : []
    }));
    
    res.json(tickets);
  } catch (err) {
    console.error('Error fetching tickets:', err);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Get single ticket by ID (filtered by CompanyCode)
app.get('/api/tickets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const companyCode = req.userCompanyCode;
    
    if (!companyCode) {
      return res.status(403).json({ error: 'Company access required' });
    }
    
    const query = `
      SELECT 
        t.*,
        s.Contact AS SiteContact,
        s.Phone AS SitePhone,
        s.Address AS SiteAddress,
        u.fullName AS OwnerFullName,
        (
          SELECT cn.NoteID, cn.Note, cn.CreatedBy, 
                 FORMAT(cn.CreatedAt, 'yyyy-MM-ddTHH:mm:ss.fffZ') as CreatedAt,
                 FORMAT(cn.CreatedAt, 'yyyy-MM-ddTHH:mm:ss.fffZ') as Timestamp
          FROM CoordinatorNotes cn 
          WHERE cn.TicketID = t.TicketID
          ORDER BY cn.CreatedAt
          FOR JSON PATH
        ) as CoordinatorNotes,
        (
          SELECT at.AuditID as id, 
                 FORMAT(at.Timestamp, 'yyyy-MM-ddTHH:mm:ss.fffZ') as timestamp,
                 at.UserName as [user], 
                 at.Action as action, 
                 at.Field as field, 
                 at.OldValue as oldValue, 
                 at.NewValue as newValue, 
                 at.Notes as notes
          FROM AuditTrail at 
          WHERE at.TicketID = t.TicketID
          ORDER BY at.Timestamp
          FOR JSON PATH
        ) as AuditTrail
      FROM Tickets t
      LEFT JOIN Sites s ON (t.Site = s.Name OR t.Site = s.SiteID) AND t.Customer = s.Customer
      LEFT JOIN Users u ON t.Owner = u.username OR t.Owner = u.fullName
      WHERE t.TicketID = @id AND t.CompanyCode = @companyCode
    `;
    
    const result = await pool.request()
      .input('id', sql.NVarChar, id)
      .input('companyCode', sql.VarChar, companyCode)
      .query(query);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    const ticket = result.recordset[0];
    
    // Parse JSON fields (dates are already formatted by SQL)
    const parsedTicket = {
      ...ticket,
      Owner: ticket.Owner || '',  // Keep the actual Owner value from DB
      OwnerFullName: ticket.OwnerFullName || ticket.Owner || '',  // Add OwnerFullName separately for display
      CoordinatorNotes: ticket.CoordinatorNotes ? JSON.parse(ticket.CoordinatorNotes) : [],
      AuditTrail: ticket.AuditTrail ? JSON.parse(ticket.AuditTrail) : []
    };
    
    res.json(parsedTicket);
  } catch (err) {
    console.error('Error fetching ticket:', err);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// Create new ticket
app.post('/api/tickets', async (req, res) => {
  try {
    const companyCode = req.userCompanyCode;
    
    if (!companyCode) {
      return res.status(403).json({ error: 'Company access required' });
    }
    
    const ticketData = req.body;
    
  // Generate sequential ticket ID scoped to the company
  const ticketId = await generateTicketID(companyCode);
    const now = formatDateForSQL(new Date());
    
    console.log(`Creating new ticket: ${ticketId} for company: ${companyCode}`);
    
    await pool.request()
      .input('ticketId', sql.NVarChar, ticketId)
      .input('title', sql.NVarChar, ticketData.Title || '')
      .input('status', sql.NVarChar, ticketData.Status || 'New')
      .input('priority', sql.NVarChar, ticketData.Priority || 'Normal')
      .input('customer', sql.NVarChar, ticketData.Customer || '')
      .input('site', sql.NVarChar, ticketData.Site || '')
      .input('assetIds', sql.NVarChar, ticketData.AssetIDs || '')
      .input('category', sql.NVarChar, ticketData.Category || '')
      .input('description', sql.NVarChar, ticketData.Description || '')
      .input('scheduledStart', sql.DateTime2, ticketData.ScheduledStart ? formatDateForSQL(ticketData.ScheduledStart) : null)
      .input('scheduledEnd', sql.DateTime2, ticketData.ScheduledEnd ? formatDateForSQL(ticketData.ScheduledEnd) : null)
      .input('assignedTo', sql.NVarChar, ticketData.AssignedTo || '')
      .input('owner', sql.NVarChar, ticketData.Owner || 'Operations Coordinator')
      .input('slaDue', sql.DateTime2, ticketData.SLA_Due ? formatDateForSQL(ticketData.SLA_Due) : null)
      .input('resolution', sql.NVarChar, ticketData.Resolution || '')
      .input('closedBy', sql.NVarChar, ticketData.ClosedBy || '')
      .input('closedDate', sql.DateTime2, ticketData.ClosedDate ? formatDateForSQL(ticketData.ClosedDate) : null)
      .input('geoLocation', sql.NVarChar, ticketData.GeoLocation || '')
      .input('tags', sql.NVarChar, ticketData.Tags || '')
      .input('companyCode', sql.VarChar, companyCode)
      .input('createdAt', sql.DateTime2, now)
      .input('updatedAt', sql.DateTime2, now)
      .query(`
        INSERT INTO Tickets (
          TicketID, Title, Status, Priority, Customer, Site, AssetIDs, Category, Description,
          ScheduledStart, ScheduledEnd, AssignedTo, Owner, SLA_Due, Resolution, ClosedBy, ClosedDate,
          GeoLocation, Tags, CompanyCode, CreatedAt, UpdatedAt
        )
        VALUES (
          @ticketId, @title, @status, @priority, @customer, @site, @assetIds, @category, @description,
          @scheduledStart, @scheduledEnd, @assignedTo, @owner, @slaDue, @resolution, @closedBy, @closedDate,
          @geoLocation, @tags, @companyCode, @createdAt, @updatedAt
        )
      `);
    
    await logActivity(req, {
      action: 'Ticket Created',
      details: `Created new ticket ${ticketId}: ${ticketData.Title || 'Untitled'}`,
      userId: req.headers['x-user-id'] || 'admin_001',
      username: req.headers['x-user-name'] || 'admin',
      companyCode
    });
    
    console.log(`?�� Created new ticket ${ticketId}`);
    res.json({ message: 'Ticket created successfully', ticketId });
  } catch (err) {
    console.error('Error creating ticket:', err);
    console.error('Error details:', err.message);
    res.status(500).json({ error: 'Failed to create ticket', details: err.message });
  }
});

// Update ticket (with CompanyCode isolation)
app.put('/api/tickets/:id', async (req, res) => {
  try {
    const companyCode = req.userCompanyCode;
    
    if (!companyCode) {
      return res.status(403).json({ error: 'Company access required' });
    }
    
    const ticketId = req.params.id;
    const updates = req.body;
    
    // First verify the ticket belongs to the user's company
    const verifyResult = await pool.request()
      .input('ticketId', sql.NVarChar, ticketId)
      .input('companyCode', sql.VarChar, companyCode)
      .query('SELECT TicketID FROM Tickets WHERE TicketID = @ticketId AND CompanyCode = @companyCode');
    
    if (verifyResult.recordset.length === 0) {
      console.log(`?�� Ticket ${ticketId} not found or access denied for company ${companyCode}`);
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    console.log('Updating ticket:', ticketId, 'with fields:', Object.keys(updates));
    
    // Build the SET clause dynamically based on provided updates
    const updateFields = [];
    const changeDetails = []; // Track what's being changed
    
    // Map of allowed fields to update with proper date formatting
    const allowedFields = {
      'Title': updates.Title,
      'Status': updates.Status,
      'Priority': updates.Priority,
      'Customer': updates.Customer,
      'Site': updates.Site,
      'AssetIDs': updates.AssetIDs,
      'LicenseIDs': updates.LicenseIDs,
      'Category': updates.Category,
      'Description': updates.Description,
      'ScheduledStart': updates.ScheduledStart ? new Date(updates.ScheduledStart).toISOString().slice(0, 19).replace('T', ' ') : null,
      'ScheduledEnd': updates.ScheduledEnd ? new Date(updates.ScheduledEnd).toISOString().slice(0, 19).replace('T', ' ') : null,
      'AssignedTo': updates.AssignedTo,
      'Owner': updates.Owner,
      'SLA_Due': updates.SLA_Due ? new Date(updates.SLA_Due).toISOString().slice(0, 19).replace('T', ' ') : null,
      'Resolution': updates.Resolution,
      'ClosedBy': updates.ClosedBy,
      'ClosedDate': updates.ClosedDate ? new Date(updates.ClosedDate).toISOString().slice(0, 19).replace('T', ' ') : null,
      'GeoLocation': updates.GeoLocation,
      'Tags': updates.Tags,
      'UpdatedAt': new Date().toISOString().slice(0, 19).replace('T', ' ')
    };
    
    const request = pool.request();
    
    // Build update query and track changes
    Object.keys(allowedFields).forEach(field => {
      if (allowedFields[field] !== undefined) {
        updateFields.push(`${field} = @${field}`);
        request.input(field, sql.NVarChar, allowedFields[field]);
        
        // Track the change for logging (skip UpdatedAt)
        if (field !== 'UpdatedAt' && updates[field] !== undefined) {
          const value = allowedFields[field];
          const displayValue = (value === null || value === '') ? '(empty)' : value;
          changeDetails.push(`${field} = "${displayValue}"`);
        }
      }
    });
    
    if (updateFields.length === 0) {
      console.log('No valid fields to update for ticket:', ticketId);
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    // Add ticketId parameter
    request.input('ticketId', sql.NVarChar, ticketId);
    
    const query = `UPDATE Tickets SET ${updateFields.join(', ')} WHERE TicketID = @ticketId`;
    console.log('Executing ticket update for:', ticketId);
    
    await request.query(query);
    
    // Get updated ticket with JSON fields
    const result = await pool.request()
      .input('ticketId', sql.NVarChar, ticketId)
      .query(`
        SELECT t.*,
          (SELECT NoteID, Note, CreatedBy, CreatedAt 
           FROM CoordinatorNotes 
           WHERE TicketID = t.TicketID 
           ORDER BY CreatedAt
           FOR JSON PATH) as CoordinatorNotes,
          (SELECT ID, AuditID, Timestamp, UserName as [user], Action, Field, OldValue, NewValue, Notes 
           FROM AuditTrail 
           WHERE TicketID = t.TicketID 
           ORDER BY Timestamp
           FOR JSON PATH) as AuditTrail
        FROM Tickets t
        WHERE t.TicketID = @ticketId
      `);
    
    if (!result.recordset || result.recordset.length === 0) {
      return res.status(404).json({ error: 'Ticket not found after update' });
    }
    
    // Parse JSON fields
    const ticket = {
      ...result.recordset[0],
      CoordinatorNotes: result.recordset[0].CoordinatorNotes ? JSON.parse(result.recordset[0].CoordinatorNotes) : [],
      AuditTrail: result.recordset[0].AuditTrail ? JSON.parse(result.recordset[0].AuditTrail) : []
    };
    
    // Log the ticket update activity
    if (changeDetails.length > 0) {
      try {
        const username = updates.UpdatedBy || req.headers['x-user-name'] || 'system';
        const rawUserId = req.headers['x-user-id'] || '';
        const validUserId = await validateUserId(rawUserId);

        await logActivity(req, {
          action: 'Ticket Updated',
          details: `Updated ticket ${ticketId}: ${changeDetails.join(', ')}`,
          userId: validUserId,
          username,
          companyCode
        });
      } catch (activityErr) {
        console.warn('Could not create ticket update activity log (non-critical):', activityErr.message);
      }
    }
    
    console.log(`?�� Updated ticket ${ticketId}. Changed: ${changeDetails.join(', ')}`);
    res.json(ticket);
    
  } catch (err) {
    console.error('Error updating ticket:', err);
    console.error('Error details:', err.message);
    res.status(500).json({ error: 'Failed to update ticket', details: err.message });
  }
});

// Save audit entries for a ticket
app.post('/api/tickets/:id/audit', async (req, res) => {
  try {
    const ticketId = req.params.id;
    const auditEntries = req.body;
    
    console.log(`Received ${auditEntries.length} audit entries for ticket ${ticketId}`);
    
    if (!Array.isArray(auditEntries) || auditEntries.length === 0) {
      return res.status(400).json({ error: 'Invalid audit entries' });
    }
    
    // Get existing audit entry IDs to avoid duplicates
    const existingResult = await pool.request()
      .input('ticketId', sql.NVarChar, ticketId)
      .query('SELECT AuditID FROM AuditTrail WHERE TicketID = @ticketId');
    
    const existingIds = new Set(existingResult.recordset.map(r => r.AuditID));
    
    // Filter to only NEW audit entries
    const newEntries = auditEntries.filter(entry => !existingIds.has(entry.id));
    
    console.log(`Filtered to ${newEntries.length} new audit entries (${existingIds.size} already exist)`);
    
    if (newEntries.length === 0) {
      console.log('No new audit entries to save');
      return res.json({ message: 'No new audit entries to save', count: 0 });
    }
    
    // Insert only new audit entries
    for (const entry of newEntries) {
      const auditId = entry.id || `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Use provided timestamp or current time - pass as JavaScript Date object
      const timestamp = entry.timestamp ? new Date(entry.timestamp) : new Date();
      
      await pool.request()
        .input('auditId', sql.NVarChar, auditId)
        .input('ticketId', sql.NVarChar, ticketId)
        .input('timestamp', sql.DateTime2, timestamp)
        .input('userName', sql.NVarChar, entry.user || 'System')
        .input('action', sql.NVarChar, entry.action || 'Updated')
        .input('field', sql.NVarChar, entry.field || '')
        .input('oldValue', sql.NVarChar, entry.oldValue || '')
        .input('newValue', sql.NVarChar, entry.newValue || '')
        .input('notes', sql.NVarChar, entry.notes || '')
        .query(`
          INSERT INTO AuditTrail (AuditID, TicketID, Timestamp, UserName, Action, Field, OldValue, NewValue, Notes)
          VALUES (@auditId, @ticketId, @timestamp, @userName, @action, @field, @oldValue, @newValue, @notes)
        `);
    }
    
    console.log(`?�� Saved ${newEntries.length} new audit entries for ticket ${ticketId}`);
    res.json({ message: 'Audit entries saved successfully', count: newEntries.length });
    
  } catch (err) {
    console.error('Error saving audit entries:', err);
    res.status(500).json({ error: 'Failed to save audit entries', details: err.message });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const normalizedUsername = typeof username === 'string' ? username.trim() : '';
    // Single-company mode: always use DCPSP
    const normalizedCompanyCode = 'DCPSP';

    console.log('🔵 Login request received:');
    console.log('  - username:', normalizedUsername || '(missing)');
    console.log('  - company code (hardcoded):', normalizedCompanyCode);
    console.log('  - hasPassword:', !!password);

    if (!normalizedUsername || !password) {
      console.log('❌ Missing credentials');
      return res.status(400).json({ error: 'Username and password required' });
    }

    console.log(`🔵 Login attempt: ${normalizedUsername} with company code: ${normalizedCompanyCode}`);

    // Query user by username (CompanyCode field still exists in Users table)
    const result = await pool.request()
      .input('username', sql.NVarChar, normalizedUsername)
      .query(`
        SELECT *
        FROM Users
        WHERE Username = @username AND IsActive = 1
      `);

    console.log(`📊 Query result: Found ${result.recordset.length} active user(s) with username`);

    if (result.recordset.length === 0) {
      console.log('❌ User not found or inactive');
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const matchingUsers = result.recordset.filter(row => {
      const rowCode = (row.CompanyCode || '').trim().toUpperCase();
      return rowCode === normalizedCompanyCode;
    });

    if (matchingUsers.length === 0) {
      const availableCodes = [...new Set(result.recordset.map(row => (row.CompanyCode || '').trim().toUpperCase()))];
      console.log('❌ No user/company match found', { normalizedCompanyCode, availableCodes });
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = matchingUsers[0];
    const userCompanyCode = (user.CompanyCode || '').trim().toUpperCase();
    console.log('📊 Company code comparison:', {
      normalizedCompanyCode,
      userCompanyCode,
      originalUserCompanyCode: user.CompanyCode,
      username: user.Username,
      candidates: matchingUsers.length,
      totalCandidates: result.recordset.length
    });

    const resolvedCompanyCode = userCompanyCode;
    console.log(`?f�� User found: ${user.Username} (${user.Role}) in company: ${resolvedCompanyCode}`);
    
    // Verify password (base64 encoded in database)
    const passwordBase64 = Buffer.from(password).toString('base64');
    
    console.log(`?f�� Password check: Provided hash=${passwordBase64}, Stored hash=${user.PasswordHash}, Match=${user.PasswordHash === passwordBase64}`);
    
    if (user.PasswordHash !== passwordBase64) {
      console.log('?�� Password mismatch');
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    console.log('?�� Login successful!');
    // Fetch company information for branding
    let companyName = resolvedCompanyCode; // Fallback to code
    let companyDisplayName = resolvedCompanyCode;

    try {
      const company = companyCheck.recordset[0];
      companyName = company.CompanyName || resolvedCompanyCode;
      companyDisplayName = company.DisplayName || company.CompanyName || resolvedCompanyCode;
      console.log(`?f�� Company branding: ${companyDisplayName}`);
    } catch (companyErr) {
      console.warn('Could not resolve company branding (non-critical):', companyErr.message);
    }
    
    // Return user data (excluding password)
    const userData = {
      id: user.ID,
      username: user.Username,
      email: user.Email,
      fullName: user.FullName,
      role: user.Role,
      permissions: user.Permissions,
      vendor: user.Vendor,
      companyCode: resolvedCompanyCode,
      companyName: companyName,
      companyDisplayName: companyDisplayName
    };
    
    // Prime request context for downstream logging
    req.userCompanyCode = resolvedCompanyCode;
    req.userCompanyName = companyDisplayName;

    // Log the login activity in the correct database
    await logActivity(req, {
      action: 'Login',
      details: `User logged in: ${user.FullName} (${user.Role})`,
      userId: user.ID,
      username: user.Username,
      companyCode: resolvedCompanyCode,
      ipAddress: req.ip || '',
      userAgent: req.get('user-agent') || ''
    });
    
    res.json({
      success: true,
      user: userData,
      token: Buffer.from(`${user.ID}:${Date.now()}`).toString('base64') // Simple token
    });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ error: 'Failed to authenticate' });
  }
});

// Reset user password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    
    if (!userId || !newPassword) {
      return res.status(400).json({ error: 'Missing required fields: userId, newPassword' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    // Get user details first
    const userResult = await pool.request()
      .input('userId', sql.NVarChar, userId)
      .query('SELECT Username, FullName, CompanyCode FROM Users WHERE ID = @userId');
    
    if (userResult.recordset.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.recordset[0];
    
    // Encode password to base64 (matches login endpoint format)
    const encodedPassword = Buffer.from(newPassword).toString('base64');
    
    // Update password
    await pool.request()
      .input('userId', sql.NVarChar, userId)
      .input('passwordHash', sql.NVarChar, encodedPassword)
      .query('UPDATE Users SET PasswordHash = @passwordHash WHERE ID = @userId');
    
    console.log(`?�� Password reset for user: ${user.Username} (ID: ${userId})`);
    
    // Log the activity
    const passwordResetCompanyCode = req.userCompanyCode || user.CompanyCode || req.headers['x-company-code'];
    await logActivity(req, {
      action: 'Password Reset',
      details: `Password reset for user: ${user.FullName} (${user.Username})`,
      userId: req.headers['x-user-id'] || 'admin_001',
      username: req.headers['x-user-name'] || 'admin',
      companyCode: passwordResetCompanyCode,
      ipAddress: '',
      userAgent: ''
    });
    
    res.json({ 
      message: 'Password reset successfully',
      targetUser: user.Username,
      userId: userId
    });
  } catch (err) {
    console.error('Error resetting password:', err);
    res.status(500).json({ error: 'Failed to reset password', details: err.message });
  }
});

// Get users (for authentication)
app.get('/api/users', async (req, res) => {
  try {
    const companyCode = req.userCompanyCode;
    
    if (!companyCode) {
      return res.status(403).json({ error: 'Company access required' });
    }
    
    const { includeInactive } = req.query;
    const query = includeInactive === 'true' 
      ? 'SELECT ID, Username, Email, FullName, Role, Vendor, IsActive, CreatedAt, CompanyCode FROM Users WHERE CompanyCode = @companyCode ORDER BY FullName'
      : 'SELECT ID, Username, Email, FullName, Role, Vendor, IsActive, CreatedAt, CompanyCode FROM Users WHERE CompanyCode = @companyCode AND IsActive = 1 ORDER BY FullName';
    
    const result = await pool.request()
      .input('companyCode', sql.VarChar, companyCode)
      .query(query);
    
    // Map to camelCase field names for frontend
    const users = result.recordset.map(user => ({
      id: user.ID,
      username: user.Username,
      email: user.Email,
      fullName: user.FullName,
      role: user.Role,
      vendor: user.Vendor,
      isActive: user.IsActive,
      createdAt: user.CreatedAt,
      companyCode: user.CompanyCode
    }));
    
    console.log(`?�� Retrieved ${users.length} users from SQL database for company ${companyCode}`);
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create user
app.post('/api/users', async (req, res) => {
  try {
    const companyCode = req.userCompanyCode;
    
    if (!companyCode) {
      return res.status(403).json({ error: 'Company access required' });
    }
    
    const { username, email, fullName, role, vendor, password, isActive } = req.body;
    
    if (!username || !email || !fullName || !role) {
      return res.status(400).json({ error: 'Missing required fields: username, email, fullName, role' });
    }

    // Prevent duplicates within the same company
    const duplicateCheck = await pool.request()
      .input('companyCode', sql.VarChar, companyCode)
      .input('username', sql.NVarChar, username)
      .input('email', sql.NVarChar, email)
      .query(`
        SELECT TOP 1 ID, Username, Email
        FROM Users
        WHERE CompanyCode = @companyCode AND (Username = @username OR Email = @email)
      `);

    if (duplicateCheck.recordset.length > 0) {
      const existing = duplicateCheck.recordset[0];
      const conflictField = existing.Username === username ? 'username' : 'email';
      return res.status(409).json({ error: `A user with that ${conflictField} already exists` });
    }
    
    // Generate user ID
    const userId = `USR-${Date.now()}`;
    // Encode password as base64 to match login expectation
    const passwordHash = password ? Buffer.from(password).toString('base64') : null;
    
    await pool.request()
      .input('userId', sql.NVarChar, userId)
      .input('username', sql.NVarChar, username)
      .input('email', sql.NVarChar, email)
      .input('fullName', sql.NVarChar, fullName)
      .input('role', sql.NVarChar, role)
      .input('vendor', sql.NVarChar, vendor || null)
      .input('passwordHash', sql.NVarChar, passwordHash)
      .input('isActive', sql.Bit, isActive !== false ? 1 : 0)
      .input('companyCode', sql.VarChar, companyCode)
      .input('createdAt', sql.DateTime2, new Date())
      .query(`
        INSERT INTO Users (ID, Username, Email, FullName, Role, Vendor, PasswordHash, IsActive, CompanyCode, CreatedAt)
        VALUES (@userId, @username, @email, @fullName, @role, @vendor, @passwordHash, @isActive, @companyCode, @createdAt)
      `);
    
    // Log the user creation for audit visibility
    await logActivity(req, {
      action: 'User Created',
      details: `Created user ${fullName} (${username}) with role ${role}`,
      userId: req.headers['x-user-id'] || 'admin_001',
      username: req.headers['x-user-name'] || 'admin',
      companyCode
    });

    console.log(`?�� Created new user ${userId}`);
    res.json({ message: 'User created successfully', userId });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Failed to create user', details: err.message });
  }
});

// Update user
app.put('/api/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const { username, email, fullName, role, vendor, isActive } = req.body;
    
    if (!username || !email || !fullName || !role) {
      return res.status(400).json({ error: 'Missing required fields: username, email, fullName, role' });
    }
    
    await pool.request()
      .input('userId', sql.NVarChar, userId)
      .input('username', sql.NVarChar, username)
      .input('email', sql.NVarChar, email)
      .input('fullName', sql.NVarChar, fullName)
      .input('role', sql.NVarChar, role)
      .input('vendor', sql.NVarChar, vendor || '')
      .input('isActive', sql.Bit, isActive !== false ? 1 : 0)
      .query(`
        UPDATE Users 
        SET Username = @username, Email = @email, FullName = @fullName, 
            Role = @role, Vendor = @vendor, IsActive = @isActive
        WHERE ID = @userId
      `);
    
    console.log(`?�� Updated user ${userId}`);
    res.json({ message: 'User updated successfully' });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Failed to update user', details: err.message });
  }
});

// Delete user
app.delete('/api/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if user exists
    const checkResult = await pool.request()
      .input('userId', sql.NVarChar, userId)
      .query('SELECT Username FROM Users WHERE ID = @userId');
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const username = checkResult.recordset[0].Username;
    
    // Delete the user
    await pool.request()
      .input('userId', sql.NVarChar, userId)
      .query('DELETE FROM Users WHERE ID = @userId');
    
    console.log(`?�� Deleted user ${userId} (${username})`);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Failed to delete user', details: err.message });
  }
});

// Get sites
app.get('/api/sites', async (req, res) => {
  try {
    const companyCode = req.userCompanyCode;
    
    if (!companyCode) {
      return res.status(403).json({ error: 'Company access required' });
    }
    
    const result = await pool.request()
      .input('companyCode', sql.VarChar, companyCode)
      .query('SELECT * FROM Sites WHERE CompanyCode = @companyCode ORDER BY Name');
    
    // Map database fields to frontend expected field names
    const sites = result.recordset.map(site => ({
      ...site,
      Site: site.Name, // Frontend expects Site field
      ContactName: site.Contact, // Database has Contact, frontend expects ContactName
      ContactPhone: site.Phone // Database has Phone, frontend expects ContactPhone
    }));
    
    res.json(sites);
  } catch (err) {
    console.error('Error fetching sites:', err);
    res.status(500).json({ error: 'Failed to fetch sites' });
  }
});

// Get customers
app.get('/api/customers', async (req, res) => {
  try {
    const companyCode = req.userCompanyCode;
    
    if (!companyCode) {
      return res.status(403).json({ error: 'Company access required' });
    }
    
    const result = await pool.request()
      .input('companyCode', sql.VarChar, companyCode)
      .query('SELECT * FROM Customers WHERE CompanyCode = @companyCode ORDER BY Name');
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Get licenses
app.get('/api/licenses', async (req, res) => {
  try {
    const companyCode = req.userCompanyCode;

    if (!companyCode) {
      console.warn('?��??� No CompanyCode found for licenses query');
      return res.status(403).json({ error: 'Company access required' });
    }

    const result = await pool.request()
      .input('companyCode', sql.VarChar, companyCode)
      .query('SELECT * FROM Licenses WHERE CompanyCode = @companyCode ORDER BY CreatedAt DESC');

    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching licenses:', err);
    res.status(500).json({ error: 'Failed to fetch licenses' });
  }
});

// Get single license by ID
app.get('/api/licenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const companyCode = req.userCompanyCode;

    if (!companyCode) {
      console.warn('?��??� No CompanyCode found for license query');
      return res.status(403).json({ error: 'Company access required' });
    }

    const result = await pool.request()
      .input('id', sql.NVarChar, id)
      .input('companyCode', sql.VarChar, companyCode)
      .query('SELECT * FROM Licenses WHERE LicenseID = @id AND CompanyCode = @companyCode');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'License not found' });
    }
    
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error fetching license:', err);
    res.status(500).json({ error: 'Failed to fetch license' });
  }
});

// Create license
app.post('/api/licenses', async (req, res) => {
  try {
    const companyCode = req.userCompanyCode;
    
    if (!companyCode) {
      return res.status(403).json({ error: 'Company access required' });
    }
    
    const {
      Customer, Site, SoftwareName, SoftwareVersion, LicenseType, LicenseKey,
      LicenseCount, UsedCount, ExpirationDate, ServicePlan, ServicePlanExpiration,
      Vendor, PurchaseDate, PurchasePrice, RenewalDate, RenewalPrice,
      ContactEmail, Status, InstallationPath, ComplianceNotes, Notes
    } = req.body;
    
    if (!Customer || !Site || !SoftwareName) {
      return res.status(400).json({ error: 'Missing required fields: Customer, Site, SoftwareName' });
    }
    
    const licenseId = `LIC-${Date.now()}`;
    const now = new Date();
    
    await pool.request()
      .input('licenseId', sql.NVarChar, licenseId)
      .input('customer', sql.NVarChar, Customer)
      .input('site', sql.NVarChar, Site)
      .input('softwareName', sql.NVarChar, SoftwareName)
      .input('softwareVersion', sql.NVarChar, SoftwareVersion || '')
      .input('licenseType', sql.NVarChar, LicenseType || 'Subscription')
      .input('licenseKey', sql.NVarChar, LicenseKey || '')
      .input('licenseCount', sql.Int, LicenseCount || 1)
      .input('usedCount', sql.Int, UsedCount || 0)
      .input('expirationDate', sql.DateTime2, ExpirationDate || null)
      .input('servicePlan', sql.NVarChar, ServicePlan || '')
      .input('servicePlanExpiration', sql.DateTime2, ServicePlanExpiration || null)
      .input('vendor', sql.NVarChar, Vendor || '')
      .input('purchaseDate', sql.DateTime2, PurchaseDate || null)
      .input('purchasePrice', sql.Decimal(10, 2), PurchasePrice || 0)
      .input('renewalDate', sql.DateTime2, RenewalDate || null)
      .input('renewalPrice', sql.Decimal(10, 2), RenewalPrice || 0)
      .input('contactEmail', sql.NVarChar, ContactEmail || '')
      .input('status', sql.NVarChar, Status || 'Active')
      .input('installationPath', sql.NVarChar, InstallationPath || '')
      .input('complianceNotes', sql.NVarChar, ComplianceNotes || '')
      .input('notes', sql.NVarChar, Notes || '')
      .input('createdAt', sql.DateTime2, now)
      .input('updatedAt', sql.DateTime2, now)
      .input('companyCode', sql.VarChar, companyCode)
      .query(`
        INSERT INTO Licenses (
          LicenseID, Customer, Site, SoftwareName, SoftwareVersion, LicenseType,
          LicenseKey, LicenseCount, UsedCount, ExpirationDate, ServicePlan,
          ServicePlanExpiration, Vendor, PurchaseDate, PurchasePrice, RenewalDate,
          RenewalPrice, ContactEmail, Status, InstallationPath, LastUpdated,
          ComplianceNotes, Notes, CompanyCode, CreatedAt, UpdatedAt
        ) VALUES (
          @licenseId, @customer, @site, @softwareName, @softwareVersion, @licenseType,
          @licenseKey, @licenseCount, @usedCount, @expirationDate, @servicePlan,
          @servicePlanExpiration, @vendor, @purchaseDate, @purchasePrice, @renewalDate,
          @renewalPrice, @contactEmail, @status, @installationPath, GETUTCDATE(),
          @complianceNotes, @notes, @companyCode, @createdAt, @updatedAt
        )
      `);
    
    console.log(`?�� Created license ${licenseId} for ${Customer} - ${Site}`);
    
    // Log activity
    await logActivity(req, {
      action: 'License Created',
      details: `Created license ${licenseId} for ${Customer} - ${Site} (${SoftwareName})`,
      userId: req.userId || req.headers['x-user-id'] || 'system',
      username: req.username || req.headers['x-user-name'] || 'system',
      companyCode: companyCode
    });
    
    res.json({ message: 'License created successfully', licenseId });
  } catch (err) {
    console.error('Error creating license:', err);
    res.status(500).json({ error: 'Failed to create license', details: err.message });
  }
});

// Delete license
app.delete('/api/licenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const companyCode = req.userCompanyCode;

    if (!companyCode) {
      return res.status(403).json({ error: 'Company access required' });
    }

    // Verify the license belongs to this company before deleting
    const checkResult = await pool.request()
      .input('id', sql.NVarChar, id)
      .input('companyCode', sql.VarChar, companyCode)
      .query('SELECT * FROM Licenses WHERE LicenseID = @id AND CompanyCode = @companyCode');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: 'License not found' });
    }

    const license = checkResult.recordset[0];

    await pool.request()
      .input('id', sql.NVarChar, id)
      .input('companyCode', sql.VarChar, companyCode)
      .query('DELETE FROM Licenses WHERE LicenseID = @id AND CompanyCode = @companyCode');

    console.log(`??? Deleted license ${id}`);

    // Log activity
    await logActivity(req, {
      action: 'License Deleted',
      details: `Deleted license ${id} (${license.SoftwareName} for ${license.Customer})`,
      userId: req.userId || req.headers['x-user-id'] || 'system',
      username: req.username || req.headers['x-user-name'] || 'system',
      companyCode: companyCode
    });

    res.json({ message: 'License deleted successfully' });
  } catch (err) {
    console.error('Error deleting license:', err);
    res.status(500).json({ error: 'Failed to delete license', details: err.message });
  }
});

// Get vendors
app.get('/api/vendors', async (req, res) => {
  try {
    const companyCode = req.userCompanyCode;
    
    if (!companyCode) {
      return res.status(403).json({ error: 'Company access required' });
    }
    const result = await pool.request()
      .input('companyCode', sql.NVarChar, companyCode)
      .query('SELECT * FROM Vendors WHERE CompanyCode = @companyCode ORDER BY Name');

    const allRows = result.recordset || [];
    const filteredRows = allRows.filter(row => {
      const rowCode = (row.CompanyCode || '').trim().toUpperCase();
      return rowCode === companyCode.trim().toUpperCase();
    });

    if (allRows.length !== filteredRows.length) {
      const mismatchedCodes = allRows
        .map(row => row.CompanyCode)
        .filter(code => (code || '').trim().toUpperCase() !== companyCode.trim().toUpperCase());
      console.warn('Vendor isolation mismatch detected', {
        companyCode,
        totalRows: allRows.length,
        filteredRows: filteredRows.length,
        mismatchedCodes
      });
    } else {
      console.log('Fetching vendors for company:', companyCode, 'rows:', filteredRows.length);
    }
    
    // Parse JSON fields back to arrays for frontend
    const vendors = filteredRows.map(vendor => ({
      ...vendor,
      ServiceAreas: vendor.ServiceAreas ? JSON.parse(vendor.ServiceAreas) : [],
      Specialties: vendor.Specialties ? JSON.parse(vendor.Specialties) : [],
      CitiesServed: vendor.CitiesServed || '' // Keep as string for easy editing
    }));
    
    res.json(vendors);
  } catch (err) {
    console.error('Error fetching vendors:', err);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

// Create new site
app.post('/api/sites', async (req, res) => {
  try {
    const companyCode = req.userCompanyCode;
    
    if (!companyCode) {
      return res.status(403).json({ error: 'Company access required' });
    }
    
    const site = req.body;
    const siteID = `SITE-${Date.now()}`;
    
    console.log('?f�� Creating site with data:', JSON.stringify(site, null, 2));
    
    // Determine customer name - frontend might send it as Customer, CustomerName, or we need to look it up
    let customerName = site.Customer || '';
    
    // If CustomerID is provided but Customer name is empty, look up the customer name
    if ((site.CustomerID || site.CustomerId) && !customerName) {
      try {
        const customerResult = await pool.request()
          .input('customerID', sql.NVarChar, site.CustomerID || site.CustomerId)
          .query('SELECT Name FROM Customers WHERE CustomerID = @customerID');
        
        if (customerResult.recordset.length > 0) {
          customerName = customerResult.recordset[0].Name;
          console.log(`?�� Looked up customer name: ${customerName}`);
        }
      } catch (lookupErr) {
        console.warn('?��??� Could not lookup customer name:', lookupErr.message);
      }
    }
    
    console.log(`?f�� Final values - CustomerID: ${site.CustomerID || site.CustomerId || ''}, Customer: ${customerName}`);
    
    // Make sure to provide empty strings (not null) for optional fields to avoid null constraint errors
    await pool.request()
      .input('SiteID', sql.NVarChar, siteID)
      .input('CustomerID', sql.NVarChar, site.CustomerID || site.CustomerId || '')
      .input('Name', sql.NVarChar, site.Site || site.Name || '')
      .input('Customer', sql.NVarChar, customerName)
      .input('Address', sql.NVarChar, site.Address || '')
      .input('Contact', sql.NVarChar, site.ContactName || site.Contact || '')
      .input('Phone', sql.NVarChar, site.ContactPhone || site.Phone || '')
      .input('GeoLocation', sql.NVarChar, site.GeoLocation || '')
      .input('Notes', sql.NVarChar, site.Notes || '')
      .input('CompanyCode', sql.VarChar, companyCode)
      .query(`
        INSERT INTO Sites (SiteID, CustomerID, Name, Customer, Address, Contact, Phone, GeoLocation, Notes, CreatedAt, CompanyCode)
        VALUES (@SiteID, @CustomerID, @Name, @Customer, @Address, @Contact, @Phone, @GeoLocation, @Notes, GETDATE(), @CompanyCode)
      `);
    
    await logActivity(req, {
      action: 'Site Created',
      details: `Created new site: ${site.Name || site.Site || 'unnamed'}`,
      userId: req.headers['x-user-id'] || 'system',
      username: req.headers['x-user-name'] || 'system',
      companyCode
    });
    
    console.log(`?�� Created new site ${siteID}`);
    res.json({ success: true, siteID });
  } catch (err) {
    console.error('Error creating site:', err);
    console.error('Site creation error details:', err.message);
    console.error('Stack:', err.stack);
    res.status(500).json({ error: 'Failed to create site', details: err.message });
  }
});

// Create new customer
app.post('/api/customers', async (req, res) => {
  try {
    const companyCode = req.userCompanyCode;
    
    if (!companyCode) {
      return res.status(403).json({ error: 'Company access required' });
    }
    
    const customer = req.body;
    const customerID = `CUST-${Date.now()}`;
    
    await pool.request()
      .input('CustomerID', sql.NVarChar, customerID)
      .input('Name', sql.NVarChar, customer.Name)
      .input('Contact', sql.NVarChar, customer.Contact || '')
      .input('Phone', sql.NVarChar, customer.Phone || '')
      .input('Email', sql.NVarChar, customer.Email || '')
      .input('Address', sql.NVarChar, customer.Address || '')
      .input('Notes', sql.NVarChar, customer.Notes || '')
      .input('CompanyCode', sql.VarChar, companyCode)
      .query(`
        INSERT INTO Customers (CustomerID, Name, Contact, Phone, Email, Address, Notes, CreatedAt, CompanyCode)
        VALUES (@CustomerID, @Name, @Contact, @Phone, @Email, @Address, @Notes, GETDATE(), @CompanyCode)
      `);
    
    await logActivity(req, {
      action: 'Customer Created',
      details: `Created new customer: ${customer.Name}`,
      userId: req.headers['x-user-id'] || 'system',
      username: req.headers['x-user-name'] || 'system',
      companyCode
    });
    
    res.json({ success: true, customerID });
  } catch (err) {
    console.error('Error creating customer:', err);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Update site
app.put('/api/sites/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const site = req.body;
    const companyCode = req.userCompanyCode || req.headers['x-company-code'];
    
    console.log('?f�� Updating site:', id, 'with data:', JSON.stringify(site, null, 2));
    
    // Determine customer name - look it up if only CustomerID is provided
    let customerName = site.Customer || '';
    
    if ((site.CustomerID || site.CustomerId) && !customerName) {
      try {
        const customerResult = await pool.request()
          .input('customerID', sql.NVarChar, site.CustomerID || site.CustomerId)
          .query('SELECT Name FROM Customers WHERE CustomerID = @customerID');
        
        if (customerResult.recordset.length > 0) {
          customerName = customerResult.recordset[0].Name;
          console.log(`?�� Looked up customer name: ${customerName}`);
        }
      } catch (lookupErr) {
        console.warn('?��??� Could not lookup customer name:', lookupErr.message);
      }
    }
    
    await pool.request()
      .input('SiteID', sql.NVarChar, id)
      .input('CustomerID', sql.NVarChar, site.CustomerID || '')
      .input('Name', sql.NVarChar, site.Site || site.Name || '')
      .input('Customer', sql.NVarChar, customerName)
      .input('Address', sql.NVarChar, site.Address || '')
      .input('Contact', sql.NVarChar, site.ContactName || site.Contact || '')
      .input('Phone', sql.NVarChar, site.ContactPhone || site.Phone || '')
      .input('GeoLocation', sql.NVarChar, site.GeoLocation || '')
      .input('Notes', sql.NVarChar, site.Notes || '')
      .query(`
        UPDATE Sites SET
          CustomerID = @CustomerID,
          Name = @Name,
          Customer = @Customer,
          Address = @Address,
          Contact = @Contact,
          Phone = @Phone,
          GeoLocation = @GeoLocation,
          Notes = @Notes
        WHERE SiteID = @SiteID
      `);
    
    // Log the site update activity
    try {
      const rawUserId = req.headers['x-user-id'] || '';
      const validUserId = await validateUserId(rawUserId);

      await logActivity(req, {
        action: 'Site Updated',
        details: `Updated site: ${site.Name || site.Site || id}`,
        userId: validUserId,
        username: req.headers['x-user-name'] || req.headers['x-user-fullname'] || 'system',
        companyCode
      });
    } catch (activityErr) {
      console.warn('Could not create site update activity log (non-critical):', activityErr.message);
    }

    // Fetch and return the updated site
    const result = await pool.request()
      .input('SiteID', sql.NVarChar, id)
      .query('SELECT * FROM Sites WHERE SiteID = @SiteID');
    
    const updatedSite = result.recordset[0];
    console.log('Site updated successfully:', id);
    res.json(updatedSite);
  } catch (err) {
    console.error('Error updating site:', err);
    console.error('Error details:', err.message);
    res.status(500).json({ error: 'Failed to update site', details: err.message });
  }
});// Delete site
app.delete('/api/sites/:id', async (req, res) => {
  try {
    const siteId = req.params.id;
    const companyCodeFromRequest = req.userCompanyCode || req.headers['x-company-code'];
    
    // Check if site exists
    const checkResult = await pool.request()
      .input('siteId', sql.NVarChar, siteId)
      .query('SELECT Name, CompanyCode FROM Sites WHERE SiteID = @siteId');
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Site not found' });
    }
    
    const siteRecord = checkResult.recordset[0];
    const siteName = siteRecord.Name;
    const siteCompanyCode = siteRecord.CompanyCode;
    const resolvedCompanyCode = siteCompanyCode || companyCodeFromRequest;
    if (siteCompanyCode && companyCodeFromRequest && siteCompanyCode !== companyCodeFromRequest) {
      return res.status(403).json({ error: 'Not authorized to delete this site' });
    }
    
    // Delete the site
    await pool.request()
      .input('siteId', sql.NVarChar, siteId)
      .query('DELETE FROM Sites WHERE SiteID = @siteId');
    
    console.log(`?�� Deleted site ${siteId} (${siteName})`);
    
    // Log the site deletion activity
    try {
      const rawUserId = req.headers['x-user-id'] || '';
      const validUserId = await validateUserId(rawUserId);

      await logActivity(req, {
        action: 'Site Deleted',
        details: `Deleted site: ${siteName}`,
        userId: validUserId,
        username: req.headers['x-user-name'] || req.headers['x-user-fullname'] || 'system',
        companyCode: resolvedCompanyCode
      });
    } catch (activityErr) {
      console.warn('Could not create site deletion activity log (non-critical):', activityErr.message);
    }
    
    res.json({ message: 'Site deleted successfully' });
  } catch (err) {
    console.error('Error deleting site:', err);
    res.status(500).json({ error: 'Failed to delete site', details: err.message });
  }
});

// Update customer
app.put('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const customer = req.body;
    const companyCode = req.userCompanyCode || req.headers['x-company-code'];
    
    console.log('Updating customer:', id, 'with data:', customer);
    
    await pool.request()
      .input('CustomerID', sql.NVarChar, id)
      .input('Name', sql.NVarChar, customer.Name || '')
      .input('Contact', sql.NVarChar, customer.Contact || '')
      .input('Phone', sql.NVarChar, customer.Phone || '')
      .input('Email', sql.NVarChar, customer.Email || '')
      .input('Address', sql.NVarChar, customer.Address || '')
      .input('Notes', sql.NVarChar, customer.Notes || '')
      .query(`
        UPDATE Customers SET
          Name = @Name,
          Contact = @Contact,
          Phone = @Phone,
          Email = @Email,
          Address = @Address,
          Notes = @Notes
        WHERE CustomerID = @CustomerID
      `);
    
    // Log the customer update activity
    try {
      const rawUserId = req.headers['x-user-id'] || '';
      const validUserId = await validateUserId(rawUserId);

      await logActivity(req, {
        action: 'Customer Updated',
        details: `Updated customer: ${customer.Name || id}`,
        userId: validUserId,
        username: req.headers['x-user-name'] || req.headers['x-user-fullname'] || 'system',
        companyCode
      });
    } catch (activityErr) {
      console.warn('Could not create customer update activity log (non-critical):', activityErr.message);
    }
    
    console.log('Customer updated successfully:', id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating customer:', err);
    console.error('Error details:', err.message);
    res.status(500).json({ error: 'Failed to update customer', details: err.message });
  }
});

// Update license
app.put('/api/licenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const license = req.body;
    
    console.log('?f�� Updating license:', id);
    console.log('   Received Status:', license.Status);
    console.log('   Full license data:', JSON.stringify(license, null, 2));
    
    const statusValue = license.Status || 'Active';
    console.log('   Using Status value:', statusValue);
    
    await pool.request()
      .input('LicenseID', sql.NVarChar, id)
      .input('Customer', sql.NVarChar, license.Customer || '')
      .input('Site', sql.NVarChar, license.Site || '')
      .input('SoftwareName', sql.NVarChar, license.SoftwareName || '')
      .input('SoftwareVersion', sql.NVarChar, license.SoftwareVersion || '')
      .input('LicenseType', sql.NVarChar, license.LicenseType || '')
      .input('LicenseKey', sql.NVarChar, license.LicenseKey || '')
      .input('LicenseCount', sql.Int, license.LicenseCount || 0)
      .input('UsedCount', sql.Int, license.UsedCount || 0)
      .input('ExpirationDate', sql.Date, license.ExpirationDate || null)
      .input('ServicePlan', sql.NVarChar, license.ServicePlan || '')
      .input('ServicePlanExpiration', sql.Date, license.ServicePlanExpiration || null)
      .input('Vendor', sql.NVarChar, license.Vendor || '')
      .input('PurchaseDate', sql.Date, license.PurchaseDate || null)
      .input('PurchasePrice', sql.Decimal(10, 2), license.PurchasePrice || null)
      .input('RenewalDate', sql.Date, license.RenewalDate || null)
      .input('RenewalPrice', sql.Decimal(10, 2), license.RenewalPrice || null)
      .input('ContactEmail', sql.NVarChar, license.ContactEmail || '')
      .input('Status', sql.NVarChar, statusValue)
      .input('InstallationPath', sql.NVarChar, license.InstallationPath || '')
      .input('ComplianceNotes', sql.NVarChar, license.ComplianceNotes || '')
      .input('Notes', sql.NVarChar, license.Notes || '')
      .query(`
        UPDATE Licenses SET
          Customer = @Customer,
          Site = @Site,
          SoftwareName = @SoftwareName,
          SoftwareVersion = @SoftwareVersion,
          LicenseType = @LicenseType,
          LicenseKey = @LicenseKey,
          LicenseCount = @LicenseCount,
          UsedCount = @UsedCount,
          ExpirationDate = @ExpirationDate,
          ServicePlan = @ServicePlan,
          ServicePlanExpiration = @ServicePlanExpiration,
          Vendor = @Vendor,
          PurchaseDate = @PurchaseDate,
          PurchasePrice = @PurchasePrice,
          RenewalDate = @RenewalDate,
          RenewalPrice = @RenewalPrice,
          ContactEmail = @ContactEmail,
          Status = @Status,
          InstallationPath = @InstallationPath,
          ComplianceNotes = @ComplianceNotes,
          Notes = @Notes,
          UpdatedAt = GETDATE()
        WHERE LicenseID = @LicenseID
      `);
    
    console.log('?�� License updated successfully:', id, '- Status set to:', statusValue);
    
    // Return the updated license to confirm changes
    const result = await pool.request()
      .input('LicenseID', sql.NVarChar, id)
      .query('SELECT * FROM Licenses WHERE LicenseID = @LicenseID');
    
    if (result.recordset.length > 0) {
      console.log('?�� Verified license Status in DB:', result.recordset[0].Status);
      res.json({ success: true, license: result.recordset[0] });
    } else {
      res.json({ success: true });
    }
  } catch (err) {
    console.error('Error updating license:', err);
    console.error('Error details:', err.message);
    res.status(500).json({ error: 'Failed to update license', details: err.message });
  }
});

// Create new vendor
app.post('/api/vendors', async (req, res) => {
  try {
    const companyCode = req.userCompanyCode;
    
    if (!companyCode) {
      return res.status(403).json({ error: 'Company access required' });
    }
    
    const vendor = req.body;
    const vendorID = `VEND-${Date.now()}`;
    
    // Convert arrays to JSON strings for storage
    const serviceAreas = Array.isArray(vendor.ServiceAreas) 
      ? JSON.stringify(vendor.ServiceAreas) 
      : '[]';
    const specialties = Array.isArray(vendor.Specialties)
      ? JSON.stringify(vendor.Specialties)
      : '[]';
    
    await pool.request()
      .input('VendorID', sql.NVarChar, vendorID)
      .input('Name', sql.NVarChar, vendor.Name || '')
      .input('Contact', sql.NVarChar, vendor.Contact || '')
      .input('Phone', sql.NVarChar, vendor.Phone || '')
      .input('Email', sql.NVarChar, vendor.Email || '')
      .input('ServiceAreas', sql.NVarChar, serviceAreas)
      .input('Specialties', sql.NVarChar, specialties)
      .input('CitiesServed', sql.NVarChar, vendor.CitiesServed || '')
      .input('Rating', sql.Decimal(3, 1), vendor.Rating || 5)
      .input('Notes', sql.NVarChar, vendor.Notes || '')
      .input('CompanyCode', sql.VarChar, companyCode)
      .input('StateLicenseNumber', sql.NVarChar, vendor.StateLicenseNumber || '')
      .input('StateLicenseExpiration', sql.Date, vendor.StateLicenseExpiration || null)
      .input('COIProvider', sql.NVarChar, vendor.COIProvider || '')
      .input('COIPolicyNumber', sql.NVarChar, vendor.COIPolicyNumber || '')
      .input('COIExpiration', sql.Date, vendor.COIExpiration || null)
      .input('Certifications', sql.NVarChar, vendor.Certifications || '')
      .input('VendorStatus', sql.NVarChar, vendor.VendorStatus || 'Active')
      .input('ComplianceNotes', sql.NVarChar, vendor.ComplianceNotes || '')
      .query(`
        INSERT INTO Vendors (
          VendorID, Name, Contact, Phone, Email, ServiceAreas, Specialties, CitiesServed, Rating, Notes, 
          StateLicenseNumber, StateLicenseExpiration, COIProvider, COIPolicyNumber, COIExpiration, 
          Certifications, VendorStatus, ComplianceNotes, CreatedAt, CompanyCode
        )
        VALUES (
          @VendorID, @Name, @Contact, @Phone, @Email, @ServiceAreas, @Specialties, @CitiesServed, @Rating, @Notes,
          @StateLicenseNumber, @StateLicenseExpiration, @COIProvider, @COIPolicyNumber, @COIExpiration,
          @Certifications, @VendorStatus, @ComplianceNotes, GETDATE(), @CompanyCode
        )
      `);
    
    res.json({ success: true, vendorID });
  } catch (err) {
    console.error('Error creating vendor:', err);
    res.status(500).json({ error: 'Failed to create vendor', details: err.message });
  }
});

// Update vendor
app.put('/api/vendors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const vendor = req.body;
    
    console.log('Updating vendor:', id, 'with data:', vendor);
    
    // Convert arrays to JSON strings for storage
    const serviceAreas = Array.isArray(vendor.ServiceAreas) 
      ? JSON.stringify(vendor.ServiceAreas) 
      : (vendor.ServiceAreas || '[]');
    const specialties = Array.isArray(vendor.Specialties)
      ? JSON.stringify(vendor.Specialties)
      : (vendor.Specialties || '[]');
    
    await pool.request()
      .input('VendorID', sql.NVarChar, id)
      .input('Name', sql.NVarChar, vendor.Name || '')
      .input('Contact', sql.NVarChar, vendor.Contact || '')
      .input('Phone', sql.NVarChar, vendor.Phone || '')
      .input('Email', sql.NVarChar, vendor.Email || '')
      .input('ServiceAreas', sql.NVarChar, serviceAreas)
      .input('Specialties', sql.NVarChar, specialties)
      .input('CitiesServed', sql.NVarChar, vendor.CitiesServed || '')
      .input('Rating', sql.Decimal(3, 1), vendor.Rating || 0)
      .input('Notes', sql.NVarChar, vendor.Notes || '')
      .input('StateLicenseNumber', sql.NVarChar, vendor.StateLicenseNumber || '')
      .input('StateLicenseExpiration', sql.Date, vendor.StateLicenseExpiration || null)
      .input('COIProvider', sql.NVarChar, vendor.COIProvider || '')
      .input('COIPolicyNumber', sql.NVarChar, vendor.COIPolicyNumber || '')
      .input('COIExpiration', sql.Date, vendor.COIExpiration || null)
      .input('Certifications', sql.NVarChar, vendor.Certifications || '')
      .input('VendorStatus', sql.NVarChar, vendor.VendorStatus || 'Active')
      .input('ComplianceNotes', sql.NVarChar, vendor.ComplianceNotes || '')
      .query(`
        UPDATE Vendors SET
          Name = @Name,
          Contact = @Contact,
          Phone = @Phone,
          Email = @Email,
          ServiceAreas = @ServiceAreas,
          Specialties = @Specialties,
          CitiesServed = @CitiesServed,
          Rating = @Rating,
          Notes = @Notes,
          StateLicenseNumber = @StateLicenseNumber,
          StateLicenseExpiration = @StateLicenseExpiration,
          COIProvider = @COIProvider,
          COIPolicyNumber = @COIPolicyNumber,
          COIExpiration = @COIExpiration,
          Certifications = @Certifications,
          VendorStatus = @VendorStatus,
          ComplianceNotes = @ComplianceNotes
        WHERE VendorID = @VendorID
      `);
    
    console.log('Vendor updated successfully:', id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating vendor:', err);
    console.error('Error details:', err.message);
    res.status(500).json({ error: 'Failed to update vendor', details: err.message });
  }
});

// Delete vendor
app.delete('/api/vendors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const companyCode = req.userCompanyCode;

    if (!companyCode) {
      return res.status(403).json({ error: 'Company access required' });
    }

    // Verify the vendor belongs to this company before deleting
    const checkResult = await pool.request()
      .input('id', sql.NVarChar, id)
      .input('companyCode', sql.VarChar, companyCode)
      .query('SELECT * FROM Vendors WHERE VendorID = @id AND CompanyCode = @companyCode');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const vendor = checkResult.recordset[0];

    await pool.request()
      .input('id', sql.NVarChar, id)
      .input('companyCode', sql.VarChar, companyCode)
      .query('DELETE FROM Vendors WHERE VendorID = @id AND CompanyCode = @companyCode');

    console.log(`??? Deleted vendor ${id}`);

    // Log activity
    await logActivity(req, {
      action: 'Vendor Deleted',
      details: `Deleted vendor ${id} (${vendor.Name})`,
      userId: req.userId || req.headers['x-user-id'] || 'system',
      username: req.username || req.headers['x-user-name'] || 'system',
      companyCode: companyCode
    });

    res.json({ message: 'Vendor deleted successfully' });
  } catch (err) {
    console.error('Error deleting vendor:', err);
    res.status(500).json({ error: 'Failed to delete vendor', details: err.message });
  }
});

// Get service request count
app.get('/api/service-requests/count/:status', async (req, res) => {
  try {
    const { status } = req.params;
    const statusMap = {
      'new': 'New',
      'pending': 'Pending',
      'completed': 'Completed',
      'dismissed': 'Dismissed'
    };
    const srStatus = statusMap[status.toLowerCase()] || 'New';
    const companyCode = req.userCompanyCode;
    
    if (!companyCode) {
      return res.status(403).json({ error: 'Company access required' });
    }
    
    console.log('Getting service request count for status:', srStatus, 'company:', companyCode);
    
    const result = await pool.request()
      .input('status', sql.NVarChar, srStatus)
      .input('companyCode', sql.VarChar, companyCode)
      .query('SELECT COUNT(*) as count FROM ServiceRequests WHERE Status = @status AND CompanyCode = @companyCode');
    
    res.json({ count: result.recordset[0].count });
  } catch (err) {
    console.error('Error fetching service request count:', err);
    res.status(500).json({ error: 'Failed to fetch count', details: err.message });
  }
});

// Get activity log with optional filters
app.get('/api/activity-log', async (req, res) => {
  try {
    const companyCode = req.userCompanyCode;
    
    if (!companyCode) {
      return res.status(403).json({ error: 'Company access required' });
    }
    
    const { search, hours = 8, userId, action } = req.query;
    const filters = [];
    const request = pool.request();
    
    // CompanyCode filter - CRITICAL for data isolation
    filters.push('CompanyCode = @companyCode');
    request.input('companyCode', sql.VarChar, companyCode);
    
    // Default timeframe filter (last 8 hours)
    filters.push('Timestamp >= DATEADD(hour, @hours, GETDATE())');
    request.input('hours', sql.Int, -parseInt(hours, 10));
    
    // Search across Username, Action, and Details
    if (search && String(search).trim()) {
      filters.push('(Username LIKE @search OR Action LIKE @search OR Details LIKE @search)');
      request.input('search', sql.NVarChar, `%${String(search).trim()}%`);
    }
    
    // Filter by specific action
    if (action && String(action).trim()) {
      filters.push('Action = @action');
      request.input('action', sql.NVarChar, String(action).trim());
    }
    
    // Filter by specific user
    if (userId && String(userId).trim()) {
      filters.push('Username = @userId');
      request.input('userId', sql.NVarChar, String(userId).trim());
    }
    
    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const query = `
      SELECT TOP 100 ID, UserID, Username, Action, Details, Timestamp, IPAddress, UserAgent, UserTimezone
      FROM ActivityLog
      ${whereClause}
      ORDER BY Timestamp DESC
    `;
    
    console.log('Activity log query filters:', { companyCode, search, hours, userId, action });
    
    const result = await request.query(query);
    
    console.log(`?�� Retrieved ${result.recordset.length} activity log entries`);
    
    // Map ActivityLog fields to match frontend expectations
    const mappedResults = result.recordset.map(record => ({
      id: record.ID,
      userId: record.UserID,
      username: record.Username,
      action: record.Action,
      details: record.Details,
      timestamp: record.Timestamp,
      userTimezone: record.UserTimezone,
      ipAddress: record.IPAddress,
      userAgent: record.UserAgent
    }));
    
    res.json(mappedResults);
  } catch (err) {
    console.error('Error fetching activity log:', err);
    res.status(500).json({ error: 'Failed to fetch activity log', details: err.message });
  }
});

// PUBLIC ENDPOINT: Submit service request from customer portal (no authentication required)
app.post('/api/service-requests/submit', async (req, res) => {
  try {
    const { 
      CustomerName, 
      ContactEmail, 
      ContactPhone, 
      SiteName, 
      Address, 
      CompanyCode, 
      Priority, 
      IssueDescription 
    } = req.body;
    
    // Validate required fields
    if (!CustomerName || !ContactEmail || !IssueDescription || !CompanyCode) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['CustomerName', 'ContactEmail', 'IssueDescription', 'CompanyCode']
      });
    }
    
    // Verify company exists
    const companyCheck = await pool.request()
      .input('companyCode', sql.VarChar, CompanyCode)
      .query('SELECT CompanyCode FROM Companies WHERE CompanyCode = @companyCode AND IsActive = 1');
    
    if (companyCheck.recordset.length === 0) {
      return res.status(400).json({ error: 'Invalid or inactive company selected' });
    }
    
    // Generate unique request ID
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const requestId = `SR-${timestamp}-${random}`;
    
    // Insert service request
    await pool.request()
      .input('requestId', sql.NVarChar, requestId)
      .input('companyCode', sql.VarChar, CompanyCode)
      .input('customerName', sql.NVarChar, CustomerName)
      .input('contactEmail', sql.NVarChar, ContactEmail)
      .input('contactPhone', sql.NVarChar, ContactPhone || null)
      .input('siteName', sql.NVarChar, SiteName || null)
      .input('address', sql.NVarChar, Address || null)
      .input('priority', sql.NVarChar, Priority || 'Medium')
      .input('issueDescription', sql.NVarChar, IssueDescription)
      .input('status', sql.NVarChar, 'New')
      .query(`
        INSERT INTO ServiceRequests (
          RequestID, CompanyCode, CustomerName, ContactEmail, ContactPhone, 
          SiteName, Address, Priority, IssueDescription, Status, SubmittedAt
        ) VALUES (
          @requestId, @companyCode, @customerName, @contactEmail, @contactPhone,
          @siteName, @address, @priority, @issueDescription, @status, GETDATE()
        )
      `);
    
    console.log(`Service request submitted: ${requestId} for company ${CompanyCode}`);
    
    // Log the service request submission
    try {
      await logActivity(req, {
        action: 'Service Request Submitted',
        details: `New service request ${requestId} submitted. Customer: ${CustomerName}, Priority: ${Priority || 'Medium'}, Issue: ${IssueDescription.substring(0, 100)}...`,
        userId: 'public',
        username: CustomerName,
        companyCode: CompanyCode
      });
      console.log('? Service request submission logged');
    } catch (logErr) {
      console.error('? Failed to log service request submission:', logErr.message);
    }
    
    res.json({ 
      success: true, 
      requestId,
      message: 'Service request submitted successfully'
    });
  } catch (err) {
    console.error('Error submitting service request:', err);
    res.status(500).json({ error: 'Failed to submit service request', details: err.message });
  }
});

// Get service requests by status (filtered by CompanyCode)
app.get('/api/service-requests', async (req, res) => {
  try {
    const companyCode = req.userCompanyCode;
    
    if (!companyCode) {
      return res.status(403).json({ error: 'Company access required' });
    }
    
    const { status } = req.query;
    const filters = ['CompanyCode = @companyCode'];
    const request = pool.request();
    
    request.input('companyCode', sql.VarChar, companyCode);
    
    if (status) {
      filters.push('Status = @status');
      request.input('status', sql.NVarChar, status);
    }
    
    const whereClause = `WHERE ${filters.join(' AND ')}`;
    const query = `SELECT * FROM ServiceRequests ${whereClause} ORDER BY SubmittedAt DESC`;
    
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching service requests:', err);
    console.error('Error details:', err.message);
    res.status(500).json({ error: 'Failed to fetch service requests', details: err.message });
  }
});

// Create ticket from service request
app.post('/api/service-requests/:id/create-ticket', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('Creating ticket from service request:', id);
    
    // Get the service request - RequestID is nvarchar, not int
    const srResult = await pool.request()
      .input('id', sql.NVarChar, id)
      .query('SELECT * FROM ServiceRequests WHERE RequestID = @id');
    
    if (srResult.recordset.length === 0) {
      console.error('Service request not found:', id);
      return res.status(404).json({ error: 'Service request not found' });
    }
    
    const sr = srResult.recordset[0];
    console.log('Found service request:', sr);

    // Determine company code FIRST
    const resolvedCompanyCode = sr.CompanyCode || req.userCompanyCode || req.headers['x-company-code'];
    if (!resolvedCompanyCode) {
      console.error('Cannot determine company code for service request -> ticket conversion', {
        serviceRequestId: id,
        serviceRequestCompany: sr.CompanyCode,
        headerCompany: req.headers['x-company-code'],
        middlewareCompany: req.userCompanyCode
      });
      return res.status(400).json({ error: 'Missing company code for service request' });
    }

    // Generate a ticket ID with company code
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const dateStamp = `${year}-${month}`;
    
    // Get the count of tickets this month
    const countResult = await pool.request()
      .input('companyCode', sql.NVarChar, resolvedCompanyCode)
      .query(`SELECT COUNT(*) as count FROM Tickets WHERE TicketID LIKE 'TKT-${resolvedCompanyCode}-${dateStamp}-%' AND CompanyCode = @companyCode`);;
    const nextNum = String(countResult.recordset[0].count + 1).padStart(3, '0');
    const ticketID = `TKT-${resolvedCompanyCode}-${dateStamp}-${nextNum}`;;
    
    console.log('Creating ticket with ID:', ticketID);
    
    // Create ticket with all required fields matching Tickets table schema
    const description = `Customer: ${sr.CustomerName}
Email: ${sr.ContactEmail}
Phone: ${sr.ContactPhone}
Site: ${sr.SiteName}
Address: ${sr.Address}

Issue:
${sr.IssueDescription}`;
    
    // Map priority values - Tickets table only allows: Low, Normal, High, Critical
    // ServiceRequests may have Medium which needs to map to Normal
    let priority = sr.Priority || 'Normal';
    if (priority === 'Medium') {
      priority = 'Normal';
    }
    // Ensure priority is one of the allowed values
    if (!['Low', 'Normal', 'High', 'Critical'].includes(priority)) {
      priority = 'Normal';
    }
    
    await pool.request()
      .input('ticketID', sql.NVarChar, ticketID)
      .input('title', sql.NVarChar, `Service Request: ${sr.CustomerName}`)
      .input('customer', sql.NVarChar, sr.CustomerName)
      .input('site', sql.NVarChar, sr.SiteName || '')
      .input('description', sql.NVarChar, description)
      .input('priority', sql.NVarChar, priority)
      .input('status', sql.NVarChar, 'New')
      .input('category', sql.NVarChar, 'General')
      .input('owner', sql.NVarChar, 'System')
      .input('companyCode', sql.NVarChar, resolvedCompanyCode)
      .query(`
        INSERT INTO Tickets (
          TicketID, Title, Status, Priority, Customer, Site, 
          Description, Category, Owner, CreatedAt, UpdatedAt, CompanyCode
        )
        VALUES (
          @ticketID, @title, @status, @priority, @customer, @site,
          @description, @category, @owner, GETDATE(), GETDATE(), @companyCode
        )
      `);
    
    // Update service request with ticket ID and mark as processed
    await pool.request()
      .input('id', sql.NVarChar, id)
      .input('ticketID', sql.NVarChar, ticketID)
      .input('status', sql.NVarChar, 'Processed')
      .input('processedBy', sql.NVarChar, 'System')
      .query(`
        UPDATE ServiceRequests 
        SET Status = @status, 
            TicketID = @ticketID,
            ProcessedBy = @processedBy,
            ProcessedAt = GETDATE(),
            ProcessedNote = 'Converted to ticket'
        WHERE RequestID = @id
      `);
    
    console.log('Successfully created ticket:', ticketID);
    
    // Log activity
    console.log('?? About to log activity - CompanyCode:', resolvedCompanyCode, 'userId:', req.userId || req.headers['x-user-id'], 'username:', req.username || req.headers['x-user-name']);
    try {
      await logActivity(req, {
        action: 'Ticket Created from Service Request',
        details: `Created ticket ${ticketID} from service request ${id}. Customer: ${sr.CustomerName}, Priority: ${priority}`,
        userId: req.userId || req.headers['x-user-id'] || 'system',
        username: req.username || req.headers['x-user-name'] || 'System',
        companyCode: resolvedCompanyCode
      });
      console.log('? Activity logged successfully');
    } catch (logErr) {
      console.error('? Failed to log activity:', logErr.message);
      console.error('Full error:', logErr);
    }
    
    res.json({ success: true, ticketId: ticketID });
  } catch (err) {
    console.error('Error creating ticket from service request:', err);
    console.error('Error details:', err.message);
    res.status(500).json({ error: 'Failed to create ticket', details: err.message });
  }
});

// Dismiss service request
app.post('/api/service-requests/:id/dismiss', async (req, res) => {
  try {
    const { id } = req.params;
    const { username = 'admin', fullName = 'System' } = req.body;
    
    console.log('Dismissing service request:', id);
    
    // Get service request details first
    const srResult = await pool.request()
      .input('id', sql.NVarChar, id)
      .query('SELECT * FROM ServiceRequests WHERE RequestID = @id');
    
    if (srResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Service request not found' });
    }
    
    const sr = srResult.recordset[0];
    
    // Update service request
    await pool.request()
      .input('id', sql.NVarChar, id)
      .input('status', sql.NVarChar, 'Dismissed')
      .input('processedBy', sql.NVarChar, fullName)
      .query(`
        UPDATE ServiceRequests 
        SET Status = @status,
            ProcessedBy = @processedBy,
            ProcessedAt = GETDATE(),
            ProcessedNote = 'Request dismissed'
        WHERE RequestID = @id
      `);
    
    // Log activity using helper
    const resolvedCompanyCode = sr.CompanyCode || req.userCompanyCode || req.headers['x-company-code'];
    await logActivity(req, {
      action: 'Service Request Dismissed',
      details: `Service Request Dismissed: ${id}\nCustomer: ${sr.CustomerName}\nPriority: ${sr.Priority}\nDismissed By: ${fullName}`,
      userId: req.userId || 'admin_001',
      username: fullName,
      companyCode: resolvedCompanyCode
    });
    
    console.log('Successfully dismissed service request:', id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error dismissing service request:', err);
    console.error('Error details:', err.message);
    res.status(500).json({ error: 'Failed to dismiss service request', details: err.message });
  }
});

// Add coordinator note to ticket
app.post('/api/tickets/:id/coordinator-notes', async (req, res) => {
  try {
    const ticketId = req.params.id;
    const { note, createdBy } = req.body;
    
    if (!note || !note.trim()) {
      return res.status(400).json({ error: 'Note content is required' });
    }
    
    const noteId = `NOTE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date(); // Pass as Date object for proper handling
    
    await pool.request()
      .input('noteId', sql.NVarChar, noteId)
      .input('ticketId', sql.NVarChar, ticketId)
      .input('note', sql.NVarChar, note.trim())
      .input('createdBy', sql.NVarChar, createdBy || 'Unknown')
      .input('createdAt', sql.DateTime2, timestamp)
      .query(`
        INSERT INTO CoordinatorNotes (NoteID, TicketID, Note, CreatedBy, CreatedAt)
        VALUES (@noteId, @ticketId, @note, @createdBy, @createdAt)
      `);
    
    console.log(`?�� Added coordinator note to ticket ${ticketId}`);
    res.json({ 
      success: true, 
      note: {
        NoteID: noteId,
        Note: note.trim(),
        CreatedBy: createdBy || 'Unknown',
        CreatedAt: timestamp.toISOString()
      }
    });
  } catch (err) {
    console.error('Error adding coordinator note:', err);
    res.status(500).json({ error: 'Failed to add note', details: err.message });
  }
});

// Get attachments by ticket (query param)
app.get('/api/attachments', async (req, res) => {
  try {
    const { ticketId } = req.query;
    
    // Check if Attachments table exists
    const tableCheck = await pool.request().query(`
      SELECT COUNT(*) as tableExists 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'Attachments'
    `);
    
    if (tableCheck.recordset[0].tableExists === 0) {
      console.warn('Attachments table does not exist - returning empty array');
      return res.json([]);
    }
    
    const request = pool.request();
    let query = 'SELECT * FROM Attachments';
    if (ticketId) {
      query += ' WHERE TicketID = @ticketId';
      request.input('ticketId', sql.NVarChar, ticketId);
    }
    
    query += ' ORDER BY UploadedAt DESC';
    
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching attachments:', err);
    console.warn('Returning empty array due to error');
    res.json([]); // Return empty array instead of error to prevent frontend crash
  }
});

// Get attachments by ticket (path param) - Alternative route for frontend compatibility
app.get('/api/tickets/:ticketId/attachments', async (req, res) => {
  try {
    const { ticketId } = req.params;
    
    // Check if Attachments table exists
    const tableCheck = await pool.request().query(`
      SELECT COUNT(*) as tableExists 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'Attachments'
    `);
    
    if (tableCheck.recordset[0].tableExists === 0) {
      console.warn('Attachments table does not exist - returning empty array');
      return res.json([]);
    }
    
    const result = await pool.request()
      .input('ticketId', sql.NVarChar, ticketId)
      .query('SELECT * FROM Attachments WHERE TicketID = @ticketId ORDER BY UploadedAt DESC');
    
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching attachments for ticket:', err);
    console.warn('Returning empty array due to error');
    res.json([]); // Return empty array instead of error to prevent frontend crash
  }
});

// Upload attachment for a ticket
app.post('/api/tickets/:ticketId/attachments', upload.single('file'), async (req, res) => {
  try {
    const { ticketId } = req.params;
    const file = req.file;
    const description = req.body.description || '';
    const uploadedBy = req.headers['x-user-id'] || req.headers['x-user-name'] || 'unknown';

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Build attachment metadata
    const attachmentId = `ATT-${Date.now()}-${Math.random().toString(36).substr(2,8)}`;
    const filePath = path.relative(__dirname, file.path).replace(/\\/g, '/');

    // Try insert into Attachments table if it exists
    try {
      const tableCheck = await pool.request().query(`SELECT COUNT(*) as tableExists FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Attachments'`);
      if (tableCheck.recordset[0].tableExists > 0) {
        // Get CompanyCode - default to 'DCPSP' for now (single-tenant mode)
  const companyCode = req.userCompanyCode || req.headers['x-company-code'] || 'DCPSP';

        // Validate that the user exists in Users table, fallback to admin_001 if not
        const validatedUploadedBy = await validateUserId(uploadedBy);

        await pool.request()
          .input('attachmentId', sql.NVarChar, attachmentId)
          .input('ticketId', sql.NVarChar, ticketId)
          .input('fileName', sql.NVarChar, file.filename)
          .input('originalFileName', sql.NVarChar, file.originalname)
          .input('fileType', sql.NVarChar, file.mimetype)
          .input('fileSize', sql.Int, file.size)
          .input('filePath', sql.NVarChar, filePath)
          .input('uploadedBy', sql.NVarChar, validatedUploadedBy)
          .input('description', sql.NVarChar, description)
          .input('companyCode', sql.VarChar, companyCode)
          .query(`
            INSERT INTO Attachments (AttachmentID, TicketID, FileName, OriginalFileName, FileType, FileSize, FilePath, UploadedBy, Description, UploadedAt, CompanyCode)
            VALUES (@attachmentId, @ticketId, @fileName, @originalFileName, @fileType, @fileSize, @filePath, @uploadedBy, @description, GETDATE(), @companyCode)
          `);
      }
    } catch (dbErr) {
      console.warn('Attachments table insert failed or table missing:', dbErr && dbErr.message);
      // Continue - uploaded file still present on disk
    }

    // Log the attachment upload activity
    try {
      const validUserId = await validateUserId(uploadedBy);
      const userName = req.headers['x-user-fullname'] || req.headers['x-user-name'] || uploadedBy;

      await logActivity(req, {
        action: 'Attachment Uploaded',
        details: `Uploaded file: ${file.originalname} (${Math.round(file.size / 1024)} KB)${description ? ` - ${description}` : ''}`,
        userId: validUserId,
        username: userName,
        companyCode
      });
    } catch (activityErr) {
      console.warn('Could not create attachment upload activity log (non-critical):', activityErr.message);
    }

    console.log(`?�� Uploaded attachment ${attachmentId} for ticket ${ticketId}`);
    res.json({ success: true, attachment: { id: attachmentId, fileName: file.filename, originalName: file.originalname } });
  } catch (err) {
    console.error('Error uploading attachment:', err);
    res.status(500).json({ error: 'Failed to upload attachment', details: err.message });
  }
});

// Get single attachment
app.get('/api/attachments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.request()
      .input('id', sql.NVarChar, id)
      .query('SELECT * FROM Attachments WHERE AttachmentID = @id');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Attachment not found' });
    }
    
    const attachment = result.recordset[0];
    const filePath = path.join(__dirname, attachment.FilePath);
    
    console.log('?f�� Download request for:', id);
    console.log('   __dirname:', __dirname);
    console.log('   FilePath from DB:', attachment.FilePath);
    console.log('   Resolved path:', filePath);
    console.log('   File exists:', fs.existsSync(filePath));
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error('?�� File not found on disk:', filePath);
      return res.status(404).json({ 
        error: 'File not found on disk',
        details: {
          attachmentId: id,
          expectedPath: filePath,
          storedPath: attachment.FilePath
        }
      });
    }
    
    console.log('?�� File found, streaming to client');
    
    // Set appropriate headers
    res.setHeader('Content-Type', attachment.FileType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.OriginalFileName}"`);
    res.setHeader('Content-Length', attachment.FileSize);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.on('error', (err) => {
      console.error('?�� Error streaming file:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error streaming file' });
      }
    });
    fileStream.pipe(res);
    
  } catch (err) {
    console.error('Error fetching attachment:', err);
    res.status(500).json({ error: 'Failed to fetch attachment' });
  }
});

// Delete attachment
app.delete('/api/attachments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.request()
      .input('id', sql.NVarChar, id)
      .query('DELETE FROM Attachments WHERE AttachmentID = @id');
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting attachment:', err);
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
});

// ================================================================
// COMPANY MANAGEMENT ENDPOINTS
// ================================================================

// GET /api/companies - Get all companies
app.get('/api/companies', async (req, res) => {
  try {
    const result = await pool.request()
      .query('SELECT * FROM Companies ORDER BY CompanyName');
    
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching companies:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/companies/active - Get active companies for service request dropdown
app.get('/api/companies/active', async (req, res) => {
  try {
    const result = await pool.request()
      .query(`
        SELECT CompanyCode, CompanyName, DisplayName 
        FROM Companies 
        WHERE IsActive = 1 AND AllowServiceRequests = 1
        ORDER BY DisplayName
      `);
    
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching active companies:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/companies/:code - Get company by code
app.get('/api/companies/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    const result = await pool.request()
      .input('code', sql.NVarChar, code)
      .query('SELECT * FROM Companies WHERE CompanyCode = @code');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error fetching company:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/companies - Create new company
app.post('/api/companies', async (req, res) => {
  const transaction = new sql.Transaction(pool);
  
  try {
    const {
      companyCode,
      companyName,
      displayName,
      contactEmail,
      contactPhone,
      address,
      isActive = true,
      allowServiceRequests = true,
      // Admin user fields
      adminUsername,
      adminEmail,
      adminFullName,
      adminPassword
    } = req.body;

    if (!companyCode || !companyName) {
      return res.status(400).json({ error: 'CompanyCode and CompanyName are required' });
    }

    // When creating a new company, admin user is required
    if (!adminUsername || !adminEmail || !adminFullName || !adminPassword) {
      return res.status(400).json({ 
        error: 'Admin user information is required (username, email, full name, password)' 
      });
    }

    // Check if company code already exists
    const existingCheck = await pool.request()
      .input('code', sql.NVarChar, companyCode)
      .query('SELECT COUNT(*) as count FROM Companies WHERE CompanyCode = @code');
    
    if (existingCheck.recordset[0].count > 0) {
      return res.status(409).json({ error: 'Company code already exists' });
    }

    // Check if admin username already exists
    const usernameCheck = await pool.request()
      .input('username', sql.NVarChar, adminUsername)
      .query('SELECT COUNT(*) as count FROM Users WHERE Username = @username');
    
    if (usernameCheck.recordset[0].count > 0) {
      return res.status(409).json({ error: 'Admin username already exists' });
    }

    // Start transaction
    await transaction.begin();

    // Create company
    const companyRequest = new sql.Request(transaction);
    const companyResult = await companyRequest
      .input('companyCode', sql.NVarChar, companyCode.toUpperCase())
      .input('companyName', sql.NVarChar, companyName)
      .input('displayName', sql.NVarChar, displayName || companyName)
      .input('contactEmail', sql.NVarChar, contactEmail)
      .input('contactPhone', sql.NVarChar, contactPhone)
      .input('address', sql.NVarChar, address)
      .input('isActive', sql.Bit, isActive)
      .input('allowServiceRequests', sql.Bit, allowServiceRequests)
      .query(`
        INSERT INTO Companies (CompanyCode, CompanyName, DisplayName, ContactEmail, ContactPhone, Address, IsActive, AllowServiceRequests, CreatedAt, UpdatedAt)
        OUTPUT INSERTED.*
        VALUES (@companyCode, @companyName, @displayName, @contactEmail, @contactPhone, @address, @isActive, @allowServiceRequests, GETDATE(), GETDATE())
      `);

    // Hash password (simple base64 encoding - matches existing pattern)
    const hashedPassword = Buffer.from(adminPassword).toString('base64');

    // Generate unique ID for admin user
    const adminUserId = `USER-${companyCode.toUpperCase()}-${Date.now()}`;

    // Create admin user
    const userRequest = new sql.Request(transaction);
    const userResult = await userRequest
      .input('id', sql.NVarChar, adminUserId)
      .input('username', sql.NVarChar, adminUsername)
      .input('passwordHash', sql.NVarChar, hashedPassword)
      .input('email', sql.NVarChar, adminEmail)
      .input('fullName', sql.NVarChar, adminFullName)
      .input('role', sql.NVarChar, 'Admin')
      .input('companyCode', sql.NVarChar, companyCode.toUpperCase())
      .query(`
        INSERT INTO Users (ID, Username, PasswordHash, Email, FullName, Role, CompanyCode, IsActive, CreatedAt)
        OUTPUT INSERTED.ID, INSERTED.Username, INSERTED.Email, INSERTED.FullName, INSERTED.Role, INSERTED.CompanyCode
        VALUES (@id, @username, @passwordHash, @email, @fullName, @role, @companyCode, 1, GETDATE())
      `);

    // Commit transaction
    await transaction.commit();

    console.log(`?�� Created new company: ${companyCode} - ${companyName}`);
    console.log(`?�� Created admin user: ${adminUsername} for ${companyCode}`);
    
    res.status(201).json({
      company: companyResult.recordset[0],
      adminUser: userResult.recordset[0]
    });
  } catch (err) {
    // Rollback transaction on error
    if (transaction._aborted === false) {
      await transaction.rollback();
    }
    console.error('Error creating company:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/companies/:code - Update company
app.put('/api/companies/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const {
      companyName,
      displayName,
      contactEmail,
      contactPhone,
      address,
      isActive,
      allowServiceRequests
    } = req.body;

    const result = await pool.request()
      .input('code', sql.NVarChar, code)
      .input('companyName', sql.NVarChar, companyName)
      .input('displayName', sql.NVarChar, displayName)
      .input('contactEmail', sql.NVarChar, contactEmail)
      .input('contactPhone', sql.NVarChar, contactPhone)
      .input('address', sql.NVarChar, address)
      .input('isActive', sql.Bit, isActive)
      .input('allowServiceRequests', sql.Bit, allowServiceRequests)
      .query(`
        UPDATE Companies
        SET CompanyName = @companyName,
            DisplayName = @displayName,
            ContactEmail = @contactEmail,
            ContactPhone = @contactPhone,
            Address = @address,
            IsActive = @isActive,
            AllowServiceRequests = @allowServiceRequests,
            UpdatedAt = GETDATE()
        OUTPUT INSERTED.*
        WHERE CompanyCode = @code
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    console.log(`?�� Updated company: ${code}`);
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error updating company:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/companies/:code - Delete company (soft delete by setting IsActive = 0)
app.delete('/api/companies/:code', async (req, res) => {
  try {
    const { code } = req.params;

    // Don't allow deleting DCPSP
    if (code.toUpperCase() === 'DCPSP') {
      return res.status(403).json({ error: 'Cannot delete default company' });
    }

    const result = await pool.request()
      .input('code', sql.NVarChar, code)
      .query(`
        UPDATE Companies
        SET IsActive = 0, UpdatedAt = GETDATE()
        OUTPUT INSERTED.*
        WHERE CompanyCode = @code
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    console.log(`?�� Deactivated company: ${code}`);
    res.json({ message: 'Company deactivated successfully', company: result.recordset[0] });
  } catch (err) {
    console.error('Error deleting company:', err);
    res.status(500).json({ error: err.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Server is started in the initialization chain above after plugins are loaded

