// Plugin Manager for Field Service Management System
// Handles plugin loading, lifecycle, and hook execution

const fs = require('fs');
const path = require('path');

class PluginManager {
  constructor(pool) {
    this.pool = pool;
    this.loadedPlugins = new Map(); // PluginID -> Plugin Instance
    this.hooks = new Map(); // HookName -> Array of handlers
    this.pluginsDir = path.join(__dirname, 'plugins');
    this.initialized = false;
  }

  /**
   * Initialize the plugin system
   * Loads plugin metadata from database and initializes enabled plugins
   */
  async initialize(companyCode) {
    try {
      console.log('🔌 Initializing plugin system...');
      
      // Ensure plugins directory exists
      if (!fs.existsSync(this.pluginsDir)) {
        fs.mkdirSync(this.pluginsDir, { recursive: true });
        console.log('📁 Created plugins directory:', this.pluginsDir);
      }

      // Load enabled plugins for this company
      const enabledPlugins = await this.getEnabledPlugins(companyCode);
      console.log(`📦 Found ${enabledPlugins.length} enabled plugins for ${companyCode}`);

      if (enabledPlugins.length === 0) {
        console.log('ℹ️  No plugins enabled - plugin system ready but inactive');
        this.initialized = true;
        return; // Exit early if no plugins
      }

      // Load each plugin
      for (const pluginMeta of enabledPlugins) {
        await this.loadPlugin(pluginMeta, companyCode);
      }

      this.initialized = true;
      console.log(`✅ Plugin system initialized successfully`);
      console.log(`🎉 Loaded ${this.loadedPlugins.size} plugins for tenant: ${companyCode}`);
      
    } catch (error) {
      console.error('❌ Failed to initialize plugin system:', error);
      // Don't throw - allow app to continue without plugins
      console.warn('⚠️  Continuing without plugins...');
      this.initialized = true;
    }
  }

  /**
   * Get all enabled plugins for a company from database
   */
  async getEnabledPlugins(companyCode) {
    const result = await this.pool.request()
      .input('companyCode', companyCode)
      .query(`
        SELECT 
          gp.id as PluginID,
          gp.name as PluginName,
          gp.displayName,
          gp.version as Version,
          gp.description as Description,
          gp.category as Category,
          tpi.configuration as ConfigurationJSON,
          tpi.isEnabled as IsEnabled
        FROM GlobalPlugins gp
        INNER JOIN TenantPluginInstallations tpi 
          ON gp.id = tpi.pluginId
        WHERE tpi.tenantId = @companyCode
          AND tpi.isEnabled = 1
        ORDER BY gp.displayName
      `);
    
    return result.recordset;
  }

  /**
   * Load a single plugin
   */
  async loadPlugin(pluginMeta, companyCode) {
    try {
      const pluginId = pluginMeta.PluginID;
      const pluginName = pluginMeta.PluginName; // Use plugin name (folder name), not GUID
      const pluginPath = path.join(this.pluginsDir, pluginName, 'index.js');

      // Check if plugin file exists
      if (!fs.existsSync(pluginPath)) {
        console.warn(`⚠️ Plugin file not found: ${pluginPath}`);
        return;
      }

      // Clear require cache to ensure fresh plugin code is loaded
      if (require.cache[require.resolve(pluginPath)]) {
        delete require.cache[require.resolve(pluginPath)];
      }

      // Load plugin module
      const pluginModule = require(pluginPath);
      
      // Parse configuration
      const config = pluginMeta.ConfigurationJSON 
        ? JSON.parse(pluginMeta.ConfigurationJSON) 
        : {};

      // Support both class-based and object-based plugins
      let plugin;
      if (typeof pluginModule === 'function') {
        // Class-based plugin
        plugin = new pluginModule({
          id: pluginId,
          name: pluginMeta.PluginName,
          version: pluginMeta.Version,
          config,
          companyCode,
          pool: this.pool
        });
      } else if (typeof pluginModule === 'object') {
        // Object-based plugin (add metadata)
        plugin = {
          ...pluginModule,
          id: pluginId,
          name: pluginModule.name || pluginMeta.PluginName,
          version: pluginModule.version || pluginMeta.Version,
          config,
          companyCode,
          pool: this.pool
        };
      } else {
        console.error(`❌ Invalid plugin format for ${pluginId}`);
        return;
      }

      // Initialize plugin
      if (typeof plugin.initialize === 'function') {
        await plugin.initialize();
      }

      // Register plugin hooks
      if (plugin.hooks && typeof plugin.hooks === 'object') {
        for (const [hookName, handler] of Object.entries(plugin.hooks)) {
          this.registerHook(hookName, handler, pluginName);
        }
      }

      // Store loaded plugin using plugin name as key (e.g., 'time-clock')
      this.loadedPlugins.set(pluginName, plugin);
      console.log(`✅ Loaded plugin: ${pluginMeta.displayName} (${pluginName})`);

    } catch (error) {
      console.error(`❌ Failed to load plugin ${pluginMeta.PluginID}:`, error);
    }
  }

  /**
   * Register a hook handler
   */
  registerHook(hookName, handler, pluginId) {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }
    
    this.hooks.get(hookName).push({
      handler,
      pluginId,
      priority: 100 // Default priority
    });

    console.log(`🪝 Registered hook: ${hookName} for plugin: ${pluginId}`);
  }

  /**
   * Execute all handlers for a specific hook
   */
  async executeHook(hookName, data) {
    if (!this.hooks.has(hookName)) {
      return data; // No handlers registered
    }

    const handlers = this.hooks.get(hookName)
      .sort((a, b) => a.priority - b.priority); // Lower priority runs first

    let result = data;
    
    for (const { handler, pluginId } of handlers) {
      try {
        console.log(`🔄 Executing hook ${hookName} for plugin ${pluginId}`);
        result = await handler(result);
      } catch (error) {
        console.error(`❌ Hook ${hookName} failed for plugin ${pluginId}:`, error);
      }
    }

    return result;
  }

  /**
   * Get a loaded plugin by ID
   */
  getPlugin(pluginId) {
    return this.loadedPlugins.get(pluginId);
  }

  /**
   * Get all loaded plugins
   */
  getAllPlugins() {
    return Array.from(this.loadedPlugins.values());
  }

  /**
   * Get plugin API routes
   * Returns array of {method, path, handler, pluginId} objects
   * Path is relative to /api/plugins/{pluginId}
   */
  getPluginRoutes() {
    const routes = [];
    
    console.log(`🔍 Getting routes from ${this.loadedPlugins.size} loaded plugins...`);
    
    for (const [pluginId, plugin] of this.loadedPlugins) {
      console.log(`  🔍 Checking plugin: ${pluginId}, has routes:`, !!plugin.routes, 'isArray:', Array.isArray(plugin.routes));
      
      if (plugin.routes && Array.isArray(plugin.routes)) {
        console.log(`  📋 Found ${plugin.routes.length} routes in ${pluginId}`);
        for (const route of plugin.routes) {
          // Keep path relative (e.g., '/clock-in') - will be mounted at /api/plugins/{pluginId}
          routes.push({
            ...route,
            pluginId
          });
          console.log(`    ➕ Added route: ${route.method} ${route.path} (will be mounted at /api/plugins/${pluginId}${route.path})`);
        }
      }
    }

    console.log(`🔍 Total routes to register: ${routes.length}`);
    return routes;
  }

  /**
   * Unload a plugin
   */
  async unloadPlugin(pluginId) {
    const plugin = this.loadedPlugins.get(pluginId);
    
    if (!plugin) {
      return;
    }

    // Call plugin cleanup if available
    if (typeof plugin.cleanup === 'function') {
      try {
        await plugin.cleanup();
      } catch (error) {
        console.error(`❌ Plugin cleanup failed for ${pluginId}:`, error);
      }
    }

    // Remove hooks registered by this plugin
    for (const [hookName, handlers] of this.hooks.entries()) {
      const filtered = handlers.filter(h => h.pluginId !== pluginId);
      if (filtered.length === 0) {
        this.hooks.delete(hookName);
      } else {
        this.hooks.set(hookName, filtered);
      }
    }

    // Remove from loaded plugins
    this.loadedPlugins.delete(pluginId);
    console.log(`✅ Unloaded plugin: ${pluginId}`);
  }

  /**
   * Reload a plugin (unload and load again)
   */
  async reloadPlugin(pluginId, companyCode) {
    await this.unloadPlugin(pluginId);
    
    const pluginMeta = await this.pool.request()
      .input('pluginId', pluginId)
      .input('companyCode', companyCode)
      .query(`
        SELECT 
          gp.id as PluginID,
          gp.name as PluginName,
          gp.displayName,
          gp.version as Version,
          gp.description as Description,
          gp.category as Category,
          tpi.configuration as ConfigurationJSON,
          tpi.isEnabled as IsEnabled
        FROM GlobalPlugins gp
        INNER JOIN TenantPluginInstallations tpi 
          ON gp.id = tpi.pluginId
        WHERE gp.id = @pluginId
          AND tpi.tenantId = @companyCode
          AND tpi.isEnabled = 1
      `);

    if (pluginMeta.recordset.length > 0) {
      await this.loadPlugin(pluginMeta.recordset[0], companyCode);
    }
  }

  /**
   * Reload all plugins for a company (useful after enable/disable operations)
   */
  async reloadAllPlugins(companyCode) {
    console.log(`🔄 Reloading all plugins for ${companyCode}...`);
    
    // Unload all currently loaded plugins
    const pluginIds = Array.from(this.loadedPlugins.keys());
    for (const pluginId of pluginIds) {
      await this.unloadPlugin(pluginId);
    }
    
    // Clear module cache for plugin files to get fresh code
    Object.keys(require.cache).forEach(key => {
      if (key.includes('plugins')) {
        delete require.cache[key];
      }
    });
    
    // Re-initialize with current enabled plugins
    const enabledPlugins = await this.getEnabledPlugins(companyCode);
    console.log(`📦 Found ${enabledPlugins.length} enabled plugins for ${companyCode}`);
    
    for (const pluginMeta of enabledPlugins) {
      await this.loadPlugin(pluginMeta, companyCode);
    }
    
    console.log(`✅ Reloaded ${this.loadedPlugins.size} plugins for ${companyCode}`);
  }

  /**
   * Get report components from all loaded plugins
   */
  getReportComponents() {
    const components = [];
    
    for (const [pluginId, plugin] of this.loadedPlugins.entries()) {
      if (plugin.reportComponent) {
        components.push({
          pluginId: pluginId,
          ...plugin.reportComponent
        });
      }
    }
    
    return components;
  }

  /**
   * Get ticket tabs from all loaded plugins
   */
  getTicketTabs() {
    const tabs = [];
    
    for (const [pluginId, plugin] of this.loadedPlugins.entries()) {
      if (plugin.ticketTabs && Array.isArray(plugin.ticketTabs)) {
        for (const tab of plugin.ticketTabs) {
          tabs.push({
            pluginId: pluginId,
            ...tab
          });
        }
      }
    }
    
    return tabs;
  }

  /**
   * Get main navigation tabs from all loaded plugins
   * Each tab: { pluginId, id, label, icon?, componentId, roles? }
   */
  getNavTabs() {
    const tabs = [];

    for (const [pluginId, plugin] of this.loadedPlugins.entries()) {
      if (plugin.navTabs && Array.isArray(plugin.navTabs)) {
        for (const tab of plugin.navTabs) {
          tabs.push({
            pluginId,
            ...tab
          });
        }
      }
    }

    return tabs;
  }
}

module.exports = PluginManager;
