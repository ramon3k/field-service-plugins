/**
 * Example Plugin
 * 
 * This is a simple example plugin that demonstrates:
 * - REST API routes
 * - Ticket tabs
 * - Report components
 * - Lifecycle hooks
 */

module.exports = {
  name: 'example-plugin',
  version: '1.0.0',
  
  /**
   * API Routes
   * These will be accessible at /api/plugins/example-plugin/*
   */
  routes: [
    {
      method: 'GET',
      path: '/status',
      handler: (req, res) => {
        res.json({
          status: 'active',
          message: 'Example plugin is running!',
          version: '1.0.0'
        });
      }
    },
    {
      method: 'GET',
      path: '/data',
      handler: async (req, res) => {
        const companyCode = req.headers['x-company-code'] || 'DCPSP';
        
        res.json({
          companyCode,
          message: 'This is example data from the plugin',
          timestamp: new Date().toISOString(),
          items: [
            { id: 1, name: 'Item 1' },
            { id: 2, name: 'Item 2' },
            { id: 3, name: 'Item 3' }
          ]
        });
      }
    },
    {
      method: 'POST',
      path: '/action',
      handler: async (req, res) => {
        const { action, data } = req.body;
        
        console.log('Example plugin received action:', action, data);
        
        res.json({
          success: true,
          message: `Action "${action}" processed successfully`,
          receivedData: data
        });
      }
    }
  ],
  
  /**
   * Ticket Tabs
   * Add a tab to the ticket modal
   */
  ticketTabs: [
    {
      id: 'example-tab',
      label: 'Example',
      componentId: 'example-plugin-tab' // Frontend component to render
    }
  ],
  
  /**
   * Report Component
   * Add a report to the Reports page
   */
  reportComponent: {
    componentId: 'example-plugin-report',
    label: 'Example Report'
  },
  
  /**
   * Lifecycle Hooks
   */
  hooks: {
    /**
     * Called when plugin is installed for a tenant
     */
    onInstall: async (tenantId, pool) => {
      console.log(`📦 Example Plugin: Installing for tenant ${tenantId}`);
      
      try {
        // Example: Create a custom table
        await pool.request()
          .input('companyCode', tenantId)
          .query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ExamplePluginData')
            BEGIN
              CREATE TABLE ExamplePluginData (
                id INT IDENTITY PRIMARY KEY,
                companyCode NVARCHAR(50) NOT NULL,
                itemName NVARCHAR(200),
                itemValue NVARCHAR(500),
                createdAt DATETIME DEFAULT GETUTCDATE(),
                createdBy NVARCHAR(100)
              );
              
              CREATE INDEX IX_ExamplePluginData_CompanyCode 
                ON ExamplePluginData(companyCode);
            END
          `);
        
        console.log(`✅ Example Plugin: Tables created for ${tenantId}`);
      } catch (error) {
        console.error(`❌ Example Plugin: Error during installation:`, error);
        throw error;
      }
    },
    
    /**
     * Called when plugin is uninstalled for a tenant
     */
    onUninstall: async (tenantId, pool) => {
      console.log(`🗑️ Example Plugin: Uninstalling for tenant ${tenantId}`);
      
      try {
        // Example: Clean up data
        await pool.request()
          .input('companyCode', tenantId)
          .query(`
            DELETE FROM ExamplePluginData WHERE companyCode = @companyCode;
          `);
        
        console.log(`✅ Example Plugin: Data cleaned up for ${tenantId}`);
      } catch (error) {
        console.error(`❌ Example Plugin: Error during uninstallation:`, error);
        throw error;
      }
    },
    
    /**
     * Called when plugin is enabled for a tenant
     */
    onEnable: async (tenantId, pool) => {
      console.log(`✅ Example Plugin: Enabled for tenant ${tenantId}`);
    },
    
    /**
     * Called when plugin is disabled for a tenant
     */
    onDisable: async (tenantId, pool) => {
      console.log(`⏸️ Example Plugin: Disabled for tenant ${tenantId}`);
    }
  }
};
