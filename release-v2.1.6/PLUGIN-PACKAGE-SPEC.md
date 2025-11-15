# Plugin Package Specification

## Overview

This document describes the format for packaging plugins that can be uploaded through the Plugin Manager interface.

## Package Format

Plugins must be packaged as a **ZIP file** containing:

1. **index.js** - The main plugin code (required)
2. **plugin.json** - Plugin metadata (required)
3. **README.md** - Documentation (recommended)
4. **Additional files** (optional: CSS, images, subfolders, etc.)

### Subdirectories Are Supported! ✅

You can organize your plugin with subdirectories:

```
my-plugin.zip
├── plugin.json
├── index.js
├── README.md
├── frontend/
│   ├── components/
│   │   ├── MyComponent.tsx
│   │   └── styles.css
│   └── assets/
│       └── logo.png
├── utils/
│   └── helpers.js
└── database/
    └── schema.sql
```

All files and subdirectories will be preserved when the plugin is extracted.

## plugin.json Schema

The `plugin.json` file contains metadata about your plugin:

```json
{
  "name": "equipment-maintenance",
  "displayName": "Equipment Maintenance",
  "version": "1.0.0",
  "description": "Track and schedule equipment maintenance",
  "author": "Your Company Name",
  "category": "operations",
  "isOfficial": false
}
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Unique identifier (lowercase, hyphens only, no spaces) |
| `displayName` | string | Human-readable name shown in UI |
| `version` | string | Semantic version (e.g., "1.0.0") |
| `description` | string | Brief description of plugin functionality |

### Optional Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `author` | string | "Unknown" | Plugin author/company name |
| `category` | string | "general" | Plugin category (operations, reporting, time-tracking, etc.) |
| `isOfficial` | boolean | false | Whether this is an official plugin |

## Creating a Plugin Package

### Step 1: Prepare Your Files

```
my-plugin/
├── index.js          # Main plugin code
├── plugin.json       # Metadata
└── README.md         # Documentation
```

### Step 2: Create plugin.json

```json
{
  "name": "my-plugin",
  "displayName": "My Plugin",
  "version": "1.0.0",
  "description": "My custom plugin for field service",
  "author": "Your Company",
  "category": "general"
}
```

### Step 3: Create index.js

```javascript
// index.js
module.exports = {
  name: 'my-plugin',
  version: '1.0.0',
  
  routes: [
    {
      method: 'GET',
      path: '/status',
      handler: (req, res) => {
        res.json({ status: 'active' });
      }
    }
  ],
  
  // Optional: Add ticket tabs
  ticketTabs: [
    {
      id: 'my-plugin-tab',
      label: 'My Plugin',
      componentId: 'my-plugin-component'
    }
  ],
  
  // Optional: Add report component
  reportComponent: {
    componentId: 'my-plugin-report',
    label: 'My Plugin Report'
  },
  
  // Optional: Lifecycle hooks
  hooks: {
    onInstall: async (tenantId, pool) => {
      console.log(`Plugin installed for ${tenantId}`);
    },
    onUninstall: async (tenantId, pool) => {
      console.log(`Plugin uninstalled for ${tenantId}`);
    }
  }
};
```

### Step 4: Create ZIP File

**Windows:**
1. Select all files (index.js, plugin.json, README.md)
2. Right-click → Send to → Compressed (zipped) folder
3. Name it `my-plugin.zip`

**macOS:**
1. Select all files
2. Right-click → Compress Items
3. Rename to `my-plugin.zip`

**Command Line:**
```bash
zip -r my-plugin.zip index.js plugin.json README.md
```

## Uploading a Plugin

### Via Plugin Manager (Recommended)

1. Log in as a System Admin
2. Navigate to **Plugins** tab
3. Click **📦 Upload Plugin** button
4. Select your `.zip` file
5. Click **Upload**
6. **Restart the server** to load the new plugin
7. Click **Install** to enable it for your company

### Via SQL (Advanced Users Only)

Not recommended. Use the upload interface instead.

## Validation Rules

The upload system validates:

✅ File must be a `.zip` archive
✅ Must contain `index.js`
✅ Must contain `plugin.json`
✅ plugin.json must have: name, displayName, version, description
✅ Plugin name must be unique (not already registered)
✅ index.js must be valid JavaScript

## Plugin Naming Conventions

### Plugin Name (name field)
- Lowercase letters only
- Use hyphens to separate words
- No spaces or special characters
- Examples: `time-clock`, `equipment-maintenance`, `custom-reports`

### Display Name (displayName field)
- Title case
- Can include spaces
- Human-readable
- Examples: "Time Clock", "Equipment Maintenance", "Custom Reports"

## Categories

Recommended category values:
- `time-tracking` - Time and attendance
- `operations` - Field operations and logistics
- `reporting` - Reports and analytics
- `integrations` - Third-party integrations
- `communications` - Messaging and notifications
- `general` - Other/miscellaneous

## Example: Complete Equipment Maintenance Plugin

**plugin.json:**
```json
{
  "name": "equipment-maintenance",
  "displayName": "Equipment Maintenance",
  "version": "1.0.0",
  "description": "Track equipment maintenance schedules and history",
  "author": "DCPSP",
  "category": "operations",
  "isOfficial": false
}
```

**index.js:**
```javascript
module.exports = {
  name: 'equipment-maintenance',
  version: '1.0.0',
  
  routes: [
    {
      method: 'GET',
      path: '/schedules',
      handler: async (req, res) => {
        const companyCode = req.headers['x-company-code'];
        // Fetch maintenance schedules
        res.json({ schedules: [] });
      }
    },
    {
      method: 'POST',
      path: '/schedule',
      handler: async (req, res) => {
        // Create maintenance schedule
        res.json({ success: true });
      }
    }
  ],
  
  ticketTabs: [
    {
      id: 'equipment-maintenance',
      label: 'Equipment',
      componentId: 'equipment-maintenance-tab'
    }
  ],
  
  hooks: {
    onInstall: async (tenantId, pool) => {
      // Create tables if needed
      await pool.request()
        .input('companyCode', tenantId)
        .query(`
          IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'EquipmentMaintenance')
          BEGIN
            CREATE TABLE EquipmentMaintenance (
              id INT IDENTITY PRIMARY KEY,
              companyCode NVARCHAR(50),
              equipmentId NVARCHAR(100),
              maintenanceDate DATETIME,
              notes NVARCHAR(MAX)
            )
          END
        `);
    }
  }
};
```

**README.md:**
```markdown
# Equipment Maintenance Plugin

Track and schedule equipment maintenance for your field service operations.

## Features
- Maintenance scheduling
- Equipment history tracking
- Automated reminders

## Installation
Upload via Plugin Manager and restart server.

## Usage
Access the Equipment tab in ticket modals.
```

## Troubleshooting

### "plugin.json not found in ZIP file"
- Ensure plugin.json is in the **root** of the ZIP, not in a subfolder
- Check file name is exactly `plugin.json` (lowercase)

### "index.js not found in ZIP file"
- Ensure index.js is in the **root** of the ZIP
- Check file name is exactly `index.js` (lowercase)

### "Plugin with name 'X' already exists"
- Change the `name` field in plugin.json to something unique
- Or uninstall/delete the existing plugin first

### "Only .zip files are allowed"
- File must have `.zip` extension
- Some browsers may add `.txt` - rename if needed

### Plugin uploaded but not appearing
- **Restart the server** - new plugins are loaded on startup
- Check server logs for errors
- Verify plugin appears in GlobalPlugins database table

## Best Practices

1. **Version Control**: Increment version number for updates
2. **Testing**: Test plugins thoroughly before distribution
3. **Documentation**: Include detailed README.md
4. **Dependencies**: Document any required database tables
5. **Error Handling**: Add try-catch blocks in all handlers
6. **Logging**: Use console.log for debugging
7. **Tenant Isolation**: Always filter by companyCode
8. **Security**: Validate all inputs

## Next Steps

After uploading:
1. ✅ Plugin uploaded successfully
2. 🔄 **Restart server** (required)
3. 📥 Click **Install** in Plugin Manager
4. ✅ Plugin now active for your company
5. 🎨 Add frontend components if needed

## Additional Resources

- **[Plugin Frontend Components Guide](PLUGIN-FRONTEND-COMPONENTS.md)** - CSS guidelines and component registration
- **[Plugin Development Guide](docs/PLUGIN-DEVELOPMENT-GUIDE.md)** - Full API reference
- **Example Plugin**: Check `server/plugins/time-clock/` for complete example
- **Database Schema**: Review `GlobalPlugins` and `TenantPluginInstallations` tables
