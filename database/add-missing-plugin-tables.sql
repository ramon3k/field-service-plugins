-- ====================================
-- Add Missing Plugin System Tables
-- Run this on existing databases to add
-- the missing plugin architecture tables
-- ====================================

USE FieldServiceDB;
GO

PRINT '========================================';
PRINT 'Adding missing plugin system tables...';
PRINT '========================================';

-- Companies table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Companies')
BEGIN
    CREATE TABLE Companies (
        CompanyID INT IDENTITY(1,1) PRIMARY KEY,
        CompanyCode NVARCHAR(50) NOT NULL UNIQUE,
        CompanyName NVARCHAR(255) NOT NULL,
        DisplayName NVARCHAR(255),
        ContactEmail NVARCHAR(255),
        ContactPhone NVARCHAR(50),
        Address NVARCHAR(500),
        IsActive BIT DEFAULT 1,
        AllowServiceRequests BIT DEFAULT 1,
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE()
    );
    PRINT 'Companies table created';
END
ELSE
    PRINT 'Companies table already exists - skipping';
GO

-- SystemHooks table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SystemHooks')
BEGIN
    CREATE TABLE SystemHooks (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        name NVARCHAR(100) NOT NULL,
        displayName NVARCHAR(200) NOT NULL,
        description NVARCHAR(500),
        hookType NVARCHAR(50) NOT NULL,
        category NVARCHAR(50),
        parameters NVARCHAR(1000),
        returnType NVARCHAR(100),
        triggerContext NVARCHAR(200),
        isAsync BIT DEFAULT 0,
        createdAt DATETIME2 DEFAULT GETUTCDATE()
    );
    PRINT 'SystemHooks table created';
END
ELSE
    PRINT 'SystemHooks table already exists - skipping';
GO

-- PluginHookRegistrations table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PluginHookRegistrations')
BEGIN
    CREATE TABLE PluginHookRegistrations (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        tenantId NVARCHAR(50) NOT NULL,
        pluginId UNIQUEIDENTIFIER NOT NULL,
        hookId UNIQUEIDENTIFIER NOT NULL,
        handlerFunction NVARCHAR(255) NOT NULL,
        priority INT DEFAULT 10,
        isEnabled BIT DEFAULT 1,
        executionCount INT DEFAULT 0,
        totalExecutionTime BIGINT DEFAULT 0,
        lastExecuted DATETIME2,
        lastError NVARCHAR(1000),
        registeredAt DATETIME2 DEFAULT GETUTCDATE(),
        CONSTRAINT FK_PluginHookReg_Plugin FOREIGN KEY (pluginId) 
            REFERENCES GlobalPlugins(id) ON DELETE CASCADE,
        CONSTRAINT FK_PluginHookReg_Hook FOREIGN KEY (hookId) 
            REFERENCES SystemHooks(id) ON DELETE CASCADE
    );
    PRINT 'PluginHookRegistrations table created';
END
ELSE
    PRINT 'PluginHookRegistrations table already exists - skipping';
GO

-- PluginMenuItems table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PluginMenuItems')
BEGIN
    CREATE TABLE PluginMenuItems (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        tenantId NVARCHAR(50) NOT NULL,
        pluginId UNIQUEIDENTIFIER NOT NULL,
        label NVARCHAR(100) NOT NULL,
        icon NVARCHAR(100),
        route NVARCHAR(255),
        component NVARCHAR(255),
        parentMenu NVARCHAR(100),
        sortOrder INT DEFAULT 100,
        requiredRole NVARCHAR(50),
        requiredPermissions NVARCHAR(500),
        isEnabled BIT DEFAULT 1,
        isVisible BIT DEFAULT 1,
        createdAt DATETIME2 DEFAULT GETUTCDATE(),
        CONSTRAINT FK_PluginMenu_Plugin FOREIGN KEY (pluginId) 
            REFERENCES GlobalPlugins(id) ON DELETE CASCADE
    );
    PRINT 'PluginMenuItems table created';
END
ELSE
    PRINT 'PluginMenuItems table already exists - skipping';
GO

-- PluginDatabaseObjects table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PluginDatabaseObjects')
BEGIN
    CREATE TABLE PluginDatabaseObjects (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        tenantId NVARCHAR(50) NOT NULL,
        pluginId UNIQUEIDENTIFIER NOT NULL,
        objectType NVARCHAR(50) NOT NULL,
        objectName NVARCHAR(255) NOT NULL,
        schemaName NVARCHAR(100) DEFAULT 'dbo',
        creationScript NVARCHAR(MAX),
        rollbackScript NVARCHAR(MAX),
        dependsOn NVARCHAR(1000),
        requiredBy NVARCHAR(1000),
        isCreated BIT DEFAULT 0,
        createdAt DATETIME2,
        lastModified DATETIME2,
        CONSTRAINT FK_PluginDBObj_Plugin FOREIGN KEY (pluginId) 
            REFERENCES GlobalPlugins(id) ON DELETE CASCADE
    );
    PRINT 'PluginDatabaseObjects table created';
END
ELSE
    PRINT 'PluginDatabaseObjects table already exists - skipping';
GO

-- PluginActivityLog table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PluginActivityLog')
BEGIN
    CREATE TABLE PluginActivityLog (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        tenantId NVARCHAR(50) NOT NULL,
        pluginId UNIQUEIDENTIFIER,
        activity NVARCHAR(100) NOT NULL,
        description NVARCHAR(500),
        userId NVARCHAR(100),
        userRole NVARCHAR(50),
        ipAddress NVARCHAR(45),
        userAgent NVARCHAR(500),
        metadata NVARCHAR(MAX),
        timestamp DATETIME2 DEFAULT GETUTCDATE(),
        CONSTRAINT FK_PluginActivity_Plugin FOREIGN KEY (pluginId) 
            REFERENCES GlobalPlugins(id) ON DELETE SET NULL
    );
    PRINT 'PluginActivityLog table created';
END
ELSE
    PRINT 'PluginActivityLog table already exists - skipping';
GO

-- TenantPluginInstallations table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TenantPluginInstallations')
BEGIN
    CREATE TABLE TenantPluginInstallations (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        tenantId NVARCHAR(50) NOT NULL,
        pluginId UNIQUEIDENTIFIER NOT NULL,
        installedVersion NVARCHAR(20) NOT NULL,
        installedAt DATETIME2 DEFAULT GETUTCDATE(),
        installedBy NVARCHAR(100),
        isEnabled BIT DEFAULT 1,
        isConfigured BIT DEFAULT 0,
        configuration NVARCHAR(MAX),
        customSettings NVARCHAR(MAX),
        lastActivated DATETIME2,
        lastDeactivated DATETIME2,
        activationCount INT DEFAULT 0,
        status NVARCHAR(20) DEFAULT 'installed',
        errorMessage NVARCHAR(1000),
        updatedAt DATETIME2 DEFAULT GETUTCDATE(),
        CONSTRAINT FK_TenantPlugin_Plugin FOREIGN KEY (pluginId) 
            REFERENCES GlobalPlugins(id) ON DELETE CASCADE
    );
    PRINT 'TenantPluginInstallations table created';
END
ELSE
    PRINT 'TenantPluginInstallations table already exists - skipping';
GO

PRINT '========================================';
PRINT 'Missing plugin tables added successfully!';
PRINT '========================================';
GO
