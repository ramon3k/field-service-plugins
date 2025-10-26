/**
 * Standalone Customer Service Request Portal API
 * 
 * This is a minimal, standalone API server that handles public service request submissions.
 * It connects to your main Field Service database and stores requests in the ServiceRequests table.
 * 
 * DEPLOYMENT: Can be hosted on any Node.js hosting platform (Azure, AWS, Heroku, shared hosting, etc.)
 * NO AUTHENTICATION: This endpoint is intentionally public for customer submissions
 */

require('dotenv').config();
const express = require('express');
const sql = require('mssql'); // Cross-platform SQL driver (works on Azure!)
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== CONFIGURATION =====
const DB_SERVER = process.env.DB_SERVER || 'localhost\\SQLEXPRESS';
const DB_NAME = process.env.DB_NAME || 'FieldServiceDB';
const DB_USER = process.env.DB_USER; // Optional: for SQL Authentication
const DB_PASSWORD = process.env.DB_PASSWORD; // Optional: for SQL Authentication

// SQL connection config for mssql package
const dbConfig = DB_USER ? {
  server: DB_SERVER,
  database: DB_NAME,
  user: DB_USER,
  password: DB_PASSWORD,
  options: {
    encrypt: true, // Required for Azure SQL Database
    trustServerCertificate: false, // Azure uses proper certificates
    connectTimeout: 30000,
    requestTimeout: 30000
  }
} : {
  server: DB_SERVER,
  database: DB_NAME,
  options: {
    trustedConnection: true,
    encrypt: false,
    trustServerCertificate: true,
    connectTimeout: 30000,
    requestTimeout: 30000
  }
};

console.log(`Database: ${DB_NAME} on ${DB_SERVER}`);
console.log(`Auth Mode: ${DB_USER ? 'SQL Authentication' : 'Windows Authentication'}`);

// CORS configuration - restrict to specific domains in production
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['*']; // Allow all origins by default (restrict in production!)

app.use(cors({
  origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (the HTML form)
app.use(express.static(path.join(__dirname, 'public')));

// Create connection pool
let pool;
async function initializeDatabase() {
  try {
    console.log('=== DATABASE CONNECTION DEBUG ===');
    console.log('Environment Variables:');
    console.log('  DB_SERVER:', process.env.DB_SERVER || 'NOT SET');
    console.log('  DB_NAME:', process.env.DB_NAME || 'NOT SET');
    console.log('  DB_USER:', process.env.DB_USER || 'NOT SET');
    console.log('  DB_PASSWORD:', process.env.DB_PASSWORD ? '***SET***' : 'NOT SET');
    console.log('Connection Config:');
    console.log('  server:', dbConfig.server);
    console.log('  database:', dbConfig.database);
    console.log('  user:', dbConfig.user);
    console.log('  password:', dbConfig.password ? '***SET***' : 'NOT SET');
    console.log('  encrypt:', dbConfig.options.encrypt);
    console.log('  trustServerCertificate:', dbConfig.options.trustServerCertificate);
    console.log('Testing SQL Server connection...');
    pool = await sql.connect(dbConfig);
    console.log('✅ Connected to SQL Server successfully');
  } catch (err) {
    console.error('❌ Database connection FAILED');
    console.error('Error Name:', err.name);
    console.error('Error Message:', err.message);
    console.error('Error Code:', err.code);
    if (err.originalError) {
      console.error('Original Error:', err.originalError.message);
    }
    console.error('Full Error:', JSON.stringify(err, null, 2));
    // Don't crash - try to reconnect on first request
  }
}

// Initialize database connection
initializeDatabase();

// ===== ROUTES =====

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    if (!pool) await initializeDatabase();
    await pool.request().query('SELECT 1 as test');
    res.json({
      status: 'ok',
      service: 'Customer Service Request Portal',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (err) {
    res.json({
      status: 'ok',
      service: 'Customer Service Request Portal',
      timestamp: new Date().toISOString(),
      database: 'disconnected'
    });
  }
});

// Submit service request (PUBLIC - no authentication required)
app.post('/api/service-requests/submit', async (req, res) => {
  try {
    const requestData = req.body;
    
    // Validation
    if (!requestData.CustomerName || !requestData.ContactEmail || !requestData.IssueDescription) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: CustomerName, ContactEmail, and IssueDescription are required.' 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(requestData.ContactEmail)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email address format.' 
      });
    }

    const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const companyCode = process.env.COMPANY_CODE || 'DEFAULT';
    
    // Get client IP address
    const ipAddress = (req.headers['x-forwarded-for'] && req.headers['x-forwarded-for'].split(',')[0].trim()) 
                   || req.ip 
                   || (req.connection && req.connection.remoteAddress) 
                   || 'unknown';
    
    const userAgent = req.get('user-agent') || 'unknown';
    
    // Ensure pool is connected
    if (!pool) await initializeDatabase();
    
    // Insert service request using mssql package
    const request = pool.request();
    request.input('requestId', sql.VarChar(100), requestId);
    request.input('customerName', sql.NVarChar(255), requestData.CustomerName);
    request.input('contactEmail', sql.VarChar(255), requestData.ContactEmail);
    request.input('contactPhone', sql.VarChar(50), requestData.ContactPhone || '');
    request.input('siteName', sql.NVarChar(255), requestData.SiteName || '');
    request.input('address', sql.NVarChar(sql.MAX), requestData.Address || '');
    request.input('issueDescription', sql.NVarChar(sql.MAX), requestData.IssueDescription);
    request.input('priority', sql.VarChar(20), requestData.Priority || 'Medium');
    request.input('ipAddress', sql.VarChar(50), ipAddress);
    request.input('userAgent', sql.NVarChar(500), userAgent);
    request.input('companyCode', sql.VarChar(50), companyCode);
    
    const query = `
      INSERT INTO ServiceRequests (
        RequestID, CustomerName, ContactEmail, ContactPhone, SiteName, 
        Address, IssueDescription, Priority, Status, SubmittedAt, 
        IPAddress, UserAgent, CompanyCode
      )
      VALUES (
        @requestId, @customerName, @contactEmail, @contactPhone, @siteName,
        @address, @issueDescription, @priority, 'New', GETDATE(), 
        @ipAddress, @userAgent, @companyCode
      )
    `;
    
    await request.query(query);
    
    // Log activity (non-blocking)
    const activityId = `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const activityDetails = `Service Request Received: ${requestId}
Customer: ${requestData.CustomerName}
Email: ${requestData.ContactEmail}
Phone: ${requestData.ContactPhone || 'Not provided'}
Site: ${requestData.SiteName || 'Not provided'}
Priority: ${requestData.Priority || 'Medium'}
Issue: ${requestData.IssueDescription ? requestData.IssueDescription.substring(0, 200) : ''}${requestData.IssueDescription && requestData.IssueDescription.length > 200 ? '...' : ''}`;

    try {
      const activityRequest = pool.request();
      activityRequest.input('activityId', sql.VarChar(100), activityId);
      activityRequest.input('userId', sql.VarChar(50), 'system_001');
      activityRequest.input('username', sql.NVarChar(255), requestData.CustomerName);
      activityRequest.input('action', sql.NVarChar(255), 'Service Request Submitted');
      activityRequest.input('details', sql.NVarChar(sql.MAX), activityDetails);
      activityRequest.input('ipAddress', sql.VarChar(50), ipAddress);
      activityRequest.input('userAgent', sql.NVarChar(500), userAgent);
      activityRequest.input('companyCode', sql.VarChar(50), companyCode);
      
      await activityRequest.query(`
        INSERT INTO ActivityLog (ID, UserID, Username, Action, Details, Timestamp, IPAddress, UserAgent, CompanyCode)
        VALUES (@activityId, @userId, @username, @action, @details, GETUTCDATE(), @ipAddress, @userAgent, @companyCode)
      `);
    } catch (activityErr) {
      console.error('Note: Could not log activity (non-critical):', activityErr.message);
    }
    
    console.log(`✅ Service request submitted: ${requestId} from ${requestData.CustomerName}`);
    
    res.json({ 
      success: true, 
      requestId,
      message: 'Your service request has been submitted successfully. We will contact you soon.',
      estimatedResponse: 'within 24 hours'
    });
    
  } catch (err) {
    console.error('❌ Error in service request submission:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to submit request. Please try again or contact us directly.' 
    });
  }
});

// Catch-all route - serve the HTML form
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ===== SERVER STARTUP =====
console.log('🚀 Starting Customer Service Request Portal...');

// Start Express server
app.listen(PORT, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log('🎯 Customer Service Request Portal');
  console.log(`${'='.repeat(60)}`);
  console.log(`🌐 Server running at: http://localhost:${PORT}`);
  console.log(`📋 Submit form: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Database: ${DB_NAME}`);
  console.log(`🏢 Company Code: ${process.env.COMPANY_CODE || 'DEFAULT'}`);
  console.log(`${'='.repeat(60)}\n`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n📴 Shutting down server...');
  process.exit(0);
});
