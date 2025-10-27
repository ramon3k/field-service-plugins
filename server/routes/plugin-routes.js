// Plugin Management API Routes
// Provides REST API for managing plugins

const express = require('express');
const router = express.Router();
const multer = require('multer');
const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed') {
      cb(null, true);
    } else {
      cb(new Error('Only .zip files are allowed'));
    }
  }
});

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
      const { configuration } = req.body || {}; // Configuration is optional

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
  // POST /api/plugins/upload
  // Upload and register a new plugin from a .zip file
  // =============================================
  router.post('/upload', upload.single('plugin'), async (req, res) => {
    let tempDir = null;
    
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      console.log('📦 Plugin upload received:', req.file.originalname);

      // Extract ZIP file
      const zip = new AdmZip(req.file.path);
      tempDir = path.join('uploads', `temp-${Date.now()}`);
      zip.extractAllTo(tempDir, true);

      // Read plugin.json
      const pluginJsonPath = path.join(tempDir, 'plugin.json');
      if (!fs.existsSync(pluginJsonPath)) {
        throw new Error('plugin.json not found in ZIP file');
      }

      const pluginJson = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf8'));

      // Validate required fields
      const required = ['name', 'displayName', 'version', 'description'];
      for (const field of required) {
        if (!pluginJson[field]) {
          throw new Error(`Missing required field in plugin.json: ${field}`);
        }
      }

      // Check if plugin name already exists
      const existingPlugin = await pool.request()
        .input('name', pluginJson.name)
        .query('SELECT id FROM GlobalPlugins WHERE name = @name');

      if (existingPlugin.recordset.length > 0) {
        throw new Error(`Plugin with name '${pluginJson.name}' already exists`);
      }

      // Validate index.js exists
      const indexPath = path.join(tempDir, 'index.js');
      if (!fs.existsSync(indexPath)) {
        throw new Error('index.js not found in ZIP file');
      }

      // Insert into GlobalPlugins
      const result = await pool.request()
        .input('name', pluginJson.name)
        .input('displayName', pluginJson.displayName)
        .input('version', pluginJson.version)
        .input('description', pluginJson.description)
        .input('author', pluginJson.author || 'Unknown')
        .input('category', pluginJson.category || 'general')
        .input('status', 'active')
        .input('isOfficial', pluginJson.isOfficial || false)
        .query(`
          INSERT INTO GlobalPlugins (name, displayName, version, description, author, category, status, isOfficial)
          OUTPUT INSERTED.id, INSERTED.name, INSERTED.displayName, INSERTED.version
          VALUES (@name, @displayName, @version, @description, @author, @category, @status, @isOfficial)
        `);

      const newPlugin = result.recordset[0];
      console.log('✅ Plugin registered in database:', newPlugin);

      // Copy plugin files to server/plugins/{name}/
      const pluginDir = path.join(__dirname, '..', 'plugins', pluginJson.name);
      
      // Remove existing plugin directory if it exists
      if (fs.existsSync(pluginDir)) {
        fs.rmSync(pluginDir, { recursive: true, force: true });
      }

      // Create plugin directory
      fs.mkdirSync(pluginDir, { recursive: true });

      // Copy all files from temp directory to plugin directory
      const files = fs.readdirSync(tempDir);
      files.forEach(file => {
        const srcPath = path.join(tempDir, file);
        const destPath = path.join(pluginDir, file);
        fs.copyFileSync(srcPath, destPath);
      });

      console.log('✅ Plugin files copied to:', pluginDir);

      // Clean up temp files
      fs.rmSync(req.file.path, { force: true });
      fs.rmSync(tempDir, { recursive: true, force: true });

      res.json({
        success: true,
        message: 'Plugin uploaded and registered successfully',
        plugin: newPlugin,
        note: 'Restart the server to load the new plugin'
      });

    } catch (error) {
      console.error('❌ Error uploading plugin:', error);
      
      // Clean up temp files on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.rmSync(req.file.path, { force: true });
      }
      if (tempDir && fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }

      res.status(500).json({
        error: error.message || 'Failed to upload plugin',
        details: error.toString()
      });
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

  // =============================================
  // GET /api/plugins/report-components
  // Get available plugin report components
  // =============================================
  router.get('/report-components', async (req, res) => {
    try {
      if (!pluginManager) {
        return res.json({ components: [] });
      }

      const components = pluginManager.getReportComponents();
      res.json({ components });
    } catch (error) {
      console.error('Error fetching report components:', error);
      res.status(500).json({ error: 'Failed to fetch report components' });
    }
  });

  // =============================================
  // =============================================
  // POST /api/plugins/reload
  // Reload all plugins (refresh plugin system without server restart)
  // =============================================
  router.post('/reload', async (req, res) => {
    try {
      const companyCode = req.headers['x-company-code'] || 'DCPSP';

      if (!pluginManager) {
        return res.status(500).json({ error: 'Plugin manager not available' });
      }

      await pluginManager.reloadAllPlugins(companyCode);

      res.json({ 
        success: true, 
        message: 'All plugins reloaded successfully',
        loadedPlugins: Array.from(pluginManager.loadedPlugins.keys())
      });
    } catch (error) {
      console.error('Error reloading plugins:', error);
      res.status(500).json({ error: 'Failed to reload plugins' });
    }
  });

  // =============================================
  // GET /api/plugins/ticket-tabs
  // Get available plugin ticket tabs
  // =============================================
  router.get('/ticket-tabs', async (req, res) => {
    try {
      if (!pluginManager) {
        return res.json({ tabs: [] });
      }

      const tabs = pluginManager.getTicketTabs();
      res.json({ tabs });
    } catch (error) {
      console.error('Error fetching ticket tabs:', error);
      res.status(500).json({ error: 'Failed to fetch ticket tabs' });
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
      
      // CRITICAL: Check if plugin is enabled before allowing access
      pluginRouter.use(async (req, res, next) => {
        const companyCode = req.headers['x-company-code'] || 'DCPSP';
        
        try {
          // First get the plugin GUID from the name
          const pluginResult = await pool.request()
            .input('pluginName', pluginId)
            .query(`SELECT id FROM GlobalPlugins WHERE name = @pluginName`);
          
          if (!pluginResult.recordset.length) {
            return res.status(404).json({ 
              error: 'Plugin not found',
              message: `Plugin ${pluginId} not found in system.`
            });
          }
          
          const pluginGuid = pluginResult.recordset[0].id;
          
          // Check if plugin is enabled for this company
          const result = await pool.request()
            .input('companyCode', companyCode)
            .input('pluginGuid', pluginGuid)
            .query(`
              SELECT IsEnabled 
              FROM TenantPluginInstallations 
              WHERE TenantId = @companyCode AND PluginId = @pluginGuid
            `);
          
          if (!result.recordset.length || !result.recordset[0].IsEnabled) {
            return res.status(403).json({ 
              error: 'Plugin is disabled',
              message: `The ${pluginId} plugin is currently disabled. Please enable it in the Plugin Manager.`
            });
          }
          
          next();
        } catch (error) {
          console.error(`❌ Error checking plugin status for ${pluginId}:`, error);
          return res.status(500).json({ error: 'Failed to verify plugin status' });
        }
      });
      
      // Add middleware to inject pool into request context
      pluginRouter.use((req, res, next) => {
        // Make sure pool is available in both locations
        req.pool = pool;
        if (!req.app.locals.pool) {
          req.app.locals.pool = pool;
        }
        next();
      });
      
      routes.forEach(route => {
        const { method, path, handler } = route;
        const methodLower = method.toLowerCase();
        
        // Wrap handler to ensure pool is available
        const wrappedHandler = async (req, res, next) => {
          req.pool = pool;
          req.app.locals.pool = pool;
          try {
            await handler(req, res, next);
          } catch (error) {
            console.error(`❌ Error in ${pluginId} ${method} ${path}:`, error);
            if (!res.headersSent) {
              res.status(500).json({ error: 'Internal server error', details: error.message });
            }
          }
        };
        
        // Register route on plugin router (path is relative, e.g., '/clock-in')
        if (typeof pluginRouter[methodLower] === 'function') {
          pluginRouter[methodLower](path, wrappedHandler);
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
