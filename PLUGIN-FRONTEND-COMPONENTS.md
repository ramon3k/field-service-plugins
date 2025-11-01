# Plugin Frontend Components Guide

## Overview

Plugins can provide React components for tabs, reports, and custom UI. This guide explains how to structure frontend components and handle CSS in your plugins.

---

## 🎯 Current Workflow (Manual Registration Required)

### For Plugin Developers

**1. Structure your plugin with frontend files:**

```
my-plugin.zip
├── plugin.json
├── index.js
├── frontend/
│   ├── MyComponent.tsx    # React component
│   └── MyComponent.css     # Component styles
└── README.md
```

**2. Document the registration requirement:**

In your plugin's README.md, include:

```markdown
## Frontend Component Installation

This plugin includes a React component that must be registered in the main application:

1. After uploading and installing the plugin, copy these files:
   - `server/plugins/my-plugin/frontend/MyComponent.tsx` → `src/components/plugins/`
   - `server/plugins/my-plugin/frontend/MyComponent.css` → `src/components/plugins/`

2. Register in `src/components/plugins/PluginComponentRegistry.tsx`:
   ```tsx
   import MyComponent from './MyComponent';
   
   const PLUGIN_COMPONENTS = {
     'my-component-id': MyComponent,
     // ... other components
   };
   ```

3. Restart the frontend dev server (Vite will auto-reload in dev mode)
```

**3. Use the component in your plugin.json:**

```javascript
module.exports = {
  name: 'my-plugin',
  
  navTabs: [
    {
      id: 'my-tab',
      label: 'My Tab',
      icon: '🎯',
      componentId: 'my-component-id',  // Must match registry key
      roles: ['Admin', 'SystemAdmin']
    }
  ]
};
```

---

## 🎨 CSS Guidelines

### Recommended: Scoped CSS with Component-Specific Classes

**✅ BEST PRACTICE:**

```css
/* MyComponent.css */

/* Use a unique prefix for all classes */
.my-plugin-container {
  padding: 20px;
}

.my-plugin-header {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 16px;
}

.my-plugin-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}

.my-plugin-button-primary {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.my-plugin-button-primary:hover {
  background: #0056b3;
}
```

**Component:**

```tsx
import React from 'react';
import './MyComponent.css';

export default function MyComponent({ currentUser, companyCode }) {
  return (
    <div className="my-plugin-container">
      <h2 className="my-plugin-header">My Plugin</h2>
      <div className="my-plugin-card">
        <p>Content here</p>
        <button className="my-plugin-button-primary">
          Action
        </button>
      </div>
    </div>
  );
}
```

### ❌ Avoid Global CSS Selectors

**DON'T DO THIS:**

```css
/* This will affect ALL buttons in the entire app! */
button {
  background: red;
}

/* This will affect all cards everywhere! */
.card {
  border: 5px solid purple;
}

/* Too generic - will clash with other plugins */
.header {
  font-size: 24px;
}
```

### ⚠️ Inline Styles Are Allowed (But Not Preferred)

The linter will warn about inline styles, but they **will work**:

```tsx
// This works, but the linter will warn
<div style={{ padding: '20px', color: '#333' }}>
  Content
</div>
```

**Why the warning exists:**
- Inline styles can't use media queries
- Harder to maintain
- Larger bundle size
- Can't be shared across components

**When inline styles are acceptable:**
- Dynamic values based on props/state
- Prototyping/testing
- Very small components

### 🎯 CSS Naming Convention

Use a unique prefix based on your plugin name:

| Plugin Name | CSS Prefix | Example Class |
|-------------|------------|---------------|
| `time-clock` | `tc-` | `.tc-clock-in-btn` |
| `vamp-plugin` | `vamp-` | `.vamp-device-card` |
| `popup-messenger` | `pm-` | `.pm-chat-window` |
| `equipment-maintenance` | `em-` | `.em-schedule-grid` |

**Example:**

```css
/* time-clock plugin CSS */
.tc-container { }
.tc-status-badge { }
.tc-clock-in-btn { }
.tc-report-table { }
```

---

## 📦 Component Props Interface

All plugin components receive these props:

```tsx
export interface PluginComponentProps {
  currentUser: {
    id: string;
    name: string;
    role: string;
    companyCode: string;
  };
  companyCode: string;
  pluginId: string;
  componentId: string;
}
```

**Example component:**

```tsx
import React from 'react';
import './MyComponent.css';

interface MyComponentProps {
  currentUser: {
    id: string;
    name: string;
    role: string;
    companyCode: string;
  };
  companyCode: string;
  pluginId: string;
  componentId: string;
}

export default function MyComponent({ 
  currentUser, 
  companyCode,
  pluginId,
  componentId 
}: MyComponentProps) {
  return (
    <div className="my-plugin-container">
      <h2>Welcome, {currentUser.name}!</h2>
      <p>Company: {companyCode}</p>
      <p>Plugin ID: {pluginId}</p>
    </div>
  );
}
```

---

## 🔧 Component Types

### 1. Navigation Tab Component

Used in main navigation tabs (appears in sidebar/header).

```javascript
// In plugin's index.js
navTabs: [
  {
    id: 'my-main-tab',
    label: 'My Plugin',
    icon: '📊',
    componentId: 'my-plugin-dashboard',  // Must be registered
    roles: ['Admin', 'SystemAdmin']
  }
]
```

### 2. Ticket Tab Component

Embedded in ticket detail modals.

```javascript
// In plugin's index.js
ticketTabs: [
  {
    id: 'my-ticket-tab',
    label: 'Details',
    componentId: 'my-plugin-ticket-view'  // Must be registered
  }
]
```

### 3. Report Component

Appears in the Reports page.

```javascript
// In plugin's index.js
reportComponent: {
  componentId: 'my-plugin-report',  // Must be registered
  label: 'My Plugin Report'
}
```

---

## 🏗️ Complete Example: Equipment Plugin

### File Structure

```
equipment-plugin.zip
├── plugin.json
├── index.js
├── README.md
├── frontend/
│   ├── EquipmentDashboard.tsx
│   └── EquipmentDashboard.css
└── database/
    └── schema.sql
```

### plugin.json

```json
{
  "name": "equipment-plugin",
  "displayName": "Equipment Manager",
  "version": "1.0.0",
  "description": "Manage equipment inventory and assignments",
  "author": "Your Company",
  "category": "operations"
}
```

### index.js

```javascript
module.exports = {
  name: 'equipment-plugin',
  version: '1.0.0',
  
  navTabs: [
    {
      id: 'equipment-main',
      label: 'Equipment',
      icon: '🔧',
      componentId: 'equipment-dashboard',
      roles: ['Admin', 'SystemAdmin', 'Coordinator']
    }
  ],
  
  routes: [
    {
      method: 'GET',
      path: '/equipment',
      handler: async (req, res) => {
        const companyCode = req.headers['x-company-code'];
        const pool = req.pool || req.app.locals.pool;
        
        const result = await pool.request()
          .input('companyCode', companyCode)
          .query('SELECT * FROM Equipment WHERE CompanyCode = @companyCode');
        
        res.json({ equipment: result.recordset });
      }
    }
  ],
  
  hooks: {
    onInstall: async (tenantId, pool) => {
      console.log(`🔧 Equipment Plugin: Installing for ${tenantId}`);
      // Create tables, etc.
    }
  }
};
```

### frontend/EquipmentDashboard.tsx

```tsx
import React, { useState, useEffect } from 'react';
import './EquipmentDashboard.css';

interface EquipmentDashboardProps {
  currentUser: any;
  companyCode: string;
  pluginId: string;
  componentId: string;
}

export default function EquipmentDashboard({ 
  currentUser, 
  companyCode 
}: EquipmentDashboardProps) {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchEquipment();
  }, [companyCode]);
  
  const fetchEquipment = async () => {
    try {
      const response = await fetch(
        `/api/plugins/equipment-plugin/equipment`,
        {
          headers: {
            'x-company-code': companyCode,
            'x-user-id': currentUser.id
          }
        }
      );
      const data = await response.json();
      setEquipment(data.equipment);
    } catch (error) {
      console.error('Failed to fetch equipment:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <div className="eq-loading">Loading equipment...</div>;
  }
  
  return (
    <div className="eq-container">
      <div className="eq-header">
        <h2 className="eq-title">Equipment Inventory</h2>
        <button className="eq-btn-primary">+ Add Equipment</button>
      </div>
      
      <div className="eq-grid">
        {equipment.map(item => (
          <div key={item.id} className="eq-card">
            <h3 className="eq-card-title">{item.name}</h3>
            <p className="eq-card-status">Status: {item.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### frontend/EquipmentDashboard.css

```css
/* Equipment Plugin Styles - Prefix: eq- */

.eq-container {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.eq-loading {
  padding: 40px;
  text-align: center;
  color: #666;
  font-size: 16px;
}

.eq-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e0e0e0;
}

.eq-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.eq-btn-primary {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.eq-btn-primary:hover {
  background: #0056b3;
}

.eq-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.eq-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  transition: box-shadow 0.2s;
}

.eq-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.eq-card-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.eq-card-status {
  font-size: 14px;
  color: #666;
  margin: 0;
}
```

### README.md

```markdown
# Equipment Manager Plugin

Track and manage equipment inventory for field service operations.

## Features
- Equipment inventory management
- Assignment tracking
- Status monitoring

## Installation

1. Upload `equipment-plugin.zip` via Plugin Manager
2. Restart the server
3. Install for your company

## Frontend Component Setup

**Required:** This plugin includes a React component that must be manually registered.

### Steps:

1. Copy frontend files after plugin installation:
   ```
   server/plugins/equipment-plugin/frontend/EquipmentDashboard.tsx → src/components/plugins/
   server/plugins/equipment-plugin/frontend/EquipmentDashboard.css → src/components/plugins/
   ```

2. Register in `src/components/plugins/PluginComponentRegistry.tsx`:
   ```tsx
   import EquipmentDashboard from './EquipmentDashboard';
   
   const PLUGIN_COMPONENTS = {
     'equipment-dashboard': EquipmentDashboard,
     // ... existing components
   };
   ```

3. Restart frontend (or wait for Vite hot-reload)

## Usage

After setup, the "Equipment" tab will appear in the main navigation.
```

---

## ⚠️ Important Notes

### Manual Registration Is Required

Currently, plugin frontend components **must be manually copied and registered** in `PluginComponentRegistry.tsx`. This is a limitation of the current architecture.

### Why Manual Registration?

1. **Security**: Prevents arbitrary code execution
2. **Build Process**: Vite/React requires components at build time
3. **Type Safety**: TypeScript needs component imports
4. **Bundle Optimization**: Tree-shaking and code splitting

### Future Improvements (Potential)

Possible automation options for future versions:

1. **Build-time Plugin Loader**: Scan plugins directory during build
2. **Dynamic Import System**: Load components at runtime (more complex)
3. **CLI Tool**: `npm run register-plugin <plugin-name>`

---

## 📋 Checklist for Plugin Developers

When creating a plugin with frontend components:

- [ ] Create frontend files in `frontend/` subdirectory
- [ ] Use unique CSS class prefixes (plugin-specific)
- [ ] Import CSS file in your component
- [ ] Define proper TypeScript interfaces
- [ ] Document component registration in README.md
- [ ] Test component with different user roles
- [ ] Verify CSS doesn't conflict with main app
- [ ] Include installation instructions in README

---

## 🆘 Troubleshooting

### Component Not Showing (Placeholder Appears)

**Cause:** Component ID not registered in `PluginComponentRegistry.tsx`

**Solution:**
1. Verify component ID in plugin's `navTabs`/`ticketTabs`
2. Check if component is imported in registry
3. Ensure component ID matches registry key exactly

### CSS Not Applied

**Cause:** CSS file not imported or wrong class names

**Solution:**
1. Add `import './MyComponent.css'` at top of component
2. Verify class names match between CSS and JSX
3. Check browser dev tools for CSS conflicts

### Lint Warnings About Inline Styles

**Cause:** ESLint rule against inline styles

**Solution:**
- Extract to CSS file (preferred)
- OR ignore warning (inline styles still work)
- OR disable rule in component: `/* eslint-disable */`

---

## 📚 Related Documentation

- [Plugin Package Specification](PLUGIN-PACKAGE-SPEC.md)
- [Plugin Navigation Tabs](PLUGIN-NAV-TABS.md)
- [Plugin Upload System](PLUGIN-UPLOAD-SYSTEM.md)
