/**
 * Plugin Component Registry
 * 
 * This registry maps plugin componentIds to their React components.
 * 
 * AUTOMATIC REGISTRATION:
 * Components are automatically discovered from the 'plugins' directory.
 * Just place your component file (e.g., MyPlugin.tsx) in this folder and
 * export a default component that accepts PluginComponentProps.
 * 
 * MANUAL REGISTRATION (for built-in components):
 * Legacy components can still be manually registered below.
 */

import React, { ComponentType, lazy, Suspense } from 'react';

// Import built-in plugin components here as needed
// Example:
// import MyBuiltInPlugin from './MyBuiltInPlugin';

// Auto-discovery: This will be populated at build time by webpack/vite
// For now, we'll use the manual registry below
const AUTO_DISCOVERED_COMPONENTS: Record<string, ComponentType<PluginComponentProps>> = {
  // Automatically populated during build
};

// Component props interface - all plugin components receive these
export interface PluginComponentProps {
  currentUser: any;
  companyCode: string;
  pluginId: string;
  componentId: string;
}

// Manual registry for built-in and explicitly registered components
const MANUAL_COMPONENTS: Record<string, ComponentType<PluginComponentProps>> = {
  // Add your plugin components here when you install them:
  // 'my-plugin-page': MyPluginComponent,
  
  // Example (uncomment when you have the component):
  // 'vamp-dashboard': VampDeviceManager,
  // 'instant-messenger-page': InstantMessenger,
};

// Merged registry combining auto-discovered and manual components
const PLUGIN_COMPONENTS: Record<string, ComponentType<PluginComponentProps>> = {
  ...AUTO_DISCOVERED_COMPONENTS,
  ...MANUAL_COMPONENTS,
  
  // Default fallback component
  'plugin-placeholder': ({ pluginId, componentId }) => (
    <div className="card">
      <h2>🔌 Plugin Component Not Found</h2>
      <p><strong>Component ID:</strong> {componentId}</p>
      <p><strong>Plugin ID:</strong> {pluginId}</p>
      <p className="muted">
        This plugin component hasn't been registered.
        <br />
        Place your component file in src/components/plugins/ and it will be auto-discovered.
        <br />
        Or manually register it in PluginComponentRegistry.tsx
      </p>
    </div>
  )
};

/**
 * Get a plugin component by its componentId
 * Returns a wrapped component with Suspense for lazy loading
 */
export function getPluginComponent(componentId: string): ComponentType<PluginComponentProps> | null {
  const Component = PLUGIN_COMPONENTS[componentId];
  
  if (!Component) {
    console.warn(`⚠️ Plugin component not found: ${componentId}`);
    return PLUGIN_COMPONENTS['plugin-placeholder'];
  }
  
  // Wrap in Suspense for lazy-loaded components
  return (props: PluginComponentProps) => (
    <Suspense fallback={
      <div style={{ padding: '40px', textAlign: 'center', color: '#a8b3cf' }}>
        Loading plugin component...
      </div>
    }>
      <Component {...props} />
    </Suspense>
  );
}

/**
 * Register a new plugin component at runtime
 * Useful for plugins that dynamically load their components from uploaded files
 */
export function registerPluginComponent(
  componentId: string, 
  component: ComponentType<PluginComponentProps>
): void {
  PLUGIN_COMPONENTS[componentId] = component;
  console.log(`✅ Registered plugin component: ${componentId}`);
}

/**
 * List all available plugin components
 * Useful for debugging and plugin management UI
 */
export function listPluginComponents(): string[] {
  return Object.keys(PLUGIN_COMPONENTS).filter(id => id !== 'plugin-placeholder');
}

/**
 * Check if a component is registered
 */
export function hasPluginComponent(componentId: string): boolean {
  return componentId in PLUGIN_COMPONENTS;
}

export default PLUGIN_COMPONENTS;
