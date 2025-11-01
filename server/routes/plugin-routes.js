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
    if (app && app._router && Array.isArray(app._router.stack)) {
      app._router.stack.forEach(middleware => {
        if (middleware && middleware.route) {
          routes.push({
            path: middleware.route.path,
            methods: Object.keys(middleware.route.methods)
          });
        } else if (middleware && middleware.name === 'router' && middleware.handle && Array.isArray(middleware.handle.stack)) {
          middleware.handle.stack.forEach(handler => {
            if (handler && handler.route) {
              routes.push({
                path: handler.route.path,
                methods: Object.keys(handler.route.methods)
              });
            }
          });
        }
      });
    }
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
      const companyCode = req.userCompanyCode || req.headers['x-company-code'];
      
      console.log('🔍 GET /installed - companyCode:', companyCode);
      console.log('🔍 GET /installed - headers:', {
        'x-company-code': req.headers['x-company-code'],
        'x-user-id': req.headers['x-user-id']
      });
      console.log('🔍 GET /installed - req.userCompanyCode:', req.userCompanyCode);

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
      
      console.log('🔍 GET /installed - Found', result.recordset.length, 'plugins for', companyCode);
      if (result.recordset.length > 0) {
        console.log('🔍 Installed plugin IDs:', result.recordset.map(p => p.PluginID));
      }

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
      const companyCode = req.userCompanyCode || req.headers['x-company-code'];
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
      const installResult = await pool.request()
        .input('companyCode', companyCode)
        .input('pluginId', pluginId)
        .input('userId', userId)
        .input('version', version)
        .input('config', configuration ? JSON.stringify(configuration) : null)
        .query(`
          DECLARE @isNewInstall BIT = 0;
          
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
            SET @isNewInstall = 1;
            INSERT INTO TenantPluginInstallations 
              (id, tenantId, pluginId, installedVersion, isEnabled, configuration, installedBy, installedAt)
            VALUES 
              (NEWID(), @companyCode, @pluginId, @version, 1, @config, @userId, GETDATE())
          END
          
          SELECT @isNewInstall as isNewInstall
        `);

      const isNewInstall = installResult.recordset[0].isNewInstall;
      console.log(`🔍 Plugin installation - isNewInstall: ${isNewInstall}, pluginId: ${pluginId}`);

      // Load the plugin to get access to its hooks
      const pluginNameResult = await pool.request()
        .input('pluginId', pluginId)
        .query('SELECT name FROM GlobalPlugins WHERE id = @pluginId');
      
      const pluginName = pluginNameResult.recordset[0].name;
      const pluginPath = path.join(__dirname, '..', 'plugins', pluginName, 'index.js');
      console.log(`🔍 Plugin path: ${pluginPath}, exists: ${fs.existsSync(pluginPath)}`);
      
      // Call onInstall hook if this is a new installation
      if (isNewInstall) {
        try {
          if (fs.existsSync(pluginPath)) {
            // Clear require cache
            if (require.cache[require.resolve(pluginPath)]) {
              delete require.cache[require.resolve(pluginPath)];
            }
            
            const pluginModule = require(pluginPath);
            
            // Copy frontend files if they exist
            const frontendPath = path.join(__dirname, '..', 'plugins', pluginName, 'frontend');
            if (fs.existsSync(frontendPath)) {
              console.log(`📂 Frontend folder found for ${pluginName}, copying files...`);
              const targetPath = path.join(__dirname, '..', '..', 'src', 'components', 'plugins');
              
              // Ensure target directory exists
              if (!fs.existsSync(targetPath)) {
                fs.mkdirSync(targetPath, { recursive: true });
              }
              
              // Copy all files from frontend folder
              const files = fs.readdirSync(frontendPath);
              let copiedFiles = [];
              for (const file of files) {
                const sourcePath = path.join(frontendPath, file);
                const destPath = path.join(targetPath, file);
                fs.copyFileSync(sourcePath, destPath);
                copiedFiles.push(file);
                console.log(`✅ Copied ${file} to src/components/plugins/`);
              }
              
              console.log(`� Frontend files copied: ${copiedFiles.join(', ')}`);
              console.log(`⚠️ User must rebuild the app to see frontend components`);
            }
            
            // Call onInstall hook if it exists
            if (pluginModule.hooks && typeof pluginModule.hooks.onInstall === 'function') {
              console.log(`🔧 Calling onInstall hook for ${pluginName}...`);
              await pluginModule.hooks.onInstall(companyCode, pool);
              console.log(`✅ onInstall hook completed for ${pluginName}`);
            }
          }
        } catch (hookError) {
          console.error(`❌ Error calling onInstall hook:`, hookError);
          // Rollback installation
          await pool.request()
            .input('companyCode', companyCode)
            .input('pluginId', pluginId)
            .query('DELETE FROM TenantPluginInstallations WHERE tenantId = @companyCode AND pluginId = @pluginId');
          
          throw new Error(`Installation failed: ${hookError.message}`);
        }
      }

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
      const companyCode = req.userCompanyCode || req.headers['x-company-code'];

      // Get plugin name before uninstalling
      const pluginNameResult = await pool.request()
        .input('pluginId', pluginId)
        .query('SELECT name FROM GlobalPlugins WHERE id = @pluginId');
      
      if (pluginNameResult.recordset.length === 0) {
        return res.status(404).json({ error: 'Plugin not found' });
      }

      const pluginName = pluginNameResult.recordset[0].name;
      const pluginPath = path.join(__dirname, '..', 'plugins', pluginName, 'index.js');

      // Call onUninstall hook before removing from database
      try {
        if (fs.existsSync(pluginPath)) {
          // Clear require cache
          if (require.cache[require.resolve(pluginPath)]) {
            delete require.cache[require.resolve(pluginPath)];
          }
          
          const pluginModule = require(pluginPath);
          
          // Call onUninstall hook if it exists
          if (pluginModule.hooks && typeof pluginModule.hooks.onUninstall === 'function') {
            console.log(`🔧 Calling onUninstall hook for ${pluginName}...`);
            await pluginModule.hooks.onUninstall(companyCode, pool);
            console.log(`✅ onUninstall hook completed for ${pluginName}`);
          }
        }
      } catch (hookError) {
        console.error(`❌ Error calling onUninstall hook:`, hookError);
        // Continue with uninstallation even if hook fails
      }

      // Unload plugin from memory
      if (pluginManager) {
        await pluginManager.unloadPlugin(pluginId);
      }

      // Delete installation from database
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
  // DELETE /api/plugins/:pluginId
  // Delete a plugin completely from the system
  // (Admin only - removes from GlobalPlugins)
  // =============================================
  router.delete('/:pluginId', async (req, res) => {
    try {
      const { pluginId } = req.params;

      // Check if plugin is installed for any tenant
      const installCheck = await pool.request()
        .input('pluginId', pluginId)
        .query('SELECT COUNT(*) as count FROM TenantPluginInstallations WHERE pluginId = @pluginId');

      if (installCheck.recordset[0].count > 0) {
        return res.status(400).json({ 
          error: 'Plugin is still installed for one or more companies. Uninstall from all companies first.' 
        });
      }

      // Get plugin info before deleting
      const pluginInfo = await pool.request()
        .input('pluginId', pluginId)
        .query('SELECT name, displayName FROM GlobalPlugins WHERE id = @pluginId');

      if (pluginInfo.recordset.length === 0) {
        return res.status(404).json({ error: 'Plugin not found' });
      }

      const pluginName = pluginInfo.recordset[0].name;
      const pluginDisplayName = pluginInfo.recordset[0].displayName;

      // Delete from GlobalPlugins (cascade will handle related tables)
      await pool.request()
        .input('pluginId', pluginId)
        .query('DELETE FROM GlobalPlugins WHERE id = @pluginId');

      // Delete plugin files from server/plugins/{name}/
      const fs = require('fs');
      const pluginDir = path.join(__dirname, '..', 'plugins', pluginName);
      if (fs.existsSync(pluginDir)) {
        fs.rmSync(pluginDir, { recursive: true, force: true });
        console.log(`🗑️ Deleted plugin directory: ${pluginDir}`);
      }

      console.log(`✅ Deleted plugin: ${pluginDisplayName} (${pluginName})`);

      res.json({ 
        success: true, 
        message: `Plugin "${pluginDisplayName}" deleted successfully` 
      });
    } catch (error) {
      console.error('Error deleting plugin:', error);
      res.status(500).json({ error: 'Failed to delete plugin' });
    }
  });

  // =============================================
  // POST /api/plugins/:pluginId/enable
  // Enable a plugin
  // =============================================
  router.post('/:pluginId/enable', async (req, res) => {
    try {
      const { pluginId } = req.params;
      const companyCode = req.userCompanyCode || req.headers['x-company-code'];

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

      // Copy all files from temp directory to plugin directory (including subdirectories)
      const copyRecursive = (src, dest) => {
        const entries = fs.readdirSync(src, { withFileTypes: true });
        for (const entry of entries) {
          const srcPath = path.join(src, entry.name);
          const destPath = path.join(dest, entry.name);
          
          if (entry.isDirectory()) {
            fs.mkdirSync(destPath, { recursive: true });
            copyRecursive(srcPath, destPath);
          } else {
            fs.copyFileSync(srcPath, destPath);
          }
        }
      };
      
      copyRecursive(tempDir, pluginDir);

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
      const companyCode = req.userCompanyCode || req.headers['x-company-code'];

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
      const companyCode = req.userCompanyCode || req.headers['x-company-code'];
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
    const warnings = [];
    try {
      let companyCode = req.userCompanyCode || req.headers['x-company-code'];
      console.log('♻️  /api/plugins/reload requested. Header/Context companyCode =', companyCode);

      if (!pluginManager) {
        return res.status(500).json({ error: 'Plugin manager not available' });
      }

      // Fallback: if no company supplied, try to infer a single active tenant
      if (!companyCode) {
        try {
          const guess = await pool.request().query(`
            SELECT TOP 1 TenantId
            FROM TenantPluginInstallations
            WHERE IsEnabled = 1
            ORDER BY InstalledAt DESC
          `);
          if (guess.recordset.length === 1) {
            companyCode = guess.recordset[0].TenantId;
            console.log('🔎 Inferred companyCode for reload:', companyCode);
          } else {
            // As last resort, pick an active company if there is exactly one
            const companies = await pool.request().query(`SELECT CompanyCode FROM Companies WHERE IsActive = 1`);
            if (companies.recordset.length === 1) {
              companyCode = companies.recordset[0].CompanyCode;
              console.log('🔎 Inferred companyCode from Companies:', companyCode);
            }
          }
        } catch (e) {
          warnings.push('Could not infer companyCode automatically');
        }
      }

      if (!companyCode) {
        warnings.push('No companyCode provided; reloading with no tenant context may load 0 plugins');
      }

      try {
        await pluginManager.reloadAllPlugins(companyCode);
      } catch (e) {
        console.error('❌ reloadAllPlugins failed:', e && e.message ? e.message : e);
        warnings.push(e && e.message ? e.message : String(e));
      }

      // Re-register plugin routers so new/updated routes take effect immediately
      try {
        if (typeof req.app.locals.refreshPluginRouters === 'function') {
          req.app.locals.refreshPluginRouters();
        } else {
          const msg = 'refreshPluginRouters not available; plugin routes may be stale until restart';
          console.warn('⚠️', msg);
          warnings.push(msg);
        }
      } catch (e) {
        console.error('❌ Failed to refresh plugin routers:', e && e.message ? e.message : e);
        warnings.push('Failed to refresh plugin routers');
      }

      res.json({ 
        success: true, 
        message: 'Plugins reloaded',
        companyCode: companyCode || null,
        loadedPlugins: Array.from(pluginManager.loadedPlugins.keys()),
        warnings
      });
    } catch (error) {
      console.error('Error reloading plugins (outer):', error);
      res.status(500).json({ error: 'Failed to reload plugins', details: error && error.message ? error.message : String(error) });
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

  // =============================================
  // GET /api/plugins/nav-tabs
  // Get available plugin navigation tabs
  // =============================================
  router.get('/nav-tabs', async (req, res) => {
    try {
      if (!pluginManager) {
        return res.json({ tabs: [] });
      }

      const tabs = pluginManager.getNavTabs();
      res.json({ tabs });
    } catch (error) {
      console.error('Error fetching nav tabs:', error);
      res.status(500).json({ error: 'Failed to fetch nav tabs' });
    }
  });

  // Mount the plugin management router FIRST at /api/plugins
  // This will only match routes defined in the router (/, /installed, /:pluginId/install, etc.)
  app.use('/api/plugins', router);
  console.log('✅ Plugin management routes registered at /api/plugins');

  // Keep track of mounted plugin routers so we can refresh them on reload
  app.locals.pluginRouters = app.locals.pluginRouters || [];

  // Helper to clear existing plugin routers
  const clearPluginRouters = () => {
    if (!app || !app._router || !Array.isArray(app._router.stack)) {
      app.locals.pluginRouters = [];
      return;
    }
    const beforeCount = app._router.stack.length;
    // We may have stored either Layer objects (with .handle) or the Router function itself; remove both kinds
    const toRemove = new Set(
      (app.locals.pluginRouters || []).map(entry => {
        if (entry && typeof entry === 'function') return entry; // Router function
        if (entry && entry.handle) return entry.handle; // Layer
        return null;
      }).filter(Boolean)
    );
    app._router.stack = app._router.stack.filter(layer => {
      // Keep the layer if it doesn't match any stored plugin router
      return !(layer && layer.handle && toRemove.has(layer.handle));
    });
    const afterCount = app._router.stack.length;
    if (beforeCount !== afterCount) {
      console.log(`♻️  Removed ${beforeCount - afterCount} previously mounted plugin routers`);
    }
    app.locals.pluginRouters = [];
  };

  // Helper to mount plugin routers based on currently loaded plugins
  const mountPluginRouters = () => {
    if (!pluginManager) return;
    const pluginRoutes = pluginManager.getPluginRoutes();

    // Group routes by plugin
    const routesByPlugin = {};
    pluginRoutes.forEach(route => {
      if (!routesByPlugin[route.pluginId]) {
        routesByPlugin[route.pluginId] = [];
      }
      routesByPlugin[route.pluginId].push(route);
    });

    Object.entries(routesByPlugin).forEach(([pluginId, routes]) => {
      const pluginRouter = express.Router();

      // CRITICAL: Check if plugin is enabled before allowing access
      pluginRouter.use(async (req, res, next) => {
        const companyCode = req.userCompanyCode || req.headers['x-company-code'];

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
        req.pool = pool;
        if (!req.app.locals.pool) {
          req.app.locals.pool = pool;
        }
        next();
      });

      routes.forEach(route => {
        const { method, path, handler } = route;
        const methodLower = method.toLowerCase();

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

        if (typeof pluginRouter[methodLower] === 'function') {
          pluginRouter[methodLower](path, wrappedHandler);
          console.log(`  📍 Registered ${method.toUpperCase()} /api/plugins/${pluginId}${path}`);
        }
      });

      // Mount and remember the router so we can remove it later
      app.use(`/api/plugins/${pluginId}`, pluginRouter);
      // Prefer storing the Layer we just mounted; fall back to the router function if _router/stack isn't available
      let storedRef = pluginRouter;
      try {
        if (app && app._router && Array.isArray(app._router.stack) && app._router.stack.length > 0) {
          storedRef = app._router.stack[app._router.stack.length - 1];
        }
      } catch (_) {
        // ignore; we'll keep the router function reference in storedRef
      }
      app.locals.pluginRouters.push(storedRef);
      console.log(`✅ Mounted plugin router at: /api/plugins/${pluginId}`);
    });

    console.log(`✅ Registered ${pluginRoutes.length} plugin API routes across ${Object.keys(routesByPlugin).length} plugins`);
  };

  // Initial mount of plugin routers (based on currently loaded plugins)
  clearPluginRouters();
  mountPluginRouters();

  // Expose a refresher on app.locals so the reload endpoint can re-register routes
  app.locals.refreshPluginRouters = () => {
    try {
      clearPluginRouters();
      mountPluginRouters();
    } catch (err) {
      console.error('❌ Failed to refresh plugin routers safely:', err && err.message ? err.message : err);
    }
  };
}

module.exports = { initializePluginRoutes };
