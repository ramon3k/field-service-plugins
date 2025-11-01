# Plugin Component Registration Guide

## Overview

The Field Service app uses a **hybrid registration system** for plugin frontend components:

1. **Auto-Discovery** (future): Components placed in `src/components/plugins/` will be automatically discovered
2. **Manual Registration** (current): Components must be imported and registered in `PluginComponentRegistry.tsx`
3. **Runtime Registration**: Plugins can register components dynamically via API

---

## Current Method: Manual Registration

### Step 1: Copy Component Files

After installing a plugin with frontend components, copy the component files to your app:

```bash
# Example: instant-messenger plugin
cp server/plugins/instant-messenger/frontend/InstantMessenger.tsx src/components/plugins/
cp server/plugins/instant-messenger/frontend/InstantMessenger.css src/components/plugins/
```

### Step 2: Register in PluginComponentRegistry.tsx

Edit `src/components/plugins/PluginComponentRegistry.tsx`:

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

### Step 3: Rebuild App

```bash
npm run build
# or
npm run dev
```

---

## Future: Auto-Discovery (Planned)

In future versions, simply placing a component file in `src/components/plugins/` will automatically register it:

```
src/components/plugins/
├── MyPlugin.tsx          ← Auto-discovered as 'my-plugin'
├── AnotherPlugin.tsx     ← Auto-discovered as 'another-plugin'
└── PluginComponentRegistry.tsx
```

The build system will scan this directory and generate the registry automatically.

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
# 1. Install plugin
cp instant-messenger.zip server/plugins/
cd server/plugins
unzip instant-messenger.zip

# 2. Copy frontend files
cp instant-messenger/frontend/* ../../src/components/plugins/

# 3. Edit PluginComponentRegistry.tsx
# Add: import InstantMessenger from './InstantMessenger';
# Add to MANUAL_COMPONENTS: 'instant-messenger-page': InstantMessenger

# 4. Rebuild
npm run build

# 5. Restart server
npm run start:api
```

---

## Roadmap

- [ ] Automatic component discovery at build time
- [ ] Hot module replacement for plugin components
- [ ] Plugin component marketplace
- [ ] Component versioning and compatibility checks
- [ ] Sandboxed iframe-based plugins for untrusted code
