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
const sql = require('msnodesqlv8'); // Use Windows-compatible SQL driver
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== CONFIGURATION =====
const DB_SERVER = process.env.DB_SERVER || 'localhost\\SQLEXPRESS';
const DB_NAME = process.env.DB_NAME || 'FieldServiceDB';
const DB_USER = process.env.DB_USER; // Optional: for SQL Authentication
const DB_PASSWORD = process.env.DB_PASSWORD; // Optional: for SQL Authentication

// Connection string - supports both Windows Auth and SQL Auth
// If DB_USER is provided, use SQL Authentication (for Plesk/remote hosting)
// Otherwise, use Windows Authentication (for local development)
const connectionString = DB_USER 
  ? `server=${DB_SERVER};Database=${DB_NAME};UID=${DB_USER};PWD=${DB_PASSWORD};Driver={SQL Server Native Client 11.0}`
  : `server=${DB_SERVER};Database=${DB_NAME};Trusted_Connection=Yes;Driver={SQL Server Native Client 11.0}`;

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

// Test database connection at startup
console.log('Testing SQL Server connection...');
sql.query(connectionString, 'SELECT 1 as test', (err, rows) => {
  if (err) {
    console.error('❌ Database connection test failed:', err.message);
  } else {
    console.log('✅ Connected to SQL Server Express successfully');
  }
});

// ===== ROUTES =====

// Health check endpoint
app.get('/health', (req, res) => {
  // Test database connection
  sql.query(connectionString, 'SELECT 1 as test', (err) => {
    res.json({
      status: 'ok',
      service: 'Customer Service Request Portal',
      timestamp: new Date().toISOString(),
      database: err ? 'disconnected' : 'connected'
    });
  });
});

// Submit service request (PUBLIC - no authentication required)
app.post('/api/service-requests/submit', (req, res) => {
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
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0].trim() 
                   || req.ip 
                   || req.connection?.remoteAddress 
                   || 'unknown';
    
    const userAgent = req.get('user-agent') || 'unknown';
    
    // Insert service request using msnodesqlv8
    const query = `
      INSERT INTO ServiceRequests (
        RequestID, CustomerName, ContactEmail, ContactPhone, SiteName, 
        Address, IssueDescription, Priority, Status, SubmittedAt, 
        IPAddress, UserAgent, CompanyCode
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'New', GETDATE(), ?, ?, ?)
    `;
    
    const params = [
      requestId,
      requestData.CustomerName,
      requestData.ContactEmail,
      requestData.ContactPhone || '',
      requestData.SiteName || '',
      requestData.Address || '',
      requestData.IssueDescription,
      requestData.Priority || 'Medium',
      ipAddress,
      userAgent,
      companyCode
    ];
    
    sql.query(connectionString, query, params, (err) => {
      if (err) {
        console.error('❌ Error creating service request:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to submit request. Please try again or contact us directly.' 
        });
      }
      
      // Log activity (non-blocking)
      const activityId = `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const activityDetails = `Service Request Received: ${requestId}
Customer: ${requestData.CustomerName}
Email: ${requestData.ContactEmail}
Phone: ${requestData.ContactPhone || 'Not provided'}
Site: ${requestData.SiteName || 'Not provided'}
Priority: ${requestData.Priority || 'Medium'}
Issue: ${requestData.IssueDescription?.substring(0, 200)}${requestData.IssueDescription?.length > 200 ? '...' : ''}`;

      const activityQuery = `
        INSERT INTO ActivityLog (ID, UserID, Username, Action, Details, Timestamp, IPAddress, UserAgent, CompanyCode)
        VALUES (?, ?, ?, ?, ?, GETUTCDATE(), ?, ?, ?)
      `;
      
      sql.query(connectionString, activityQuery, [
        activityId,
        'system_001',
        requestData.CustomerName,
        'Service Request Submitted',
        activityDetails,
        ipAddress,
        userAgent,
        companyCode
      ], (activityErr) => {
        if (activityErr) {
          console.error('Note: Could not log activity (non-critical):', activityErr.message);
        }
      });
      
      console.log(`✅ Service request submitted: ${requestId} from ${requestData.CustomerName}`);
      
      res.json({ 
        success: true, 
        requestId,
        message: 'Your service request has been submitted successfully. We will contact you soon.',
        estimatedResponse: 'within 24 hours'
      });
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
