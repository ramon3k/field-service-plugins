const { v4: uuidv4 } = require('uuid');

module.exports = {
  name: 'vamp-plugin',
  version: '1.0.0',
  
  // ============================================================
  // LIFECYCLE HOOKS
  // ============================================================
  hooks: {
    /**
     * Install Hook - Create Devices table with proper schema
     */
    onInstall: async (tenantId, pool) => {
      console.log(`[VAMP Plugin] Installing for tenant: ${tenantId}`);
      
      try {
        // Create Devices table
        await pool.request().query(`
          IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'VAMPDevices')
          BEGIN
            CREATE TABLE VAMPDevices (
              -- Primary Key
              DeviceID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
              
              -- Multi-tenant isolation
              CompanyCode NVARCHAR(50) NOT NULL,
              
              -- Device Identification
              DeviceIdentifier NVARCHAR(100) NOT NULL,  -- User-visible Device ID
              DeviceName NVARCHAR(200),
              UID UNIQUEIDENTIFIER DEFAULT NEWID(),
              
              -- Network Configuration
              MACAddress NVARCHAR(17),
              IPAddress NVARCHAR(45),
              SubnetMask NVARCHAR(45),
              Gateway NVARCHAR(45),
              
              -- Hardware Information
              Manufacturer NVARCHAR(100),
              Model NVARCHAR(100),
              PartNumber NVARCHAR(100),
              SerialNumber NVARCHAR(100),
              FirmwareVersion NVARCHAR(50),
              
              -- Location & Installation
              Location NVARCHAR(200),
              Building NVARCHAR(100),
              TerminationPoint NVARCHAR(200),
              DrawingRef NVARCHAR(200),
              InstallationDate DATE,
              
              -- Security & Access
              Login NVARCHAR(100),
              
              -- Service & Maintenance
              ServiceRecord NVARCHAR(MAX),
              
              -- Audit Fields
              CreatedAt DATETIME DEFAULT GETUTCDATE(),
              CreatedBy NVARCHAR(50),
              UpdatedAt DATETIME DEFAULT GETUTCDATE(),
              UpdatedBy NVARCHAR(50),
              
              -- Constraints
              CONSTRAINT UQ_VAMPDevices_Identifier UNIQUE (CompanyCode, DeviceIdentifier)
            );
            
            -- Create indexes for performance
            CREATE INDEX IX_VAMPDevices_CompanyCode ON VAMPDevices(CompanyCode);
            CREATE INDEX IX_VAMPDevices_Location ON VAMPDevices(CompanyCode, Location);
            CREATE INDEX IX_VAMPDevices_Building ON VAMPDevices(CompanyCode, Building);
            CREATE INDEX IX_VAMPDevices_Manufacturer ON VAMPDevices(CompanyCode, Manufacturer);
            CREATE INDEX IX_VAMPDevices_InstallationDate ON VAMPDevices(InstallationDate);
            CREATE INDEX IX_VAMPDevices_SearchName ON VAMPDevices(DeviceName);
            CREATE INDEX IX_VAMPDevices_SearchIdentifier ON VAMPDevices(DeviceIdentifier);
            
            PRINT 'VAMPDevices table created successfully';
          END
          ELSE
          BEGIN
            PRINT 'VAMPDevices table already exists';
          END
        `);

        // Create version history table for audit trail
        await pool.request().query(`
          IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'VAMPDeviceHistory')
          BEGIN
            CREATE TABLE VAMPDeviceHistory (
              HistoryID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
              DeviceID UNIQUEIDENTIFIER NOT NULL,
              CompanyCode NVARCHAR(50) NOT NULL,
              ChangeType NVARCHAR(50),  -- 'CREATE', 'UPDATE', 'DELETE'
              FieldChanged NVARCHAR(100),
              OldValue NVARCHAR(MAX),
              NewValue NVARCHAR(MAX),
              ChangedAt DATETIME DEFAULT GETUTCDATE(),
              ChangedBy NVARCHAR(50),
              
              FOREIGN KEY (DeviceID) REFERENCES VAMPDevices(DeviceID) ON DELETE CASCADE
            );
            
            CREATE INDEX IX_VAMPDeviceHistory_DeviceID ON VAMPDeviceHistory(DeviceID);
            CREATE INDEX IX_VAMPDeviceHistory_CompanyCode ON VAMPDeviceHistory(CompanyCode);
            CREATE INDEX IX_VAMPDeviceHistory_ChangedAt ON VAMPDeviceHistory(ChangedAt DESC);
            
            PRINT 'VAMPDeviceHistory table created successfully';
          END
        `);
        
        console.log(`✅ [VAMP Plugin] Successfully installed for ${tenantId}`);
      } catch (error) {
        console.error(`❌ [VAMP Plugin] Installation failed:`, error);
        throw error;
      }
    },

    /**
     * Uninstall Hook - Clean up tenant data (but preserve table structure)
     */
    onUninstall: async (tenantId, pool) => {
      console.log(`[VAMP Plugin] Uninstalling for tenant: ${tenantId}`);
      
      try {
        // Delete tenant-specific data, but keep table structure
        await pool.request()
          .input('companyCode', tenantId)
          .query('DELETE FROM VAMPDeviceHistory WHERE CompanyCode = @companyCode');
        
        await pool.request()
          .input('companyCode', tenantId)
          .query('DELETE FROM VAMPDevices WHERE CompanyCode = @companyCode');
        
        console.log(`✅ [VAMP Plugin] Uninstalled for ${tenantId}`);
      } catch (error) {
        console.error(`❌ [VAMP Plugin] Uninstall failed:`, error);
        throw error;
      }
    },

    onEnable: async (tenantId, pool) => {
      console.log(`✅ [VAMP Plugin] Enabled for ${tenantId}`);
    },

    onDisable: async (tenantId, pool) => {
      console.log(`⚠️ [VAMP Plugin] Disabled for ${tenantId}`);
    }
  },

  // ============================================================
  // API ROUTES
  // ============================================================
  routes: [
    /**
     * GET /api/plugins/vamp-plugin/devices
     * Fetch all devices for the company
     */
    {
      method: 'GET',
      path: '/devices',
      handler: async (req, res) => {
        try {
          const companyCode = req.headers['x-company-code'] || 'DCPSP';
          const { location, building, manufacturer, search } = req.query;
          
          let query = `
            SELECT 
              DeviceID, DeviceIdentifier as device_id, DeviceName as name,
              MACAddress as mac_address, IPAddress as ip_address,
              SubnetMask as subnet_mask, Gateway as gateway,
              Manufacturer as manufacturer, Model as model,
              PartNumber as part_number, SerialNumber as serial_number,
              FirmwareVersion as firmware_version, Location as location,
              Building as building, TerminationPoint as termination_point,
              DrawingRef as drawing_ref, InstallationDate as installation_date,
              Login as login, ServiceRecord as service_record,
              CreatedAt, CreatedBy, UpdatedAt, UpdatedBy
            FROM VAMPDevices
            WHERE CompanyCode = @companyCode
          `;
          
          const request = req.pool.request()
            .input('companyCode', companyCode);
          
          // Add filters if provided
          if (location) {
            query += ' AND Location = @location';
            request.input('location', location);
          }
          if (building) {
            query += ' AND Building = @building';
            request.input('building', building);
          }
          if (manufacturer) {
            query += ' AND Manufacturer = @manufacturer';
            request.input('manufacturer', manufacturer);
          }
          if (search) {
            query += ` AND (
              DeviceIdentifier LIKE @search OR
              DeviceName LIKE @search OR
              MACAddress LIKE @search OR
              IPAddress LIKE @search OR
              Location LIKE @search
            )`;
            request.input('search', `%${search}%`);
          }
          
          query += ' ORDER BY CreatedAt DESC';
          
          const result = await request.query(query);
          
          res.json({
            success: true,
            count: result.recordset.length,
            devices: result.recordset
          });
        } catch (error) {
          console.error('[VAMP Plugin] Error fetching devices:', error);
          res.status(500).json({ 
            success: false, 
            error: error.message 
          });
        }
      }
    },

    /**
     * GET /api/plugins/vamp-plugin/devices/:id
     * Fetch single device by ID
     */
    {
      method: 'GET',
      path: '/devices/:id',
      handler: async (req, res) => {
        try {
          const companyCode = req.headers['x-company-code'] || 'DCPSP';
          const { id } = req.params;
          
          const result = await req.pool.request()
            .input('companyCode', companyCode)
            .input('deviceId', id)
            .query(`
              SELECT 
                DeviceID, DeviceIdentifier as device_id, DeviceName as name,
                MACAddress as mac_address, IPAddress as ip_address,
                SubnetMask as subnet_mask, Gateway as gateway,
                Manufacturer as manufacturer, Model as model,
                PartNumber as part_number, SerialNumber as serial_number,
                FirmwareVersion as firmware_version, Location as location,
                Building as building, TerminationPoint as termination_point,
                DrawingRef as drawing_ref, InstallationDate as installation_date,
                Login as login, ServiceRecord as service_record,
                CreatedAt, CreatedBy, UpdatedAt, UpdatedBy
              FROM VAMPDevices
              WHERE CompanyCode = @companyCode AND DeviceID = @deviceId
            `);
          
          if (result.recordset.length === 0) {
            return res.status(404).json({ 
              success: false, 
              error: 'Device not found' 
            });
          }
          
          res.json({
            success: true,
            device: result.recordset[0]
          });
        } catch (error) {
          console.error('[VAMP Plugin] Error fetching device:', error);
          res.status(500).json({ 
            success: false, 
            error: error.message 
          });
        }
      }
    },

    /**
     * POST /api/plugins/vamp-plugin/devices
     * Create new device
     */
    {
      method: 'POST',
      path: '/devices',
      handler: async (req, res) => {
        try {
          const companyCode = req.headers['x-company-code'] || 'DCPSP';
          const userName = req.headers['x-user-name'] || 'System';
          const deviceId = uuidv4();
          
          const {
            device_id, name, mac_address, ip_address, subnet_mask, gateway,
            manufacturer, model, part_number, serial_number, firmware_version,
            location, building, termination_point, drawing_ref, installation_date,
            login, service_record
          } = req.body;
          
          // Validate required fields
          if (!device_id) {
            return res.status(400).json({
              success: false,
              error: 'Device Identifier is required'
            });
          }
          
          // Insert device
          await req.pool.request()
            .input('deviceId', deviceId)
            .input('companyCode', companyCode)
            .input('deviceIdentifier', device_id)
            .input('name', name || null)
            .input('macAddress', mac_address || null)
            .input('ipAddress', ip_address || null)
            .input('subnetMask', subnet_mask || null)
            .input('gateway', gateway || null)
            .input('manufacturer', manufacturer || null)
            .input('model', model || null)
            .input('partNumber', part_number || null)
            .input('serialNumber', serial_number || null)
            .input('firmwareVersion', firmware_version || null)
            .input('location', location || null)
            .input('building', building || null)
            .input('terminationPoint', termination_point || null)
            .input('drawingRef', drawing_ref || null)
            .input('installationDate', installation_date || null)
            .input('login', login || null)
            .input('serviceRecord', service_record || null)
            .input('createdBy', userName)
            .query(`
              INSERT INTO VAMPDevices (
                DeviceID, CompanyCode, DeviceIdentifier, DeviceName,
                MACAddress, IPAddress, SubnetMask, Gateway,
                Manufacturer, Model, PartNumber, SerialNumber, FirmwareVersion,
                Location, Building, TerminationPoint, DrawingRef, InstallationDate,
                Login, ServiceRecord, CreatedBy, UpdatedBy
              ) VALUES (
                @deviceId, @companyCode, @deviceIdentifier, @name,
                @macAddress, @ipAddress, @subnetMask, @gateway,
                @manufacturer, @model, @partNumber, @serialNumber, @firmwareVersion,
                @location, @building, @terminationPoint, @drawingRef, @installationDate,
                @login, @serviceRecord, @createdBy, @createdBy
              )
            `);
          
          // Create history entry
          await req.pool.request()
            .input('deviceId', deviceId)
            .input('companyCode', companyCode)
            .input('changeType', 'CREATE')
            .input('changedBy', userName)
            .query(`
              INSERT INTO VAMPDeviceHistory (DeviceID, CompanyCode, ChangeType, ChangedBy)
              VALUES (@deviceId, @companyCode, @changeType, @changedBy)
            `);
          
          res.status(201).json({
            success: true,
            message: 'Device created successfully',
            deviceId: deviceId
          });
        } catch (error) {
          console.error('[VAMP Plugin] Error creating device:', error);
          
          // Check for unique constraint violation
          if (error.message && error.message.includes('UQ_VAMPDevices_Identifier')) {
            return res.status(409).json({
              success: false,
              error: 'A device with this identifier already exists'
            });
          }
          
          res.status(500).json({ 
            success: false, 
            error: error.message 
          });
        }
      }
    },

    /**
     * PUT /api/plugins/vamp-plugin/devices/:id
     * Update existing device
     */
    {
      method: 'PUT',
      path: '/devices/:id',
      handler: async (req, res) => {
        try {
          const companyCode = req.headers['x-company-code'] || 'DCPSP';
          const userName = req.headers['x-user-name'] || 'System';
          const { id } = req.params;
          
          const {
            device_id, name, mac_address, ip_address, subnet_mask, gateway,
            manufacturer, model, part_number, serial_number, firmware_version,
            location, building, termination_point, drawing_ref, installation_date,
            login, service_record
          } = req.body;
          
          // Get current device for history tracking
          const currentDevice = await req.pool.request()
            .input('deviceId', id)
            .input('companyCode', companyCode)
            .query('SELECT * FROM VAMPDevices WHERE DeviceID = @deviceId AND CompanyCode = @companyCode');
          
          if (currentDevice.recordset.length === 0) {
            return res.status(404).json({
              success: false,
              error: 'Device not found'
            });
          }
          
          const oldDevice = currentDevice.recordset[0];
          
          // Update device
          await req.pool.request()
            .input('deviceId', id)
            .input('companyCode', companyCode)
            .input('deviceIdentifier', device_id)
            .input('name', name || null)
            .input('macAddress', mac_address || null)
            .input('ipAddress', ip_address || null)
            .input('subnetMask', subnet_mask || null)
            .input('gateway', gateway || null)
            .input('manufacturer', manufacturer || null)
            .input('model', model || null)
            .input('partNumber', part_number || null)
            .input('serialNumber', serial_number || null)
            .input('firmwareVersion', firmware_version || null)
            .input('location', location || null)
            .input('building', building || null)
            .input('terminationPoint', termination_point || null)
            .input('drawingRef', drawing_ref || null)
            .input('installationDate', installation_date || null)
            .input('login', login || null)
            .input('serviceRecord', service_record || null)
            .input('updatedBy', userName)
            .query(`
              UPDATE VAMPDevices SET
                DeviceIdentifier = @deviceIdentifier,
                DeviceName = @name,
                MACAddress = @macAddress,
                IPAddress = @ipAddress,
                SubnetMask = @subnetMask,
                Gateway = @gateway,
                Manufacturer = @manufacturer,
                Model = @model,
                PartNumber = @partNumber,
                SerialNumber = @serialNumber,
                FirmwareVersion = @firmwareVersion,
                Location = @location,
                Building = @building,
                TerminationPoint = @terminationPoint,
                DrawingRef = @drawingRef,
                InstallationDate = @installationDate,
                Login = @login,
                ServiceRecord = @serviceRecord,
                UpdatedAt = GETUTCDATE(),
                UpdatedBy = @updatedBy
              WHERE DeviceID = @deviceId AND CompanyCode = @companyCode
            `);
          
          // Track changed fields in history
          const fieldsToTrack = [
            { field: 'DeviceIdentifier', old: oldDevice.DeviceIdentifier, new: device_id },
            { field: 'DeviceName', old: oldDevice.DeviceName, new: name },
            { field: 'MACAddress', old: oldDevice.MACAddress, new: mac_address },
            { field: 'IPAddress', old: oldDevice.IPAddress, new: ip_address },
            { field: 'SubnetMask', old: oldDevice.SubnetMask, new: subnet_mask },
            { field: 'Gateway', old: oldDevice.Gateway, new: gateway },
            { field: 'Manufacturer', old: oldDevice.Manufacturer, new: manufacturer },
            { field: 'Model', old: oldDevice.Model, new: model },
            { field: 'PartNumber', old: oldDevice.PartNumber, new: part_number },
            { field: 'SerialNumber', old: oldDevice.SerialNumber, new: serial_number },
            { field: 'FirmwareVersion', old: oldDevice.FirmwareVersion, new: firmware_version },
            { field: 'Location', old: oldDevice.Location, new: location },
            { field: 'Building', old: oldDevice.Building, new: building },
            { field: 'TerminationPoint', old: oldDevice.TerminationPoint, new: termination_point },
            { field: 'DrawingRef', old: oldDevice.DrawingRef, new: drawing_ref },
            { field: 'InstallationDate', old: oldDevice.InstallationDate, new: installation_date },
            { field: 'Login', old: oldDevice.Login, new: login },
            { field: 'ServiceRecord', old: oldDevice.ServiceRecord, new: service_record }
          ];
          
          for (const { field, old, new: newValue } of fieldsToTrack) {
            if (old !== newValue) {
              await req.pool.request()
                .input('deviceId', id)
                .input('companyCode', companyCode)
                .input('changeType', 'UPDATE')
                .input('fieldChanged', field)
                .input('oldValue', old || '')
                .input('newValue', newValue || '')
                .input('changedBy', userName)
                .query(`
                  INSERT INTO VAMPDeviceHistory 
                    (DeviceID, CompanyCode, ChangeType, FieldChanged, OldValue, NewValue, ChangedBy)
                  VALUES 
                    (@deviceId, @companyCode, @changeType, @fieldChanged, @oldValue, @newValue, @changedBy)
                `);
            }
          }
          
          res.json({
            success: true,
            message: 'Device updated successfully'
          });
        } catch (error) {
          console.error('[VAMP Plugin] Error updating device:', error);
          res.status(500).json({ 
            success: false, 
            error: error.message 
          });
        }
      }
    },

    /**
     * DELETE /api/plugins/vamp-plugin/devices/:id
     * Delete device
     */
    {
      method: 'DELETE',
      path: '/devices/:id',
      handler: async (req, res) => {
        try {
          const companyCode = req.headers['x-company-code'] || 'DCPSP';
          const userName = req.headers['x-user-name'] || 'System';
          const { id } = req.params;
          
          // Create deletion history entry before deleting
          await req.pool.request()
            .input('deviceId', id)
            .input('companyCode', companyCode)
            .input('changeType', 'DELETE')
            .input('changedBy', userName)
            .query(`
              INSERT INTO VAMPDeviceHistory (DeviceID, CompanyCode, ChangeType, ChangedBy)
              VALUES (@deviceId, @companyCode, @changeType, @changedBy)
            `);
          
          // Delete device (cascade will delete history)
          const result = await req.pool.request()
            .input('deviceId', id)
            .input('companyCode', companyCode)
            .query('DELETE FROM VAMPDevices WHERE DeviceID = @deviceId AND CompanyCode = @companyCode');
          
          if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
              success: false,
              error: 'Device not found'
            });
          }
          
          res.json({
            success: true,
            message: 'Device deleted successfully'
          });
        } catch (error) {
          console.error('[VAMP Plugin] Error deleting device:', error);
          res.status(500).json({ 
            success: false, 
            error: error.message 
          });
        }
      }
    },

    /**
     * GET /api/plugins/vamp-plugin/devices/:id/history
     * Get device change history
     */
    {
      method: 'GET',
      path: '/devices/:id/history',
      handler: async (req, res) => {
        try {
          const companyCode = req.headers['x-company-code'] || 'DCPSP';
          const { id } = req.params;
          
          const result = await req.pool.request()
            .input('deviceId', id)
            .input('companyCode', companyCode)
            .query(`
              SELECT 
                HistoryID, ChangeType, FieldChanged, 
                OldValue, NewValue, ChangedAt, ChangedBy
              FROM VAMPDeviceHistory
              WHERE DeviceID = @deviceId AND CompanyCode = @companyCode
              ORDER BY ChangedAt DESC
            `);
          
          res.json({
            success: true,
            count: result.recordset.length,
            history: result.recordset
          });
        } catch (error) {
          console.error('[VAMP Plugin] Error fetching history:', error);
          res.status(500).json({ 
            success: false, 
            error: error.message 
          });
        }
      }
    },

    /**
     * GET /api/plugins/vamp-plugin/stats
     * Get device statistics
     */
    {
      method: 'GET',
      path: '/stats',
      handler: async (req, res) => {
        try {
          const companyCode = req.headers['x-company-code'] || 'DCPSP';
          
          const result = await req.pool.request()
            .input('companyCode', companyCode)
            .query(`
              SELECT 
                COUNT(*) as TotalDevices,
                COUNT(DISTINCT Location) as TotalLocations,
                COUNT(DISTINCT Building) as TotalBuildings,
                COUNT(DISTINCT Manufacturer) as TotalManufacturers,
                COUNT(CASE WHEN InstallationDate IS NOT NULL THEN 1 END) as DevicesWithInstallDate,
                COUNT(CASE WHEN ServiceRecord IS NOT NULL THEN 1 END) as DevicesWithServiceRecord
              FROM VAMPDevices
              WHERE CompanyCode = @companyCode
            `);
          
          res.json({
            success: true,
            stats: result.recordset[0]
          });
        } catch (error) {
          console.error('[VAMP Plugin] Error fetching stats:', error);
          res.status(500).json({ 
            success: false, 
            error: error.message 
          });
        }
      }
    }
  ],

  // ============================================================
  // NAVIGATION TABS (Shows in Main Nav Bar)
  // ============================================================
  navTabs: [
    {
      id: 'vamp-main',
      label: 'VAMP',
      icon: '📱',
      componentId: 'VampDeviceManager',
      roles: ['Admin', 'SystemAdmin', 'Coordinator', 'Technician']
    }
  ]
};
