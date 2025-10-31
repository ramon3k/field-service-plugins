-- =============================================
-- Plugin System Database Schema
-- Field Service Management System
-- =============================================

USE FieldServiceDB;
GO

-- =============================================
-- Table: GlobalPlugins
-- Stores metadata about available plugins
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'GlobalPlugins')
BEGIN
    CREATE TABLE GlobalPlugins (
        PluginID NVARCHAR(100) PRIMARY KEY,
        PluginName NVARCHAR(200) NOT NULL,
        Version NVARCHAR(50) NOT NULL,
        Description NVARCHAR(MAX),
        Author NVARCHAR(200),
        Category NVARCHAR(100), -- 'Integration', 'Automation', 'Reporting', 'UI Extension', etc.
        IconURL NVARCHAR(500),
        DocumentationURL NVARCHAR(500),
        IsSystemPlugin BIT DEFAULT 0, -- Cannot be uninstalled
        RequiresConfiguration BIT DEFAULT 0,
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE()
    );
    PRINT '✅ Created table: GlobalPlugins';
END
ELSE
    PRINT '⚠️ Table already exists: GlobalPlugins';
GO

-- =============================================
-- Table: TenantPluginInstallations
-- Tracks which plugins are installed/enabled per company
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TenantPluginInstallations')
BEGIN
    CREATE TABLE TenantPluginInstallations (
        InstallationID INT IDENTITY(1,1) PRIMARY KEY,
        CompanyCode NVARCHAR(50) NOT NULL,
        PluginID NVARCHAR(100) NOT NULL,
        IsEnabled BIT DEFAULT 1,
        ConfigurationJSON NVARCHAR(MAX), -- Store plugin-specific configuration
        InstalledAt DATETIME DEFAULT GETDATE(),
        InstalledBy NVARCHAR(100),
        LastEnabledAt DATETIME,
        LastDisabledAt DATETIME,
        CONSTRAINT FK_TenantPlugins_Company FOREIGN KEY (CompanyCode) 
            REFERENCES Companies(CompanyCode) ON DELETE CASCADE,
        CONSTRAINT FK_TenantPlugins_Plugin FOREIGN KEY (PluginID) 
            REFERENCES GlobalPlugins(PluginID) ON DELETE CASCADE,
        CONSTRAINT UQ_TenantPlugin UNIQUE (CompanyCode, PluginID)
    );
    PRINT '✅ Created table: TenantPluginInstallations';
END
ELSE
    PRINT '⚠️ Table already exists: TenantPluginInstallations';
GO

-- =============================================
-- Table: PluginAPIEndpoints
-- Stores custom API endpoints registered by plugins
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PluginAPIEndpoints')
BEGIN
    CREATE TABLE PluginAPIEndpoints (
        EndpointID INT IDENTITY(1,1) PRIMARY KEY,
        PluginID NVARCHAR(100) NOT NULL,
        Method NVARCHAR(10) NOT NULL, -- GET, POST, PUT, DELETE
        Path NVARCHAR(500) NOT NULL, -- e.g., '/api/plugins/my-plugin/action'
        Description NVARCHAR(MAX),
        RequiresAuth BIT DEFAULT 1,
        RequiresRole NVARCHAR(50), -- 'Admin', 'Technician', null for any
        IsActive BIT DEFAULT 1,
        CreatedAt DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_PluginEndpoints_Plugin FOREIGN KEY (PluginID) 
            REFERENCES GlobalPlugins(PluginID) ON DELETE CASCADE
    );
    PRINT '✅ Created table: PluginAPIEndpoints';
END
ELSE
    PRINT '⚠️ Table already exists: PluginAPIEndpoints';
GO

-- =============================================
-- Table: PluginHooks
-- Defines lifecycle hooks that plugins can register for
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PluginHooks')
BEGIN
    CREATE TABLE PluginHooks (
        HookID INT IDENTITY(1,1) PRIMARY KEY,
        PluginID NVARCHAR(100) NOT NULL,
        HookName NVARCHAR(100) NOT NULL, -- 'ticket.created', 'ticket.updated', etc.
        HandlerFunction NVARCHAR(200), -- Function name in plugin code
        Priority INT DEFAULT 100, -- Lower = runs first
        IsActive BIT DEFAULT 1,
        CreatedAt DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_PluginHooks_Plugin FOREIGN KEY (PluginID) 
            REFERENCES GlobalPlugins(PluginID) ON DELETE CASCADE
    );
    PRINT '✅ Created table: PluginHooks';
END
ELSE
    PRINT '⚠️ Table already exists: PluginHooks';
GO

-- =============================================
-- Table: PluginSettings
-- Key-value settings for plugins (per tenant)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PluginSettings')
BEGIN
    CREATE TABLE PluginSettings (
        SettingID INT IDENTITY(1,1) PRIMARY KEY,
        CompanyCode NVARCHAR(50) NOT NULL,
        PluginID NVARCHAR(100) NOT NULL,
        SettingKey NVARCHAR(200) NOT NULL,
        SettingValue NVARCHAR(MAX),
        SettingType NVARCHAR(50) DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
        IsEncrypted BIT DEFAULT 0,
        UpdatedAt DATETIME DEFAULT GETDATE(),
        UpdatedBy NVARCHAR(100),
        CONSTRAINT FK_PluginSettings_Company FOREIGN KEY (CompanyCode) 
            REFERENCES Companies(CompanyCode) ON DELETE CASCADE,
        CONSTRAINT FK_PluginSettings_Plugin FOREIGN KEY (PluginID) 
            REFERENCES GlobalPlugins(PluginID) ON DELETE CASCADE,
        CONSTRAINT UQ_PluginSetting UNIQUE (CompanyCode, PluginID, SettingKey)
    );
    PRINT '✅ Created table: PluginSettings';
END
ELSE
    PRINT '⚠️ Table already exists: PluginSettings';
GO

-- =============================================
-- Table: PluginActivityLog
-- Audit log for plugin operations
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PluginActivityLog')
BEGIN
    CREATE TABLE PluginActivityLog (
        LogID INT IDENTITY(1,1) PRIMARY KEY,
        CompanyCode NVARCHAR(50),
        PluginID NVARCHAR(100),
        Action NVARCHAR(100) NOT NULL, -- 'installed', 'enabled', 'disabled', 'configured', etc.
        Details NVARCHAR(MAX),
        PerformedBy NVARCHAR(100),
        PerformedAt DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_PluginLog_Company FOREIGN KEY (CompanyCode) 
            REFERENCES Companies(CompanyCode) ON DELETE CASCADE,
        CONSTRAINT FK_PluginLog_Plugin FOREIGN KEY (PluginID) 
            REFERENCES GlobalPlugins(PluginID) ON DELETE CASCADE
    );
    PRINT '✅ Created table: PluginActivityLog';
END
ELSE
    PRINT '⚠️ Table already exists: PluginActivityLog';
GO

-- =============================================
-- Table: PluginDependencies
-- Track dependencies between plugins
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PluginDependencies')
BEGIN
    CREATE TABLE PluginDependencies (
        DependencyID INT IDENTITY(1,1) PRIMARY KEY,
        PluginID NVARCHAR(100) NOT NULL, -- The plugin that has the dependency
        RequiredPluginID NVARCHAR(100) NOT NULL, -- The plugin it depends on
        MinVersion NVARCHAR(50), -- Minimum required version
        IsOptional BIT DEFAULT 0,
        CreatedAt DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_PluginDep_Plugin FOREIGN KEY (PluginID) 
            REFERENCES GlobalPlugins(PluginID) ON DELETE NO ACTION,
        CONSTRAINT FK_PluginDep_Required FOREIGN KEY (RequiredPluginID) 
            REFERENCES GlobalPlugins(PluginID) ON DELETE NO ACTION
    );
    PRINT '✅ Created table: PluginDependencies';
END
ELSE
    PRINT '⚠️ Table already exists: PluginDependencies';
GO

-- =============================================
-- Create Indexes for Performance
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TenantPlugins_Company')
    CREATE INDEX IX_TenantPlugins_Company ON TenantPluginInstallations(CompanyCode);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TenantPlugins_Enabled')
    CREATE INDEX IX_TenantPlugins_Enabled ON TenantPluginInstallations(IsEnabled);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PluginEndpoints_Plugin')
    CREATE INDEX IX_PluginEndpoints_Plugin ON PluginAPIEndpoints(PluginID);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PluginHooks_Name')
    CREATE INDEX IX_PluginHooks_Name ON PluginHooks(HookName);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PluginSettings_Company')
    CREATE INDEX IX_PluginSettings_Company ON PluginSettings(CompanyCode, PluginID);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PluginLog_Company')
    CREATE INDEX IX_PluginLog_Company ON PluginActivityLog(CompanyCode);

PRINT '✅ Created indexes for plugin tables';
GO

PRINT '';
PRINT '========================================';
PRINT 'Plugin System Schema Deployment Complete';
PRINT '========================================';
PRINT '';
PRINT 'Created 7 plugin management tables:';
PRINT '  ✅ GlobalPlugins';
PRINT '  ✅ TenantPluginInstallations';
PRINT '  ✅ PluginAPIEndpoints';
PRINT '  ✅ PluginHooks';
PRINT '  ✅ PluginSettings';
PRINT '  ✅ PluginActivityLog';
PRINT '  ✅ PluginDependencies';
PRINT '';
GO
