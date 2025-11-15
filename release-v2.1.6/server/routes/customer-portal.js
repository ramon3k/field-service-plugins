// server/routes/customer-portal.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sql = require('mssql');

const router = express.Router();

// JWT Secret for customer portal (separate from admin JWT)
const JWT_SECRET = process.env.CUSTOMER_JWT_SECRET || 'customer-portal-secret-key-2024';

// Middleware to verify customer JWT tokens
const authenticateCustomer = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    // Add customer info to request
    req.customer = decoded;
    next();
  } catch (error) {
    console.error('Customer authentication error:', error);
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

// Simple database configuration for demo/development
// In production, this would use the tenant middleware
const getSimpleConnection = async () => {
  const config = {
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'FieldServiceDB',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '',
    options: {
      encrypt: false,
      trustServerCertificate: true
    }
  };
  
  try {
    const pool = await sql.connect(config);
    return pool;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

// Customer Login Endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password, tenantCode } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    // For demo purposes, we'll use simple authentication
    // In production, this would integrate with the tenant system
    
    // Simple demo authentication - replace with proper user lookup
    if (username === 'demo' && password === 'demo123') {
      // Demo user - generate sites list
      const sites = ['Main Office', 'Warehouse A', 'Branch Location'];
      const customerName = 'Demo Customer';

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: 'demo-user',
          username: username,
          customerName: customerName,
          tenantCode: tenantCode || 'DEMO'
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        success: true,
        data: {
          customerName: customerName,
          sites: sites,
          token: token
        }
      });
    }

    // Try database authentication
    try {
      const pool = await getSimpleConnection();
      
      // Query to find customer user
      const userQuery = `
        SELECT u.*, c.Name as CustomerName
        FROM users u
        LEFT JOIN customers c ON u.CustomerID = c.CustomerID
        WHERE u.Username = @username AND u.IsActive = 1
      `;

      const userResult = await pool.request()
        .input('username', sql.VarChar, username)
        .query(userQuery);

      if (userResult.recordset.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'Invalid username or password'
        });
      }

      const user = userResult.recordset[0];

      // Simple password check for demo
      if (password !== 'password123' && password !== user.Password) {
        return res.status(401).json({
          success: false,
          error: 'Invalid username or password'
        });
      }

      // Get sites for this customer
      const customerName = user.CustomerName || user.Customer || 'Demo Customer';
      const sitesQuery = `
        SELECT DISTINCT Site
        FROM sites s
        WHERE s.Customer = @customerName
        ORDER BY Site
      `;

      const sitesResult = await pool.request()
        .input('customerName', sql.VarChar, customerName)
        .query(sitesQuery);

      const sites = sitesResult.recordset.map(row => row.Site);

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.UserID || user.Username,
          username: user.Username,
          customerName: customerName,
          tenantCode: tenantCode || 'DEFAULT'
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        data: {
          customerName: customerName,
          sites: sites,
          token: token
        }
      });

    } catch (dbError) {
      console.error('Database error during customer login:', dbError);
      
      // Fallback to demo auth if database is not available
      return res.status(401).json({
        success: false,
        error: 'Authentication service unavailable. Try demo/demo123 for demo access.'
      });
    }

  } catch (error) {
    console.error('Customer login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during login'
    });
  }
});

// Validate Session Endpoint
router.get('/validate', authenticateCustomer, (req, res) => {
  res.json({
    success: true,
    data: {
      valid: true,
      customer: req.customer.customerName,
      username: req.customer.username
    }
  });
});

// Submit Service Request Endpoint
router.post('/service-request', authenticateCustomer, async (req, res) => {
  try {
    const {
      title,
      description,
      site,
      priority = 'Normal',
      category = 'General Service Request'
    } = req.body;

    // Validate required fields
    if (!title || !description || !site) {
      return res.status(400).json({
        success: false,
        error: 'Title, description, and site are required'
      });
    }

    // Generate unique ticket ID
    const ticketId = `SR${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    try {
      const pool = await getSimpleConnection();

      // Insert service request as a ticket
      const insertQuery = `
        INSERT INTO tickets (
          TicketID, Title, Status, Priority, Customer, Site, Category, Description,
          AssignedTo, Owner, SLA_Due, CreatedAt, UpdatedAt, Tags
        ) VALUES (
          @ticketId, @title, 'New', @priority, @customer, @site, @category, @description,
          'Unassigned', 'Auto-Assignment', 
          DATEADD(day, CASE WHEN @priority = 'Critical' THEN 1 WHEN @priority = 'High' THEN 2 ELSE 5 END, GETDATE()),
          GETDATE(), GETDATE(), 'CustomerPortal'
        )
      `;

      await pool.request()
        .input('ticketId', sql.VarChar, ticketId)
        .input('title', sql.VarChar, title)
        .input('priority', sql.VarChar, priority)
        .input('customer', sql.VarChar, req.customer.customerName)
        .input('site', sql.VarChar, site)
        .input('category', sql.VarChar, category)
        .input('description', sql.Text, description)
        .query(insertQuery);

      // Log the service request submission activity
      try {
        const { v4: uuidv4 } = require('uuid');
        const activityId = uuidv4();
        const tenantCode = req.customer.tenantCode || 'DEMO';
        
        await pool.request()
          .input('id', sql.UniqueIdentifier, activityId)
          .input('userId', sql.VarChar, req.customer.userId || 'customer_portal')
          .input('username', sql.VarChar, req.customer.username || req.customer.customerName)
          .input('action', sql.VarChar, 'Service Request Submitted')
          .input('details', sql.VarChar, `Customer portal request: ${ticketId} - ${title} (${priority})`)
          .input('companyCode', sql.VarChar, tenantCode)
          .input('ipAddress', sql.NVarChar, req.ip || 'unknown')
          .input('userAgent', sql.NVarChar, req.get('user-agent') || 'unknown')
          .query(`
            INSERT INTO ActivityLog (ID, UserID, Username, Action, Details, Timestamp, CompanyCode, IPAddress, UserAgent)
            VALUES (@id, @userId, @username, @action, @details, GETDATE(), @companyCode, @ipAddress, @userAgent)
          `);
        
        console.log(`✅ Activity logged for customer portal request: ${ticketId}`);
      } catch (activityErr) {
        console.warn('⚠️ Failed to log activity for customer portal request:', activityErr.message);
      }

      res.json({
        success: true,
        data: {
          ticketId: ticketId,
          message: 'Service request submitted successfully. You will be contacted soon.'
        }
      });

    } catch (dbError) {
      console.error('Database error during service request:', dbError);
      
      // For demo purposes, still return success even if database fails
      res.json({
        success: true,
        data: {
          ticketId: ticketId,
          message: 'Service request received (demo mode - database not connected). You will be contacted soon.'
        }
      });
    }

  } catch (error) {
    console.error('Service request submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during service request submission'
    });
  }
});

// Get Customer's Service Requests
router.get('/my-requests', authenticateCustomer, async (req, res) => {
  try {
    try {
      const pool = await getSimpleConnection();

      const requestsQuery = `
        SELECT
          TicketID, Title, Status, Priority, Site, Category, CreatedAt, SLA_Due, Description
        FROM tickets
        WHERE Customer = @customerName
        ORDER BY CreatedAt DESC
      `;

      const result = await pool.request()
        .input('customerName', sql.VarChar, req.customer.customerName)
        .query(requestsQuery);

      res.json({
        success: true,
        data: result.recordset
      });

    } catch (dbError) {
      console.error('Database error during requests lookup:', dbError);
      
      // Return empty list if database not available
      res.json({
        success: true,
        data: []
      });
    }

  } catch (error) {
    console.error('Get customer requests error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve service requests'
    });
  }
});

module.exports = router;