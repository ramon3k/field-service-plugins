# Plugin Navigation Tabs - Implementation Summary

## What We've Built

The plugin navigation tabs feature is now **fully functional** (with placeholder rendering). Plugins can add custom tabs to the main navigation bar that appear alongside core tabs like Tickets, Map, Calendar, etc.

## Implementation Status

### ✅ Backend - Complete
- **PluginManager.getNavTabs()** method implemented
- **API endpoint** `/api/plugins/nav-tabs` functional
- **Role-based filtering** working
- **Multi-tab support** per plugin (array of tabs)

### ✅ Frontend - Complete  
- **Nav.tsx** fetches plugin tabs from API
- **Nav.tsx** filters tabs by user role
- **Nav.tsx** displays plugin tabs in navigation bar
- **App.tsx** renders content area for plugin tabs
- **Tab state management** working (clicking tabs switches content)

### ⚠️ Component Loading - Placeholder
- Currently shows **placeholder div** with plugin info
- Dynamic React component loading **not yet implemented**
- Workarounds available (see documentation)

## Files Changed

### Backend
1. **server/routes/plugin-routes.js**
   - Added `/api/plugins/nav-tabs` endpoint
   - Returns tabs from `pluginManager.getNavTabs()`

### Frontend
2. **src/components/Nav.tsx**
   - Added `useEffect` to fetch plugin tabs
   - Added role filtering logic
   - Merged plugin tabs with core tabs

3. **src/App.tsx**
   - Added `pluginNavTabs` state
   - Added `useEffect` to fetch plugin tabs
   - Changed tab type to accept strings (not just hardcoded union)
   - Added plugin tab rendering with placeholder

### Documentation
4. **PLUGIN-NAV-TABS.md**
   - Complete developer guide
   - API reference
   - Working VAMP plugin example
   - Troubleshooting section

## How It Works

### 1. Plugin Defines Nav Tabs

```javascript
// server/plugins/vamp-plugin/index.js
module.exports = {
  name: 'vamp-plugin',
  navTabs: [
    {
      id: 'vamp-main',
      label: 'VAMP',
      icon: '🎵',
      componentId: 'vamp-dashboard',
      roles: ['Admin', 'SystemAdmin', 'Coordinator']
    }
  ]
}
```

### 2. Backend Exposes Tabs

```
GET /api/plugins/nav-tabs
→ PluginManager.getNavTabs()
→ Returns array of tabs from all enabled plugins
```

### 3. Frontend Fetches & Displays

```typescript
// Nav.tsx fetches tabs
useEffect(() => {
  fetch('/api/plugins/nav-tabs')
    .then(data => setPluginTabs(data.tabs))
}, [currentUser])

// Filters by role
const allowedTabs = pluginTabs.filter(tab => 
  !tab.roles || tab.roles.includes(currentUser.role)
)

// Displays in navigation
{tabs.map(t => <button>{t}</button>)}
```

### 4. App Renders Content

```typescript
// App.tsx renders placeholder when tab is active
{pluginNavTabs.map(pluginTab => {
  if (tab === pluginTab.label) {
    return (
      <div id={`plugin-nav-${pluginTab.componentId}`}>
        <h2>{pluginTab.icon} {pluginTab.label}</h2>
        <p>Plugin component: {pluginTab.componentId}</p>
      </div>
    )
  }
})}
```

## Testing Steps

### 1. Create VAMP Plugin

```bash
# Create directory
mkdir server/plugins/vamp-plugin

# Create index.js with navTabs (see PLUGIN-NAV-TABS.md for example)
```

### 2. Restart Server

```bash
npm start
```

### 3. Install & Enable

1. Go to **Plugins** tab (must be Admin/SystemAdmin)
2. Find **VAMP** in plugin list
3. Click **Install**
4. Click **Enable**

### 4. See Tab in Navigation

1. Refresh the page or click **Reload Plugins**
2. You should see **🎵 VAMP** tab in the navigation bar
3. Click it to see the placeholder

## Expected Behavior

### ✅ What Works Now

- **Tab appears** in navigation if plugin is enabled
- **Tab is clickable** and switches content
- **Role filtering** - only users with matching roles see the tab
- **Multiple tabs** per plugin supported
- **Placeholder renders** with plugin info and componentId
- **Icons display** if specified (emojis work great)

### ⚠️ What Shows Placeholder

- **Plugin UI component** - shows placeholder div instead of actual component
- You'll see:
  ```
  🎵 VAMP
  Plugin component: vamp-dashboard
  From plugin: vamp-plugin
  Plugin UI components will be loaded here.
  ```

### 🔮 Future Enhancements

- **Dynamic component loading** - Load React components from plugin bundles
- **Component registry** - Global registry for plugin components
- **Hot reload** - Update plugin tabs without page refresh
- **Advanced routing** - Sub-routes within plugin tabs
- **Plugin assets** - Serve CSS, images from plugins

## Troubleshooting

### Tab doesn't appear

1. ✅ Plugin installed? Go to Plugins tab → check status
2. ✅ Plugin enabled for your company?
3. ✅ User role matches `roles` array? (or `roles` is empty/omitted)
4. ✅ Server restarted after creating plugin?
5. ✅ Browser refreshed or "Reload Plugins" clicked?

### API returns empty tabs array

```bash
# Check this endpoint:
curl http://localhost:5000/api/plugins/nav-tabs

# Should return:
{ "tabs": [ { "pluginId": "vamp-plugin", ... } ] }

# If empty:
# - Plugin not loaded (check server logs)
# - Plugin not enabled (check TenantPluginInstallations table)
# - navTabs property missing or wrong format
```

### Common mistakes

- ❌ Using `navTab` (singular) instead of `navTabs` (array)
- ❌ Wrong role names (case-sensitive: `'Admin'` not `'admin'`)
- ❌ Forgetting to enable plugin after installing
- ❌ Not restarting server after plugin changes

## Documentation

Complete developer documentation: **[PLUGIN-NAV-TABS.md](./PLUGIN-NAV-TABS.md)**

Includes:
- Full API reference
- Complete working VAMP example
- Frontend component guide
- Troubleshooting checklist
- Property reference tables

## API Reference

### GET /api/plugins/nav-tabs

**Headers:**
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
      "pluginId": "vamp-plugin",
      "id": "vamp-main",
      "label": "VAMP",
      "icon": "🎵",
      "componentId": "vamp-dashboard",
      "roles": ["Admin", "SystemAdmin", "Coordinator"]
    }
  ]
}
```

## Next Steps

### For Plugin Developers

1. Read **PLUGIN-NAV-TABS.md** for complete guide
2. Use the VAMP example as a template
3. Create your plugin with `navTabs` array
4. Test with different user roles
5. Build plugin API routes for data

### For System Enhancement

Future improvements needed:
1. **Component registry system** for dynamic loading
2. **Plugin bundler** to compile React components
3. **Asset serving** for plugin CSS/images
4. **Advanced routing** for sub-pages
5. **Plugin development toolkit** with hot reload

## Summary

**Current State:** Plugin navigation tabs are **fully functional** with placeholder rendering.

**What Works:**
- Backend API ✅
- Tab display ✅  
- Role filtering ✅
- Tab switching ✅
- Multi-tab support ✅

**What's Placeholder:**
- Component loading (shows placeholder with plugin info)

**How to Use:**
1. Add `navTabs` array to plugin manifest
2. Install and enable plugin
3. Tab appears in navigation
4. Click tab to see placeholder
5. Use plugin API routes for functionality

**Documentation:** See PLUGIN-NAV-TABS.md for complete developer guide.
