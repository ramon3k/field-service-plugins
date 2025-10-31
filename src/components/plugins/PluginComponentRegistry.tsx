/**
 * Plugin Component Registry
 * 
 * This registry maps plugin componentIds to their React components.
 * Plugin developers should register their components here.
 */

import React, { ComponentType, lazy, Suspense } from 'react';

// Import plugin components
import VampDeviceManager from './VampDeviceManager';

// Example of lazy loading (for larger components):
// const TimeClockReport = lazy(() => import('./TimeClockReport'));

// Component props interface - all plugin components receive these
export interface PluginComponentProps {
  currentUser: any;
  companyCode: string;
  pluginId: string;
  componentId: string;
}

// Registry of available plugin components
const PLUGIN_COMPONENTS: Record<string, ComponentType<PluginComponentProps>> = {
  // VAMP Plugin
  'vamp-dashboard': VampDeviceManager,
  'VampDeviceManager': VampDeviceManager,
  
  // Add more plugin components here:
  // 'time-clock-report': TimeClockReport,
  
  // Default fallback component
  'plugin-placeholder': ({ pluginId, componentId }) => (
    <div className="card">
      <h2>🔌 Plugin Component</h2>
      <p><strong>Component ID:</strong> {componentId}</p>
      <p><strong>Plugin ID:</strong> {pluginId}</p>
      <p className="muted">
        This plugin component hasn't been registered yet.
        <br />
        To register, add the component to PluginComponentRegistry.tsx
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
    return PLUGIN_COMPONENTS['plugin-placeholder'];
  }
  
  // Wrap in Suspense for lazy-loaded components
  return (props: PluginComponentProps) => (
    <Suspense fallback={
      <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
        Loading plugin component...
      </div>
    }>
      <Component {...props} />
    </Suspense>
  );
}

/**
 * Register a new plugin component at runtime
 * Useful for plugins that dynamically load their components
 */
export function registerPluginComponent(
  componentId: string, 
  component: ComponentType<PluginComponentProps>
): void {
  PLUGIN_COMPONENTS[componentId] = component;
  console.log(`✅ Registered plugin component: ${componentId}`);
}

/**
 * Check if a component is registered
 */
export function hasPluginComponent(componentId: string): boolean {
  return componentId in PLUGIN_COMPONENTS;
}

export default PLUGIN_COMPONENTS;
