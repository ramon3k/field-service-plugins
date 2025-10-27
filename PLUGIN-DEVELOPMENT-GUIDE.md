# Plugin Development Guide

## Overview

This guide walks you through creating a new plugin for the Field Service Management System. Plugins extend the core functionality without modifying the main application code.

> **💡 New!** Plugins can now be uploaded via the Plugin Manager UI! See [PLUGIN-PACKAGE-SPEC.md](PLUGIN-PACKAGE-SPEC.md) for packaging instructions and [PLUGIN-UPLOAD-SYSTEM.md](PLUGIN-UPLOAD-SYSTEM.md) for system overview.

---

## Two Ways to Install Plugins

### Method 1: Upload via Plugin Manager ⭐ **Recommended for Most Users**

1. Package your plugin as a `.zip` file (see [PLUGIN-PACKAGE-SPEC.md](PLUGIN-PACKAGE-SPEC.md))
2. Log in as System Admin
3. Navigate to **Plugins** tab
4. Click **📦 Upload Plugin**
5. Select your ZIP file
6. Restart server
7. Click **Install**

**No SQL knowledge required!** Perfect for non-technical system administrators.

### Method 2: Manual Installation (Advanced)

For developers who want direct file system access, continue with the steps below.

---

## Quick Start: Creating a New Plugin

### Step 1: Create Plugin Directory Structure

```
server/plugins/your-plugin-name/
├── index.js           # Main plugin class (required)
├── package.json       # Plugin metadata (optional)
└── README.md          # Plugin documentation (optional)
```

### Step 2: Create the Plugin Class

Create `server/plugins/your-plugin-name/index.js`:

```javascript
// Example: Equipment Maintenance Tracker Plugin

class EquipmentMaintenancePlugin {
  constructor({ id, name, version, config, companyCode, pool }) {
    this.id = id;
    this.name = name;
    this.version = version;
    this.config = config;
    this.companyCode = companyCode;
    this.pool = pool;
  }

  /**
   * Initialize plugin (called when plugin loads)
   */
  async initialize() {
    console.log(`🔧 Equipment Maintenance Plugin v${this.version} initialized for ${this.companyCode}`);
    // Create database tables if needed
    await this.createTables();
  }

  /**
   * Cleanup (called when plugin unloads)
   */
  async cleanup() {
    console.log(`🔧 Equipment Maintenance Plugin cleanup for ${this.companyCode}`);
  }

  /**
   * Define API routes
   */
  routes = [
    {
      method: 'GET',
      path: '/equipment',
      handler: this.listEquipment.bind(this),
      description: 'List all equipment'
    },
    {
      method: 'POST',
      path: '/equipment',
      handler: this.createEquipment.bind(this),
      description: 'Create new equipment'
    },
    {
      method: 'GET',
      path: '/maintenance-schedule',
      handler: this.getMaintenanceSchedule.bind(this),
      description: 'Get maintenance schedule'
    }
  ];

  /**
   * Define ticket modal tabs (optional)
   */
  ticketTabs = [
    {
      id: 'equipment',
      label: 'Equipment',
      icon: '🔧',
      componentId: 'equipment-maintenance',
      roles: ['admin', 'technician']
    }
  ];

  /**
   * Define report components (optional)
   */
  reportComponent = {
    name: 'EquipmentMaintenanceReport',
    componentId: 'equipment-maintenance-report',
    title: 'Equipment Maintenance Report'
  };

  /**
   * Define hooks (optional)
   */
  hooks = {
    'ticket.completed': async (data) => {
      console.log('Ticket completed, updating equipment maintenance records:', data);
      // Custom logic when ticket is completed
    }
  };

  /**
   * Route Handlers
   */
  async listEquipment(req, res) {
    try {
      const result = await this.pool.request()
        .input('companyCode', this.companyCode)
        .query(`
          SELECT * FROM EquipmentMaintenance 
          WHERE CompanyCode = @companyCode
          ORDER BY NextMaintenanceDate
        `);
      
      res.json({ equipment: result.recordset });
    } catch (error) {
      console.error('Error listing equipment:', error);
      res.status(500).json({ error: 'Failed to list equipment' });
    }
  }

  async createEquipment(req, res) {
    try {
      const { name, serialNumber, maintenanceInterval } = req.body;
      
      await this.pool.request()
        .input('companyCode', this.companyCode)
        .input('name', name)
        .input('serialNumber', serialNumber)
        .input('maintenanceInterval', maintenanceInterval)
        .query(`
          INSERT INTO EquipmentMaintenance 
          (CompanyCode, Name, SerialNumber, MaintenanceInterval, CreatedAt)
          VALUES (@companyCode, @name, @serialNumber, @maintenanceInterval, GETUTCDATE())
        `);
      
      res.json({ success: true, message: 'Equipment created' });
    } catch (error) {
      console.error('Error creating equipment:', error);
      res.status(500).json({ error: 'Failed to create equipment' });
    }
  }

  async getMaintenanceSchedule(req, res) {
    try {
      const result = await this.pool.request()
        .input('companyCode', this.companyCode)
        .query(`
          SELECT 
            Name,
            SerialNumber,
            NextMaintenanceDate,
            MaintenanceInterval
          FROM EquipmentMaintenance
          WHERE CompanyCode = @companyCode
            AND NextMaintenanceDate IS NOT NULL
          ORDER BY NextMaintenanceDate
        `);
      
      res.json({ schedule: result.recordset });
    } catch (error) {
      console.error('Error getting maintenance schedule:', error);
      res.status(500).json({ error: 'Failed to get maintenance schedule' });
    }
  }

  /**
   * Helper: Create database tables
   */
  async createTables() {
    try {
      await this.pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'EquipmentMaintenance')
        BEGIN
          CREATE TABLE EquipmentMaintenance (
            ID INT IDENTITY(1,1) PRIMARY KEY,
            CompanyCode VARCHAR(50) NOT NULL,
            Name VARCHAR(255) NOT NULL,
            SerialNumber VARCHAR(100),
            MaintenanceInterval INT, -- Days
            LastMaintenanceDate DATETIME,
            NextMaintenanceDate DATETIME,
            CreatedAt DATETIME NOT NULL,
            UpdatedAt DATETIME,
            INDEX IX_CompanyCode_NextMaintenance (CompanyCode, NextMaintenanceDate)
          )
        END
      `);
      console.log('✅ EquipmentMaintenance table ready');
    } catch (error) {
      console.error('❌ Failed to create tables:', error);
    }
  }
}

module.exports = EquipmentMaintenancePlugin;
```

### Step 3: Register Plugin in Database

Run this SQL to add your plugin to the global catalog:

```sql
-- Add to GlobalPlugins table
INSERT INTO GlobalPlugins (
  id,
  name,
  displayName,
  version,
  description,
  author,
  category,
  status,
  isOfficial,
  createdAt
) VALUES (
  NEWID(),
  'equipment-maintenance',
  'Equipment Maintenance Tracker',
  '1.0.0',
  'Track equipment maintenance schedules and service records',
  'Your Name',
  'Operations',
  'active',
  0, -- Set to 1 if official plugin
  GETUTCDATE()
);
```

### Step 4: Install Plugin for a Tenant

You can install the plugin either:

**Option A: Via Plugin Manager UI**
1. Login as SystemAdmin
2. Go to Plugins tab
3. Click "Install" on your plugin

**Option B: Via SQL**
```sql
-- Get the plugin ID
DECLARE @pluginId UNIQUEIDENTIFIER = (
  SELECT id FROM GlobalPlugins WHERE name = 'equipment-maintenance'
);

-- Install for tenant
INSERT INTO TenantPluginInstallations (
  id,
  tenantId,
  pluginId,
  isEnabled,
  configuration,
  installedAt
) VALUES (
  NEWID(),
  'DCPSP', -- Your company code
  @pluginId,
  1, -- Enabled
  NULL, -- Optional JSON configuration
  GETUTCDATE()
);
```

### Step 5: Restart Server

After registering and installing the plugin, restart your Node.js server to load it:

```bash
npm start
```

You should see:
```
🔧 Equipment Maintenance Plugin v1.0.0 initialized for DCPSP
```

---

## Plugin API Reference

### Required Properties

```javascript
class MyPlugin {
  constructor({ id, name, version, config, companyCode, pool }) {
    this.id = id;           // Plugin UUID from database
    this.name = name;       // Plugin name (e.g., 'time-clock')
    this.version = version; // Version string
    this.config = config;   // JSON configuration from database
    this.companyCode = companyCode; // Tenant/company code
    this.pool = pool;       // SQL Server connection pool
  }
}
```

### Optional Lifecycle Methods

```javascript
async initialize() {
  // Called when plugin loads
  // Perfect for creating database tables, loading data, etc.
}

async cleanup() {
  // Called when plugin unloads
  // Clean up resources, close connections, etc.
}
```

### Routes Definition

```javascript
routes = [
  {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    path: '/your-path',  // Will be mounted at /api/plugins/{plugin-name}/your-path
    handler: this.yourHandler.bind(this),
    description: 'Route description'
  }
];
```

### Ticket Tabs Definition

```javascript
ticketTabs = [
  {
    id: 'unique-tab-id',
    label: 'Tab Display Name',
    icon: '🔧', // Emoji icon
    componentId: 'component-identifier', // Used for component mapping
    roles: ['admin', 'technician', 'coordinator'] // Who can see this tab
  }
];
```

### Report Components Definition

```javascript
reportComponent = {
  name: 'ReportComponentName',
  componentId: 'report-component-id',
  title: 'Report Display Title'
};
```

### Hooks Definition

```javascript
hooks = {
  'ticket.completed': async (data) => {
    // Called when a ticket is marked as completed
  },
  'ticket.created': async (data) => {
    // Called when a new ticket is created
  },
  'ticket.updated': async (data) => {
    // Called when a ticket is updated
  }
};
```

---

## Frontend Components

### Creating a Ticket Tab Component

Create `src/components/EquipmentMaintenance.tsx`:

```typescript
import React, { useState, useEffect } from 'react';

interface EquipmentMaintenanceProps {
  ticketId: string;
}

export default function EquipmentMaintenance({ ticketId }: EquipmentMaintenanceProps) {
  const [equipment, setEquipment] = useState([]);
  const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

  useEffect(() => {
    fetchEquipment();
  }, [ticketId]);

  const fetchEquipment = async () => {
    try {
      const response = await fetch(`${API_BASE}/plugins/equipment-maintenance/equipment`);
      if (response.ok) {
        const data = await response.json();
        setEquipment(data.equipment || []);
      }
    } catch (error) {
      console.error('Failed to fetch equipment:', error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h3>Equipment Maintenance</h3>
      {/* Your UI here */}
    </div>
  );
}
```

### Registering Frontend Component

Update `TechnicianInterface.tsx` component mapping:

```typescript
// In the plugin tab rendering section
if (tab.componentId === 'equipment-maintenance') {
  return (
    <div key={tab.id}>
      <EquipmentMaintenance ticketId={ticket.TicketID} />
    </div>
  )
}
```

### Creating a Report Component

Create `src/components/EquipmentMaintenanceReport.tsx`:

```typescript
import React, { useState, useEffect } from 'react';

export default function EquipmentMaintenanceReport() {
  const [schedule, setSchedule] = useState([]);
  const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      const response = await fetch(`${API_BASE}/plugins/equipment-maintenance/maintenance-schedule`);
      if (response.ok) {
        const data = await response.json();
        setSchedule(data.schedule || []);
      }
    } catch (error) {
      console.error('Failed to fetch schedule:', error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Equipment Maintenance Schedule</h2>
      {/* Your report UI here */}
    </div>
  );
}
```

Register in `ReportsPage.tsx`:

```typescript
import EquipmentMaintenanceReport from './EquipmentMaintenanceReport'

const pluginComponents = {
  'time-clock-report': TimeClockReport,
  'equipment-maintenance-report': EquipmentMaintenanceReport
}
```

---

## Best Practices

### 1. Database Isolation
- Always filter by `CompanyCode` in queries
- Create indexes on `CompanyCode` columns
- Use tenant-specific table prefixes if needed

### 2. Error Handling
- Always wrap route handlers in try-catch
- Return meaningful error messages
- Log errors with context

### 3. Security
- Validate all user inputs
- Use parameterized queries (always!)
- Check user permissions in routes

### 4. Performance
- Create appropriate database indexes
- Cache frequently accessed data
- Use pagination for large datasets

### 5. Naming Conventions
- Plugin name: lowercase-with-hyphens
- Component IDs: lowercase-with-hyphens
- Database tables: PascalCase
- Route paths: /lowercase-with-hyphens

---

## Testing Your Plugin

### 1. Backend API Testing

```bash
# Test GET endpoint
curl http://localhost:5000/api/plugins/equipment-maintenance/equipment

# Test POST endpoint
curl -X POST http://localhost:5000/api/plugins/equipment-maintenance/equipment \
  -H "Content-Type: application/json" \
  -d '{"name":"Generator","serialNumber":"GEN-001","maintenanceInterval":90}'
```

### 2. Check Plugin Loading

Look for these logs on server start:
```
🔧 Equipment Maintenance Plugin v1.0.0 initialized for DCPSP
📋 Found 3 routes in equipment-maintenance
  ➕ Added route: GET /equipment
  ➕ Added route: POST /equipment
  ➕ Added route: GET /maintenance-schedule
```

### 3. Test in UI

1. Login as SystemAdmin
2. Go to Plugins tab
3. Verify your plugin shows up
4. Install and enable it
5. Test functionality

---

## Troubleshooting

### Plugin Not Loading
- Check `GlobalPlugins` table has entry with correct `name`
- Check `TenantPluginInstallations` has entry with `isEnabled = 1`
- Check plugin file path: `server/plugins/{name}/index.js`
- Check server logs for errors

### Routes Not Working
- Verify routes array is properly defined
- Check route paths don't conflict
- Ensure handlers are bound: `.bind(this)`
- Check server logs for route registration

### Frontend Component Not Showing
- Verify `componentId` matches in plugin and frontend
- Check component is imported in the mapping file
- Check user role has permission to see tab
- Look for console errors in browser

---

## Example Plugins

### Time Clock Plugin (Reference)
Location: `server/plugins/time-clock/index.js`
- Full working example with 9 API routes
- Ticket tabs integration
- Report component
- Hooks implementation

### Simple Plugin Template

```javascript
class SimplePlugin {
  constructor({ id, name, version, config, companyCode, pool }) {
    this.id = id;
    this.name = name;
    this.version = version;
    this.config = config;
    this.companyCode = companyCode;
    this.pool = pool;
  }

  async initialize() {
    console.log(`Plugin ${this.name} initialized`);
  }

  routes = [
    {
      method: 'GET',
      path: '/hello',
      handler: this.sayHello.bind(this)
    }
  ];

  async sayHello(req, res) {
    res.json({ message: `Hello from ${this.name}!` });
  }
}

module.exports = SimplePlugin;
```

---

## Plugin Lifecycle

```
1. Database Registration
   ↓
2. Server Starts
   ↓
3. PluginManager.loadPluginsForTenant()
   ↓
4. Plugin Constructor Called
   ↓
5. plugin.initialize() Called
   ↓
6. Routes Registered
   ↓
7. Hooks Registered
   ↓
8. Plugin Active
   ↓
9. On Disable/Uninstall
   ↓
10. plugin.cleanup() Called
```

---

## Getting Help

- Check existing plugins in `server/plugins/`
- Review `server/plugin-manager.js` for plugin loading logic
- Look at `server/routes/plugin-routes.js` for API routes
- Test endpoints using the `/api/debug/routes` endpoint

---

Happy Plugin Development! 🔌
