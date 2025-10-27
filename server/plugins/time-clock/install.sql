-- =============================================
-- Register Time Clock Plugin in Database
-- =============================================

USE FieldServiceDB;
GO

-- First, deploy the plugin schema (tables)
-- This is included from schema.sql

-- Register the plugin in GlobalPlugins
IF NOT EXISTS (SELECT * FROM GlobalPlugins WHERE name = 'time-clock')
BEGIN
    INSERT INTO GlobalPlugins (
        id,
        name,
        displayName,
        description,
        version,
        author,
        category,
        status,
        isOfficial,
        hasDatabase,
        hasAPI,
        hasUI,
        hasHooks
    )
    VALUES (
        NEWID(),
        'time-clock',
        'Technician Time Clock',
        'Track technician work hours with clock in/out functionality, breaks, and time reporting.',
        '1.0.0',
        'Field Service Team',
        'Time Tracking',
        'active',
        1, -- is official
        1, -- has database tables
        1, -- has API endpoints  
        1, -- has UI components
        1  -- has hooks
    );
    
    PRINT '✅ Registered Time Clock plugin in GlobalPlugins';
END
ELSE
    PRINT '⚠️ Time Clock plugin already registered';
GO

-- Install plugin for default company (DCPSP)
DECLARE @pluginId UNIQUEIDENTIFIER;
SELECT @pluginId = id FROM GlobalPlugins WHERE name = 'time-clock';

IF @pluginId IS NOT NULL AND NOT EXISTS (
    SELECT * FROM TenantPluginInstallations 
    WHERE tenantId = 'DCPSP' AND pluginId = @pluginId
)
BEGIN
    INSERT INTO TenantPluginInstallations (
        id,
        tenantId,
        pluginId,
        installedVersion,
        isEnabled,
        installedBy,
        installedAt
    )
    VALUES (
        NEWID(),
        'DCPSP',
        @pluginId,
        '1.0.0',
        1, -- enabled
        'system',
        GETDATE()
    );
    
    PRINT '✅ Installed Time Clock plugin for DCPSP';
END
ELSE
    PRINT '⚠️ Time Clock plugin already installed for DCPSP';
GO

PRINT '';
PRINT '========================================';
PRINT 'Time Clock Plugin Registration Complete';
PRINT '========================================';
PRINT '';
GO
