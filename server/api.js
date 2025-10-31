// SQL Server API for Field Service App
const express = require('express');
const sql = require('mssql'); // Using mssql for Azure SQL
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - Allow all origins and custom headers for frontend communication
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Role', 'X-User-FullName', 'x-user-role', 'x-user-name', 'x-user-id', 'x-user-timezone'],
  exposedHeaders: ['Content-Type', 'Authorization']
}));
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

// SQL Server configuration for Azure SQL
const dbConfig = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true, // Required for Azure SQL
    trustServerCertificate: true, // Allow self-signed certificates for local SQL Server
    enableArithAbort: true
  }
};

// Create connection pool
let pool;

// Connect to SQL Server
async function connectDB() {
  try {
    console.log('Testing SQL Server connection...');
    pool = await sql.connect(dbConfig);
    console.log('✅ Connected to Azure SQL successfully');
  } catch (err) {
    console.error('Database connection failed:', err);
  }
}

// Initialize database connection
connectDB();

// Helper functions
function formatDateForSQL(date) {
  if (!date) return null;
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return null;
  return value.toISOString().slice(0, 19).replace('T', ' ');
}

// Generate sequential ticket ID in format TKT-YYYY-MM-NNN
async function generateTicketID() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `TKT-${year}-${month}-`;
  
  try {
    // Find the highest ticket number for this month
    const result = await pool.request()
      .input('prefix', sql.NVarChar, `${prefix}%`)
      .query('SELECT TOP 1 TicketID FROM Tickets WHERE TicketID LIKE @prefix ORDER BY TicketID DESC');
    
    let nextNumber = 1;
    if (result.recordset && result.recordset.length > 0) {
      // Extract the number from the last ticket (e.g., "TKT-2025-10-004" -> "004")
      const lastTicket = result.recordset[0].TicketID;
      const lastNumber = parseInt(lastTicket.split('-')[3], 10);
      nextNumber = lastNumber + 1;
    }
    
    return `${prefix}${String(nextNumber).padStart(3, '0')}`;
  } catch (err) {
    console.error('Error generating ticket ID:', err);
    // Fallback to timestamp-based ID
    return `TKT-${Date.now()}`;
  }
}

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

// Get all tickets
app.get('/api/tickets', async (req, res) => {
  try {
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
      LEFT JOIN Sites s ON t.Site = s.Name OR t.Site = s.SiteID
      LEFT JOIN Users u ON t.Owner = u.username OR t.Owner = u.fullName
      ORDER BY t.CreatedAt DESC
    `;
    
    const result = await pool.request().query(query);
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

// Get single ticket by ID
app.get('/api/tickets/:id', async (req, res) => {
  try {
    const { id } = req.params;
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
      LEFT JOIN Sites s ON t.Site = s.Name OR t.Site = s.SiteID
      LEFT JOIN Users u ON t.Owner = u.username OR t.Owner = u.fullName
      WHERE t.TicketID = @id
    `;
    
    const result = await pool.request()
      .input('id', sql.NVarChar, id)
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
    const ticketData = req.body;
    
    // Generate sequential ticket ID
    const ticketId = await generateTicketID();
    const now = formatDateForSQL(new Date());
    
    console.log('Creating new ticket:', ticketId);
    
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
      .input('createdAt', sql.DateTime2, now)
      .input('updatedAt', sql.DateTime2, now)
      .query(`
        INSERT INTO Tickets (
          TicketID, Title, Status, Priority, Customer, Site, AssetIDs, Category, Description,
          ScheduledStart, ScheduledEnd, AssignedTo, Owner, SLA_Due, Resolution, ClosedBy, ClosedDate,
          GeoLocation, Tags, CreatedAt, UpdatedAt
        )
        VALUES (
          @ticketId, @title, @status, @priority, @customer, @site, @assetIds, @category, @description,
          @scheduledStart, @scheduledEnd, @assignedTo, @owner, @slaDue, @resolution, @closedBy, @closedDate,
          @geoLocation, @tags, @createdAt, @updatedAt
        )
      `);
    
    // Create activity log entry
    const activityId = `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await pool.request()
      .input('id', sql.NVarChar, activityId)
      .input('userId', sql.NVarChar, 'admin_001')
      .input('username', sql.NVarChar, 'admin')
      .input('action', sql.NVarChar, 'Ticket Created')
      .input('details', sql.NVarChar, `Created new ticket ${ticketId}: ${ticketData.Title || 'Untitled'}`)
      .input('timestamp', sql.DateTime2, new Date())
      .input('ipAddress', sql.NVarChar, '')
      .input('userAgent', sql.NVarChar, '')
      .query(`
        INSERT INTO ActivityLog (ID, UserID, Username, Action, Details, Timestamp, IPAddress, UserAgent)
        VALUES (@id, @userId, @username, @action, @details, @timestamp, @ipAddress, @userAgent)
      `);
    
    console.log(`✅ Created new ticket ${ticketId}`);
    res.json({ message: 'Ticket created successfully', ticketId });
  } catch (err) {
    console.error('Error creating ticket:', err);
    console.error('Error details:', err.message);
    res.status(500).json({ error: 'Failed to create ticket', details: err.message });
  }
});

// Update ticket
app.put('/api/tickets/:id', async (req, res) => {
  try {
    const ticketId = req.params.id;
    const updates = req.body;
    
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
        const { v4: uuidv4 } = require('uuid');
        const username = updates.UpdatedBy || 'system';
        await pool.request()
          .input('id', sql.NVarChar, uuidv4())
          .input('userId', sql.NVarChar, '')
          .input('username', sql.NVarChar, username)
          .input('action', sql.NVarChar, 'Ticket Updated')
          .input('details', sql.NVarChar, `Updated ticket ${ticketId}: ${changeDetails.join(', ')}`)
          .input('timestamp', sql.DateTime2, new Date())
          .input('ipAddress', sql.NVarChar, '')
          .input('userAgent', sql.NVarChar, '')
          .query(`
            INSERT INTO ActivityLog (ID, UserID, Username, Action, Details, Timestamp, IPAddress, UserAgent)
            VALUES (@id, @userId, @username, @action, @details, @timestamp, @ipAddress, @userAgent)
          `);
      } catch (activityErr) {
        console.warn('Could not create ticket update activity log (non-critical):', activityErr.message);
      }
    }
    
    console.log(`✅ Updated ticket ${ticketId}. Changed: ${changeDetails.join(', ')}`);
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
    
    console.log(`✅ Saved ${newEntries.length} new audit entries for ticket ${ticketId}`);
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
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    // Query user by username
    const result = await pool.request()
      .input('username', sql.NVarChar, username)
      .query('SELECT * FROM Users WHERE Username = @username AND IsActive = 1');
    
    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    const user = result.recordset[0];
    
    // Verify password (base64 encoded in database)
    const passwordBase64 = Buffer.from(password).toString('base64');
    
    if (user.PasswordHash !== passwordBase64) {
      return res.status(401).json({ error: 'Invalid username or password' });
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
      companyCode: user.CompanyCode
    };
    
    // Log the login activity
    try {
      const { v4: uuidv4 } = require('uuid');
      await pool.request()
        .input('id', sql.NVarChar, uuidv4())
        .input('userId', sql.NVarChar, user.ID)
        .input('username', sql.NVarChar, user.Username)
        .input('action', sql.NVarChar, 'Login')
        .input('details', sql.NVarChar, `User logged in: ${user.FullName} (${user.Role})`)
        .input('timestamp', sql.DateTime2, new Date())
        .input('ipAddress', sql.NVarChar, req.ip || '')
        .input('userAgent', sql.NVarChar, req.get('user-agent') || '')
        .query(`
          INSERT INTO ActivityLog (ID, UserID, Username, Action, Details, Timestamp, IPAddress, UserAgent)
          VALUES (@id, @userId, @username, @action, @details, @timestamp, @ipAddress, @userAgent)
        `);
    } catch (activityErr) {
      console.warn('Could not create login activity log (non-critical):', activityErr.message);
    }
    
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
      .query('SELECT Username, FullName FROM Users WHERE ID = @userId');
    
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
    
    console.log(`✅ Password reset for user: ${user.Username} (ID: ${userId})`);
    
    // Log the activity
    try {
      const { v4: uuidv4 } = require('uuid');
      await pool.request()
        .input('id', sql.NVarChar, uuidv4())
        .input('userId', sql.NVarChar, '')
        .input('username', sql.NVarChar, 'admin')
        .input('action', sql.NVarChar, 'Password Reset')
        .input('details', sql.NVarChar, `Password reset for user: ${user.FullName} (${user.Username})`)
        .input('timestamp', sql.DateTime2, new Date())
        .input('ipAddress', sql.NVarChar, '')
        .input('userAgent', sql.NVarChar, '')
        .query(`
          INSERT INTO ActivityLog (ID, UserID, Username, Action, Details, Timestamp, IPAddress, UserAgent)
          VALUES (@id, @userId, @username, @action, @details, @timestamp, @ipAddress, @userAgent)
        `);
    } catch (activityErr) {
      console.warn('Could not create password reset activity log (non-critical):', activityErr.message);
    }
    
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
    const { includeInactive } = req.query;
    const query = includeInactive === 'true' 
      ? 'SELECT ID, Username, Email, FullName, Role, Vendor, IsActive, CreatedAt FROM Users ORDER BY FullName'
      : 'SELECT ID, Username, Email, FullName, Role, Vendor, IsActive, CreatedAt FROM Users WHERE IsActive = 1 ORDER BY FullName';
    
    const result = await pool.request().query(query);
    
    // Map to camelCase field names for frontend
    const users = result.recordset.map(user => ({
      id: user.ID,
      username: user.Username,
      email: user.Email,
      fullName: user.FullName,
      role: user.Role,
      vendor: user.Vendor,
      isActive: user.IsActive,
      createdAt: user.CreatedAt
    }));
    
    console.log(`✅ Retrieved ${users.length} users from SQL database`);
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create user
app.post('/api/users', async (req, res) => {
  try {
    const { username, email, fullName, role, vendor, password, isActive } = req.body;
    
    if (!username || !email || !fullName || !role) {
      return res.status(400).json({ error: 'Missing required fields: username, email, fullName, role' });
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
      .input('createdAt', sql.DateTime2, new Date())
      .query(`
        INSERT INTO Users (ID, Username, Email, FullName, Role, Vendor, PasswordHash, IsActive, CreatedAt)
        VALUES (@userId, @username, @email, @fullName, @role, @vendor, @passwordHash, @isActive, @createdAt)
      `);
    
    console.log(`✅ Created new user ${userId}`);
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
    
    console.log(`✅ Updated user ${userId}`);
    res.json({ message: 'User updated successfully' });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Failed to update user', details: err.message });
  }
});

// Get sites
app.get('/api/sites', async (req, res) => {
  try {
    const result = await pool.request()
      .query('SELECT * FROM Sites ORDER BY Name');
    
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
    const result = await pool.request()
      .query('SELECT * FROM Customers ORDER BY Name');
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Get licenses
app.get('/api/licenses', async (req, res) => {
  try {
    const result = await pool.request()
      .query('SELECT * FROM Licenses ORDER BY CreatedAt DESC');
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
    const result = await pool.request()
      .input('id', sql.NVarChar, id)
      .query('SELECT * FROM Licenses WHERE LicenseID = @id');
    
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
      .query(`
        INSERT INTO Licenses (
          LicenseID, Customer, Site, SoftwareName, SoftwareVersion, LicenseType,
          LicenseKey, LicenseCount, UsedCount, ExpirationDate, ServicePlan,
          ServicePlanExpiration, Vendor, PurchaseDate, PurchasePrice, RenewalDate,
          RenewalPrice, ContactEmail, Status, InstallationPath, LastUpdated,
          ComplianceNotes, Notes, CreatedAt, UpdatedAt
        ) VALUES (
          @licenseId, @customer, @site, @softwareName, @softwareVersion, @licenseType,
          @licenseKey, @licenseCount, @usedCount, @expirationDate, @servicePlan,
          @servicePlanExpiration, @vendor, @purchaseDate, @purchasePrice, @renewalDate,
          @renewalPrice, @contactEmail, @status, @installationPath, GETUTCDATE(),
          @complianceNotes, @notes, @createdAt, @updatedAt
        )
      `);
    
    console.log(`✅ Created license ${licenseId} for ${Customer} - ${Site}`);
    res.json({ message: 'License created successfully', licenseId });
  } catch (err) {
    console.error('Error creating license:', err);
    res.status(500).json({ error: 'Failed to create license', details: err.message });
  }
});

// Get vendors
app.get('/api/vendors', async (req, res) => {
  try {
    const result = await pool.request()
      .query('SELECT * FROM Vendors ORDER BY Name');
    
    // Parse JSON fields back to arrays for frontend
    const vendors = result.recordset.map(vendor => ({
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
    const site = req.body;
    const siteID = `SITE-${Date.now()}`;
    
    console.log('📝 Creating site with data:', JSON.stringify(site, null, 2));
    
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
          console.log(`✅ Looked up customer name: ${customerName}`);
        }
      } catch (lookupErr) {
        console.warn('⚠️ Could not lookup customer name:', lookupErr.message);
      }
    }
    
    console.log(`📌 Final values - CustomerID: ${site.CustomerID || site.CustomerId || ''}, Customer: ${customerName}`);
    
    // Make sure to provide empty strings (not null) for optional fields to avoid null constraint errors
    await pool.request()
      .input('SiteID', sql.NVarChar, siteID)
      .input('CustomerID', sql.NVarChar, site.CustomerID || site.CustomerId || '')
      .input('Name', sql.NVarChar, site.Name || site.Site || '')
      .input('Customer', sql.NVarChar, customerName)
      .input('Address', sql.NVarChar, site.Address || '')
      .input('Contact', sql.NVarChar, site.Contact || site.ContactName || '')
      .input('Phone', sql.NVarChar, site.Phone || site.ContactPhone || '')
      .input('GeoLocation', sql.NVarChar, site.GeoLocation || '')
      .input('Notes', sql.NVarChar, site.Notes || '')
      .input('CompanyCode', sql.VarChar, 'DEFAULT')
      .query(`
        INSERT INTO Sites (SiteID, CustomerID, Name, Customer, Address, Contact, Phone, GeoLocation, Notes, CreatedAt, CompanyCode)
        VALUES (@SiteID, @CustomerID, @Name, @Customer, @Address, @Contact, @Phone, @GeoLocation, @Notes, GETDATE(), @CompanyCode)
      `);
    
    // Create activity log entry (skip if ActivityLog has complex required fields or doesn't exist)
    try {
      const activityId = `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await pool.request()
        .input('id', sql.NVarChar, activityId)
        .input('userId', sql.NVarChar, 'system')
        .input('username', sql.NVarChar, 'system')
        .input('action', sql.NVarChar, 'Site Created')
        .input('details', sql.NVarChar, `Created new site: ${site.Name || site.Site || 'unnamed'}`)
        .input('timestamp', sql.DateTime2, new Date())
        .input('ipAddress', sql.NVarChar, '')
        .input('userAgent', sql.NVarChar, '')
        .query(`
          INSERT INTO ActivityLog (ID, UserID, Username, Action, Details, Timestamp, IPAddress, UserAgent)
          VALUES (@id, @userId, @username, @action, @details, @timestamp, @ipAddress, @userAgent)
        `);
    } catch (activityErr) {
      console.warn('Could not create activity log (non-critical):', activityErr && activityErr.message);
    }
    
    console.log(`✅ Created new site ${siteID}`);
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
      .input('CompanyCode', sql.VarChar, 'DEFAULT')
      .query(`
        INSERT INTO Customers (CustomerID, Name, Contact, Phone, Email, Address, Notes, CreatedAt, CompanyCode)
        VALUES (@CustomerID, @Name, @Contact, @Phone, @Email, @Address, @Notes, GETDATE(), @CompanyCode)
      `);
    
    // Log the customer creation activity
    try {
      const { v4: uuidv4 } = require('uuid');
      await pool.request()
        .input('id', sql.NVarChar, uuidv4())
        .input('userId', sql.NVarChar, '')
        .input('username', sql.NVarChar, 'system')
        .input('action', sql.NVarChar, 'Customer Created')
        .input('details', sql.NVarChar, `Created new customer: ${customer.Name}`)
        .input('timestamp', sql.DateTime2, new Date())
        .input('ipAddress', sql.NVarChar, '')
        .input('userAgent', sql.NVarChar, '')
        .query(`
          INSERT INTO ActivityLog (ID, UserID, Username, Action, Details, Timestamp, IPAddress, UserAgent)
          VALUES (@id, @userId, @username, @action, @details, @timestamp, @ipAddress, @userAgent)
        `);
    } catch (activityErr) {
      console.warn('Could not create customer creation activity log (non-critical):', activityErr.message);
    }
    
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
    
    console.log('📝 Updating site:', id, 'with data:', JSON.stringify(site, null, 2));
    
    // Determine customer name - look it up if only CustomerID is provided
    let customerName = site.Customer || '';
    
    if ((site.CustomerID || site.CustomerId) && !customerName) {
      try {
        const customerResult = await pool.request()
          .input('customerID', sql.NVarChar, site.CustomerID || site.CustomerId)
          .query('SELECT Name FROM Customers WHERE CustomerID = @customerID');
        
        if (customerResult.recordset.length > 0) {
          customerName = customerResult.recordset[0].Name;
          console.log(`✅ Looked up customer name: ${customerName}`);
        }
      } catch (lookupErr) {
        console.warn('⚠️ Could not lookup customer name:', lookupErr.message);
      }
    }
    
    await pool.request()
      .input('SiteID', sql.NVarChar, id)
  .input('CustomerID', sql.NVarChar, site.CustomerID || site.CustomerId || '')
  .input('Name', sql.NVarChar, (site.Site && site.Site.trim()) || site.Name || '')
  .input('Customer', sql.NVarChar, customerName)
  .input('Address', sql.NVarChar, site.Address || '')
  .input('Contact', sql.NVarChar, (site.ContactName && site.ContactName.trim()) || site.Contact || '')
  .input('Phone', sql.NVarChar, (site.ContactPhone && site.ContactPhone.trim()) || site.Phone || '')
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
      const { v4: uuidv4 } = require('uuid');
      await pool.request()
        .input('id', sql.NVarChar, uuidv4())
        .input('userId', sql.NVarChar, '')
        .input('username', sql.NVarChar, 'system')
        .input('action', sql.NVarChar, 'Site Updated')
        .input('details', sql.NVarChar, `Updated site: ${site.Name || site.Site || id}`)
        .input('timestamp', sql.DateTime2, new Date())
        .input('ipAddress', sql.NVarChar, '')
        .input('userAgent', sql.NVarChar, '')
        .query(`
          INSERT INTO ActivityLog (ID, UserID, Username, Action, Details, Timestamp, IPAddress, UserAgent)
          VALUES (@id, @userId, @username, @action, @details, @timestamp, @ipAddress, @userAgent)
        `);
    } catch (activityErr) {
      console.warn('Could not create site update activity log (non-critical):', activityErr.message);
    }
    
    console.log('Site updated successfully:', id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating site:', err);
    console.error('Error details:', err.message);
    res.status(500).json({ error: 'Failed to update site', details: err.message });
  }
});

// Update customer
app.put('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const customer = req.body;
    
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
      const { v4: uuidv4 } = require('uuid');
      await pool.request()
        .input('id', sql.NVarChar, uuidv4())
        .input('userId', sql.NVarChar, '')
        .input('username', sql.NVarChar, 'system')
        .input('action', sql.NVarChar, 'Customer Updated')
        .input('details', sql.NVarChar, `Updated customer: ${customer.Name || id}`)
        .input('timestamp', sql.DateTime2, new Date())
        .input('ipAddress', sql.NVarChar, '')
        .input('userAgent', sql.NVarChar, '')
        .query(`
          INSERT INTO ActivityLog (ID, UserID, Username, Action, Details, Timestamp, IPAddress, UserAgent)
          VALUES (@id, @userId, @username, @action, @details, @timestamp, @ipAddress, @userAgent)
        `);
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
    
    console.log('📝 Updating license:', id);
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
    
    console.log('✅ License updated successfully:', id, '- Status set to:', statusValue);
    
    // Return the updated license to confirm changes
    const result = await pool.request()
      .input('LicenseID', sql.NVarChar, id)
      .query('SELECT * FROM Licenses WHERE LicenseID = @LicenseID');
    
    if (result.recordset.length > 0) {
      console.log('✅ Verified license Status in DB:', result.recordset[0].Status);
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

// Delete license
app.delete('/api/licenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const companyCode = req.userCompanyCode;

    console.log('🏗️ Deleting license:', id, 'for company:', companyCode);

    // Delete the license
    await pool.request()
      .input('LicenseID', sql.NVarChar, id)
      .input('CompanyCode', sql.VarChar, companyCode)
      .query('DELETE FROM Licenses WHERE LicenseID = @LicenseID AND CompanyCode = @CompanyCode');

    console.log('✅ License deleted successfully:', id);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error deleting license:', err);
    res.status(500).json({ error: 'Failed to delete license', details: err.message });
  }
});

// Create new vendor
app.post('/api/vendors', async (req, res) => {
  try {
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
      .input('CompanyCode', sql.VarChar, 'DEFAULT')
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

    console.log('🏗️ Deleting vendor:', id, 'for company:', companyCode);

    // Check if vendor has any associated tickets
    const ticketCheck = await pool.request()
      .input('VendorID', sql.NVarChar, id)
      .query('SELECT COUNT(*) as ticketCount FROM Tickets WHERE AssignedTo = @VendorID');

    if (ticketCheck.recordset[0].ticketCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete vendor with associated tickets',
        details: `This vendor has ${ticketCheck.recordset[0].ticketCount} ticket(s). Please reassign or close them first.`
      });
    }

    // Delete the vendor
    await pool.request()
      .input('VendorID', sql.NVarChar, id)
      .input('CompanyCode', sql.VarChar, companyCode)
      .query('DELETE FROM Vendors WHERE VendorID = @VendorID AND CompanyCode = @CompanyCode');

    console.log('✅ Vendor deleted successfully:', id);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error deleting vendor:', err);
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
    
    console.log('Getting service request count for status:', srStatus);
    
    const result = await pool.request()
      .input('status', sql.NVarChar, srStatus)
      .query('SELECT COUNT(*) as count FROM ServiceRequests WHERE Status = @status');
    
    res.json({ count: result.recordset[0].count });
  } catch (err) {
    console.error('Error fetching service request count:', err);
    res.status(500).json({ error: 'Failed to fetch count', details: err.message });
  }
});

// Get activity log with optional filters
app.get('/api/activity-log', async (req, res) => {
  try {
    const { search, hours = 8, userId, action } = req.query;
    const filters = [];
    const request = pool.request();
    
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
    
    console.log('Activity log query filters:', { search, hours, userId, action });
    
    const result = await request.query(query);
    
    console.log(`✅ Retrieved ${result.recordset.length} activity log entries`);
    
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

// Get service requests by status
app.get('/api/service-requests', async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM ServiceRequests';
    const request = pool.request();
    
    if (status) {
      query += ' WHERE Status = @status';
      request.input('status', sql.NVarChar, status);
    }
    
    query += ' ORDER BY SubmittedAt DESC';
    
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
    
    // Generate a ticket ID
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const dateStamp = `${year}-${month}`;
    
    // Get the count of tickets this month
    const countResult = await pool.request()
      .query(`SELECT COUNT(*) as count FROM Tickets WHERE TicketID LIKE 'TKT-${dateStamp}-%'`);
    
    const nextNum = String(countResult.recordset[0].count + 1).padStart(3, '0');
    const ticketID = `TKT-${dateStamp}-${nextNum}`;
    
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
      .input('companyCode', sql.NVarChar, sr.CompanyCode || 'DEFAULT')
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
    
    // Log activity
    const activityId = `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await pool.request()
      .input('id', sql.NVarChar, activityId)
      .input('userId', sql.NVarChar, 'admin_001')
      .input('username', sql.NVarChar, fullName)
      .input('action', sql.NVarChar, 'Service Request Dismissed')
      .input('details', sql.NVarChar, `Service Request Dismissed: ${id}\nCustomer: ${sr.CustomerName}\nPriority: ${sr.Priority}\nDismissed By: ${fullName}`)
      .input('timestamp', sql.DateTime2, new Date())
      .input('ipAddress', sql.NVarChar, '')
      .input('userAgent', sql.NVarChar, '')
      .query(`
        INSERT INTO ActivityLog (ID, UserID, Username, Action, Details, Timestamp, IPAddress, UserAgent)
        VALUES (@id, @userId, @username, @action, @details, @timestamp, @ipAddress, @userAgent)
      `);
    
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
    
    console.log(`✅ Added coordinator note to ticket ${ticketId}`);
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

    console.log('📎 Attachment upload attempt:', {
      ticketId,
      uploadedBy,
      fileName: file?.originalname,
      headers: {
        'x-user-id': req.headers['x-user-id'],
        'x-user-fullname': req.headers['x-user-fullname']
      }
    });

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!uploadedBy || uploadedBy === 'unknown' || uploadedBy === '') {
      console.error('❌ Missing user ID in request headers');
      return res.status(400).json({ 
        error: 'User ID required', 
        details: 'Please ensure you are logged in. Missing x-user-id header.' 
      });
    }

    // Build attachment metadata
    const attachmentId = `ATT-${Date.now()}-${Math.random().toString(36).substr(2,8)}`;
    const filePath = path.relative(__dirname, file.path).replace(/\\/g, '/');

    // Try insert into Attachments table if it exists
    try {
      const tableCheck = await pool.request().query(`SELECT COUNT(*) as tableExists FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Attachments'`);
      if (tableCheck.recordset[0].tableExists > 0) {
        // Verify user exists
        const userCheck = await pool.request()
          .input('userId', sql.NVarChar, uploadedBy)
          .query(`SELECT ID FROM Users WHERE ID = @userId`);
        
        if (userCheck.recordset.length === 0) {
          console.error(`❌ User ${uploadedBy} not found in Users table`);
          return res.status(400).json({ 
            error: 'Invalid user', 
            details: `User ID "${uploadedBy}" not found in database` 
          });
        }

        // Get CompanyCode - default to 'DCPSP' for now (single-tenant mode)
        const companyCode = req.headers['x-company-code'] || 'DCPSP';

        await pool.request()
          .input('attachmentId', sql.NVarChar, attachmentId)
          .input('ticketId', sql.NVarChar, ticketId)
          .input('fileName', sql.NVarChar, file.filename)
          .input('originalFileName', sql.NVarChar, file.originalname)
          .input('fileType', sql.NVarChar, file.mimetype)
          .input('fileSize', sql.Int, file.size)
          .input('filePath', sql.NVarChar, filePath)
          .input('uploadedBy', sql.NVarChar, uploadedBy)
          .input('description', sql.NVarChar, description)
          .input('companyCode', sql.VarChar, companyCode)
          .query(`
            INSERT INTO Attachments (AttachmentID, TicketID, FileName, OriginalFileName, FileType, FileSize, FilePath, UploadedBy, Description, UploadedAt, CompanyCode)
            VALUES (@attachmentId, @ticketId, @fileName, @originalFileName, @fileType, @fileSize, @filePath, @uploadedBy, @description, GETDATE(), @companyCode)
          `);
        
        console.log(`✅ Uploaded attachment ${attachmentId} for ticket ${ticketId} by user ${uploadedBy}`);
      } else {
        console.warn('⚠️ Attachments table does not exist');
        return res.status(500).json({ 
          error: 'Attachments not configured', 
          details: 'Attachments table missing in database' 
        });
      }
    } catch (dbErr) {
      console.error('❌ Database error during attachment insert:', dbErr);
      return res.status(500).json({ 
        error: 'Database error', 
        details: dbErr.message 
      });
    }

    res.json({ success: true, attachment: { id: attachmentId, fileName: file.filename, originalName: file.originalname } });
  } catch (err) {
    console.error('❌ Error uploading attachment:', err);
    res.status(500).json({ error: 'Failed to upload attachment', details: err.message });
  }
});

// Get single attachment
app.get('/api/attachments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query('SELECT * FROM Attachments WHERE AttachmentID = @id');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Attachment not found' });
    }
    
    res.json(result.recordset[0]);
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
      .input('id', sql.Int, parseInt(id))
      .query('DELETE FROM Attachments WHERE AttachmentID = @id');
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting attachment:', err);
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Field Service API running on http://localhost:${PORT}`);
  console.log(`📊 Database: Azure SQL - ${process.env.DB_SERVER}/${process.env.DB_NAME}`);
  console.log(`🔧 Test the API: http://localhost:${PORT}/api/test`);
});