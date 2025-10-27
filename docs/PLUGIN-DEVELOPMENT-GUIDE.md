# Plugin Development Guide

**Field Service Management System - Plugin Architecture**

Version: 1.0.0  
Last Updated: October 27, 2025

---

## Table of Contents

1. [Introduction](#introduction)
2. [Plugin Architecture Overview](#plugin-architecture-overview)
3. [Getting Started](#getting-started)
4. [Plugin Structure](#plugin-structure)
5. [Core Plugin API](#core-plugin-api)
6. [Adding Features](#adding-features)
7. [Database Access](#database-access)
8. [Lifecycle Hooks](#lifecycle-hooks)
9. [Frontend Integration](#frontend-integration)
10. [Testing Your Plugin](#testing-your-plugin)
11. [Packaging & Distribution](#packaging--distribution)
12. [Best Practices](#best-practices)
13. [Troubleshooting](#troubleshooting)

---

## Introduction

The Field Service Management System uses a **modular plugin architecture** that allows you to extend the application's functionality without modifying the core codebase. Plugins can:

- ✅ Add new API routes
- ✅ Create custom tabs in ticket modals
- ✅ Add report components to the Reports page
- ✅ Execute code during install/uninstall/enable/disable events
- ✅ Access the shared database connection pool
- ✅ Integrate seamlessly with the existing UI

### Why Use Plugins?

- **Modularity**: Keep features isolated and maintainable
- **Hot-Reload**: Enable/disable features without restarting the server
- **Reusability**: Package and share functionality across installations
- **Customization**: Extend the system to meet specific business needs

---

## Plugin Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                        │
│  - TicketEditModal (renders plugin tabs)                   │
│  - ReportsPage (renders plugin report components)          │
└─────────────────────────────────────────────────────────────┘
                           ↕ HTTP
┌─────────────────────────────────────────────────────────────┐
│                   Backend API (Express)                     │
│  - Plugin Manager (loads/unloads plugins)                  │
│  - Plugin Routes (handles /api/plugins/*)                  │
│  - Enable/Disable Middleware (security)                    │
└─────────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────────┐
│                   Database (SQL Server)                     │
│  - GlobalPlugins (plugin registry)                         │
│  - TenantPluginInstallations (company-specific config)     │
│  - Your Plugin Tables (custom data)                        │
└─────────────────────────────────────────────────────────────┘
```

### Plugin Lifecycle

```
Upload ZIP → Extract → Register in DB → Install Hook → 
Enable → Load into Memory → Register Routes → Active ✓

Disable → Unload from Memory → Routes Blocked (403) → 
Can Re-enable

Uninstall → Uninstall Hook → Clean DB → Remove Files
```

---

## Getting Started

### Prerequisites

- Node.js 16+ installed
- Access to the Field Service system
- Basic JavaScript/TypeScript knowledge
- Understanding of Express.js and React (for advanced features)

### Quick Start: Hello World Plugin

Create a simple plugin in 5 minutes:

```bash
# 1. Create plugin directory
mkdir my-plugin
cd my-plugin

# 2. Create the main plugin file
touch index.js

# 3. Create package.json
touch package.json
```

**index.js:**
```javascript
module.exports = {
  name: 'hello-world',
  version: '1.0.0',
  
  routes: [
    {
      method: 'GET',
      path: '/hello',
      handler: async (req, res) => {
        res.json({ 
          message: 'Hello from my plugin!',
          timestamp: new Date()
        });
      }
    }
  ]
};
```

**package.json:**
```json
{
  "name": "hello-world",
  "version": "1.0.0",
  "displayName": "Hello World Plugin",
  "description": "A simple example plugin",
  "author": "Your Name",
  "category": "example"
}
```

**Test it:**
```bash
# Package the plugin
zip -r hello-world.zip .

# Upload via Plugin Manager UI
# Settings → Plugins → Upload Plugin → Select hello-world.zip

# Test the endpoint
curl http://localhost:5000/api/plugins/hello-world/hello
```

---

## Plugin Structure

### Recommended Directory Structure

```
my-plugin/
├── index.js              # Main plugin file (required)
├── package.json          # Plugin metadata (required)
├── README.md             # Plugin documentation
├── frontend/             # Optional React components
│   ├── MyTab.tsx
│   └── MyReport.tsx
├── migrations/           # Optional database migrations
│   └── 001-create-tables.sql
├── utils/                # Helper functions
│   └── validators.js
└── tests/                # Unit tests
    └── index.test.js
```

### Required Files

#### 1. `index.js` (Main Plugin Module)

This is the entry point for your plugin. It must export an object with specific properties:

```javascript
module.exports = {
  // REQUIRED: Plugin identifier (lowercase, hyphenated)
  name: 'my-plugin',
  
  // REQUIRED: Semantic version
  version: '1.0.0',
  
  // OPTIONAL: API routes
  routes: [],
  
  // OPTIONAL: Ticket modal tabs
  ticketTabs: [],
  
  // OPTIONAL: Report page components
  reportComponents: [],
  
  // OPTIONAL: Lifecycle hooks
  hooks: {
    onInstall: async (tenantId, pool) => {},
    onUninstall: async (tenantId, pool) => {},
    onEnable: async (tenantId, pool) => {},
    onDisable: async (tenantId, pool) => {}
  }
};
```

#### 2. `package.json` (Plugin Metadata)

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "displayName": "My Awesome Plugin",
  "description": "Does something amazing for field service",
  "author": "Your Company",
  "category": "productivity",
  "keywords": ["field-service", "automation"],
  "homepage": "https://example.com/plugins/my-plugin",
  "license": "MIT"
}
```

**Metadata Fields:**

| Field | Required | Description |
|-------|----------|-------------|
| `name` | ✅ | Plugin identifier (must match `index.js`) |
| `version` | ✅ | Semantic version (e.g., "1.2.3") |
| `displayName` | ✅ | Human-readable name shown in UI |
| `description` | ✅ | Short description (200 chars max) |
| `author` | ⚠️ | Plugin creator/maintainer |
| `category` | ⚠️ | Category for organization |
| `keywords` | ⬜ | Search keywords |
| `homepage` | ⬜ | Documentation URL |
| `license` | ⬜ | License identifier |

---

## Core Plugin API

### 1. Routes

Add custom API endpoints to your plugin:

```javascript
routes: [
  {
    method: 'GET',           // HTTP method: GET, POST, PUT, DELETE, PATCH
    path: '/my-endpoint',    // Route path (relative to /api/plugins/{plugin-name})
    handler: async (req, res) => {
      // Request object includes:
      // - req.pool: Database connection pool
      // - req.params: URL parameters
      // - req.query: Query string parameters
      // - req.body: Request body (JSON)
      // - req.headers: HTTP headers
      
      try {
        const data = await req.pool.request()
          .query('SELECT * FROM MyTable');
        
        res.json({ success: true, data: data.recordset });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  }
]
```

**Your routes will be mounted at:**
```
/api/plugins/{plugin-name}/{path}
```

**Example:** Plugin `time-clock` with path `/status/:technicianId` → 
```
GET /api/plugins/time-clock/status/admin_001
```

### 2. Ticket Tabs

Add custom tabs to the ticket modal:

```javascript
ticketTabs: [
  {
    id: 'my-tab',
    label: 'My Feature',
    icon: '⚡',
    component: 'MyCustomTab'  // React component name (frontend/MyCustomTab.tsx)
  }
]
```

**Frontend Component Example:**

```tsx
// frontend/MyCustomTab.tsx
import React, { useState, useEffect } from 'react';

interface Props {
  ticketId: string;
  technicianId: string;
}

export default function MyCustomTab({ ticketId, technicianId }: Props) {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetch(`/api/plugins/my-plugin/data/${ticketId}`)
      .then(res => res.json())
      .then(setData);
  }, [ticketId]);
  
  return (
    <div>
      <h2>My Custom Feature</h2>
      {/* Your UI here */}
    </div>
  );
}
```

### 3. Report Components

Add sections to the Reports page:

```javascript
reportComponents: [
  {
    id: 'my-report',
    title: 'My Custom Report',
    description: 'Detailed analytics for my plugin',
    endpoint: '/my-report-data'  // API endpoint returning report data
  }
]
```

**Report Endpoint Example:**

```javascript
{
  method: 'GET',
  path: '/my-report-data',
  handler: async (req, res) => {
    const companyCode = req.headers['x-company-code'] || 'DCPSP';
    
    const result = await req.pool.request()
      .input('companyCode', companyCode)
      .query(`
        SELECT 
          COUNT(*) as TotalRecords,
          SUM(Value) as TotalValue
        FROM MyPluginData
        WHERE CompanyCode = @companyCode
      `);
    
    res.json({
      summary: result.recordset[0],
      charts: [
        // Chart data
      ]
    });
  }
}
```

---

## Database Access

### Using the Connection Pool

Every route handler receives `req.pool` - a shared SQL Server connection pool.

```javascript
const { v4: uuidv4 } = require('uuid');

// SELECT query
const result = await req.pool.request()
  .input('ticketId', ticketId)
  .query('SELECT * FROM Tickets WHERE TicketID = @ticketId');

const ticket = result.recordset[0];

// INSERT query
await req.pool.request()
  .input('id', uuidv4())
  .input('name', 'John Doe')
  .input('email', 'john@example.com')
  .query(`
    INSERT INTO MyTable (ID, Name, Email)
    VALUES (@id, @name, @email)
  `);

// UPDATE query
await req.pool.request()
  .input('id', recordId)
  .input('status', 'completed')
  .query(`
    UPDATE MyTable 
    SET Status = @status, UpdatedAt = GETUTCDATE()
    WHERE ID = @id
  `);

// DELETE query
await req.pool.request()
  .input('id', recordId)
  .query('DELETE FROM MyTable WHERE ID = @id');
```

### Database Schema Conventions

Follow these conventions for consistency:

1. **Column Names**: Use PascalCase
   ```sql
   CREATE TABLE MyPluginData (
     EntryID UNIQUEIDENTIFIER PRIMARY KEY,
     CompanyCode NVARCHAR(50) NOT NULL,
     CreatedAt DATETIME NOT NULL,
     CreatedBy NVARCHAR(50)
   )
   ```

2. **Always Include CompanyCode**: For multi-tenant data isolation
   ```sql
   WHERE CompanyCode = @companyCode
   ```

3. **Use UNIQUEIDENTIFIER for IDs**: Generate with `uuidv4()`
   ```javascript
   const { v4: uuidv4 } = require('uuid');
   const newId = uuidv4();
   ```

4. **Index Important Columns**:
   ```sql
   CREATE INDEX IX_MyTable_CompanyCode ON MyTable(CompanyCode);
   CREATE INDEX IX_MyTable_CreatedAt ON MyTable(CreatedAt);
   ```

---

## Lifecycle Hooks

Plugins can execute code during key lifecycle events.

### Available Hooks

```javascript
hooks: {
  /**
   * Called when plugin is installed for a tenant
   * Use for: Creating tables, inserting default data, initial setup
   */
  onInstall: async (tenantId, pool) => {
    console.log(`Installing plugin for ${tenantId}`);
    
    // Create plugin tables
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MyPluginData')
      BEGIN
        CREATE TABLE MyPluginData (
          EntryID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
          CompanyCode NVARCHAR(50) NOT NULL,
          Data NVARCHAR(MAX),
          CreatedAt DATETIME DEFAULT GETUTCDATE()
        );
        
        CREATE INDEX IX_MyPluginData_CompanyCode 
        ON MyPluginData(CompanyCode);
      END
    `);
    
    console.log(`✅ Plugin installed for ${tenantId}`);
  },

  /**
   * Called when plugin is uninstalled for a tenant
   * Use for: Cleaning up data, removing tables (optional)
   */
  onUninstall: async (tenantId, pool) => {
    console.log(`Uninstalling plugin for ${tenantId}`);
    
    // Option 1: Delete only tenant data (recommended)
    await pool.request()
      .input('companyCode', tenantId)
      .query('DELETE FROM MyPluginData WHERE CompanyCode = @companyCode');
    
    // Option 2: Drop tables entirely (use with caution!)
    // await pool.request().query('DROP TABLE IF EXISTS MyPluginData');
    
    console.log(`✅ Plugin uninstalled for ${tenantId}`);
  },

  /**
   * Called when plugin is enabled for a tenant
   * Use for: Starting background jobs, enabling integrations
   */
  onEnable: async (tenantId, pool) => {
    console.log(`✅ Plugin enabled for ${tenantId}`);
    // Plugin routes are now active
  },

  /**
   * Called when plugin is disabled for a tenant
   * Use for: Stopping background jobs, pausing integrations
   */
  onDisable: async (tenantId, pool) => {
    console.log(`⏸️  Plugin disabled for ${tenantId}`);
    // Plugin routes will return 403 Forbidden
  }
}
```

### Hook Execution Order

**Install Flow:**
```
Upload → Register → onInstall → Enable → onEnable → Active
```

**Disable Flow:**
```
User clicks Disable → onDisable → Unload from memory → Routes return 403
```

**Re-enable Flow:**
```
User clicks Enable → onEnable → Reload into memory → Routes active
```

**Uninstall Flow:**
```
User clicks Uninstall → Disable → onUninstall → Remove from DB → Delete files
```

---

## Frontend Integration

### Adding React Components

Place frontend components in the `frontend/` directory:

```
my-plugin/
├── index.js
├── package.json
└── frontend/
    ├── MyTab.tsx         # Tab component
    └── MyReport.tsx      # Report component
```

### Example: Time Clock Tab Component

```tsx
// frontend/TimeClock.tsx
import React, { useState, useEffect } from 'react';

interface Props {
  ticketId: string;
  technicianId: string;
}

export default function TimeClock({ ticketId, technicianId }: Props) {
  const [status, setStatus] = useState<any>(null);
  const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

  useEffect(() => {
    fetchStatus();
  }, [ticketId, technicianId]);

  const fetchStatus = async () => {
    const response = await fetch(
      `${API_BASE}/plugins/time-clock/status/${technicianId}?ticketId=${ticketId}`
    );
    const data = await response.json();
    setStatus(data);
  };

  const handleClockIn = async () => {
    await fetch(`${API_BASE}/plugins/time-clock/clock-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ technicianId, ticketId })
    });
    fetchStatus();
  };

  return (
    <div>
      <h2>⏰ Time Clock</h2>
      {status?.isClockedIn ? (
        <button onClick={handleClockOut}>Clock Out</button>
      ) : (
        <button onClick={handleClockIn}>Clock In</button>
      )}
    </div>
  );
}
```

### Registering Components

In your `index.js`, reference the component:

```javascript
ticketTabs: [
  {
    id: 'time-clock',
    label: 'Time Clock',
    icon: '⏰',
    component: 'TimeClock'  // Must match the exported component name
  }
]
```

The system will automatically:
1. Load your component when the tab is selected
2. Pass props: `{ ticketId, technicianId }`
3. Handle errors and loading states

---

## Testing Your Plugin

### Local Development

1. **Place plugin in `server/plugins/` directory:**
   ```bash
   cp -r my-plugin server/plugins/
   ```

2. **Register in database:**
   ```sql
   INSERT INTO GlobalPlugins (id, name, displayName, version, description, category, status, isOfficial)
   VALUES (NEWID(), 'my-plugin', 'My Plugin', '1.0.0', 'Test plugin', 'development', 'active', 0);

   INSERT INTO TenantPluginInstallations (tenantId, pluginId, isEnabled)
   VALUES ('DCPSP', (SELECT id FROM GlobalPlugins WHERE name = 'my-plugin'), 1);
   ```

3. **Restart server:**
   ```bash
   cd server
   node api.cjs
   ```

4. **Test routes:**
   ```bash
   curl http://localhost:5000/api/plugins/my-plugin/my-endpoint
   ```

### Testing Checklist

- [ ] Plugin loads without errors
- [ ] All routes return expected responses
- [ ] Database queries work correctly
- [ ] Frontend components render properly
- [ ] Enable/disable works as expected
- [ ] Install/uninstall hooks execute successfully
- [ ] No console errors in browser or server
- [ ] Data isolation works (multi-tenant)

### Debugging Tips

**Server Logs:**
```javascript
// Add logging to your plugin
console.log('🔵 My Plugin: Processing request', { ticketId, userId });
console.error('❌ My Plugin: Error occurred', error);
```

**Check Plugin Status:**
```bash
# Via API
curl http://localhost:5000/api/plugins

# Via Database
sqlcmd -S localhost\SQLEXPRESS -d FieldServiceDB -E -Q "SELECT * FROM TenantPluginInstallations"
```

**Network Debugging:**
- Open browser DevTools → Network tab
- Filter for "plugins"
- Check request/response for errors

---

## Packaging & Distribution

### Creating a Plugin Package

1. **Ensure all required files exist:**
   ```bash
   my-plugin/
   ├── index.js       ✅
   ├── package.json   ✅
   └── README.md      ✅
   ```

2. **Create a ZIP archive:**
   ```bash
   # From the plugin directory
   zip -r my-plugin.zip .
   
   # OR on Windows
   Compress-Archive -Path * -DestinationPath my-plugin.zip
   ```

3. **Verify the package:**
   ```bash
   unzip -l my-plugin.zip
   # Should show:
   # index.js
   # package.json
   # README.md
   # frontend/ (if applicable)
   ```

### Upload via Plugin Manager

1. Navigate to **Settings → Plugins**
2. Click **📤 Upload Plugin**
3. Select your `.zip` file
4. Wait for upload confirmation
5. Plugin appears in the list
6. Click **Install** to activate it

### Version Management

Follow semantic versioning:

- **Major** (1.0.0 → 2.0.0): Breaking changes
- **Minor** (1.0.0 → 1.1.0): New features, backwards compatible
- **Patch** (1.0.0 → 1.0.1): Bug fixes

Update both files when releasing:
```json
// package.json
{
  "version": "1.2.0"
}
```

```javascript
// index.js
module.exports = {
  version: '1.2.0'
}
```

---

## Best Practices

### Security

✅ **DO:**
- Validate all user input
- Use parameterized queries (prevent SQL injection)
- Check user permissions before operations
- Include CompanyCode in all data queries (data isolation)
- Use HTTPS in production

❌ **DON'T:**
- Trust client-side data without validation
- Concatenate user input into SQL queries
- Store sensitive data in plain text
- Allow cross-tenant data access

**Example - Secure Query:**
```javascript
// ✅ GOOD: Parameterized query
await req.pool.request()
  .input('ticketId', ticketId)
  .input('companyCode', companyCode)
  .query('SELECT * FROM Tickets WHERE TicketID = @ticketId AND CompanyCode = @companyCode');

// ❌ BAD: SQL injection risk
await req.pool.request()
  .query(`SELECT * FROM Tickets WHERE TicketID = '${ticketId}'`);
```

### Performance

✅ **DO:**
- Index frequently queried columns
- Paginate large result sets
- Cache expensive queries
- Use `SELECT` specific columns (not `SELECT *`)
- Limit result set size

❌ **DON'T:**
- Load all records without pagination
- Run queries in loops
- Store large files in the database
- Make synchronous blocking calls

**Example - Pagination:**
```javascript
const page = parseInt(req.query.page) || 1;
const pageSize = 50;
const offset = (page - 1) * pageSize;

const result = await req.pool.request()
  .input('offset', offset)
  .input('pageSize', pageSize)
  .query(`
    SELECT * FROM MyTable
    ORDER BY CreatedAt DESC
    OFFSET @offset ROWS
    FETCH NEXT @pageSize ROWS ONLY
  `);
```

### Error Handling

Always wrap async operations in try-catch:

```javascript
{
  method: 'POST',
  path: '/create',
  handler: async (req, res) => {
    try {
      const { name, value } = req.body;
      
      // Validation
      if (!name || !value) {
        return res.status(400).json({ 
          error: 'Missing required fields' 
        });
      }
      
      // Database operation
      const result = await req.pool.request()
        .input('name', name)
        .input('value', value)
        .query('INSERT INTO MyTable (Name, Value) VALUES (@name, @value)');
      
      res.json({ success: true, rowsAffected: result.rowsAffected[0] });
      
    } catch (error) {
      console.error('❌ Create error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  }
}
```

### Code Organization

```javascript
// ✅ GOOD: Organized, modular
const validators = require('./utils/validators');
const queries = require('./utils/queries');

module.exports = {
  name: 'my-plugin',
  version: '1.0.0',
  routes: require('./routes'),
  hooks: require('./hooks')
};

// ❌ BAD: Everything in one file
module.exports = {
  name: 'my-plugin',
  version: '1.0.0',
  routes: [
    // 500 lines of route handlers...
  ]
};
```

---

## Troubleshooting

### Common Issues

#### 1. Plugin Not Loading

**Symptoms:**
- Plugin doesn't appear in Plugin Manager
- Routes return 404

**Solutions:**
```bash
# Check server logs for errors
# Look for: "❌ Failed to load plugin: my-plugin"

# Verify package.json structure
cat package.json | jq

# Check database registration
sqlcmd -S localhost\SQLEXPRESS -d FieldServiceDB -E -Q "SELECT * FROM GlobalPlugins WHERE name = 'my-plugin'"
```

#### 2. Routes Return 403 Forbidden

**Symptoms:**
- API calls fail with 403 status
- Error: "Plugin is disabled"

**Solutions:**
```bash
# Check if plugin is enabled
curl http://localhost:5000/api/plugins/installed

# Enable via API
curl -X POST http://localhost:5000/api/plugins/{plugin-guid}/enable \
  -H "x-company-code: DCPSP"

# Reload plugins
curl -X POST http://localhost:5000/api/plugins/reload \
  -H "x-company-code: DCPSP"
```

#### 3. Database Connection Errors

**Symptoms:**
- "req.pool is undefined"
- "Cannot read property 'request' of undefined"

**Solutions:**
```javascript
// ✅ Check pool exists
handler: async (req, res) => {
  if (!req.pool) {
    console.error('❌ Database pool not available');
    return res.status(500).json({ error: 'Database unavailable' });
  }
  // ... rest of handler
}
```

#### 4. Frontend Component Not Rendering

**Symptoms:**
- Tab shows blank screen
- Console error: "Component not found"

**Solutions:**
```tsx
// Verify component export
export default function MyComponent(props: Props) { ... }
// NOT: export function MyComponent(props: Props) { ... }

// Verify component name matches registration
ticketTabs: [{
  component: 'MyComponent'  // Must match export name exactly
}]
```

#### 5. Install Hook Fails

**Symptoms:**
- Plugin installs but doesn't work
- Database tables not created

**Solutions:**
```javascript
// Add detailed logging
onInstall: async (tenantId, pool) => {
  try {
    console.log(`📦 Starting install for ${tenantId}`);
    
    await pool.request().query(`CREATE TABLE ...`);
    console.log('✅ Table created');
    
  } catch (error) {
    console.error('❌ Install failed:', error);
    throw error;  // Re-throw to show error in UI
  }
}
```

### Getting Help

If you're stuck:

1. **Check server logs** - Most errors show detailed stack traces
2. **Test with cURL** - Isolate if issue is frontend or backend
3. **Use the reload button** - Click "🔄 Reload Plugins" after code changes
4. **Check database** - Verify data is correct using SQL queries
5. **Review Time Clock plugin** - It's a complete working example

### Debug Checklist

- [ ] Server is running without errors
- [ ] Plugin ZIP contains all required files
- [ ] package.json and index.js versions match
- [ ] Plugin is registered in GlobalPlugins table
- [ ] Plugin is enabled in TenantPluginInstallations
- [ ] Routes are correctly defined (method, path, handler)
- [ ] Database queries use parameterized inputs
- [ ] Frontend components are properly exported
- [ ] No console errors in browser DevTools
- [ ] Tested "Reload Plugins" button after changes

---

## Reference: Complete Plugin Example

Here's the **Time Clock plugin** structure as a reference:

```
time-clock/
├── index.js                    # Main plugin file
├── package.json                # Metadata
└── frontend/
    └── TicketTimeClock.tsx     # Tab component
```

**index.js (abbreviated):**
```javascript
const { v4: uuidv4 } = require('uuid');

module.exports = {
  name: 'time-clock',
  version: '1.0.0',
  
  routes: [
    {
      method: 'GET',
      path: '/status/:technicianId',
      handler: async (req, res) => { /* ... */ }
    },
    {
      method: 'POST',
      path: '/clock-in',
      handler: async (req, res) => { /* ... */ }
    },
    {
      method: 'POST',
      path: '/clock-out',
      handler: async (req, res) => { /* ... */ }
    },
    {
      method: 'GET',
      path: '/ticket-summary/:ticketId',
      handler: async (req, res) => { /* ... */ }
    },
    {
      method: 'GET',
      path: '/report',
      handler: async (req, res) => { /* ... */ }
    }
  ],
  
  ticketTabs: [
    {
      id: 'time-clock',
      label: 'Time Clock',
      icon: '⏰',
      component: 'TicketTimeClock'
    }
  ],
  
  reportComponents: [
    {
      id: 'time-clock-report',
      title: 'Time Clock Report',
      description: 'Technician time tracking and ticket summaries',
      endpoint: '/report'
    }
  ],
  
  hooks: {
    onInstall: async (tenantId, pool) => {
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TimeClockEntries')
        BEGIN
          CREATE TABLE TimeClockEntries (
            EntryID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
            CompanyCode NVARCHAR(50) NOT NULL,
            TechnicianID NVARCHAR(50) NOT NULL,
            TechnicianName NVARCHAR(100),
            TicketID NVARCHAR(50),
            ClockInTime DATETIME NOT NULL,
            ClockOutTime DATETIME,
            TotalHours DECIMAL(10,2),
            Status NVARCHAR(20)
          );
          
          CREATE INDEX IX_TimeClockEntries_CompanyCode 
          ON TimeClockEntries(CompanyCode);
        END
      `);
    },
    
    onUninstall: async (tenantId, pool) => {
      await pool.request()
        .input('companyCode', tenantId)
        .query('DELETE FROM TimeClockEntries WHERE CompanyCode = @companyCode');
    }
  }
};
```

---

## Summary

You now have everything needed to build plugins for the Field Service Management System:

✅ **Architecture understanding** - How plugins integrate  
✅ **API reference** - Routes, tabs, reports, hooks  
✅ **Database patterns** - Queries, schema, best practices  
✅ **Frontend integration** - React components  
✅ **Packaging guide** - Creating and distributing plugins  
✅ **Troubleshooting** - Common issues and solutions  

### Next Steps

1. **Study the Time Clock plugin** - It's a complete working example
2. **Create your first plugin** - Start with the Hello World example
3. **Test thoroughly** - Use the testing checklist
4. **Package and share** - Distribute to other installations

### Resources

- **Time Clock Plugin Source**: `server/plugins/time-clock/`
- **Plugin Manager UI**: Settings → Plugins
- **API Documentation**: See `API-HOSTING-GUIDE.md`
- **Database Schema**: Check `server/database/schema.sql`

---

**Happy Plugin Development! 🚀**

For questions or support, refer to the Time Clock plugin implementation or contact your system administrator.
