# Plugin Developer Guide - Field Service System

## Overview
This guide shows you how to build plugins for the Field Service Management system. Plugins can add custom functionality, new pages, database tables, and API endpoints while integrating seamlessly with the core application.

## Quick Start

### Plugin Structure
A complete plugin has this folder structure:
```
your-plugin/
├── plugin.json          # Plugin metadata (required)
├── index.js            # Backend logic and routes (required)
├── frontend/           # Frontend components (optional)
│   └── YourComponent.tsx
└── README.md           # Documentation (recommended)
```

### Minimum Required Files

**1. `plugin.json`** - Plugin metadata
```json
{
  "id": "your-plugin",
  "name": "your-plugin",
  "displayName": "Your Plugin Name",
  "version": "1.0.0",
  "description": "Description of what your plugin does",
  "author": "Your Company",
  "main": "index.js",
  "permissions": [],
  "dependencies": []
}
```

**2. `index.js`** - Main plugin file
```javascript
module.exports = {
  id: 'your-plugin',
  name: 'your-plugin',
  version: '1.0.0',
  
  // Lifecycle hooks
  async onInstall(context) {
    // Runs once when plugin is installed
    const pool = context.pool || context.app.locals.pool;
    console.log('[Your Plugin] Installing...');
    
    // Create your custom tables here
  },
  
  async onEnable(context) {
    // Runs every time plugin is enabled
    const pool = context.pool || context.app.locals.pool;
    console.log('[Your Plugin] Enabled');
  },
  
  async onUninstall(context) {
    // Cleanup when plugin is uninstalled
    const pool = context.pool || context.app.locals.pool;
    console.log('[Your Plugin] Uninstalling...');
    
    // Drop your custom tables here
  },
  
  // API routes
  routes: [],
  
  // Navigation tabs (optional)
  navTabs: []
};
```

## Core Concepts

### 1. Plugin Lifecycle

Plugins have three lifecycle hooks that you can implement:

#### `onInstall(context)`
- Called **once** when the plugin is first installed
- Use this to create database tables
- Context includes: `pool` (database connection), `app` (Express app)

#### `onEnable(context)`
- Called every time the plugin is enabled (including after installation)
- Use this to add missing columns to existing tables
- Good for migrations/upgrades

#### `onUninstall(context)`  
- Called when the plugin is uninstalled
- Use this to clean up database tables
- **Important:** Drop tables in correct order to avoid foreign key errors

### 2. Company Code Isolation

**Every plugin MUST respect company code isolation!** This system supports multiple companies in one database.

#### Always include CompanyCode in your tables:
```javascript
await pool.request().query(`
  CREATE TABLE YourTable (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    CompanyCode NVARCHAR(50) NOT NULL,
    YourData NVARCHAR(255),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
  );
  CREATE INDEX IX_YourTable_CompanyCode ON YourTable(CompanyCode);
`);
```

#### Always filter by CompanyCode in queries:
```javascript
const companyCode = req.headers['x-company-code'];

const result = await pool.request()
  .input('CompanyCode', companyCode)
  .query('SELECT * FROM YourTable WHERE CompanyCode = @CompanyCode');
```

### 3. API Routes

Add custom REST API endpoints to your plugin:

```javascript
routes: [
  {
    method: 'GET',
    path: '/data',
    handler: async (req, res) => {
      const pool = req.pool || req.app.locals.pool;
      const companyCode = req.headers['x-company-code'];
      const userName = req.headers['x-user-name'];
      
      try {
        const result = await pool.request()
          .input('CompanyCode', companyCode)
          .query('SELECT * FROM YourTable WHERE CompanyCode = @CompanyCode');
        
        res.json({ data: result.recordset });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch data' });
      }
    }
  },
  
  {
    method: 'POST',
    path: '/data',
    handler: async (req, res) => {
      const pool = req.pool || req.app.locals.pool;
      const companyCode = req.headers['x-company-code'];
      const userName = req.headers['x-user-name'];
      const { yourField } = req.body;
      
      try {
        await pool.request()
          .input('CompanyCode', companyCode)
          .input('YourField', yourField)
          .input('CreatedBy', userName)
          .query(`
            INSERT INTO YourTable (CompanyCode, YourField, CreatedBy)
            VALUES (@CompanyCode, @YourField, @CreatedBy)
          `);
        
        res.json({ success: true });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to save data' });
      }
    }
  }
]
```

**Your routes will be accessible at:** `/api/plugins/your-plugin/data`

### 4. Navigation Tabs

Add a new tab to the main navigation bar:

```javascript
navTabs: [
  {
    id: 'your-feature',
    label: 'Your Feature',
    icon: '📊',
    componentId: 'your-component-page',
    roles: ['Admin', 'SystemAdmin', 'Coordinator', 'Technician']
  }
]
```

**Important:**
- `componentId` must match your frontend component filename (see Frontend Components below)
- `roles` array controls who can see the tab
- Omit `roles` to make the tab visible to everyone

### 5. Frontend Components

#### Component Naming Convention

Your frontend component file must follow this naming pattern:

**Filename:** `YourComponent.tsx` (PascalCase)  
**Auto-generated componentId:** `your-component-page` (kebab-case + `-page`)

**Example:**
- File: `SpmHub.tsx` → componentId: `spm-hub-page`
- File: `InstantMessenger.tsx` → componentId: `instant-messenger-page`
- File: `DailyReport.tsx` → componentId: `daily-report-page`

#### Component Structure

Create your component in `frontend/YourComponent.tsx`:

```typescript
import React, { useState, useEffect } from 'react';

interface YourComponentProps {
  currentUser: any;
  companyCode: string;
  pluginId: string;
  componentId: string;
}

export default function YourComponent({ 
  currentUser, 
  companyCode, 
  pluginId 
}: YourComponentProps) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const userName = currentUser?.username || currentUser?.fullName || 'User';

  useEffect(() => {
    loadData();
  }, [companyCode]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/plugins/${pluginId}/data`, {
        headers: {
          'x-company-code': companyCode,
          'x-user-name': userName
        }
      });
      const result = await response.json();
      setData(result.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <h1>Your Feature</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
          {/* Your UI here */}
        </div>
      )}
    </div>
  );
}
```

#### Installing Components

Place your frontend component in:
```
server/plugins/your-plugin/frontend/YourComponent.tsx
```

After uploading the plugin, copy the component file to:
```
src/components/plugins/YourComponent.tsx
```

The system will automatically discover and register it based on the filename!

## Database Schema

### Core Tables You Can Reference

The system includes these core tables available for your plugins:

## Database Schema

### Core Tables Available for Plugin Integration

#### Users Table
```sql
CREATE TABLE Users (
    ID NVARCHAR(50) PRIMARY KEY,
    Username NVARCHAR(50) NOT NULL UNIQUE,
    Email NVARCHAR(100) NOT NULL,
    FullName NVARCHAR(100) NOT NULL,
    Role NVARCHAR(20) NOT NULL CHECK (Role IN ('Admin', 'Coordinator', 'Technician')),
    PasswordHash NVARCHAR(255) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    Permissions NVARCHAR(MAX) -- JSON array of permissions
);
```
**Plugin Integration**: Use for user authentication, role-based features, activity tracking

#### Customers Table
```sql
CREATE TABLE Customers (
    CustomerID NVARCHAR(50) PRIMARY KEY,
    Name NVARCHAR(200) NOT NULL,
    Contact NVARCHAR(100),
    Phone NVARCHAR(20),
    Email NVARCHAR(100),
    Address NVARCHAR(500),
    Notes NVARCHAR(MAX),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
);
```
**Plugin Integration**: Reference for customer-specific features, contact information

#### Sites Table
```sql
CREATE TABLE Sites (
    SiteID NVARCHAR(50) PRIMARY KEY,
    CustomerID NVARCHAR(50) NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    Address NVARCHAR(500),
    Contact NVARCHAR(100),
    Phone NVARCHAR(20),
    GeoLocation NVARCHAR(50), -- "lat,lng" format
    Notes NVARCHAR(MAX),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID)
);
```
**Plugin Integration**: Location-based features, site-specific data, mapping

#### Assets Table
```sql
CREATE TABLE Assets (
    AssetID NVARCHAR(50) PRIMARY KEY,
    SiteID NVARCHAR(50) NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    Type NVARCHAR(100),
    Model NVARCHAR(100),
    SerialNumber NVARCHAR(100),
    InstallDate DATE,
    WarrantyExpiration DATE,
    Status NVARCHAR(50) DEFAULT 'Active',
    Notes NVARCHAR(MAX),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (SiteID) REFERENCES Sites(SiteID)
);
```
**Plugin Integration**: Asset tracking, maintenance scheduling, equipment history

#### Tickets Table (Main Workflow)
```sql
CREATE TABLE Tickets (
    TicketID NVARCHAR(50) PRIMARY KEY,
    Title NVARCHAR(300) NOT NULL,
    Status NVARCHAR(50) NOT NULL DEFAULT 'New', -- 'New', 'Scheduled', 'In-Progress', 'On-Hold', 'Complete', 'Closed'
    Priority NVARCHAR(20) NOT NULL DEFAULT 'Normal', -- 'Low', 'Normal', 'High', 'Critical'
    Customer NVARCHAR(200) NOT NULL,
    Site NVARCHAR(200) NOT NULL,
    AssetIDs NVARCHAR(MAX), -- Comma-separated asset IDs
    Category NVARCHAR(100),
    Description NVARCHAR(MAX) NOT NULL,
    ScheduledStart DATETIME2,
    ScheduledEnd DATETIME2,
    AssignedTo NVARCHAR(200),
    Owner NVARCHAR(100) DEFAULT 'Operations Coordinator',
    SLA_Due DATETIME2,
    Resolution NVARCHAR(MAX),
    ClosedBy NVARCHAR(100),
    ClosedDate DATETIME2,
    GeoLocation NVARCHAR(50), -- "lat,lng" format
    Tags NVARCHAR(500), -- Comma-separated tags
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
);
```
**Plugin Integration**: Main workflow integration, task management, scheduling

#### Vendors Table
```sql
CREATE TABLE Vendors (
    VendorID NVARCHAR(50) PRIMARY KEY,
    Name NVARCHAR(200) NOT NULL,
    Contact NVARCHAR(100),
    Phone NVARCHAR(20),
    Email NVARCHAR(100),
    ServiceAreas NVARCHAR(MAX), -- JSON array
    Specialties NVARCHAR(MAX), -- JSON array
    Rating DECIMAL(3,2),
    ServicesTexas BIT DEFAULT 0,
    Notes NVARCHAR(MAX),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
);
```
**Plugin Integration**: Vendor management, contractor assignment, service area filtering

#### Activity/Audit Tables
```sql
CREATE TABLE CoordinatorNotes (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    TicketID NVARCHAR(50) NOT NULL,
    Note NVARCHAR(MAX) NOT NULL,
    CreatedBy NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (TicketID) REFERENCES Tickets(TicketID)
);

CREATE TABLE AuditTrail (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    TicketID NVARCHAR(50) NOT NULL,
    AuditID NVARCHAR(50) NOT NULL,
    Timestamp DATETIME2 NOT NULL,
    UserName NVARCHAR(100) NOT NULL,
    Action NVARCHAR(200) NOT NULL,
    Field NVARCHAR(100),
    OldValue NVARCHAR(MAX),
    NewValue NVARCHAR(MAX),
    Notes NVARCHAR(MAX),
    FOREIGN KEY (TicketID) REFERENCES Tickets(TicketID)
);
```
**Plugin Integration**: Activity logging, change tracking, communication history

## Available API Endpoints

### Authentication & User Management
- `GET /api/users` - Get all users
- User context automatically included in headers (`x-user-id`, `x-user-role`, `x-company-code`)

### Tickets & Workflow
- `GET /api/tickets` - Get all tickets
- `GET /api/tickets/:id` - Get specific ticket
- `DELETE /api/tickets/:id` - Delete ticket
- Tickets include embedded `CoordinatorNotes` and `AuditTrail`

### Customer & Site Management
- `GET /api/customers` - Get all customers
- `GET /api/sites` - Get all sites
- `DELETE /api/sites/:id` - Delete site

### Asset Management
- Assets are referenced in tickets via `AssetIDs` field
- Site relationships maintained through foreign keys

### Vendor Management
- `GET /api/vendors` - Get all vendors
- `DELETE /api/vendors/:id` - Delete vendor

### License Management (Existing Business Logic)
- `GET /api/licenses` - Get all licenses
- `GET /api/licenses/:id` - Get specific license
- `GET /api/licenses/site/:customer/:site` - Get licenses by site
- `DELETE /api/licenses/:id` - Delete license

### Activity & Logging
- `GET /api/activity-log` - Get activity log entries

## Multi-Tenant Support

### Company Code Isolation
All API requests automatically include `x-company-code` header for data isolation. The system supports:
- Company-specific data separation
- Automatic company context in all operations
- User-company relationships

### Headers Automatically Included
```typescript
headers: {
  'x-user-id': 'current-user-id',
  'x-user-name': 'current-user-name', 
  'x-user-role': 'Admin|Coordinator|Technician',
  'x-company-code': 'company-identifier',
  'x-company-name': 'company-display-name'
}
```

## Plugin Development Best Practices

### 1. Leverage Existing Resources First
- **Before creating new tables**: Check if existing tables can store your data
- **Before creating new APIs**: Check if existing endpoints can be extended
- **Use existing relationships**: CustomerID → SiteID → AssetID hierarchy

### 2. Integration Patterns

#### Example: Asset Monitoring Plugin
```typescript
// ✅ GOOD: Use existing assets table
const assets = await fetch('/api/sites').then(r => r.json())
const assetIds = assets.flatMap(site => site.assets || [])

// ❌ AVOID: Creating new asset table
// CREATE TABLE PluginAssets (...)
```

#### Example: Communication Plugin
```typescript
// ✅ GOOD: Extend existing ticket communication
const ticket = await fetch(`/api/tickets/${ticketId}`).then(r => r.json())
const notes = ticket.CoordinatorNotes || []

// ✅ GOOD: Use existing user context
headers['x-user-id'] // Available automatically
headers['x-company-code'] // Available automatically
```

### 3. Data Storage Strategies

#### Extend Existing Tables
```sql
-- Add plugin-specific columns to existing tables
ALTER TABLE Sites ADD PluginData NVARCHAR(MAX) -- JSON for plugin-specific data
ALTER TABLE Tickets ADD PluginFlags NVARCHAR(500) -- Plugin-specific flags
```

#### Use JSON Fields for Plugin Data
```sql
-- Store plugin configuration in existing JSON fields
UPDATE Sites SET Notes = JSON_MODIFY(Notes, '$.pluginConfig', @pluginData)
UPDATE Tickets SET Tags = Tags + ',plugin:feature-name'
```

#### Reference Existing IDs
```sql
-- Create plugin tables that reference existing entities
CREATE TABLE PluginUserPreferences (
    UserID NVARCHAR(50) NOT NULL, -- References Users.ID
    PluginName NVARCHAR(100) NOT NULL,
    Settings NVARCHAR(MAX), -- JSON configuration
    FOREIGN KEY (UserID) REFERENCES Users(ID)
)
```

### 4. Plugin Architecture Guidelines

#### Self-Contained Plugins
- Plugin files should include all necessary frontend components
- Minimal core application modifications
- Plugin-specific API endpoints prefixed: `/api/plugins/{plugin-name}/`

#### Use Existing UI Patterns
- Follow existing React component patterns
- Use existing styling and themes
- Integrate with existing navigation

#### Company-Aware Development
- All plugin data must respect `x-company-code` isolation
- Test with multiple company codes
- Handle company switching gracefully

## Common Integration Scenarios

### 1. User Activity Tracking
```typescript
// Use existing user context and audit trail patterns
const logActivity = async (action: string, details: any) => {
  const response = await fetch('/api/audit-trail', {
    method: 'POST',
    headers: buildHeaders('application/json'),
    body: JSON.stringify({
      action: `plugin:${pluginName}:${action}`,
      details: JSON.stringify(details)
    })
  })
}
```

### 2. Site-Specific Features
```typescript
// Leverage existing site data
const sites = await fetch('/api/sites').then(r => r.json())
const siteData = sites.find(s => s.SiteID === targetSiteId)
// Use siteData.GeoLocation, siteData.Contact, etc.
```

### 3. Customer Integration
```typescript
// Reference existing customer relationships
const customers = await fetch('/api/customers').then(r => r.json()) 
const customer = customers.find(c => c.CustomerID === targetCustomerId)
// Use customer.Contact, customer.Email for notifications
```

### 4. Ticket Workflow Integration
```typescript
// Extend existing ticket workflow
const tickets = await fetch('/api/tickets').then(r => r.json())
const activeTickets = tickets.filter(t => ['New', 'Scheduled', 'In-Progress'].includes(t.Status))
// Plugin can add workflow steps, notifications, etc.
```

## Complete Working Example

Here's a minimal but complete plugin that demonstrates all the key concepts:

### Directory Structure
```
my-tracker-plugin/
├── plugin.json
├── index.js
├── frontend/
│   └── TrackerPage.tsx
└── README.md
```

### plugin.json
```json
{
  "id": "tracker-plugin",
  "name": "tracker-plugin",
  "displayName": "Item Tracker",
  "version": "1.0.0",
  "description": "Track custom items with status updates",
  "author": "Your Company",
  "main": "index.js"
}
```

### index.js
```javascript
module.exports = {
  id: 'tracker-plugin',
  name: 'tracker-plugin',
  version: '1.0.0',
  
  async onInstall(context) {
    const pool = context.pool || context.app.locals.pool;
    
    await pool.request().query(`
      CREATE TABLE TrackerItems (
        ItemID INT IDENTITY(1,1) PRIMARY KEY,
        CompanyCode NVARCHAR(50) NOT NULL,
        ItemName NVARCHAR(255) NOT NULL,
        Status NVARCHAR(50) DEFAULT 'Active',
        CreatedBy NVARCHAR(100),
        CreatedAt DATETIME2 DEFAULT GETDATE()
      );
      CREATE INDEX IX_TrackerItems_CompanyCode ON TrackerItems(CompanyCode);
    `);
    
    console.log('[Tracker] Plugin installed');
  },
  
  async onUninstall(context) {
    const pool = context.pool || context.app.locals.pool;
    await pool.request().query('DROP TABLE IF EXISTS TrackerItems');
    console.log('[Tracker] Plugin uninstalled');
  },
  
  routes: [
    {
      method: 'GET',
      path: '/items',
      handler: async (req, res) => {
        const pool = req.pool || req.app.locals.pool;
        const companyCode = req.headers['x-company-code'];
        
        const result = await pool.request()
          .input('CompanyCode', companyCode)
          .query('SELECT * FROM TrackerItems WHERE CompanyCode = @CompanyCode');
        
        res.json({ items: result.recordset });
      }
    },
    
    {
      method: 'POST',
      path: '/items',
      handler: async (req, res) => {
        const pool = req.pool || req.app.locals.pool;
        const companyCode = req.headers['x-company-code'];
        const userName = req.headers['x-user-name'];
        const { itemName, status } = req.body;
        
        await pool.request()
          .input('CompanyCode', companyCode)
          .input('ItemName', itemName)
          .input('Status', status)
          .input('CreatedBy', userName)
          .query(`
            INSERT INTO TrackerItems (CompanyCode, ItemName, Status, CreatedBy)
            VALUES (@CompanyCode, @ItemName, @Status, @CreatedBy)
          `);
        
        res.json({ success: true });
      }
    }
  ],
  
  navTabs: [
    {
      id: 'tracker-main',
      label: 'Tracker',
      icon: '📋',
      componentId: 'tracker-page-page',
      roles: ['Admin', 'Coordinator']
    }
  ]
};
```

### frontend/TrackerPage.tsx
```typescript
import React, { useState, useEffect } from 'react';

export default function TrackerPage({ currentUser, companyCode, pluginId }) {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    loadItems();
  }, [companyCode]);

  const loadItems = async () => {
    const response = await fetch(`/api/plugins/${pluginId}/items`, {
      headers: {
        'x-company-code': companyCode,
        'x-user-name': currentUser?.fullName || 'User'
      }
    });
    const data = await response.json();
    setItems(data.items || []);
  };

  const addItem = async () => {
    await fetch(`/api/plugins/${pluginId}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-company-code': companyCode,
        'x-user-name': currentUser?.fullName || 'User'
      },
      body: JSON.stringify({ itemName: newItem, status: 'Active' })
    });
    
    setNewItem('');
    loadItems();
  };

  return (
    <div style={{ padding: '24px' }}>
      <h1>Item Tracker</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <input 
          value={newItem} 
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="New item name"
        />
        <button onClick={addItem}>Add Item</button>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Status</th>
            <th>Created By</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.ItemID}>
              <td>{item.ItemName}</td>
              <td>{item.Status}</td>
              <td>{item.CreatedBy}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## Packaging Your Plugin

### 1. Create Package Structure

Your plugin ZIP must have this structure:
```
plugin-name.zip
├── plugin.json
├── index.js
├── frontend/
│   └── YourComponent.tsx
└── README.md
```

### 2. Create the ZIP File

**Using PowerShell:**
```powershell
Compress-Archive -Path .\your-plugin\* -DestinationPath .\your-plugin.zip
```

**Using Command Prompt:**
```cmd
powershell -command "Compress-Archive -Path .\your-plugin\* -DestinationPath .\your-plugin.zip"
```

**Using 7-Zip or WinRAR:**
- Right-click the plugin folder
- Select "Add to archive" or "Compress to ZIP"

### 3. Install the Plugin

1. Open the Field Service application
2. Navigate to the **Plugins** tab
3. Click **Upload Plugin**
4. Select your ZIP file
5. Click **Install**
6. After installation, manually copy `frontend/YourComponent.tsx` to `src/components/plugins/YourComponent.tsx`
7. Rebuild the frontend if needed
8. Enable the plugin

## Development Tips

### Use Hot Reload for Development

Run `PLUGIN-DEV-MODE.bat` to enable automatic reloading:
- Edit your plugin files in `server/plugins/your-plugin/`
- Server automatically restarts when files change
- Refresh browser to see changes
- No need to zip/upload/install repeatedly!

### Debugging

**Backend (API/Database):**
- Check server console for `console.log()` output
- Plugin logs are prefixed with `[Plugin-Name]`
- Database errors show query details

**Frontend:**
- Open browser DevTools (F12)
- Check Console tab for errors
- Network tab shows API requests/responses

### Testing Multi-Tenancy

Create test users with different company codes:
```sql
INSERT INTO Users (ID, Username, Email, FullName, Role, PasswordHash, CompanyCode)
VALUES 
  (NEWID(), 'test1', 'test1@company-a.com', 'Test User A', 'Admin', '$2b$10$...', 'COMPANY-A'),
  (NEWID(), 'test2', 'test2@company-b.com', 'Test User B', 'Admin', '$2b$10$...', 'COMPANY-B');
```

Log in as each user and verify:
- Data from other companies is not visible
- Plugin creates separate data per company
- All queries include CompanyCode filter

## Troubleshooting

### "Component not found in registry"
- Check that your component filename matches the `componentId` pattern
- `TrackerPage.tsx` → `tracker-page-page`
- Component must be copied to `src/components/plugins/`

### "Cannot find module" errors
- Verify `index.js` exports a module: `module.exports = { ... }`
- Check that `plugin.json` has `"main": "index.js"`

### Database table not created
- Check `onInstall()` was called (check console logs)
- Verify SQL syntax is correct
- Make sure table doesn't already exist (prevents re-creation)

### Data showing from other companies
- **Always** filter by `CompanyCode` in every query
- Get CompanyCode from request headers: `req.headers['x-company-code']`
- Never hardcode CompanyCode values

## Best Practices

✅ **DO:**
- Always filter queries by CompanyCode
- Use parameterized queries to prevent SQL injection
- Add indexes on CompanyCode columns
- Log important operations with `console.log('[Your Plugin] ...')`
- Test with multiple company codes
- Handle errors gracefully
- Document your API endpoints

❌ **DON'T:**
- Share data between companies
- Use raw string concatenation in SQL queries
- Create tables without CompanyCode
- Forget foreign key constraints on CASCADE DELETE
- Hardcode company names or codes
- Ignore error handling

## Getting Help

For additional support:
- Check the example plugins in `server/plugins/`
- Review the plugin templates in `plugin-templates/`
- Test with `PLUGIN-DEV-MODE.bat` for rapid iteration
- Read the error messages carefully - they usually point to the issue

This approach ensures plugins integrate seamlessly with the existing system while maintaining data consistency and multi-tenant isolation.