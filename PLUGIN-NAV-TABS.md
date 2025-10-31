# Plugin Navigation Tabs - Developer Guide

## Overview
This guide explains how to add main navigation tabs to your plugin, making them appear in the top navigation bar alongside Tickets, Map, Calendar, etc.

## ✅ Current Implementation Status

**Backend:** ✅ Fully Implemented
- PluginManager.getNavTabs() method exists
- API endpoint `/api/plugins/nav-tabs` available
- Role-based filtering supported

**Frontend:** ✅ Fully Implemented
- Nav.tsx fetches and displays plugin tabs
- App.tsx renders plugin tab content areas
- Role-based tab visibility working

**Component Loading:** ⚠️ Placeholder (See "Frontend Components" section below)

## Plugin Manifest Structure

Add a `navTabs` array to your plugin's `index.js`:

```javascript
module.exports = {
  name: 'my-plugin',
  version: '1.0.0',
  
  /**
   * Main Navigation Tabs
   * Adds tabs to the main navigation bar (can have multiple tabs per plugin)
   */
  navTabs: [
    {
      id: 'my-plugin-main',           // Unique ID within this plugin
      label: 'My Plugin',             // Display name in nav bar
      icon: '🔌',                     // Emoji or icon (optional)
      componentId: 'my-plugin-page',  // Frontend component ID
      roles: ['Admin', 'SystemAdmin'] // Which roles can see this tab (optional)
    },
    {
      id: 'my-plugin-reports',
      label: 'Plugin Reports',
      icon: '📊',
      componentId: 'my-plugin-reports',
      roles: ['Admin', 'SystemAdmin', 'Coordinator']
    }
  ],
  
  // API Routes (optional)
  routes: [
    // Your API endpoints
  ],
  
  // Lifecycle hooks (optional)
  hooks: {
    onInstall: async (tenantId, pool) => { /* ... */ },
    onUninstall: async (tenantId, pool) => { /* ... */ }
  }
}
```

## NavTab Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | ✅ Yes | Unique identifier for this tab within the plugin |
| `label` | string | ✅ Yes | Display name shown in the navigation bar (this becomes the tab name) |
| `icon` | string | ❌ No | Emoji or icon character (e.g., '🔧', '📊') |
| `componentId` | string | ✅ Yes | Identifier for the frontend component to render |
| `roles` | string[] | ❌ No | User roles that can see this tab. Empty/omitted = visible to all |

### Available User Roles
- `SystemAdmin` - System administrators
- `Admin` - Company administrators  
- `Coordinator` - Coordinators
- `Technician` - Field technicians

## Backend API

### GET /api/plugins/nav-tabs

Returns all navigation tabs from **enabled** plugins for the current company.

**Request Headers:**
```
Authorization: Bearer <token>
x-user-id: <user-id>
x-user-role: <user-role>
x-company-code: <company-code>
```

**Response:**
```json
{
  "tabs": [
    {
      "pluginId": "my-plugin",
      "id": "my-plugin-main",
      "label": "My Plugin",
      "icon": "🔌",
      "componentId": "my-plugin-page",
      "roles": ["Admin", "SystemAdmin"]
    }
  ]
}
```

## Frontend Components

### Current State: Placeholder Rendering

The system currently renders a **placeholder** for plugin nav tabs. When you click on a plugin tab, you'll see:

```
🔌 My Plugin
Plugin component: my-plugin-page
From plugin: my-plugin
Plugin UI components will be loaded here.
See plugin documentation for frontend component integration.
```

This placeholder appears in a `<div id="plugin-nav-{componentId}">` container that you can target with your plugin's frontend code.

### How to Add Frontend UI (Current Options)

**Option 1: API-Driven Content (Recommended for now)**

Use your plugin's API routes to serve data, then inject UI via JavaScript:

```javascript
// In your plugin's backend route
{
  method: 'GET',
  path: '/dashboard',
  handler: async (req, res) => {
    const companyCode = req.headers['x-company-code'];
    // Fetch data from database
    const data = await req.pool.request()
      .input('companyCode', companyCode)
      .query('SELECT * FROM YourTable WHERE CompanyCode = @companyCode');
    
    res.json({ data: data.recordset });
  }
}
```

Then use the main app to make API calls when your tab is active.

**Option 2: Standalone Page**

Create a separate HTML page served by your plugin:

```javascript
routes: [
  {
    method: 'GET',
    path: '/page',
    handler: async (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>My Plugin</title></head>
          <body>
            <h1>My Plugin Content</h1>
            <script>
              // Your plugin JavaScript here
            </script>
          </body>
        </html>
      `);
    }
  }
]
```

Then navigate to `/api/plugins/my-plugin/page` when the tab is clicked.

**Option 3: Future - React Component Loading**

Future enhancement will support bundling React components with your plugin:

```typescript
// Future: src/components/plugins/MyPluginPage.tsx
import React, { useState, useEffect } from 'react'

export default function MyPluginPage({ currentUser, companyCode }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || '/api'
      const response = await fetch(`${API_BASE}/plugins/my-plugin/data`, {
        headers: {
          'x-company-code': companyCode,
          'x-user-id': currentUser?.id || ''
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        setData(result.data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
  }

  return (
    <div style={{ padding: '24px' }}>
      <h2>My Plugin Page</h2>
      <p>This is a custom plugin tab in the main navigation!</p>
      
      {/* Your custom UI here */}
      <div className="card">
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    </div>
  )
}
```

## Register Component

Add your component to the plugin component registry in `src/components/plugins/PluginComponentRegistry.tsx`:

```typescript
import MyPluginPage from './MyPluginPage'

const PLUGIN_COMPONENTS = {
  'my-plugin-page': MyPluginPage,
  // ... other plugin components
}
```

## Properties Reference

### `navTab` Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Yes | Unique identifier for the tab |
| `label` | string | Yes | Display name shown in navigation bar |
| `icon` | string | No | Emoji or icon character |
| `componentId` | string | Yes | Frontend component ID (must match registry) |
| `roles` | string[] | No | User roles that can see this tab. Defaults to all roles if not specified |

### Available Roles
- `'SystemAdmin'` - Full system access
- `'Admin'` - Company admin
- `'Coordinator'` - Coordinators
- `'Technician'` - Field technicians

## Complete Working Example: VAMP Plugin

Here's a complete, working example for a plugin called "VAMP":

### Backend: `server/plugins/vamp-plugin/index.js`

```javascript
/**
 * VAMP Plugin
 * Vendor Asset Management Portal
 */

module.exports = {
  name: 'vamp-plugin',
  displayName: 'VAMP',
  version: '1.0.0',
  description: 'Vendor Asset Management Portal',
  author: 'Your Company',
  category: 'Management',
  
  /**
   * Main Navigation Tabs
   */
  navTabs: [
    {
      id: 'vamp-main',
      label: 'VAMP',
      icon: '🎵',
      componentId: 'vamp-dashboard',
      roles: ['Admin', 'SystemAdmin', 'Coordinator']
    }
  ],
  
  /**
   * API Routes
   */
  routes: [
    {
      method: 'GET',
      path: '/assets',
      handler: async (req, res) => {
        const pool = req.pool || req.app.locals.pool;
        const companyCode = req.headers['x-company-code'];
        
        try {
          const result = await pool.request()
            .input('companyCode', companyCode)
            .query(`
              SELECT 
                AssetID,
                AssetName,
                VendorName,
                PurchaseDate,
                WarrantyExpiry,
                Status
              FROM VendorAssets
              WHERE CompanyCode = @companyCode
              ORDER BY PurchaseDate DESC
            `);
          
          res.json({ assets: result.recordset });
        } catch (error) {
          console.error('Error fetching VAMP assets:', error);
          res.status(500).json({ error: 'Failed to fetch assets' });
        }
      }
    },
    
    {
      method: 'POST',
      path: '/assets',
      handler: async (req, res) => {
        const pool = req.pool || req.app.locals.pool;
        const companyCode = req.headers['x-company-code'];
        const { assetName, vendorName, purchaseDate, warrantyExpiry } = req.body;
        
        try {
          await pool.request()
            .input('companyCode', companyCode)
            .input('assetName', assetName)
            .input('vendorName', vendorName)
            .input('purchaseDate', purchaseDate)
            .input('warrantyExpiry', warrantyExpiry)
            .query(`
              INSERT INTO VendorAssets 
              (CompanyCode, AssetName, VendorName, PurchaseDate, WarrantyExpiry, Status)
              VALUES 
              (@companyCode, @assetName, @vendorName, @purchaseDate, @warrantyExpiry, 'Active')
            `);
          
          res.json({ success: true });
        } catch (error) {
          console.error('Error creating VAMP asset:', error);
          res.status(500).json({ error: 'Failed to create asset' });
        }
      }
    }
  ],
  
  /**
   * Lifecycle Hooks
   */
  hooks: {
    onInstall: async (tenantId, pool) => {
      console.log(`🎵 VAMP Plugin: Installing for tenant ${tenantId}`);
      
      // Create VendorAssets table
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'VendorAssets')
        BEGIN
          CREATE TABLE VendorAssets (
            AssetID UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
            CompanyCode NVARCHAR(50) NOT NULL,
            AssetName NVARCHAR(200) NOT NULL,
            VendorName NVARCHAR(200),
            PurchaseDate DATE,
            WarrantyExpiry DATE,
            Status NVARCHAR(50) DEFAULT 'Active',
            CreatedAt DATETIME2(7) DEFAULT GETDATE(),
            
            CONSTRAINT FK_VendorAssets_Company FOREIGN KEY (CompanyCode)
              REFERENCES Companies(CompanyCode) ON DELETE CASCADE
          );
          
          CREATE INDEX IX_VendorAssets_Company ON VendorAssets(CompanyCode);
        END
      `);
      
      console.log('✅ VAMP Plugin: VendorAssets table created');
    },
    
    onEnable: async (tenantId, pool) => {
      console.log(`🎵 VAMP Plugin: Enabled for tenant ${tenantId}`);
    },
    
    onDisable: async (tenantId, pool) => {
      console.log(`🎵 VAMP Plugin: Disabled for tenant ${tenantId}`);
    },
    
    onUninstall: async (tenantId, pool) => {
      console.log(`🎵 VAMP Plugin: Uninstalling for tenant ${tenantId}`);
      
      // Drop VendorAssets table
      await pool.request().query(`
        IF EXISTS (SELECT * FROM sys.tables WHERE name = 'VendorAssets')
        BEGIN
          DROP TABLE VendorAssets;
        END
      `);
      
      console.log('✅ VAMP Plugin: VendorAssets table dropped');
    }
  }
};
```

### Testing Your VAMP Plugin

1. **Create the plugin folder:**
   ```
   server/plugins/vamp-plugin/
   └── index.js (paste the code above)
   ```

2. **Restart the server** to load the plugin

3. **Go to the Plugins tab** in your app (must be Admin or SystemAdmin)

4. **Find "VAMP" in the plugin list** and click "Install"

5. **Enable the plugin** for your company

6. **Refresh the page** - you should see a "🎵 VAMP" tab in the navigation bar

7. **Click the VAMP tab** - you'll see the placeholder showing:
   ```
   🎵 VAMP
   Plugin component: vamp-dashboard
   From plugin: vamp-plugin
   ```

8. **Test the API:**
   - GET `/api/plugins/vamp-plugin/assets` - should return empty array (or your assets)
   - POST `/api/plugins/vamp-plugin/assets` with asset data

### What You'll See

When you click the VAMP tab, you'll currently see a placeholder. This is **expected behavior** in the current implementation.

To build the actual UI:
1. Use the provided API endpoints to fetch/manage data
2. Create a separate frontend app or page that calls these APIs
3. Or wait for the React component loading feature (future enhancement)

## Properties Reference
    id: 'dashboard',
    label: 'Dashboard',
    icon: '📊',
    componentId: 'custom-dashboard',
    roles: ['Admin', 'SystemAdmin', 'Coordinator']
  }
}
```

## Installation Flow

1. **Package your plugin** as a ZIP containing `index.js`
2. **Upload via Plugin Manager** in the UI
3. **Install for your company** - this creates DB entries and loads the plugin
4. **Reload plugins** - the nav tab will appear automatically
5. **Click the tab** - your component renders

## API Integration

Your plugin can call its own API endpoints:

```typescript
const API_BASE = import.meta.env.VITE_API_URL || '/api'

// Call your plugin's routes
const response = await fetch(`${API_BASE}/plugins/my-plugin/my-route`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-company-code': companyCode,
    'x-user-id': currentUser.id
  },
  body: JSON.stringify({ data: 'value' })
})
```

## Best Practices

1. **Role-based access** - Always specify which roles can see your tab
2. **Company isolation** - Use `x-company-code` header in all API calls
3. **Error handling** - Show friendly messages if data fails to load
4. **Loading states** - Display loading indicators while fetching data
5. **Responsive design** - Use the existing CSS classes from the main app

## Troubleshooting

### Tab doesn't appear in navigation

**1. Check plugin status:**
```
Go to Plugins tab → Find your plugin → Check status
- ❌ If "Not Installed": Click "Install"
- ❌ If "Installed but Disabled": Click "Enable"  
- ✅ Should show: "Installed and Enabled"
```

**2. Check role permissions:**
```javascript
// If your navTab has:
roles: ['Admin', 'SystemAdmin']

// And you're logged in as 'Coordinator' - the tab won't appear
// Fix: Remove roles array or add 'Coordinator' to it
navTabs: [
  {
    id: 'my-tab',
    label: 'My Tab',
    componentId: 'my-component',
    roles: ['Admin', 'SystemAdmin', 'Coordinator'] // Now Coordinators can see it
  }
]
```

**3. Verify API endpoint:**
```
Open browser DevTools → Network tab
Refresh page → Look for call to: /api/plugins/nav-tabs

✅ Should return: { tabs: [ { pluginId: 'your-plugin', ... } ] }
❌ If your tab is missing: Plugin not loaded or not enabled
❌ If 404 error: Server may need restart
```

**4. Check browser console:**
```javascript
// Look for errors like:
// ❌ "Failed to fetch plugin nav tabs: 404"
// ❌ "Cannot read property 'navTabs' of undefined"
```

**5. Restart and reload:**
```bash
# Stop the server
Ctrl+C

# Start again
npm start

# In browser: Click "Reload Plugins" button or refresh page
```

### Tab appears but shows placeholder

**This is expected!** The current implementation shows:
```
🔌 My Plugin
Plugin component: my-plugin-page
From plugin: my-plugin
Plugin UI components will be loaded here.
```

**Why:** Dynamic React component loading is not yet implemented.

**Solutions:**
1. Use plugin API routes + existing frontend to display data
2. Create a standalone page served by your plugin
3. Wait for component loading feature (future)

### Common Mistakes

**❌ Wrong: `navTab` (singular)**
```javascript
module.exports = {
  navTab: { ... }  // This won't work!
}
```

**✅ Correct: `navTabs` (plural, array)**
```javascript
module.exports = {
  navTabs: [    // Array, even with one tab
    { ... }
  ]
}
```

**❌ Wrong: Roles as strings**
```javascript
navTabs: [{
  roles: 'Admin, SystemAdmin'  // Won't work!
}]
```

**✅ Correct: Roles as array**
```javascript
navTabs: [{
  roles: ['Admin', 'SystemAdmin']  // Array of strings
}]
```

**❌ Wrong: Role names**
```javascript
roles: ['admin', 'sysadmin']  // Case-sensitive! Won't match
```

**✅ Correct: Exact role names**
```javascript
roles: ['Admin', 'SystemAdmin']  // Must match exactly
```

### Debugging Checklist

- [ ] Plugin folder exists: `server/plugins/your-plugin/index.js`
- [ ] Plugin installed in Plugins Manager
- [ ] Plugin enabled for your company
- [ ] `navTabs` is an array (not `navTab` singular)
- [ ] Each tab has: `id`, `label`, `componentId`
- [ ] Your user role matches the `roles` array (or `roles` is empty/omitted)
- [ ] Server restarted after plugin changes
- [ ] Browser refreshed or "Reload Plugins" clicked
- [ ] `/api/plugins/nav-tabs` returns your tab in the response
- [ ] No errors in browser console
- [ ] No errors in server logs

### Testing API Endpoint Manually

```bash
# Get all nav tabs (using curl or Postman)
curl -X GET http://localhost:5000/api/plugins/nav-tabs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "x-company-code: YOUR_COMPANY_CODE" \
  -H "x-user-id: YOUR_USER_ID"

# Expected response:
{
  "tabs": [
    {
      "pluginId": "your-plugin",
      "id": "your-tab-id",
      "label": "Your Tab",
      "icon": "🔌",
      "componentId": "your-component",
      "roles": ["Admin"]
    }
  ]
}
```

## See Also

- [Plugin Upload System](PLUGIN-UPLOAD-SYSTEM.md)
- [Plugin Package Specification](PLUGIN-PACKAGE-SPEC.md)
- Existing plugin example: `server/plugins/time-clock/`
