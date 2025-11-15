/**
 * Basic Plugin Template
 * 
 * This is a starter template for creating Field Service plugins.
 * Rename this folder and customize the code below to create your own plugin.
 */

const { v4: uuidv4 } = require('uuid');

module.exports = {
  // REQUIRED: Plugin identifier (lowercase, hyphenated, no spaces)
  name: 'my-plugin',
  
  // REQUIRED: Semantic version (major.minor.patch)
  version: '1.0.0',
  
  /**
   * ROUTES: Define API endpoints for your plugin
   * 
   * Routes will be accessible at:
   * /api/plugins/{plugin-name}/{path}
   * 
   * Example: GET /api/plugins/my-plugin/hello
   */
  routes: [
    {
      method: 'GET',
      path: '/hello',
      handler: async (req, res) => {
        try {
          const companyCode = req.headers['x-company-code'] || 'DCPSP';
          
          res.json({
            success: true,
            message: `Hello from ${companyCode}!`,
            timestamp: new Date(),
            plugin: {
              name: module.exports.name,
              version: module.exports.version
            }
          });
        } catch (error) {
          console.error('❌ Error in /hello:', error);
          res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
          });
        }
      }
    },
    
    {
      method: 'POST',
      path: '/data',
      handler: async (req, res) => {
        try {
          const companyCode = req.headers['x-company-code'] || 'DCPSP';
          const { name, value } = req.body;
          
          // Input validation
          if (!name || !value) {
            return res.status(400).json({
              error: 'Missing required fields',
              required: ['name', 'value']
            });
          }
          
          // Database operation example
          const newId = uuidv4();
          await req.pool.request()
            .input('id', newId)
            .input('companyCode', companyCode)
            .input('name', name)
            .input('value', value)
            .query(`
              INSERT INTO MyPluginData (ID, CompanyCode, Name, Value, CreatedAt)
              VALUES (@id, @companyCode, @name, @value, GETUTCDATE())
            `);
          
          res.json({
            success: true,
            id: newId,
            message: 'Data created successfully'
          });
          
        } catch (error) {
          console.error('❌ Error in /data POST:', error);
          res.status(500).json({ 
            error: 'Failed to create data',
            message: error.message 
          });
        }
      }
    },
    
    {
      method: 'GET',
      path: '/data',
      handler: async (req, res) => {
        try {
          const companyCode = req.headers['x-company-code'] || 'DCPSP';
          
          const result = await req.pool.request()
            .input('companyCode', companyCode)
            .query(`
              SELECT ID, Name, Value, CreatedAt
              FROM MyPluginData
              WHERE CompanyCode = @companyCode
              ORDER BY CreatedAt DESC
            `);
          
          res.json({
            success: true,
            count: result.recordset.length,
            data: result.recordset
          });
          
        } catch (error) {
          console.error('❌ Error in /data GET:', error);
          res.status(500).json({ 
            error: 'Failed to fetch data',
            message: error.message 
          });
        }
      }
    }
  ],
  
  /**
   * TICKET TABS: Add custom tabs to the ticket modal
   * 
   * Tabs will appear in the ticket edit modal alongside existing tabs.
   * Frontend components must be in the frontend/ directory.
   */
  ticketTabs: [
    // Uncomment to add a custom tab:
    // {
    //   id: 'my-tab',
    //   label: 'My Feature',
    //   icon: '⚡',
    //   component: 'MyCustomTab'  // Must match frontend/MyCustomTab.tsx export
    // }
  ],
  
  /**
   * REPORT COMPONENTS: Add sections to the Reports page
   * 
   * Report components will appear as cards on the Reports page.
   */
  reportComponents: [
    // Uncomment to add a report section:
    // {
    //   id: 'my-report',
    //   title: 'My Plugin Report',
    //   description: 'Custom analytics for my plugin',
    //   endpoint: '/report-data'
    // }
  ],
  
  /**
   * LIFECYCLE HOOKS: Execute code during plugin lifecycle events
   * 
   * Available hooks:
   * - onInstall: Called when plugin is first installed for a tenant
   * - onUninstall: Called when plugin is removed from a tenant
   * - onEnable: Called when plugin is enabled for a tenant
   * - onDisable: Called when plugin is disabled for a tenant
   */
  hooks: {
    /**
     * Install Hook
     * Create database tables, insert default data, perform initial setup
     */
    onInstall: async (tenantId, pool) => {
      console.log(`📦 Installing plugin for ${tenantId}...`);
      
      try {
        // Create plugin table (if it doesn't exist)
        await pool.request().query(`
          IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MyPluginData')
          BEGIN
            CREATE TABLE MyPluginData (
              ID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
              CompanyCode NVARCHAR(50) NOT NULL,
              Name NVARCHAR(100) NOT NULL,
              Value NVARCHAR(MAX),
              CreatedAt DATETIME DEFAULT GETUTCDATE(),
              UpdatedAt DATETIME
            );
            
            -- Create indexes for better performance
            CREATE INDEX IX_MyPluginData_CompanyCode 
            ON MyPluginData(CompanyCode);
            
            CREATE INDEX IX_MyPluginData_CreatedAt 
            ON MyPluginData(CreatedAt);
            
            PRINT 'MyPluginData table created successfully';
          END
          ELSE
          BEGIN
            PRINT 'MyPluginData table already exists';
          END
        `);
        
        console.log(`✅ Plugin installed successfully for ${tenantId}`);
        
      } catch (error) {
        console.error(`❌ Install failed for ${tenantId}:`, error);
        throw error; // Re-throw to show error in UI
      }
    },
    
    /**
     * Uninstall Hook
     * Clean up data, optionally remove tables
     */
    onUninstall: async (tenantId, pool) => {
      console.log(`🗑️  Uninstalling plugin for ${tenantId}...`);
      
      try {
        // Option 1: Delete only this tenant's data (recommended)
        const result = await pool.request()
          .input('companyCode', tenantId)
          .query('DELETE FROM MyPluginData WHERE CompanyCode = @companyCode');
        
        console.log(`Deleted ${result.rowsAffected[0]} records for ${tenantId}`);
        
        // Option 2: Drop the table entirely (use with caution!)
        // await pool.request().query('DROP TABLE IF EXISTS MyPluginData');
        
        console.log(`✅ Plugin uninstalled successfully for ${tenantId}`);
        
      } catch (error) {
        console.error(`❌ Uninstall failed for ${tenantId}:`, error);
        throw error;
      }
    },
    
    /**
     * Enable Hook
     * Called when plugin is enabled (routes become active)
     */
    onEnable: async (tenantId, pool) => {
      console.log(`✅ Plugin enabled for ${tenantId}`);
      
      // Optional: Start background jobs, enable integrations, etc.
    },
    
    /**
     * Disable Hook
     * Called when plugin is disabled (routes return 403)
     */
    onDisable: async (tenantId, pool) => {
      console.log(`⏸️  Plugin disabled for ${tenantId}`);
      
      // Optional: Stop background jobs, pause integrations, etc.
    }
  }
};
