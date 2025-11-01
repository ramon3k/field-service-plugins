# Plugin Component Registration Guide

## Overview

The Field Service app now uses **automatic component registration** for plugin frontend components:

1. **Auto-Discovery** ✅ (CURRENT): Components in `src/components/plugins/` are automatically discovered and registered
2. **Manual Registration** (legacy): Components can still be manually registered in `PluginComponentRegistry.tsx` if needed
3. **Runtime Registration**: Plugins can register components dynamically via API

---

## Quick Start: Installing a Plugin with Frontend

### Step 1: Upload & Install Plugin

1. Go to **Plugins** tab in the UI
2. Click **📦 Upload Plugin**
3. Select your `.zip` file containing the plugin
4. After upload, restart the server
5. Click **Install** to enable the plugin for your company

### Step 2: Copy Frontend Files (if plugin has them)

If your plugin ZIP contains a `frontend/` folder with `.tsx` and `.css` files:

```bash
# Copy component files to the plugins directory
cp server/plugins/your-plugin/frontend/*.tsx src/components/plugins/
cp server/plugins/your-plugin/frontend/*.css src/components/plugins/
```

### Step 3: Rebuild App

```bash
npm run build
# or for development
npm run dev
```

**That's it!** The component is automatically registered. No manual code changes needed.

---

## How Auto-Discovery Works

The system automatically scans `src/components/plugins/` directory for `.tsx` files and registers them:

**File naming convention:**
- `InstantMessenger.tsx` → component ID: `instant-messenger-page`
- `VampDeviceManager.tsx` → component ID: `vamp-device-manager-page`
- `MyCustomPlugin.tsx` → component ID: `my-custom-plugin-page`

**The system:**
1. Converts CamelCase filenames to kebab-case
2. Adds `-page` suffix automatically
3. Registers the component at build time

---

## Old Method: Manual Registration (Legacy)

You can still manually register components if needed:

---

## Old Method: Manual Registration (Legacy)

You can still manually register components if needed:

### Step 1: Copy Component Files

```bash
cp server/plugins/instant-messenger/frontend/InstantMessenger.tsx src/components/plugins/
cp server/plugins/instant-messenger/frontend/InstantMessenger.css src/components/plugins/
```

### Step 2: Rebuild App (Auto-Registration Happens)

```bash
npm run build
```

The component is now automatically registered! No manual code changes needed.

### Step 3 (Optional): Manual Override

If you need to manually control the registration, edit `PluginComponentRegistry.tsx`:

```typescript
// 1. Import the component at the top
import InstantMessenger from './InstantMessenger';

// 2. Add to MANUAL_COMPONENTS registry
const MANUAL_COMPONENTS: Record<string, ComponentType<PluginComponentProps>> = {
  // ... existing components ...
  
  // Your plugin
  'instant-messenger-page': InstantMessenger,
};
```

### Step 3 (Optional): Manual Override

If you need to manually control the registration, edit `PluginComponentRegistry.tsx`:

```typescript
// 1. Import the component at the top
import InstantMessenger from './InstantMessenger';

// 2. Add to MANUAL_COMPONENTS registry (overrides auto-discovery)
const MANUAL_COMPONENTS: Record<string, ComponentType<PluginComponentProps>> = {
  // Manual registration (takes precedence over auto-discovery)
  'instant-messenger-page': InstantMessenger,
};
```

**Note:** Manual registration overrides auto-discovery for that component ID.

---

## Troubleshooting

### Component Not Loading After Installation

1. **Check files were copied:**
   ```bash
   ls src/components/plugins/
   # Should show your .tsx and .css files
   ```

2. **Check build output:**
   ```bash
   npm run build
   # Should show "✅ Auto-registered plugin component: your-component-page"
   ```

3. **Check componentId matches:**
   - File: `InstantMessenger.tsx`
   - Auto-generated ID: `instant-messenger-page`
   - Plugin's navTab or pageComponent should use: `instant-messenger-page`

4. **Rebuild after adding files:**
   ```bash
   npm run build
   # or restart dev server
   npm run dev
   ```

### Placeholder Still Showing

If you see "Plugin Component Not Found" after copying files:

1. Make sure the component file exports a default component:
   ```typescript
   export default function MyPlugin({ currentUser, companyCode }: PluginComponentProps) {
     // ...
   }
   ```

2. Ensure the filename matches what the plugin expects:
   - Plugin wants: `my-custom-plugin-page`
   - Filename should be: `MyCustomPlugin.tsx`

3. Clear build cache and rebuild:
   ```bash
   rm -rf dist/
   npm run build
   ```

---

## Runtime Registration (Advanced)

Plugins can register components at runtime using the API:

```typescript
import { registerPluginComponent } from './PluginComponentRegistry';

// Dynamically loaded component
const MyDynamicComponent = lazy(() => import('./remote-components/MyPlugin'));

// Register it
registerPluginComponent('my-dynamic-plugin', MyDynamicComponent);
```

This is useful for:
- Hot-reloadable plugins
- Remote plugin components loaded from CDN
- A/B testing different component versions

---

## Component Requirements

All plugin components must:

1. **Accept `PluginComponentProps`**:
   ```typescript
   interface PluginComponentProps {
     currentUser: any;
     companyCode: string;
     pluginId: string;
     componentId: string;
   }
   ```

2. **Export as default**:
   ```typescript
   export default function MyPlugin({ currentUser, companyCode }: PluginComponentProps) {
     return <div>My Plugin</div>;
   }
   ```

3. **Use scoped CSS** (prefix all classes to avoid conflicts):
   ```css
   /* MyPlugin.css */
   .mp-container { /* mp- prefix for "MyPlugin" */ }
   .mp-header { }
   .mp-button { }
   ```

---

## Dark Theme Compatibility

The app uses a dark theme with these CSS variables:

```css
:root { 
  --bg: #0b1220;           /* Dark background */
  --card: #111a2b;         /* Card background */
  --muted: #a8b3cf;        /* Muted text */
  --text: #e5ecff;         /* Primary text */
  --accent: #4aa8ff;       /* Accent blue */
  --ok: #37d67a;           /* Success green */
  --warn: #ffaf38;         /* Warning orange */
  --danger: #ff5470;       /* Error red */
}
```

**Always style your plugin components to match the dark theme!**

Example:
```css
.my-plugin-container {
  background: var(--card);
  color: var(--text);
  border: 1px solid #1b2740;
}

.my-plugin-button {
  background: linear-gradient(180deg, #2a6fff, #1a4bd6);
  color: #ffffff;
  border: 1px solid #2d5fe0;
}
```

---

## Troubleshooting

### Component Not Showing?

1. **Check registration**: Is it in `MANUAL_COMPONENTS`?
2. **Check componentId**: Does `plugin.json` match the registry key?
3. **Check import**: Is the import path correct?
4. **Check console**: Look for "Plugin component not found" warnings

### White Text on White Background?

Your component isn't using the dark theme. Update your CSS to use dark backgrounds and light text.

### WebSocket Connection Failed?

The global notification service (port 8081) must be running:
```bash
# Check if it's started
curl http://localhost:8081/health

# If not running, restart the API server
npm run start:api
```

---

## Example: Complete Plugin Installation

```bash
# 1. Upload plugin via UI
# (Plugins → Upload Plugin → Select instant-messenger.zip → Upload)

# 2. Restart server to load the plugin
cd server
node api.cjs

# 3. Install plugin via UI
# (Plugins → Find "Instant Messenger" → Click Install)

# 4. Copy frontend files to plugins directory
cp server/plugins/instant-messenger/frontend/InstantMessenger.tsx src/components/plugins/
cp server/plugins/instant-messenger/frontend/InstantMessenger.css src/components/plugins/

# 5. Rebuild app (components are auto-registered!)
npm run build

# 6. Refresh browser - plugin is now active!
```

**No manual code editing required!** The component is automatically discovered and registered.

---

## Benefits of Auto-Discovery

✅ **No Code Editing** - Just copy files and rebuild
✅ **Less Error-Prone** - No manual registration mistakes  
✅ **Faster Installation** - 3 steps instead of 5
✅ **Convention Over Configuration** - Standard naming = automatic registration
✅ **Still Flexible** - Manual override available if needed

---

## Benefits of Auto-Discovery

✅ **No Code Editing** - Just copy files and rebuild
✅ **Less Error-Prone** - No manual registration mistakes  
✅ **Faster Installation** - 3 steps instead of 5
✅ **Convention Over Configuration** - Standard naming = automatic registration
✅ **Still Flexible** - Manual override available if needed

---

## Implementation Details

### File: `auto-register.ts`

Scans `src/components/plugins/*.tsx` files and automatically registers them:

```typescript
// Vite's glob import finds all .tsx files
const modules = import.meta.glob('./*.tsx', { eager: true });

// Convert filename to component ID
// InstantMessenger.tsx → instant-messenger-page
```

### File: `PluginComponentRegistry.tsx`

Uses auto-registration at startup:

```typescript
import { autoRegisterPluginComponentsSync } from './auto-register';

const AUTO_DISCOVERED_COMPONENTS = autoRegisterPluginComponentsSync();
```

### Naming Convention

| Filename | Component ID |
|----------|--------------|
| `InstantMessenger.tsx` | `instant-messenger-page` |
| `VampDeviceManager.tsx` | `vamp-device-manager-page` |
| `MyCustomPlugin.tsx` | `my-custom-plugin-page` |
| `TimeClock.tsx` | `time-clock-page` |

**Rule:** CamelCase → kebab-case + `-page` suffix

---
