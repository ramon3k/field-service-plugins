// Plugin Management API Routes
// Provides REST API for managing plugins

const express = require('express');
const router = express.Router();

/**
 * Initialize plugin routes with plugin manager instance
 */
function initializePluginRoutes(app, pluginManager, pool) {
  console.log('🚀 initializePluginRoutes called!');
  console.log('   app type:', typeof app);
  console.log('   app.get type:', typeof app.get);
  console.log('   app.post type:', typeof app.post);
  
  // SIMPLE TEST: Add a test route directly to app
  app.get('/api/plugin-test', (req, res) => {
    console.log('🎯 /api/plugin-test route HIT!');
    res.json({ message: 'Plugin route system is working!' });
  });
  console.log('✅ Registered test route: GET /api/plugin-test');
  
  // Debug route to list all registered routes
  app.get('/api/debug/routes', (req, res) => {
    const routes = [];
    app._router.stack.forEach(middleware => {
      if (middleware.route) {
        routes.push({
          path: middleware.route.path,
          methods: Object.keys(middleware.route.methods)
        });
      } else if (middleware.name === 'router') {
        middleware.handle.stack.forEach(handler => {
          if (handler.route) {
            routes.push({
              path: handler.route.path,
              methods: Object.keys(handler.route.methods)
            });
          }
        });
      }
    });
    res.json({ totalRoutes: routes.length, routes });
  });
  
  // =============================================
  // GET /api/plugins
  // List all available plugins (global catalog)
  // =============================================
  router.get('/', async (req, res) => {
    try {
      const result = await pool.request().query(`
        SELECT 
          id as PluginID,
          name as PluginName,
          displayName,
          version as Version,
          description as Description,
          author,
          category as Category,
          status,
          isOfficial,
          createdAt
        FROM GlobalPlugins
        ORDER BY displayName
      `);

      res.json({ plugins: result.recordset });
    } catch (error) {
      console.error('Error fetching plugins:', error);
      res.status(500).json({ error: 'Failed to fetch plugins' });
    }
  });

  // =============================================
  // GET /api/plugins/installed
  // List installed plugins for current company
  // =============================================
  router.get('/installed', async (req, res) => {
    try {
      const companyCode = req.headers['x-company-code'] || 'DCPSP';

      const result = await pool.request()
        .input('companyCode', companyCode)
        .query(`
          SELECT 
            gp.id as PluginID,
            gp.name as PluginName,
            gp.displayName,
            gp.version as Version,
            gp.description as Description,
            gp.category as Category,
            tpi.isEnabled as IsEnabled,
            tpi.configuration as ConfigurationJSON,
            tpi.installedAt as InstalledAt,
            tpi.installedBy as InstalledBy
          FROM GlobalPlugins gp
          INNER JOIN TenantPluginInstallations tpi 
            ON gp.id = tpi.pluginId
          WHERE tpi.tenantId = @companyCode
          ORDER BY gp.displayName
        `);

      res.json({ plugins: result.recordset });
    } catch (error) {
      console.error('Error fetching installed plugins:', error);
      res.status(500).json({ error: 'Failed to fetch installed plugins' });
    }
  });

  // =============================================
  // POST /api/plugins/:pluginId/install
  // Install a plugin for current company
  // =============================================
  router.post('/:pluginId/install', async (req, res) => {
    try {
      const { pluginId } = req.params;
      const companyCode = req.headers['x-company-code'] || 'DCPSP';
      const userId = req.headers['x-user-id'] || 'system';
      const { configuration } = req.body;

      // Check if plugin exists
      const pluginCheck = await pool.request()
        .input('pluginId', pluginId)
        .query('SELECT id FROM GlobalPlugins WHERE id = @pluginId');

      if (pluginCheck.recordset.length === 0) {
        return res.status(404).json({ error: 'Plugin not found' });
      }

      // Get plugin version
      const pluginInfo = await pool.request()
        .input('pluginId', pluginId)
        .query('SELECT version FROM GlobalPlugins WHERE id = @pluginId');
      
      const version = pluginInfo.recordset[0].version;

      // Install plugin (or update if already installed)
      await pool.request()
        .input('companyCode', companyCode)
        .input('pluginId', pluginId)
        .input('userId', userId)
        .input('version', version)
        .input('config', configuration ? JSON.stringify(configuration) : null)
        .query(`
          IF EXISTS (SELECT 1 FROM TenantPluginInstallations WHERE tenantId = @companyCode AND pluginId = @pluginId)
          BEGIN
            UPDATE TenantPluginInstallations
            SET isEnabled = 1,
                configuration = @config,
                lastActivated = GETDATE(),
                updatedAt = GETDATE()
            WHERE tenantId = @companyCode AND pluginId = @pluginId
          END
          ELSE
          BEGIN
            INSERT INTO TenantPluginInstallations 
              (id, tenantId, pluginId, installedVersion, isEnabled, configuration, installedBy, installedAt)
            VALUES 
              (NEWID(), @companyCode, @pluginId, @version, 1, @config, @userId, GETDATE())
          END
        `);

      // Reload plugin manager for this tenant
      if (pluginManager) {
        await pluginManager.reloadPlugin(pluginId, companyCode);
      }

      res.json({ 
        success: true, 
        message: 'Plugin installed successfully' 
      });
    } catch (error) {
      console.error('Error installing plugin:', error);
      res.status(500).json({ error: 'Failed to install plugin' });
    }
  });

  // =============================================
  // POST /api/plugins/:pluginId/uninstall
  // Uninstall a plugin for current company
  // =============================================
  router.post('/:pluginId/uninstall', async (req, res) => {
    try {
      const { pluginId } = req.params;
      const companyCode = req.headers['x-company-code'] || 'DCPSP';

      // Unload plugin first
      if (pluginManager) {
        await pluginManager.unloadPlugin(pluginId);
      }

      // Delete installation
      await pool.request()
        .input('companyCode', companyCode)
        .input('pluginId', pluginId)
        .query(`
          DELETE FROM TenantPluginInstallations
          WHERE tenantId = @companyCode AND pluginId = @pluginId
        `);

      res.json({ 
        success: true, 
        message: 'Plugin uninstalled successfully' 
      });
    } catch (error) {
      console.error('Error uninstalling plugin:', error);
      res.status(500).json({ error: 'Failed to uninstall plugin' });
    }
  });

  // =============================================
  // POST /api/plugins/:pluginId/enable
  // Enable a plugin
  // =============================================
  router.post('/:pluginId/enable', async (req, res) => {
    try {
      const { pluginId } = req.params;
      const companyCode = req.headers['x-company-code'] || 'DCPSP';

      await pool.request()
        .input('companyCode', companyCode)
        .input('pluginId', pluginId)
        .query(`
          UPDATE TenantPluginInstallations
          SET isEnabled = 1, lastActivated = GETDATE(), updatedAt = GETDATE()
          WHERE tenantId = @companyCode AND pluginId = @pluginId
        `);

      // Reload plugin
      if (pluginManager) {
        await pluginManager.reloadPlugin(pluginId, companyCode);
      }

      res.json({ 
        success: true, 
        message: 'Plugin enabled successfully' 
      });
    } catch (error) {
      console.error('Error enabling plugin:', error);
      res.status(500).json({ error: 'Failed to enable plugin' });
    }
  });

  // =============================================
  // POST /api/plugins/:pluginId/disable
  // Disable a plugin
  // =============================================
  router.post('/:pluginId/disable', async (req, res) => {
    try {
      const { pluginId } = req.params;
      const companyCode = req.headers['x-company-code'] || 'DCPSP';

      // Unload plugin first
      if (pluginManager) {
        await pluginManager.unloadPlugin(pluginId);
      }

      await pool.request()
        .input('companyCode', companyCode)
        .input('pluginId', pluginId)
        .query(`
          UPDATE TenantPluginInstallations
          SET isEnabled = 0, lastDeactivated = GETDATE(), updatedAt = GETDATE()
          WHERE tenantId = @companyCode AND pluginId = @pluginId
        `);

      res.json({ 
        success: true, 
        message: 'Plugin disabled successfully' 
      });
    } catch (error) {
      console.error('Error disabling plugin:', error);
      res.status(500).json({ error: 'Failed to disable plugin' });
    }
  });

  // =============================================
  // PUT /api/plugins/:pluginId/configure
  // Update plugin configuration
  // =============================================
  router.put('/:pluginId/configure', async (req, res) => {
    try {
      const { pluginId } = req.params;
      const companyCode = req.headers['x-company-code'] || 'DCPSP';
      const { configuration } = req.body;

      await pool.request()
        .input('companyCode', companyCode)
        .input('pluginId', pluginId)
        .input('config', JSON.stringify(configuration))
        .query(`
          UPDATE TenantPluginInstallations
          SET configuration = @config, updatedAt = GETDATE()
          WHERE tenantId = @companyCode AND pluginId = @pluginId
        `);

      // Reload plugin with new config
      if (pluginManager) {
        await pluginManager.reloadPlugin(pluginId, companyCode);
      }

      res.json({ 
        success: true, 
        message: 'Plugin configuration updated successfully' 
      });
    } catch (error) {
      console.error('Error configuring plugin:', error);
      res.status(500).json({ error: 'Failed to configure plugin' });
    }
  });

  // Mount the plugin management router FIRST at /api/plugins
  // This will only match routes defined in the router (/, /installed, /:pluginId/install, etc.)
  app.use('/api/plugins', router);
  console.log('✅ Plugin management routes registered at /api/plugins');

  // Mount individual plugin routes AFTER the management router
  // These are more specific paths so they won't be caught by the generic /api/plugins router
  if (pluginManager) {
    const pluginRoutes = pluginManager.getPluginRoutes();
    
    // Group routes by plugin
    const routesByPlugin = {};
    pluginRoutes.forEach(route => {
      if (!routesByPlugin[route.pluginId]) {
        routesByPlugin[route.pluginId] = [];
      }
      routesByPlugin[route.pluginId].push(route);
    });
    
    // Create a router for each plugin and mount it
    Object.entries(routesByPlugin).forEach(([pluginId, routes]) => {
      const pluginRouter = express.Router();
      
      routes.forEach(route => {
        const { method, path, handler } = route;
        const methodLower = method.toLowerCase();
        
        // Register route on plugin router (path is relative, e.g., '/clock-in')
        if (typeof pluginRouter[methodLower] === 'function') {
          pluginRouter[methodLower](path, handler);
          console.log(`  📍 Registered ${method.toUpperCase()} /api/plugins/${pluginId}${path}`);
        }
      });
      
      // Mount the plugin router at /api/plugins/{pluginId}
      app.use(`/api/plugins/${pluginId}`, pluginRouter);
      console.log(`✅ Mounted plugin router at: /api/plugins/${pluginId}`);
    });
    
    console.log(`✅ Registered ${pluginRoutes.length} plugin API routes across ${Object.keys(routesByPlugin).length} plugins`);
  }
}

module.exports = { initializePluginRoutes };
