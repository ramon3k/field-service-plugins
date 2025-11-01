/**
 * Automatic Plugin Component Registration
 * 
 * This module automatically discovers and registers plugin components
 * from the plugins directory without requiring manual edits to PluginComponentRegistry.
 */

import { ComponentType } from 'react';
import { PluginComponentProps } from './PluginComponentRegistry';

/**
 * Dynamically import all .tsx files from the current directory
 * and register them as plugin components
 */
export async function autoRegisterPluginComponents(): Promise<Record<string, ComponentType<PluginComponentProps>>> {
  const components: Record<string, ComponentType<PluginComponentProps>> = {};

  // Use Vite's glob import to get all .tsx files except registry files
  const modules = import.meta.glob('./*.tsx', { eager: false });
  
  for (const path in modules) {
    // Skip the registry itself and this file
    if (path.includes('PluginComponentRegistry') || path.includes('auto-register')) {
      continue;
    }

    try {
      // Import the module dynamically
      const module = await modules[path]() as any;
      const component = module.default;

      if (component) {
        // Extract component ID from filename
        // ./InstantMessenger.tsx -> instant-messenger-page
        const fileName = path.replace('./', '').replace('.tsx', '');
        const componentId = fileName
          .replace(/([A-Z])/g, '-$1')  // CamelCase to kebab-case
          .toLowerCase()
          .replace(/^-/, '') + '-page';   // Add -page suffix

        components[componentId] = component;
        console.log(`✅ Auto-registered plugin component: ${componentId} from ${fileName}.tsx`);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to load plugin component from ${path}:`, error);
    }
  }

  return components;
}

/**
 * Synchronous version using eager loading
 * Use this for better performance but requires all components to be present at build time
 */
export function autoRegisterPluginComponentsSync(): Record<string, ComponentType<PluginComponentProps>> {
  const components: Record<string, ComponentType<PluginComponentProps>> = {};

  // Use Vite's glob import with eager: true to load synchronously
  const modules = import.meta.glob('./*.tsx', { eager: true });
  
  for (const path in modules) {
    // Skip the registry itself and this file
    if (path.includes('PluginComponentRegistry') || path.includes('auto-register')) {
      continue;
    }

    try {
      const module = modules[path] as any;
      const component = module.default;

      if (component) {
        // Extract component ID from filename
        const fileName = path.replace('./', '').replace('.tsx', '');
        const componentId = fileName
          .replace(/([A-Z])/g, '-$1')  // CamelCase to kebab-case
          .toLowerCase()
          .replace(/^-/, '') + '-page';   // Add -page suffix

        components[componentId] = component;
        console.log(`✅ Auto-registered plugin component: ${componentId} from ${fileName}.tsx`);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to load plugin component from ${path}:`, error);
    }
  }

  return components;
}
